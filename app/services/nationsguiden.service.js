var request = require('request'),
    cheerio = require('cheerio'),
    async = require('async'),
    tc = require('timezonecomplete'),
    ngConfig = require('../config/nationsguiden.config'),
    appConfig = require('../config/app.config'),
    Nation = require('../models/nation.model').model,
    Globals = require('../models/globals.model').model;

/**
 * Barrel method to trigger update of data from Nationsguiden,
 * but only if the cache has expired.
 * If the cache is still valid true is passed to the callback.
 * If the cache has expired false is passed to the callback.
 * @param callback
 */
function refreshOpenHours(callback) {
    // Check if cached open hours are still valid
    openHoursIsCached((cacheErr, isCached, updated) => {
        if (cacheErr) {
            callback(cacheErr);
        }
        else if (isCached) {
            callback(null, true);
        }
        else {
            // Get open hours from Nationsguiden
            getOpenHours((scrapeErr, scrapeData) => {
                if (scrapeErr) {
                    callback(scrapeErr);
                }
                else {
                    // Update nations
                    updateOpenHours(scrapeData, updErr => {
                        if (updErr) {
                            callback(updErr);
                        }
                        else {
                            // Update cache time
                            updated.value = Date.now();
                            updated.save(function (saveErr) {
                                if (saveErr) {
                                    callback(saveErr);
                                }
                                else {
                                    callback(null, false);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

/**
 * Checks if cached data from Nationsguiden is valid or has expired.
 * If the cache is still valid true is passed to the callback.
 * If the cache has expired false is passed to the callback along
 * with the global update flag to reset when the cache has been updated.
 * @param callback
 */
function openHoursIsCached(callback) {
    Globals.findOne({ key: ngConfig.updatedKey }, (err, updated) => {
        if (err) {
            callback(err);
        }
        else if (!updated) {
            callback({ error: 'Globals key "' + ngConfig.updatedKey + '" not found.' });
        }
        else if (updated.value && tc.now().diff(new tc.DateTime(updated.value)).seconds() <= ngConfig.cacheExpires) {
            callback(null, true);
        }
        else {
            callback(null, false, updated);
        }
    });
}

/**
 * Get new open hours from Nationsguiden by scraping their website.
 * @param callback
 */
function getOpenHours(callback) {
    request(ngConfig.url, (err, res, body) => {
        if (err) {
            callback(err);
        }
        else {
            var data = [];
            var $ = cheerio.load(body);

            $('.grouped-event').each((i, elem) => {
                // The nation name scraped below is prone to have errors. It seems
                // to be a free-text field and is sometimes blank or some kind
                // of abbreviation of the nation name, e.g. 'Svantes trädgård'
                // instead of 'Uplands nation'.
                var nationEvent = {
                    nation: $(elem).find('.where').text().trim(),
                    eventTitle: $(elem).find('.event-title').text().trim(),
                    openHours: $(elem).find('.time').text().trim()
                };

                // The following scrape of nationName seems to be more stable bound
                // to the nations default display name
                var nationName = $(elem).next('.grouped-event-description').find('.event-by').text().trim();
                if (nationName) {
                    nationEvent.nation = nationName;
                }

                data.push(nationEvent);
            });

            callback(null, data);
        }
    });
}

/**
 * Update all nations with freshly scraped data from Nationsguiden.
 * @param nationEvents
 * @param callback
 */
function updateOpenHours(nationEvents, callback) {
    Nation.find((err, nations) => {
        if (err) {
            callback(err);
        }
        else {
            // Create an array of functions to be called async to save nations.
            // When they're all done the final callback is fired. We do this to
            // be able to hold off on the callback until we know all nations are
            // up-to-date.
            var saveNationFunctions = [];

            // Update all the nations with new openHours
            nations.forEach(nation => {
                // Nations that aren't found in nationEvents will get a null
                // value for openHours to indicate they're closed today
                nation.todaysHours = null;
                nation.todaysEvent = null;

                // Look for a nationEvent that matches the nations name.
                // Sometimes there can be multiple events for each nation,
                // in that case we just use the first one.
                nationEvents.some(nationEvent => {
                    return nation.nationsguidenKeywords.some(keyword => {
                        var match = nationEvent.nation.toLowerCase().indexOf(keyword);
                        if (match != -1) {
                            nation.todaysHours = parseOpenHours(nationEvent.openHours);
                            nation.todaysEvent = nationEvent.eventTitle;
                            return true;
                        }
                    });
                });

                // Finally create a save function for the nation
                saveNationFunctions.push(cb => {
                    nation.save(saveErr => cb(saveErr));
                });
            });

            // Fire! Save all the nations (max 5 at a time) and then execute the callback.
            async.parallelLimit(saveNationFunctions, 5, saveErr => {
                callback(saveErr);
            });
        }
    });
}

/**
 * Parses a string of format "hh:mm-hh:mm" to two Date objects
 * using todays date.
 * @param openHours
 */
function parseOpenHours(openHours) {
    var now = tc.now(tc.zone(appConfig.defaultTimezone));
    var newDayThreshold = new tc.DateTime(now.format('yyyy-MM-dd zzzz') + ' ' + ngConfig.newDayThreshold, 'yyyy-MM-dd zzzz hh:mm');

    // Nationsguiden keeps showing the open hours of a nation until the nation
    // closes, even if that's on the next day. This means that the records on
    // Nationsguiden that are fetched between 0am and closing time (usually 6am
    // at the latest) will refer to the previous day. This is a bit tricky...
    // In short: Is it before 6am? Then the openHours refers to the previous day.
    // We compensate by subtracting one day.
    // todo: verify that this works
    if (now <= newDayThreshold) {
        now = now.sub(tc.days(1));
    }

    var openDateTimes = openHours.split('-').map(time =>
        new tc.DateTime(now.format('yyyy-MM-dd zzzz') + ' ' + time, 'yyyy-MM-dd zzzz hh:mm'));

    if (openDateTimes.length === 2) {
        var open = openDateTimes[0];
        var close = openDateTimes[1];

        // If end time is after midnight (i.e. the next day) we need to add one day
        if (close <= open) {
            close = close.add(tc.days(1));
        }

        return {
            open: open,
            close: close
        };
    }
    else {
        // Couldn't parse the open hours, fallback to null values. Null dates indicate
        // that we can't figure out the open hours of a nation (parse error). If we return
        // just null (not an object) that will indicate the nation is closed (no record on
        // Nationsguiden)
        return {
            open: null,
            close: null
        };
    }
}

module.exports.refreshOpenHours = refreshOpenHours;
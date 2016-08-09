var errorHandler = require('../services/error.service'),
    googleService = require('../services/google.service'),
    fbService = require('../services/facebook.service'),
    ngService = require('../services/nationsguiden.service'),
    Nation = require('../models/nation.model').model;

/**
 * Handle GET requests for a list of nations.
 * @param req
 * @param res
 */
module.exports.getList = (req, res) => {
    Nation.find((err, nations) => {
        if (err) {
            errorHandler.handle(err);
            res.json({ error: errorHandler.messages.nationsNotFound });
        }
        else {
            res.json(nations);
        }
    });
}

/**
 * Handle GET requests for details on a nation.
 * @param req
 * @param res
 */
module.exports.getDetails = (req, res) => {
    Nation.findById(req.params.id, (findErr, nation) => {
        if (findErr) {
            errorHandler.handle(findErr);
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else {
            res.json(nation);
        }
    });
}

/**
 * Middleware to update todays open hours from Nationsguiden
 * before returning nation data.
 * @param req
 * @param res
 * @param next
 */
module.exports.refreshOpenHours = (req, res, next) => {
    // Start by updating the open hours for today from Nationsguiden.
    // Won't update if cached data from previous scrapes hasn't expired.
    ngService.refreshOpenHours((ngErr, usedCache) => {
        // Handle these silently to avoid small changes on
        // Nationsguidens website from breaking the whole app.
        if (ngErr) { errorHandler.handle(ngErr); }

        console.log('Used NG cache: ' + usedCache);

        next();
    });
}

/**
 * Middleware to update place details from Google Places API
 * before returning nation data.
 * @param req
 * @param res
 * @param next
 */
module.exports.refreshPlaceDetails = (req, res, next) => {
    Nation.findById(req.params.id, (findErr, nation) => {
        if (findErr) {
            errorHandler.handle(findErr);
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else {
            // If the nation has a cached place object that isn't expired
            // we don't do anything
            if (googleService.placeIsCached(nation.place)) {
                console.log('Used Google cache: true');

                next();
            }
            else {
                console.log('Used Google cache: false');

                // Fetch place details and photos from the Google API
                googleService.getPlace(nation.googlePlaceId, (gErr, place) => {
                    if (gErr) {
                        // Handle these silently to avoid breaking the app if the
                        // Google API traffic qouta is exceeded or something. The
                        // data from Google Places is kinda static anyway so it
                        // might not matter much if it isn't updated everytime.
                        errorHandler.handle(gErr);
                        next();
                    }
                    else {
                        // Cache the place in the db so that it can be used again
                        nation.place = place;
                        nation.save(saveErr => {
                            if (saveErr) { errorHandler.handle(saveErr); }

                            // At this point we let the user proceed event if the
                            // save failed
                            next();
                        });
                    }
                });
            }
        }
    });
}

/**
 * Middleware to update nation events from Facebook API
 * before returning nation data.
 * @param req
 * @param res
 * @param next
 */
module.exports.refreshEvents = (req, res, next) => {
    Nation.findById(req.params.id, (findErr, nation) => {
        if (findErr) {
            errorHandler.handle(findErr);
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else {
            // If the nation has cached events that aren't expired
            // we don't do anything
            if (fbService.eventsAreCached(nation)) {
                console.log('Used Facebook cache: true');

                next();
            }
            else {
                console.log('Used Facebook cache: false');

                // Fetch events from the Facebook API
                fbService.getEvents(nation.facebookId, (fbErr, events) => {
                    if (fbErr) {
                        // Handle these silently to avoid breaking the app
                        // just because the Facebook API is acting up. Events
                        // arguably aren't that important to us anyway.
                        errorHandler.handle(fbErr);
                        next();
                    }
                    else {
                        // Cache the events in the db so that they can be used again
                        nation.events = events;
                        nation.eventsUpdated = Date.now();
                        nation.save(saveErr => {
                            if (saveErr) { errorHandler.handle(saveErr); }

                            // At this point we let the user proceed event if the
                            // save failed
                            next();
                        });
                    }
                });
            }
        }
    });
}
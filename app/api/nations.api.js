var errorHandler = require('../services/error.service'),
    googleService = require('../services/google.service'),
    fbService = require('../services/facebook.service'),
    ngService = require('../services/nationsguiden.service'),
    sockets = require('../sockets'),
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
        else if (!nations) {
            res.json({ error: errorHandler.messages.nationsNotFound });
        }
        else {
            res.json({ data: nations });
        }
    });
}

/**
 * Handle GET requests for details on a nation.
 * @param req
 * @param res
 */
module.exports.getDetails = (req, res) => {
    Nation.findById(req.params.id, (err, nation) => {
        if (err) {
            errorHandler.handle(err);
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else if (!nation) {
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else {
            res.json({ data: nation });
        }
    });
}

/**
 * Handle PUT request for updating details of a nation.
 * Only certain properties can be updated, see below.
 * @param req
 * @param res
 */
module.exports.putDetails = (req, res) => {
    Nation.findById(req.params.id, (err, nation) => {
        if (err) {
            errorHandler.handle(err);
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else if (!nation) {
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else {
            var updated = false;

            if (req.body.currentVisitors) {
                nation.currentVisitors = req.body.currentVisitors;
                updated = true;
            }

            if (req.body.maxVisitors) {
                nation.maxVisitors = req.body.maxVisitors;
                updated = true;
            }

            if (updated) {
                nation.save(saveErr => {
                    if (saveErr) {
                        errorHandler.handle(saveErr);
                        res.json({ error: errorHandler.messages.invalidParams });
                    }
                    else {
                        // Broadcast updated fields to all clients
                        sockets.emitVisitorStatus(nation);

                        res.json({ status: 'OK' });
                    }
                });
            }
            else {
                res.json({ error: errorHandler.messages.invalidParams });
            }
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
 * Middleware to update place details from Google API
 * (or Facebook API) before returning nation data.
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
        else if (!nation) {
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else {
            // If the nation has a cached place object that isn't expired
            // we don't do anything
            if (googleService.placeIsCached(nation.place)) {
                console.log('Used place cache: true');

                next();
            }
            else {
                console.log('Used place cache: false');

                // Fetch place details and photos from the Google API
                googleService.getPlace(nation.googlePlaceId, (pErr, place) => {
                    if (pErr) {
                        // Handle these silently to avoid breaking the app if the
                        // API call fails or something. The page data from Google
                        // is kinda static anyway so it might not matter much if it
                        // isn't updated every time.
                        errorHandler.handle(pErr);
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
 * Middleware to update photos from Google API before
 * returning nation data.
 * @param req
 * @param res
 * @param next
 */
module.exports.refreshPhotos = (req, res, next) => {
    Nation.findById(req.params.id, (findErr, nation) => {
        if (findErr) {
            errorHandler.handle(findErr);
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else if (!nation) {
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else {
            // If the nation has cached photos that aren't expired
            // we don't do anything
            if (googleService.photosAreCached(nation)) {
                console.log('Used photo cache: true');

                next();
            }
            else {
                console.log('Used photo cache: false');

                googleService.getPhotos(nation.name, (pErr, photos) => {
                    if (pErr) {
                        // Handle these silently to avoid breaking the app if the
                        // API call fails.
                        errorHandler.handle(pErr);
                        next();
                    }
                    else {
                        // Cache the photos in the db so that it can be used again
                        nation.photos = photos;
                        nation.photosUpdated = Date.now();
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
        else if (!nation) {
            res.json({ error: errorHandler.messages.nationNotFound });
        }
        else {
            // If the nation has cached events that aren't expired
            // we don't do anything
            if (fbService.eventsAreCached(nation)) {
                console.log('Used event cache: true');

                next();
            }
            else {
                console.log('Used event cache: false');

                // Fetch events from the Facebook API
                fbService.getEvents(nation.facebookId, (eErr, events) => {
                    if (eErr) {
                        // Handle these silently to avoid breaking the app
                        // just because the Facebook API is acting up. Events
                        // arguably aren't that important to us anyway.
                        errorHandler.handle(eErr);
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
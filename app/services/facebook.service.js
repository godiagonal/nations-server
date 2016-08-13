var graph = require('fbgraph'),
    tc = require('timezonecomplete'),
    Event = require('../models/event.model').model,
    Place = require('../models/place.model').model,
    fbConfig = require('../config/facebook.config'),
    appConfig = require('../config/app.config');

graph.setVersion(fbConfig.apiVersion);
graph.setAccessToken(fbConfig.accessToken);

/**
 * Checks if cached place data from Facebook API is valid or has expired.
 * Returns true if the cache is valid and false if the cache has expired.
 * @param place
 * @returns {boolean}
 */
function placeIsCached(place) {
    if (!place) { return false; }

    var updated = place.updated;
    return updated && tc.now().diff(new tc.DateTime(updated.toISOString())).seconds() <= fbConfig.placeCacheExpires;
}

/**
 * Get place (page) details for a nation by calling the Facebook API.
 * If the place is successfully fetched it's returned as a Place
 * instance in the callback.
 * @param facebookId
 * @param callback
 */
function getPlace(facebookId, callback) {
    var params = {
        fields: 'phone,single_line_address,website,location{latitude,longitude}'
    };

    graph.get(facebookId, params, (fbErr, fbRes) => {
        if (fbErr || !fbRes) {
            callback(fbErr ? fbErr : fbRes);
        }
        else {
            // Parse the Facebook API response and fire the callback
            var place = parsePlace(fbRes);
            callback(null, place);
        }
    });
}

/**
 * Parses a response from the Facebook API.
 * returns av instance of Place.
 * @param placeObj
 * @returns {*}
 */
function parsePlace(placeObj) {
    var place = new Place();
    place.address = placeObj.single_line_address;
    place.phone = placeObj.phone;
    place.website = placeObj.website;
    place.location = {
        latitude: placeObj.location ? placeObj.location.latitude : 0,
        longitude: placeObj.location ? placeObj.location.longitude : 0
    };
    place.updated = Date.now();

    return place;
}

/**
 * Checks if cached event data from Facebook API is valid or has expired.
 * Returns true if the cache is valid and false if the cache has expired.
 * @param place
 * @returns {boolean}
 */
function eventsAreCached(nation) {
    if (!nation.events) { return false; }

    var updated = nation.eventsUpdated;
    return updated && tc.now().diff(new tc.DateTime(updated.toISOString())).seconds() <= fbConfig.eventsCacheExpires;
}

/**
 * Get Facebook events for a nation by calling the Facebook API.
 * If the events are successfully fetched they're returned as an array
 * of Event instances in the callback.
 * @param facebookId
 * @param callback
 */
function getEvents(facebookId, callback) {
    var params = {
        fields: 'description,attending_count,name,start_time,end_time,id,picture{url},timezone'
    };

    graph.get(facebookId + '/events', params, (fbErr, fbRes) => {
        if (fbErr || !fbRes.data) {
            callback(fbErr ? fbErr : fbRes);
        }
        else {
            // Parse the Facebook API response and fire the callback
            var events = parseEvents(fbRes.data);
            callback(null, events);
        }
    });
}

/**
 * Parses an events response from the Facebook API.
 * returns an array of Event instances.
 * @param placeObj
 * @returns {*}
 */
function parseEvents(eventObjs) {
    var events = [];

    eventObjs.forEach(eventObj => {
        // Use same timezone as event (or fallback to app default)
        var timezone = tc.zone(eventObj.timezone ? eventObj.timezone : appConfig.defaultTimezone);
        var now = tc.now(timezone);
        var startTime = new tc.DateTime(eventObj.start_time);
        var endTime;
        if (eventObj.end_time)
            endTime = new tc.DateTime(eventObj.end_time);

        var includeEvent = false;

        // Only include events that haven't ended
        // Filter out events > 1 year in the future
        if (endTime) {
            if (endTime > now && endTime < now.add(tc.years(1))) {
                includeEvent = true;
            }
        }
        // If no end time is set, compare against start time + 1 day
        else if (startTime.add(tc.days(1)) > now) {
            includeEvent = true;
        }

        if (includeEvent) {
            var event = new Event();
            event.name = eventObj.name;
            event.description = eventObj.description;
            event.startTime = startTime;
            event.endTime = endTime;
            event.attending = eventObj.attending_count;
            event.image = eventObj.picture ? (eventObj.picture.data ? eventObj.picture.data.url : null) : null;
            event.url = fbConfig.eventUrl + eventObj.id;

            events.push(event);
        }
    });

    return events;
}

module.exports.placeIsCached = placeIsCached;
module.exports.getPlace = getPlace;
module.exports.eventsAreCached = eventsAreCached;
module.exports.getEvents = getEvents;
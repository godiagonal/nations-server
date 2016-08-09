var graph = require('fbgraph'),
    tc = require('timezonecomplete'),
    Event = require('../models/event.model').model,
    fbConfig = require('../config/facebook.config');

graph.setVersion(fbConfig.apiVersion);
graph.setAccessToken(fbConfig.accessToken);

function eventsAreCached(nation) {
    if (!nation.events) { return false; }

    var updated = nation.eventsUpdated;
    return updated && tc.now().diff(new tc.DateTime(updated.toISOString())).seconds() <= fbConfig.cacheExpires;
}

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

function parseEvents(eventObjs) {
    var events = [];

    eventObjs.forEach(eventObj => {
        // Use same timezone as event
        var now = tc.now(tc.zone(eventObj.timezone));
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

module.exports.eventsAreCached = eventsAreCached;
module.exports.getEvents = getEvents;
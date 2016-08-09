var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    PlaceSchema = require('./place.model').schema,
    EventSchema = require('./event.model').schema;

/**
 * Schema for nations, containing data from Facebook,
 * Google Places and Nationsguiden.
 */
var NationSchema = new Schema({
    id: Schema.Types.ObjectId,
    name: String,
    currentVisitors: Number,
    maxVisitors: Number,
    logo: String,
    googlePlaceId: String,
    place: PlaceSchema, // Source: Google Places
    facebookId: String,
    events: [EventSchema], // Source: Facebook
    eventsUpdated: Date,
    nationsguidenKeyword: String,
    todaysOpenHours: String, // Source: Nationsguiden
    todaysEvent: String // Source: Nationsguiden
});

module.exports.schema = NationSchema;
module.exports.model = mongoose.model('Nations', NationSchema);


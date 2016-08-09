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
    currentVisitors: {
        type: Number,
        min: [0, 'Current visitors can not be less than 0.'],
        validate: [
            function (value) {
                return value <= this.maxVisitors;
            },
            'Current visitors can not be greater than max visitors.'
        ]
    },
    maxVisitors: {
        type: Number,
        min: [0, 'Max visitors can not be less than 0.'],
        validate: [
            function (value) {
                return value >= this.currentVisitors;
            },
            'Max visitors can not be less than current visitors.'
        ]
    },
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

var NationModel = mongoose.model('Nations', NationSchema);

module.exports.schema = NationSchema;
module.exports.model = NationModel;


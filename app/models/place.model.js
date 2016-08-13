var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Schema for a place fetched from Google Places API.
 * Has a one-to-one relationship with Nation.
 */
var PlaceSchema = new Schema({
    address: String,
    phone: String,
    website: String,
    location: {
        latitude: Number,
        longitude: Number
    },
    updated: Date
});

var PlaceModel = mongoose.model('Place', PlaceSchema);

module.exports.schema = PlaceSchema;
module.exports.model = PlaceModel;

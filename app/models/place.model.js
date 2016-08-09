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
    photos: [String],
    location: {
        latitude: Number,
        longitude: Number
    },
    updated: Date
});

module.exports.schema = PlaceSchema;
module.exports.model = mongoose.model('Place', PlaceSchema);

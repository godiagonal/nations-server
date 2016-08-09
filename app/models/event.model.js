var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Schema for an event fetched from Facebook Graph API.
 * Has a one-to-many relationship with Nation.
 */
var EventSchema = new Schema({
    name: String,
    description: String,
    startTime: Date,
    endTime: Date,
    attending: Number,
    url: String,
    image: String
});

module.exports.schema = EventSchema;
module.exports.model = mongoose.model('Events', EventSchema);

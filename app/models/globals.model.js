var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Schema for global app variables that need to persist across server
 * restarts, e.g. a flag for when data was last fetched from Nationsguiden.
 *
 * Important!
 * Run this mongo command to create an index for 'key' when setting up a new db.
 * The Schema index enforcement doesn't seem to handle this automatically.
 * > db.globals.createIndex( { "key": 1 }, { unique: true } )
 */
var GlobalsSchema = new Schema({
    key: { type: String, index: { unique: true } },
    value: Schema.Types.Mixed
});

var GlobalsModel = mongoose.model('Globals', GlobalsSchema);

module.exports.schema = GlobalsSchema;
module.exports.model = GlobalsModel;
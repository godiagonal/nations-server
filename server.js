var express = require('express'),
    http = require('http'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    io = require('./app/sockets'),
    nations = require('./app/api/nations.api'),
    test = require('./app/api/test.api'),
    dbConfig = require('./app/config/db.config'),
    app = express(),
    server = http.createServer(app),
    port = process.env.PORT || 8080;

// Connect to db
mongoose.connect(dbConfig.url);

// Configure app to use bodyParser(). This will let us
// get the data from a POST.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up routes
var router = express.Router();
router.route('/nations').get(nations.refreshOpenHours, nations.getList);
router.route('/nations/:id').get(
    nations.refreshOpenHours,
    nations.refreshPlaceDetails,
    nations.refreshEvents,
    nations.getDetails);

// todo: remove
router.route('/test/addglobals').get(test.addGlobals);
router.route('/test/remove').get(test.removeNations);
router.route('/test/add').get(test.addNations);
router.route('/test/updatenation').get(test.updateNation);
router.route('/test/updateplace').get(test.updatePlace);
router.route('/test/updateevents').get(test.updateEvents);

// Lezz go
app.use('/', router);
server.listen(port);
io.listen(server);

console.log('Express server listening on port ' + port);
console.log('http://localhost:' + port + '/');
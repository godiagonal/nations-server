var express = require('express'),
    nations = require('./api/nations.api'),
    users = require('./api/users.js'),
    test = require('./api/test.api');

var router = express.Router();

router.route('/nations').get(
    nations.refreshOpenHours,
    nations.getList);

router.route('/nations/:id')
    .get(
        nations.refreshOpenHours,
        nations.refreshPlaceDetails,
        nations.refreshEvents,
        nations.getDetails)
    .put(
        users.auth,
        nations.putDetails);

router.route('/nations/:id')

// todo: remove
router.route('/test/addglobals').get(test.addGlobals);
router.route('/test/remove').get(test.removeNations);
router.route('/test/add').get(test.addNations);
router.route('/test/updatenation').get(test.updateNation);
router.route('/test/updateplace').get(test.updatePlace);
router.route('/test/updateevents').get(test.updateEvents);

module.exports = router;
// todo: remove

var mongoose = require('mongoose'),
    Nation = require('../models/nation.model').model,
    Place = require('../models/place.model').model,
    Globals = require('../models/globals.model').model;

var mockData = require('../mock-data').nations;
var id = '57a7a9fea5e0e4e4cbaf0c73';

module.exports.addGlobals = (req, res) => {
    var globals = new Globals();
    globals.key = 'nationsguidenUpdated';
    globals.value = Date.now();

    globals.save(function (err) {
        if (err) {
            console.log(err);
        }
    });
    res.json({ message: 'Globals added!' });
}

module.exports.removeNations = (req, res) => {
    Nation.remove({}, function (err) {
        if (err) {
            console.log(err);
        }
    });
    res.json({ message: 'Nation removed!' });
}

module.exports.addNations = (req, res) => {
    mockData.forEach(nationObj => {
        var nation = new Nation();
        nation.name = nationObj.name;
        nation.currentVisitors = nationObj.currentVisitors;
        nation.maxVisitors = nationObj.maxVisitors;
        nation.location = nationObj.location;
        nation.slug = nationObj.slug;
        nation.image = nationObj.image;
        nation.googlePlaceId = nationObj.googlePlaceId;
        nation.facebookId = nationObj.facebookId;
        nation.nationsguidenKeyword = nationObj.nationsguidenKeyword;

        nation.save(function (err) {
            if (err) {
                console.log(err);
            }
        });
    });
    res.json({ message: 'Nation created!' });
}

module.exports.updateNation = (req, res) => {
    Nation.findById(id, function (err, nation) {
        if (!err) {
            nation.currentVisitors = 4;
            nation.save(function (err) {
                if (err) {
                    console.log(err);
                }
                res.json({ message: 'Nation updated!' });
            });
        }
    });

}

module.exports.updatePlace = (req, res) => {
    Nation.findById(id, function (err, nation) {
        if (!err) {
            var place = new Place();
            place.address = 'Testvägen 123';
            place.phone = '070 1234';
            place.website = 'www.lol.se';
            place.openHours = ['1-2', '3-4'];
            place.photos = ['1.jpg', '2.jpg'];
            place.location = { latitude: 59.8555954, longitude: 17.637574 };
            place.updated = Date.now();

            nation.place = place;
            nation.save(function (err) {
                if (err) {
                    console.log(err);
                }
                res.json({ message: 'Place updated!' });
            });
        }
    });
}

module.exports.updateEvents = (req, res) => {
    res.json({ message: 'Events updated!' });
}


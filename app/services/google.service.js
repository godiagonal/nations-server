var tc = require('timezonecomplete'),
    async = require('async'),
    GooglePlaces = require('node-googleplaces'),
    Place = require('../models/place.model').model,
    googleConfig = require('../config/google.config');

var googlePlaces = new GooglePlaces(googleConfig.apiKey);

/**
 * Checks if cached data from Google Places is valid or has expired.
 * Returns true if the cache is valid and false if the cache has expired.
 * @param place
 * @returns {boolean}
 */
function placeIsCached(place) {
    if (!place) { return false; }

    var updated = place.updated;
    return updated && tc.now().diff(new tc.DateTime(updated.toISOString())).seconds() <= googleConfig.cacheExpires;
}

/**
 * Get place details for a nation by calling the Google Places API.
 * If the place is successfully fetched it's returned as a Place
 * instance in the callback.
 * @param googlePlaceId
 * @param callback
 */
function getPlace(googlePlaceId, callback) {
    googlePlaces.details({ placeid: googlePlaceId }, (gpErr, gpRes) => {
        if (responseError(gpErr, gpRes) || gpRes.body.status != 'OK') {
            callback(gpErr ? gpErr : gpRes);
        }
        else {
            // Fetch place photos from the API since these aren't included
            // in the details call
            getPlacePhotos(gpRes.body.result.photos, (err, photos) => {
                if (err) {
                    callback(err);
                }
                else {
                    // Replace the photo references with urls
                    gpRes.body.result.photos = photos;

                    // Parse the Google API response and fire the callback
                    var place = parsePlace(gpRes.body.result);
                    callback(null, place);
                }
            });
        }
    });
}

/**
 * Get photos for a place after fetch place details, since only photo references
 * are included in the details response.
 * If the photos are successfully fetched their urls are returned as an array
 * of Strings in the callback.
 * @param photoRefs
 * @param callback
 */
function getPlacePhotos(photoRefs, callback) {
    // Create an array of functions to be called async to fetch place
    // photos from the Google API. When they're all done the final
    // callback is fired.
    var fetchPhotoFunctions = [];
    if (photoRefs) {
        fetchPhotoFunctions = photoRefs.map(photoRef => {
            return function (cb) {
                var params = {
                    photoreference: photoRef.photo_reference,
                    maxheight: googleConfig.imageDimensions.maxHeight,
                    maxwidth: googleConfig.imageDimensions.maxWidth
                }

                // Fetch photos from the API. This (unfortunately) only returns binary
                // images. Atm we just extract the url and do nothing with the binary.
                // Kinda wasteful but don't want to store image binaries in db.
                // todo: this is potentially very resource heavy, every photo call returns a ~50kb image
                googlePlaces.photo(params, (gpErr, gpRes) => {
                    if (responseError(gpErr, gpRes) || gpRes.status != 200) {
                        cb(gpErr ? gpErr : gpRes);
                    }
                    else {
                        cb(null, gpRes.request.url)
                    }
                })
            };
        });
    }

    // Fire! Only taking the first x images to keep the API traffic down a bit.
    async.parallel(fetchPhotoFunctions.slice(0, googleConfig.maxImages), (err, photos) => {
        callback(err, photos);
    });
}

/**
 * Parses a response from the Google Places API (including photos).
 * returns av instance of Place.
 * @param placeObj
 * @returns {*}
 */
function parsePlace(placeObj) {
    var place = new Place();
    place.address = placeObj.formatted_address;
    place.phone = placeObj.formatted_phone_number;
    place.website = placeObj.website;
    place.photos = placeObj.photos;
    place.location = {
        latitude: placeObj.geometry.location ? placeObj.geometry.location.lat : 0,
        longitude: placeObj.geometry.location ? placeObj.geometry.location.lng : 0
    };
    place.updated = Date.now();

    return place;
}

/**
 * Checks if a general response from the Google API contains an error.
 * @param err
 * @param res
 * @returns {boolean}
 */
function responseError(err, res) {
    return err || !res || !res.body;
}

module.exports.placeIsCached = placeIsCached;
module.exports.getPlace = getPlace;
module.exports.getPlacePhotos = getPlacePhotos;
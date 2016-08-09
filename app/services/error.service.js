/**
 * App-wide method for handling errors.
 * @param err
 */
module.exports.handle = (err) => {
    // todo: log this? at least in production
    console.warn(err);
}

/**
 * Error messages to be returned on failed requests.
 */
module.exports.messages = {
    nationNotFound: 'Nation not found.',
    nationsNotFound: 'No nations found.',
    googleApiError: 'An error occurred when communicating with the Google API.',
    facebookApiError: 'An error occurred when communicating with the Facebook API.',
    unknownError: 'An unknown error occurred.'
}
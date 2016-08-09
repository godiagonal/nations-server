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
    nationsNotFound: 'No nations found.',
    nationNotFound: 'Nation not found.',
    invalidParams: 'The supplied parameters are invalid.',
    authFailed: 'Authentication failed.',
    googleApiError: 'An error occurred when communicating with the Google API.',
    facebookApiError: 'An error occurred when communicating with the Facebook API.',
    unknownError: 'An unknown error occurred.'
}
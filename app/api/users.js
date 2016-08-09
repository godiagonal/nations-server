var errorHandler = require('../services/error.service');

/**
 * Middleware to authenticate requests to certain routes,
 * e.g. updating nations.
 * @param req
 * @param res
 * @param next
 */
module.exports.auth = (req, res, next) => {
    // todo: implementation
    // Find user and which nation the user belongs to
    // and compare that to the nation id in request
    if (false) {
        res.json({ error: errorHandler.messages.authFailed });
    }
    else {
        next();
    }
}
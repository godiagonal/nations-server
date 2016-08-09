var socketio = require('socket.io'),
    errorHandler = require('./services/error.service'),
    appConfig = require('./config/app.config.js'),
    Nation = require('./models/nation.model').model;

// todo: implement db usage and bind db events

var io;

/**
 * Init the socket.io instance and setup listeners.
 * @param server
 * @returns {*}
 */
function listen(server) {
    io = socketio.listen(server, appConfig.socketOptions);

    io.sockets.on('connection', socket => {
        console.log('New connection, id:' + socket.id);
    });

    return io;
}

/**
 * Sends updated visitor count for a nation to all clients.
 * @param nation
 */
function emitVisitorStatus(nation) {
    io.sockets.emit('updateNationVisitorStatus', {
        nationId: nation._id,
        currentVisitors: nation.currentVisitors,
        maxVisitors: nation.maxVisitors
    });
}

module.exports.listen = listen;
module.exports.emitVisitorStatus = emitVisitorStatus;
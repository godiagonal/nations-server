var socketio = require('socket.io'),
    socketioConfig = {
        origins: 'http://localhost:* http://127.0.0.1:*'
    },
    nationsData = require('./mock-data').nations;

// todo: implement db usage and bind db events

module.exports.listen = function (server) {
    var io = socketio.listen(server, socketioConfig);

    io.sockets.on('connection', function (socket) {

        console.log('New connection:' + socket.id);

        socket.emit('nationList', {
            nations: nationsData.slice(0, 4)
        });

        setTimeout(function () {
            socket.emit('addNation', {
                nation: nationsData[4]
            });
        }, 1000);

        setTimeout(function () {
            socket.emit('updateNation', {
                nation: {
                    id: 3,
                    name: 'Uplands nation',
                    location: {latitude: 59.859, longitude: 17.637574},
                    currentVisitors: 7,
                    maxVisitors: 10,
                    slug: 'upland',
                    image: 'img/logo-uplands.png',
                    googlePlaceId: 'ChIJn-rTAfTLX0YR_3NqTw_B0nk'
                }
            });
        }, 3000);

        setTimeout(function () {
            /*socket.emit('removeNation', {
             nation: {id: 3},
             });*/
        }, 4000);

        socket.on('ping', function (data) {
            console.log(data);
        });

    });

    return io;
}



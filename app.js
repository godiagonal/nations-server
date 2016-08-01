var allowedOrigins = "http://localhost:* http://127.0.0.1:*",
    app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server, {
        origins: allowedOrigins
    }),
    port = 8080,
    url = 'http://localhost:' + port + '/';

server.listen(port);
console.log('Express server listening on port ' + port);
console.log(url);

io.sockets.on('connection', function (socket) {

    console.log('New connection:' + socket.id);

    socket.emit('nationList', {
        nations: [
            {id: 1, name: 'Gotland', location: {latitude: 59.8597109, longitude: 17.6335796}},
            {id: 2, name: 'Stockholm', location: {latitude: 59.8555954, longitude: 17.637574}},
        ]
    });

    setTimeout(function () {
        socket.emit('addNation', {
            nation: {id: 3, name: 'nation 3', location: {latitude: 59.859, longitude: 17.637574}},
        });
    }, 1000);

    setTimeout(function () {
        socket.emit('updateNation', {
            nation: {id: 3, name: 'nation 4'},
        });
    }, 3000);

    setTimeout(function () {
        socket.emit('removeNation', {
            nation: {id: 3},
        });
    }, 4000);

    socket.on('ping', function (data) {
        console.log(data);
    });

});
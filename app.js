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

const nations = [
    {
        id: 1, name: 'Gotland', currentVisitors: 9, maxVisitors: 10,
        location: {latitude: 59.8597109, longitude: 17.6335796},
        slug: 'gotland'
    },
    {
        id: 2, name: 'Stockholm', currentVisitors: 2, maxVisitors: 10,
        location: {latitude: 59.8555954, longitude: 17.637574},
        slug: 'stockholm'
    },
    {
        id: 3, name: 'Upland', currentVisitors: 5, maxVisitors: 10,
        location: {latitude: 59.859, longitude: 17.637574},
        slug: 'upland'
    },
];

io.sockets.on('connection', function (socket) {

    console.log('New connection:' + socket.id);

    socket.emit('nationList', {
        nations: nations.slice(0,2)
    });

    setTimeout(function () {
        socket.emit('addNation', {
            nation: nations[2]
        });
    }, 1000);

    setTimeout(function () {
        socket.emit('updateNation', {
            nation: {
                id: 3,
                name: 'Upland',
                location: {latitude: 59.859, longitude: 17.637574},
                currentVisitors: 7,
                maxVisitors: 10,
                slug: 'upland'
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
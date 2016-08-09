var express = require('express'),
    http = require('http'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    router = require('./app/routes'),
    io = require('./app/sockets'),
    appConfig = require('./app/config/app.config'),
    dbConfig = require('./app/config/db.config'),
    app = express(),
    server = http.createServer(app),
    port = process.env.PORT || 8080;

// Connect to db
mongoose.connect(dbConfig.url);

// Options to allow XHR requests from other domains
var corsOptions = {
    origin: function(origin, callback){
        var originIsWhitelisted = appConfig.apiOptions.origins.indexOf(origin) !== -1;
        callback(null, originIsWhitelisted);
    }
};

// Setup middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use('/', router);

// Lezz go
server.listen(port);
io.listen(server);

console.log('Express server listening on port ' + port);
console.log('http://localhost:' + port + '/');
var Hapi = require('hapi');
var Inert = require('inert');
var routes = require('./server/routes/');

// Create a server with a host and port
var server = new Hapi.Server();

server.connection({
    host: 'localhost',
    port: 8000
});
server.register([
    require('vision'),
    Inert,
    routes
], function () {

    // Start the server
    server.start(function (err) {
        if (err) {
            throw err;
        }
        console.log('started server');
    });
});
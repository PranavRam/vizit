var Path = require('path');
var swig = require('swig');
swig.setDefaults({varControls: ['[[', ']]']});

exports.register = function (server, options, next) {

    var routers;
    routers = [
        './hypothesis',
        './evidence',
        './entity',
        './misc',
        './notification',
        './snippet',
        './upload',
        './event',
        './document'
    ];


    var routes = [];
    var tmpRoute;

    routers.forEach(function (route) {

        tmpRoute = require(route);

        routes = routes.concat(tmpRoute);
    });
    server.route(routes);

    server.views({
        engines: {
            html: swig
        },
        path: Path.join(__dirname, '../views')
    });
    // Add the route
    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            // console.log(request);
            reply.view('index', {title: 'Vizit'});
        }
    });

    server.route({
        method: 'GET',
        path: '/public/{param*}',
        handler: {
            directory: {
                path: 'public'
            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'vizitRoutes'
};
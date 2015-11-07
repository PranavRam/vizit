/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config');
var db = config.db;
var Parse = require('parse/node').Parse;

module.exports = [
    {
        method: 'GET',
        path: '/api/events',
        handler: function(request, reply) {
            var query = new Parse.Query(config.parse.hypothesis);
            query.find({
                success: function(results) {
                    //console.log('retrieved object', object);
                    reply(results);
                },
                error: function(error) {
                    //alert("Error: " + error.code + " " + error.message);
                    reply({});
                }
            });
        }
    }
];
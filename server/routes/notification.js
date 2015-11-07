/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;

module.exports = [
    {
        method: 'GET',
        path: '/api/notifications',
        handler: function(request, reply) {
            var imagePath = 'img/list/60.jpeg';

            var todos = [
                {
                    face : imagePath,
                    what: 'Brunch this weekend?',
                    who: 'Min Li Chan',
                    when: '3:08PM',
                    notes: " I'll be in your neighborhood doing errands"
                },
                {
                    face : imagePath,
                    what: 'Brunch this weekend?',
                    who: 'Min Li Chan',
                    when: '3:08PM',
                    notes: " I'll be in your neighborhood doing errands"
                },
                {
                    face : imagePath,
                    what: 'Brunch this weekend?',
                    who: 'Min Li Chan',
                    when: '3:08PM',
                    notes: " I'll be in your neighborhood doing errands"
                },
                {
                    face : imagePath,
                    what: 'Brunch this weekend?',
                    who: 'Min Li Chan',
                    when: '3:08PM',
                    notes: " I'll be in your neighborhood doing errands"
                },
                {
                    face : imagePath,
                    what: 'Brunch this weekend?',
                    who: 'Min Li Chan',
                    when: '3:08PM',
                    notes: " I'll be in your neighborhood doing errands"
                },
            ];

            reply(todos);
        }
    }
];
/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;

module.exports = {
    index: function(request, reply) {

        var notifications = [
            {
                title: 'Brunch this weekend?',
                who: 'Min Li Chan',
                when: '3:08PM',
                description: " I'll be in your neighborhood doing errands"
            },
            {
                title: 'Brunch this weekend?',
                who: 'Min Li Chan',
                when: '3:08PM',
                description: " I'll be in your neighborhood doing errands"
            },
            {
                title: 'Brunch this weekend?',
                who: 'Min Li Chan',
                when: '3:08PM',
                description: " I'll be in your neighborhood doing errands"
            },
            {
                title: 'Brunch this weekend?',
                who: 'Min Li Chan',
                when: '3:08PM',
                description: " I'll be in your neighborhood doing errands"
            },
            {
                title: 'Brunch this weekend?',
                who: 'Min Li Chan',
                when: '3:08PM',
                description: " I'll be in your neighborhood doing errands"
            }
        ];

        reply(notifications);
    }
};
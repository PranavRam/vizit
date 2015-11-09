/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;

module.exports = {
    index: function(request, reply) {

        var notifications = [];

        reply(notifications);
    }
};
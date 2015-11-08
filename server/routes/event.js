/**
 * Created by pranavram on 11/7/15.
 */
var EventController = require('../controllers/event');

module.exports = [
    {
        method: 'GET',
        path: '/api/events',
        handler: EventController.index
    }
];
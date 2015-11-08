/**
 * Created by pranavram on 11/7/15.
 */
var NotificationController = require('../controllers/notification');

module.exports = [
    {
        method: 'GET',
        path: '/api/notifications',
        handler: NotificationController.index
    }
];
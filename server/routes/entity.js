/**
 * Created by pranavram on 11/7/15.
 */
var EntityController = require('../controllers/entity');

module.exports = [
    {
        method: 'GET',
        path: '/api/entities',
        handler: EntityController.index
    },

    {
        method: 'GET',
        path: '/api/entities/{id}',
        handler: EntityController.get
    },

    {
        method: 'POST',
        path: '/api/entities/{id}',
        handler: EntityController.update
    },

    {
        method: 'GET',
        path: '/api/connections/{id}',
        handler: EntityController.connections
    }
];
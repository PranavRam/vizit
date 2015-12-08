/**
 * Created by pranavram on 11/7/15.
 */
var MiscController = require('../controllers/misc');

module.exports = [

    {
        method: 'GET',
        path: '/api/tfidf',
        handler: MiscController.setTFDIF
    },

    {
        method: 'GET',
        path: '/api/reset',
        handler: MiscController.reset
    },

    {
        method: 'GET',
        path: '/api/reset-all',
        handler: MiscController.resetAll
    },

    {
        method: 'GET',
        path: '/updatemodels',
        handler: MiscController.updateGraph
    }
];
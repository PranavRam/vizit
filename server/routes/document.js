/**
 * Created by pranavram on 11/7/15.
 */
var DocumentController = require('../controllers/document')

module.exports = [
    {
        method: 'GET',
        path: '/api/documents',
        handler: DocumentController.index
    }
];
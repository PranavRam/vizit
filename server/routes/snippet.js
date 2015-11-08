/**
 * Created by pranavram on 11/7/15.
 */
var SnippetController = require('../controllers/snippet');

module.exports = [
    {
        method: 'POST',
        path: '/api/snippets',
        handler: SnippetController.create
    }
];
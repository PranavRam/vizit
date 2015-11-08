/**
 * Created by pranavram on 11/7/15.
 */
var EvidenceController = require('../controllers/evidence');

module.exports = [
    {
        method: 'GET',
        path: '/api/evidences',
        handler: EvidenceController.index
    },

    {
        method: 'PUT',
        path: '/api/evidences/{id}',
        handler: EvidenceController.update
    },
    {
        method: 'POST',
        path: '/api/evidences',
        handler: EvidenceController.create
    }
];
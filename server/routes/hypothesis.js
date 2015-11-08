var HypothesisController = require('../controllers/hypothesis');

module.exports = [
    {
        method: 'GET',
        path: '/api/hypotheses',
        handler: HypothesisController.index
    },

    {
        method: 'POST',
        path: '/api/hypotheses',
        handler: HypothesisController.create
    },

    {
        method: 'PUT',
        path: '/api/hypotheses/{id}',
        handler: HypothesisController.update
    },

    {
        method: 'GET',
        path: '/api/hypotheses/{id}/events',
        handler: HypothesisController.events
    }
];

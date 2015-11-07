/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;
var _ = require('lodash');

function getDocuments(reply) {
    var query = [
        'MATCH (n:Document)-[r:DOCENTITY]->(e)',
        'RETURN n, collect(e) as entities, collect(r) as offsets',
    ].join('\n')

    db.cypher({
        query: query,
    }, function (err, results) {
        if (err) return reply(err);
        var documents = results.map(function (doc) {
            // console.log(doc['n']);
            var obj = doc['n'].properties;
            var text = obj.text;
            // console.log(doc['entities']);
            doc['entities'].forEach(function (entity) {
                var id = entity._id;
                entity = entity.properties;
                // text = S(text).replaceAll(entity.text, '<'+entity.type+' data-entity-id="' + id + '">'+entity.text+'</'+entity.type+'>').s;
            });
            obj.text = text;
            obj.entities = _.groupBy(doc['entities'].map(function (entity) {
                var obj = entity.properties;
                obj._id = entity._id;
                return obj;
            }), 'type');
            obj._id = doc['n']._id
            return obj;
        });
        reply(documents);
    });
}

module.exports = [
    {
        method: 'GET',
        path: '/api/documents',
        handler: function (request, reply) {
            // console.log(request);
            getDocuments(reply);
        }
    }
];
/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;

function getEntities(reply) {
    var query = [
        'MATCH (n:Entity)',
        'RETURN n'
    ].join('\n');

    db.cypher({
        query: query,
    }, function (err, results) {
        if (err) return reply(err);
        var entities = results.map(function (entity) {
            // console.log(doc['n']);
            var obj = entity['n'].properties;
            obj._id = entity['n']._id;
            return obj;
        });
        reply(entities);
    });
}

module.exports = [
    {
        method: 'POST',
        path: '/api/entities/{id}',
        handler: function (request, reply) {
            // console.log(request);
            var id = encodeURIComponent(request.params.id);
            // console.log(request.payload);
            // reply(request.payload);
            var query = [
                'MATCH (n:Entity)',
                'WHERE id(n) = {id}',
                'SET n.weight = n.weight + {count}',
                'RETURN n'
            ].join('\n')

            db.cypher({
                query: query,
                params: {
                    id: +id,
                    count: +request.payload.count
                }
            }, function (err, results) {
                if (err) return reply(err);
                // console.log(results);
                var entity = results['n'];
                reply(entity);
            });
        }
    },

    {
        method: 'GET',
        path: '/api/entities/{id}',
        handler: function (request, reply) {
            // console.log(request);
            var id = encodeURIComponent(request.params.id);
            // console.log(request.payload);
            // reply(request.payload);
            var query = [
                'MATCH (n:Entity)',
                'WHERE id(n) = {id}',
                'RETURN n'
            ].join('\n')

            db.cypher({
                query: query,
                params: {
                    id: +id,
                }
            }, function (err, results) {
                if (err) return reply(err);
                console.log(results);
                var entities = results.map(function (entity) {
                    return entity['n']
                });
                reply(entities);
            });
        }
    },

    {
        method: 'GET',
        path: '/api/entities',
        handler: function (request, reply) {
            // console.log(request);
            getEntities(reply);
        }
    },

    {
        method: 'GET',
        path: '/api/connections/{id}',
        handler: function (request, reply) {
            // console.log(request);
            var id = encodeURIComponent(request.params.id);
            var query = [
                'MATCH (n:Entity)-[r:DOCENTITY*2..2]-(e:Entity)',
                'WHERE id(n) = {id}',
                'RETURN e',
            ].join('\n')

            db.cypher({
                query: query,
                params: {
                    id: +id
                }
            }, function (err, results) {
                if (err) return reply(err);
                var connections = results;
                connections = connections.map(function (connection) {
                    var obj = connection['e'].properties;
                    obj._id = connection['e']._id;
                    return obj;
                });
                reply(connections);
            });
        }
    }
];
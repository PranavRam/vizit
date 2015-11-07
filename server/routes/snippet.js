/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;

module.exports = [
    {
        method: 'POST',
        path: '/api/snippets',
        handler: function (request, reply) {
            // console.log(request);
            var snippet = request.payload.snippet;
            // console.log(request.payload);
            // reply(request.payload);
            var entities = request.payload.entities;
            var entityIds = [];
            for (entityType in entities) {
                if (entities.hasOwnProperty(entityType)) {
                    var ids = entities[entityType].map(function (entity) {
                        return +entity.id;
                    });
                    entityIds = entityIds.concat(ids)
                }
            }
            console.log(entityIds, snippet);
            // reply(entities);
            var query = [
                "MERGE (n:Snippet { text: {text} })",
                'ON CREATE SET n = {props}',
                'RETURN n',
            ].join('\n');

            var params = {
                props: snippet,
                text: snippet.text
            };

            db.cypher({
                query: query,
                params: params,
            }, function (err, results) {
                if (err) return reply(err);
                //console.log('snippet', results);
                var snippet = results[0]['n'];
                var query = [
                    "MATCH (a:Snippet),(b:Entity)",
                    "WHERE id(a) = {snippet_id} AND id(b) in {entityIds}",
                    "MERGE (a)-[r:SNIPPETENTITY]->(b)",
                    "ON CREATE SET b.weight = b.weight + 1",
                    "ON MATCH SET b.weight = b.weight + 1",
                    // "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
                    "RETURN r"
                ].join('\n');

                var params = {
                    entityIds: entityIds,
                    snippet_id: snippet._id,
                };

                db.cypher({
                    query: query,
                    params: params,
                }, function (err, results) {
                    if (err) return reply(err);
                    // console.log('relationship snippet', results);
                    reply(snippet);
                });
            });
        }
    }
];
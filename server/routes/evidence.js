/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;
function addEvent(reply, event, obj) {
    var query = [
        "MATCH (e:Evidence)-[r2]->(s:Snippet)-[r3]->(en:Entity)",
        "WITH e, sum(en.weight) as value",
        "SET e.weight = value",
        "WITH e",
        "OPTIONAL MATCH (h:Hypothesis)-[r]->(e)",
        "WHERE r.type = 'positive'",
        "WITH sum(e.weight) as pos, h, collect(e) as ep",
        "OPTIONAL MATCH (h:Hypothesis)-[r]->(e)",
        "WHERE r.type = 'negative'",
        "WITH sum(e.weight) as neg, h, pos, collect(e) as en, ep",
        "SET h.weight = pos - neg",
        "RETURN h"
    ].join('\n')

    db.cypher({
        query: query,
    }, function (err, results) {
        if (err) return reply(err);
        results.forEach(function (result) {
            if(!result['h']) return;
            console.log('add event', result['h']);
            var hypothesis = result['h'].properties;
            var id = +result['h']._id;

            var query = new Parse.Query(config.parse.hypothesis);
            query.equalTo("neo4j", id);
            query.first({
                success: function(object) {
                    //object.weight = hypothesis.weight;
                    object.add('events', {
                        name: event.name,
                        event: event.type,
                        obj: obj,
                        weight: hypothesis.weight,
                        time: new Date()
                    });
                    object.save();
                },
                error: function(error) {
                    //alert("Error: " + error.code + " " + error.message);
                }
            });
        });
        reply(results);
    });
}

function getEvidences(reply) {
    var query = [
        'MATCH (n:Evidence)-[r:EVIDENCESNIPPET]->(e)',
        'RETURN n, collect(e) as snippets'
    ].join('\n');

    db.cypher({
        query: query
    }, function (err, results) {
        if (err) return reply(err);
        var evidences = results.map(function (result) {
            var evidence = result['n'];
            var id = evidence._id;
            evidence = evidence.properties;
            evidence._id = id;
            evidence.content = result['snippets'].map(function (snippet) {
                var id = snippet._id;
                snippet = snippet.properties;
                snippet._id = id;
                return snippet;
                // text = S(text).replaceAll(entity.text, '<'+entity.type+' data-entity-id="' + id + '">'+entity.text+'</'+entity.type+'>').s;
            });
            // obj.entities = _.groupBy(doc['entities'].map(function(entity) {
            //   var obj = entity.properties;
            //   obj._id = entity._id;
            //   return obj;
            // }), 'type');
            // obj._id = doc['n']._id
            return evidence;
        });
        reply(evidences);
    });
}

module.exports = [
    {
        method: 'GET',
        path: '/api/evidences',
        handler: function (request, reply) {
            // console.log(request);
            getEvidences(reply);
        }
    },

    {
        method: 'PUT',
        path: '/api/evidences/{id}',
        handler: function (request, reply) {
            var id = +encodeURIComponent(request.params.id);
            //console.log(request.payload);
            var evidence = request.payload.evidence;
            var snippets = request.payload.snippets;
            //console.log('evidence', ev);
            //return reply(hypothesis);
            if (!snippets) {
                var query = [
                    "MATCH (n:Evidence)",
                    "WHERE id(n) = {evidence_id}",
                    "SET n = {evidence}",
                    // "ON CREATE SET b.weight = b.weight + 1",
                    // "ON MATCH SET b.weight = b.weight + 1",
                    // "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
                    "RETURN n"
                ].join('\n');

                var params = {
                    evidence_id: id,
                    evidence: _.pick(evidence, ['name', 'weight', 'x', 'y'])
                };

                db.cypher({
                    query: query,
                    params: params
                }, function (err, results) {
                    if (err) return reply(err);
                    var evidence = results[0]['n'];
                    //console.log(evidence);
                    reply(evidence);
                    //updateItems(reply);

                });
                return;
            }
            var snippet_ids = snippets.map(function (snippet) {
                return snippet._id;
            });
            //var ids = ev.map(function(evidence) {
            //    return evidence._id;
            //});
            //console.log('ev ids', ev_id, id);
            //reply('success');
            var query = [
                "MATCH (a:Evidence),(b:Snippet)",
                "WHERE id(a) = {evidence_id} AND id(b) in {snippet_ids}",
                "MERGE (a)-[r:EVIDENCESNIPPET]->(b)",
                // "ON CREATE SET b.weight = b.weight + 1",
                // "ON MATCH SET b.weight = b.weight + 1",
                // "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
                "RETURN r"
            ].join('\n');

            var params = {
                snippet_ids: snippet_ids,
                evidence_id: id
            };

            db.cypher({
                query: query,
                params: params,
            }, function (err, results) {
                if (err) return reply(err);
                var snippet = results[0]['r'];
                var event = {
                    name: evidence.name,
                    type: 'update evidence'
                };

                addEvent(reply, event, evidence);
                //reply(snippet);
                //console.log('relationship hypothesis evidence', results);
                /*var query = new Parse.Query(HypothesisParse);
                 query.equalTo("neo4j", id);
                 query.first({
                 success: function(object) {
                 //console.log('retrieved object', object);
                 object.add('events', {
                 name: ev.name,
                 event: 'add evidence',
                 obj: ev,
                 //weight: hypothesis.weight,
                 time: new Date()
                 });
                 object.save();
                 reply(hypothesis);
                 },
                 error: function(error) {
                 //alert("Error: " + error.code + " " + error.message);
                 reply(hypothesis);
                 }
                 });*/
            });
        }
    },
    {
        method: 'POST',
        path: '/api/evidences',
        handler: function (request, reply) {
            // console.log(request);
            var evidence = request.payload.evidence;
            var snippets = request.payload.snippets;
            var snippetIds = snippets.map(function (snippet) {
                return snippet._id;
            })
            var query = [
                "MERGE (n:Evidence {name: {evidence_name}})",
                'ON CREATE SET n = {props}',
                'RETURN n',
            ].join('\n');

            var params = {
                props: evidence,
                evidence_name: evidence.name
            };

            db.cypher({
                query: query,
                params: params,
            }, function (err, results) {
                if (err) return reply(err);
                var evidence = results[0]['n'];
                var query = [
                    "MATCH (a:Evidence),(b:Snippet)",
                    "WHERE id(a) = {evidence_id} AND id(b) in {snippetIds}",
                    "MERGE (a)-[r:EVIDENCESNIPPET]->(b)",
                    // "ON CREATE SET b.weight = b.weight + 1",
                    // "ON MATCH SET b.weight = b.weight + 1",
                    // "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
                    "RETURN r"
                ].join('\n');

                var params = {
                    snippetIds: snippetIds,
                    evidence_id: evidence._id,
                };

                db.cypher({
                    query: query,
                    params: params,
                }, function (err, results) {
                    if (err) return reply(err);
                    //console.log('relationship evidence snippet', results);
                    reply(evidence);

                });
            });
        }
    }
];
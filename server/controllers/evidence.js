/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;
var EventController = require('./event');
var Q = require('q');
var _ = require('lodash');

module.exports = {
    index: function (request, reply) {
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
    },

    create: function (request, reply) {
        var io = request.server.plugins['hapi-io'].io;
        var evidence = request.payload.evidence;
        var snippets = request.payload.snippets;
        var snippetIds = snippets.map(function (snippet) {
            return snippet._id;
        });
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
                "WITH a MATCH (a:Evidence)-->()-->(en:Entity)",
                "WITH sum(en.weight) as weights, a",
                "SET a.weight = weights",
                // "ON CREATE SET b.weight = b.weight + 1",
                // "ON MATCH SET b.weight = b.weight + 1",
                // "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
                "RETURN a"
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
                var event = {
                        name: evidence.name,
                        type: 'create evidence'
                    };
                EventController.create(event, evidence)
                        .then(function () {
                            io.emit('evidences:create', {evidence: evidence});
                        })
                // io.emit('evidences:create', {evidence: evidence});

            });
        });
    },

    update: function (request, reply) {
        var id = +encodeURIComponent(request.params.id);
        var io = request.server.plugins['hapi-io'].io;
        var evidence = request.payload.evidence;
        var snippets = request.payload.snippets;
        var oldHypotheses = [];
        function updateAttributes(evidence) {
            return Q.Promise(function(resolve, reject, notify) {
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
                    resolve(evidence);
                    io.emit('evidences:update', {evidence: evidence});
                });
            });
        }

        function updateNotifications(evidence) {
            var query = [
                "MATCH (e:Evidence)-->()-->(en:Entity)<--(sn)<--(ev)<--(h)",
                "WHERE id(e) = {evidence}",
                "RETURN collect(DISTINCT h) as hypotheses,  collect(DISTINCT ev) as evidences"
            ].join('\n');

            var params = {
                evidence: evidence._id
            };

            db.cypher({
                query: query,
                params: params
            }, function (err, results) {
                if (err) return reply(err);

                var notifications = results[0].hypotheses
                .filter(function(hyp) {
                    var oldHyp = _.find(oldHypotheses, function(ohyp) {
                        return hyp._id = ohyp._id;
                    });
                    return Math.abs((hyp.properties.weight - oldHyp.weight)/oldHyp.weight) > (oldHyp.threshold / 100);
                })
                .map(function (hyp) {     
                    return {
                        title: hyp.properties.name + ' changed to ' + hyp.properties.weight,
                        description: 'added evidence ' + evidence.name + ' to ' + hypothesis.name
                    }
                });
                console.log('evidencess');
                console.log(oldHypotheses, results[0].hypotheses, notifications);
                if(notifications.length > 0){
                    io.emit('notifications', {data: notifications});
                }
            });
        }

        function updateSnippets(evidence, snippets) {
            console.log('update snippet 1');
            return Q.Promise(function(resolve, reject, notify) {
                var snippet_ids = snippets.map(function (snippet) {
                    return snippet._id;
                });

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
                console.log('updating snippet');
                db.cypher({
                    query: query,
                    params: params
                }, function (err, results) {
                    if (err) return reply(err);
                    var snippet = results[0]['r'];
                    var event = {
                        name: evidence.name,
                        type: 'update evidence'
                    };

                    resolve('updated evidence');
                    console.log('creating event');
                    EventController.create(event, evidence)
                        .then(function () {
                            updateNotifications(evidence);
                            io.emit('evidences:update', {evidence: evidence});
                        })

                });
            });
        }

        function getOld() {
            var query = [
                "MATCH (n:Hypothesis)",
                "OPTIONAL MATCH n-[r1:HYPEV {type: 'positive'}]->(ep)",
                "WITH collect(ep) as pos_ev, n",
                "OPTIONAL MATCH n-[r2:HYPEV {type: 'negative'}]->(en)",
                "RETURN n, collect(en) as neg_ev , pos_ev"
            ].join('\n');

            db.cypher({
                query: query
            }, function (err, results) {
                if (err) return reply(err);
                //console.log(results);
                oldHypotheses = flattenHypotheses(results);
                updateSnippets(evidence, snippets)
                .then(function() {
                    reply(evidence);
                });
            });
        }
        if (!snippets) {
            updateAttributes(evidence)
                .then(function() {
                    reply(evidence);
                });
        }
        else {
            getOld();
        }
    }
};
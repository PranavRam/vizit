var config = require('../config');
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
function getHypotheses(reply) {
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
        console.log(results);
        var hypotheses = results.map(function (result) {
            var hypothesis = result['n'].properties;
            hypothesis._id = result['n']._id;
            var positive = result['pos_ev'] || [];
            var negative = result['neg_ev'] || [];
            hypothesis.positive = positive.map(function (evidence) {
                var obj = evidence.properties;
                obj._id = evidence._id;
                return obj;
            });
            hypothesis.negative = negative.map(function (evidence) {
                var obj = evidence.properties;
                obj._id = evidence._id;
                return obj;
            });
            //console.log(hypothesis);
            return hypothesis;
        });
        reply(hypotheses);
    });
}
module.exports = [
    {
        method: 'GET',
        path: '/api/hypotheses',
        handler: function (request, reply) {
            // console.log(request);
            getHypotheses(reply);
        }
    },

    {
        method: 'GET',
        path: '/api/hypotheses/{id}/events',
        handler: function(request, reply) {
            var id = +encodeURIComponent(request.params.id);
            var query = new Parse.Query(config.parse.hypothesis);
            query.equalTo("neo4j", id);
            query.first({
                success: function(object) {
                    //console.log('retrieved object', object);
                    reply(object);
                },
                error: function(error) {
                    //alert("Error: " + error.code + " " + error.message);
                    reply({});
                }
            });
        }
    },

    {
        method: 'POST',
        path: '/api/hypotheses',
        handler: function (request, reply) {
            // console.log(request);
            var hypothesis = request.payload.hypothesis;
            //var positiveEv = request.payload.positiveEv;
            //var negativeEv = request.payload.negativeEv;
            //var positiveIds = positiveEv.map(function(evidence) {
            //    return evidence._id;
            //});
            //var negativeIds = negativeEv.map(function(evidence) {
            //    return evidence._id;
            //});
            var query = [
                "MERGE (n:Hypothesis {name: {hypothesis_name}})",
                'ON CREATE SET n = {props}',
                'RETURN n'
            ].join('\n');

            var params = {
                props: hypothesis,
                hypothesis_name: hypothesis.name
            };

            db.cypher({
                query: query,
                params: params
            }, function (err, results) {
                if (err) return reply(err);
                console.log('add hypothesis', results[0]);
                var hypothesis = results[0]['n'].properties;
                hypothesis._id = results[0]['n']._id;
                var hypothesis_parse = new config.parse.hypothesis();

                hypothesis_parse.set("neo4j", hypothesis._id);
                hypothesis_parse.set("name", hypothesis.name);
                hypothesis_parse.set("weight", 0);
                hypothesis_parse.set("events", []);

                hypothesis_parse.save(null, {
                    success: function (hypothesis_parse) {
                        // Execute any logic that should take place after the object is saved.
                        reply(hypothesis);
                        //console.log('New object created with objectId: ' + hypothesis_parse.id);
                    },
                    error: function (hypothesis_parse, error) {
                        // Execute any logic that should take place if the save fails.
                        // error is a Parse.Error with an error code and message.
                        reply(hypothesis);
                        console.log('Failed to create new object, with error code: ' + error.message);
                    }
                });


            });
        }
    },

    {
        method: 'PUT',
        path: '/api/hypotheses/{id}',
        handler: function (request, reply) {
            var id = +encodeURIComponent(request.params.id);
            //console.log(request.payload);
            var hypothesis = request.payload.hypothesis;
            var oldWeight = +request.payload.weight;
            var ev = request.payload.ev;
            //console.log('evidence', ev);
            //return reply(hypothesis);
            if(!ev) {
                //console.log('here');
                var query = [
                    "MATCH (n:Hypothesis)",
                    "WHERE id(n) = {hypothesis_id}",
                    "SET n = {hypothesis}",
                    // "ON CREATE SET b.weight = b.weight + 1",
                    // "ON MATCH SET b.weight = b.weight + 1",
                    // "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
                    "RETURN n"
                ].join('\n');

                var params = {
                    hypothesis_id: id,
                    hypothesis: _.pick(hypothesis, ['name', 'weight', 'x', 'y'])
                };

                db.cypher({
                    query: query,
                    params: params
                }, function (err, results) {
                    if (err) return reply(err);
                    var hypothesis = results[0]['n'];
                    console.log(hypothesis);
                    reply(hypothesis);

                });
                return;
            }
            var ev_id = ev._id;
            //var ids = ev.map(function(evidence) {
            //    return evidence._id;
            //});
            //console.log('ev ids', ev_id, id);
            //reply('success');
            var query = [
                "MATCH (a:Hypothesis),(b:Evidence)",
                "WHERE id(a) = {hypothesis_id} AND id(b) = {ev_id}",
                "MERGE (a)-[r:HYPEV {type: {type}}]->(b)",
                "ON CREATE SET a.weight = {weight}",
                // "ON CREATE SET b.weight = b.weight + 1",
                // "ON MATCH SET b.weight = b.weight + 1",
                // "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
                "RETURN r"
            ].join('\n');

            var params = {
                ev_id: ev_id,
                type: hypothesis.tabType,
                hypothesis_id: id,
                weight: hypothesis.weight
            };

            db.cypher({
                query: query,
                params: params,
            }, function (err, results) {
                if (err) return reply(err);
                //console.log('relationship hypothesis evidence', results);
                var event = {
                    name: ev.name,
                    type: 'add evidence'
                };

                addEvent(reply, event, ev);
            });
        }
    }
];

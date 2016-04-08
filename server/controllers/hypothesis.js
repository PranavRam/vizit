var config = require('../config');
var db = config.db;
var Parse = require('parse/node').Parse;
var EventController = require('./event');
var Q = require('q');
var _ = require('lodash');

function flattenGraphNodes(data) {
    var flattened = data.properties;
    flattened._id = data._id;
    return flattened;
}

function flattenHypotheses(results) {
    return results.map(function (result) {
        var hypothesis = flattenGraphNodes(result['n']);
        var positive = result['pos_ev'] || [];
        var negative = result['neg_ev'] || [];
        hypothesis.positive = positive.map(function (evidence) {
            return flattenGraphNodes(evidence);
        });
        hypothesis.negative = negative.map(function (evidence) {
            return flattenGraphNodes(evidence)
        });
        //console.log(hypothesis);
        return hypothesis;
    });
}

function createNoSQL(hypothesis) {
    var query = new Parse.Query(config.parse.hypothesis);
    query.find({
        success: function (results) {
            var maxCount = 0;
            results.forEach(function (hypo) {
                if (hypo.get('events').length > maxCount) {
                    maxCount = hypo.get('events').length;
                }
            });
            var hypothesis_parse = new config.parse.hypothesis();
            var i;
            var events = [];
            for(i=0; i<maxCount; i++) {
                events.push({
                    name: '',
                    event: '',
                    obj: {},
                    weight: 0,
                    time: new Date()
                });
            }
            events.push({
                name: hypothesis.name,
                event: 'created hypothesis: ' + hypothesis.name,
                obj: hypothesis,
                weight: 0,
                threshold: 5,
                time: new Date()
            });
            hypothesis_parse.set("neo4j", hypothesis._id);
            hypothesis_parse.set("name", hypothesis.name);
            hypothesis_parse.set("events", events);

            hypothesis_parse.save(null, {
                success: function (response) {
                    // Execute any logic that should take place after the object is saved.
                    //console.log('New object created with objectId: ' + hypothesis_parse.id);
                },
                error: function (response, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    console.log('Failed to create new object, with error code: ' + error.message);
                }
            });
        },
        error: function (error) {
            //alert("Error: " + error.code + " " + error.message);
            //reply({});
        }
    });
}

module.exports = {
    index: function (request, reply) {

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
            var hypotheses = flattenHypotheses(results);
            reply(hypotheses);
        });
    },

    create: function (request, reply) {
        var io = request.server.plugins['hapi-io'].io;
        var hypothesis = request.payload.hypothesis;
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
            //console.log('add hypothesis', results[0]);
            var hypothesis = flattenGraphNodes(results[0]['n']);
            createNoSQL(hypothesis);
            io.emit('hypotheses:create', {hypothesis: hypothesis});
            reply(hypothesis);
        });
    },

    update: function (request, reply) {
        var io = request.server.plugins['hapi-io'].io;
        var id = +encodeURIComponent(request.params.id);
        var hypothesis = request.payload.hypothesis;
        var evidence = request.payload.ev;
        var oldHypotheses = [];
        function updateAttributes(hypothesis) {
            return Q.Promise(function (resolve, reject, notify) {
                //console.log('updating attributes', id);
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
                    hypothesis: _.pick(hypothesis, ['name', 'weight', 'threshold', 'x', 'y'])
                };

                db.cypher({
                    query: query,
                    params: params
                }, function (err, results) {
                    if (err) return reply(err);
                    var hyp = results[0]['n'];
                    console.log('hypotheses attributes updated');
                    var id = +encodeURIComponent(request.params.id);
                    var query = new Parse.Query(config.parse.hypothesis);
                    query.equalTo("neo4j", id);
                    query.first({
                        success: function (object) {
                            //console.log('retrieved object', object);
                            object.set('name', hypothesis.name);
                            object.save();
                        },
                        error: function (error) {
                            //alert("Error: " + error.code + " " + error.message);
                            //resolve({});
                        }
                    });
                    resolve(hyp);
                });
            });
        }

        function updateNotifications(hypothesis, evidences) {
            var query = [
                "MATCH (e:Hypothesis)-->()-->()-->(en:Entity)<--(sn)<--(ev)<--(h)",
                "WHERE id(e) = {hypothesis}",
                "RETURN collect(DISTINCT h) as hypotheses,  collect(DISTINCT ev) as evidences"
            ].join('\n');

            var params = {
                hypothesis: hypothesis._id
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
                console.log(oldHypotheses, results[0].hypotheses, notifications);
                if(notifications.length > 0){
                    io.emit('notifications', {data: notifications});
                }
            });
        }

        function updateEvidence(hypothesis, evidence) {
            return Q.Promise(function (resolve, reject, notify) {
                var query = [
                    "MATCH (a:Hypothesis),(b:Evidence)",
                    "WHERE id(a) = {hypothesis_id} AND id(b) = {ev_id}",
                    "MERGE (a)-[r:HYPEV {type: {type}}]->(b)",
                    "WITH a MATCH (a)-->()-->()-->(en)",
                    "SET en.weight = en.weight + 1",
                    "RETURN a"
                ].join('\n');

                var params = {
                    ev_id: evidence._id,
                    type: hypothesis.tabType,
                    hypothesis_id: hypothesis._id
                };

                db.cypher({
                    query: query,
                    params: params
                }, function (err, results) {
                    if (err) return reply(err);
                    //console.log('relationship hypothesis evidence', results);
                    var event = {
                        name: evidence.name,
                        type: 'add evidence'
                    };
                    resolve(results);
                    EventController.create(event, evidence)
                        .then(function () {
                            updateNotifications(hypothesis, evidence);
                            io.emit('hypotheses:update', {evidence: evidence, hypothesis: hypothesis});
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
                updateEvidence(hypothesis, evidence)
                    .then(function () {
                        reply(hypothesis);
                    })
            });
        }
        if (!evidence) {
            //console.log('here');
            updateAttributes(hypothesis)
                .then(function () {
                    reply(hypothesis);
                })
        }
        else {
            getOld();
        }
    },

    events: function (request, reply) {
        var id = +encodeURIComponent(request.params.id);
        var query = new Parse.Query(config.parse.hypothesis);
        query.equalTo("neo4j", id);
        query.first({
            success: function (object) {
                //console.log('retrieved object', object);
                reply(object);
            },
            error: function (error) {
                //alert("Error: " + error.code + " " + error.message);
                reply({});
            }
        });
    }
};
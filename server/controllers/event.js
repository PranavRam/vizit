/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config');
var db = config.db;
var Parse = require('parse/node').Parse;
var Q = require('q');

module.exports = {
    index: function(request, reply) {
        var query = new Parse.Query(config.parse.hypothesis);
        query.find({
            success: function(results) {
                //console.log('retrieved object', object);
                reply(results);
            },
            error: function(error) {
                //alert("Error: " + error.code + " " + error.message);
                reply({});
            }
        });
    },

    create: function (event, obj) {
        return Q.Promise(function(resolve, reject, notify) {
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
            ].join('\n');

            db.cypher({
                query: query,
            }, function (err, results) {
                if (err) return reply(err);
                results.forEach(function (result) {
                    if (!result['h']) return;
                    //console.log('add event', result['h']);
                    var hypothesis = result['h'].properties;
                    var id = +result['h']._id;

                    var query = new Parse.Query(config.parse.hypothesis);
                    query.equalTo("neo4j", id);
                    query.first({
                        success: function (object) {
                            //object.weight = hypothesis.weight;
                            object.add('events', {
                                name: event.name,
                                event: event.type,
                                obj: obj,
                                weight: hypothesis.weight,
                                threshold: hypothesis.threshold,
                                time: new Date()
                            });
                            object.save();
                        },
                        error: function (error) {
                            reject(error);
                            //alert("Error: " + error.code + " " + error.message);
                        }
                    });
                });
                resolve(results);
            });
        });
    }
};
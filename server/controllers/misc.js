/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;
var Q = require('q');
var natural = require('natural');
var TfIdf = natural.TfIdf;
var _ = require('lodash');

module.exports = {
    setTFDIF: function (request, reply) {
        return Q.Promise(function (resolve, reject, notify) {
            var query = [
                'MATCH n',
                'WHERE n:Document OR n:Entity',
                'RETURN n',
            ].join('\n')

            db.cypher({
                query: query,
            }, function (err, results) {
                if (err) return reply(err);
                console.log('enter');
                var documents = results.filter(function (doc) {
                    return doc['n'].labels.indexOf('Document') > -1;
                });
                var entities = results.filter(function (entity) {
                    return entity['n'].labels.indexOf('Entity') > -1;
                });
                // console.log(documents, entities);
                tfidf = new TfIdf();
                documents.forEach(function (doc) {
                    tfidf.addDocument(doc['n'].properties.text);
                });
                entities.forEach(function (entity) {
                    var totalMeasureArr = tfidf.tfidfs(entity['n'].properties.text, function (i, measure) {
                        return measure;
                    });
                    var totalMeasure = _.reduce(totalMeasureArr, function (total, n) {
                        return total + n;
                    });
                    var query = [
                        'MATCH (n:Entity {text: {name}})',
                        'SET n.tfidf = {measure}',
                        'RETURN n',
                    ].join('\n');
                    var params = {
                        name: entity['n'].properties.text,
                        measure: totalMeasure
                    };

                    db.cypher({
                        query: query,
                        params: params,
                    }, function (err, results) {
                        // console.log(results);
                    });
                });
                //console.log('exit');
                resolve("Done setTFDIF");
            });
        })
    },

    reset: function (request, reply) {
        // console.log(request);
        // console.log(request.payload);
        // reply(request.payload);
        var query = [
            'MATCH (n)',
            'WHERE NOT n:Document AND NOT n:Entity',
            'OPTIONAL MATCH (n)-[r]-()',
            'DELETE n,r',
            'WITH n MATCH (e:Entity)',
            'SET e.weight = 0',
            'RETURN e'
        ].join('\n')

        db.cypher({
            query: query,
        }, function (err, results) {
            if (err) return reply(err);
            var query = new Parse.Query(config.parse.hypothesis);
            query.find().then(function(results) {
                return Parse.Object.destroyAll(results);
            }).then(function() {
                // Done
            }, function(error) {
                // Error
            });
            query = new Parse.Query(config.parse.notification);
            query.find().then(function(results) {
                return Parse.Object.destroyAll(results);
            }).then(function() {
                // Done
            }, function(error) {
                // Error
            });
            // console.log(results);
            reply("success");
        });
    },

    resetAll: function (request, reply) {
        // console.log(request);
        // console.log(request.payload);
        // reply(request.payload);
        var query = [
            'MATCH (n)',
            'OPTIONAL MATCH (n)-[r]-()',
            'DELETE n,r'
        ].join('\n');

        db.cypher({
            query: query,
        }, function (err, results) {
            if (err) return reply(err);
            var query = new Parse.Query(config.parse.hypothesis);
            query.find().then(function(results) {
                return Parse.Object.destroyAll(results);
            }).then(function() {
                // Done
            }, function(error) {
                // Error
            });
            query = new Parse.Query(config.parse.notification);
            query.find().then(function(results) {
                return Parse.Object.destroyAll(results);
            }).then(function() {
                // Done
            }, function(error) {
                // Error
            });
            // console.log(results);
            reply("success");
        });
    },

    updateGraph: function (request, reply) {
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
            query: query
        }, function (err, results) {
            if (err) return reply(err);
            //console.log(results);
            reply(results);
        });
    }
};
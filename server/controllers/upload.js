/**
 * Created by pranavram on 11/7/15.
 */
var config = require('../config/');
var db = config.db;
var Parse = require('parse/node').Parse;
var AdmZip = require('adm-zip');
var fs = require('fs');
var multiparty = require('multiparty');
var Q = require('q');
var S = require('string');
var http = require('request');
var _ = require('lodash');
var Path = require('path');
var setTFDIF = require('./misc').setTFDIF;
function addEntity(entity, cb) {
    return Q.Promise(function (resolve, reject, notify) {
        var query = [
            "MERGE (n:Entity {text: {text}})",
            'ON CREATE SET n = {props}',
            'ON MATCH SET n.count = n.count + 1',
            'RETURN n',
        ].join('\n');

        var props = {
            type: entity["NER"],
            text: entity.word,
            count: 1,
            weight: 0,
            tfidf: 0
        };

        var params = {
            props: props,
            text: entity.word,
            type: entity["NER"]
        };

        db.cypher({
            query: query,
            params: params,
        }, function (err, results) {
            if (err) return cb(err);

            var createdEntity = results[0]['n'];
            entity.id = createdEntity._id;
            resolve(createdEntity);
        });
    });
}

function addEntityToDocument(entity, doc) {
    return Q.Promise(function (resolve, reject, notify) {
        addEntity(entity)
            .then(function (result) {
                var createdEntity = result;
                var query = [
                    "MATCH (a:Document),(b:Entity)",
                    "WHERE id(a) = {document_id} AND id(b) = {entity_id}",
                    "MERGE (a)-[r:DOCENTITY]->(b)",
                    // "ON CREATE SET r.startOffset = [{startOffset}], r.endOffset = [{endOffset}]",
                    // "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
                    "RETURN r"
                ].join('\n');

                var params = {
                    document_id: doc._id,
                    entity_id: createdEntity._id,
                    startOffset: entity.CharacterOffsetBegin,
                    endOffset: entity.CharacterOffsetEnd,
                };

                db.cypher({
                    query: query,
                    params: params,
                }, function (err, results) {
                    if (err) {
                    }
                    var createdRelation = results
                    resolve(createdRelation);
                    // console.log(createdRelation);
                    // console.log(createdRelation);
                });
            })
    })
}

function prepareText(doc, entities) {
    var offset = 0;
    var text = doc.text;
    entities.forEach(function (entity) {
        var start = +entity.CharacterOffsetBegin;
        var end = +entity.CharacterOffsetEnd;
        var entityLength = entity["NER"].length;
        var entityType = entity["NER"];
        var entityId = entity.id;
        var entityIdLength = S(entityId).length;
        text = text.substr(0, start + offset) + "<" + entityType + " data-entity-id='" + entityId + "'>" + entity.word + "</" + entityType + ">" + text.substr(end + offset, text.length);
        offset += (5 + 2 * entityLength + 18 + entityIdLength);
    });
    return text;
}

function createDocument(doc, entities) {
    return Q.Promise(function (resolve, reject, notify) {
        // doc.text = prepareText(doc, entities).replace(/\r?\n/g, '<br />');
        // console.log(doc.text);
        // return resolve(doc.text);
        var query = [
            "MERGE (n:Document { name: {name} })",
            'ON CREATE SET n = {props}',
            'RETURN n',
        ].join('\n');

        var params = {
            props: doc,
            name: doc.name
        };

        db.cypher({
            query: query,
            params: params,
        }, function (err, results) {
            if (err) return reply(err);
            console.log('Created doc', doc.name);
            var createdDoc = results[0]['n'];
            var funcs = [];
            entities.forEach(function (entity) {
                funcs.push(function (entity, createdDoc) {
                    return function () {
                        return addEntityToDocument(entity, createdDoc);
                    }
                }(entity, createdDoc))
            });
            // console.log("deferred");
            // return result;
            var result = Q();
            funcs.forEach(function (f) {
                result = result.then(f);
            });
            // console.log('start:e');
            // funcs.forEach(function(promise) {
            //   console.log(promise);
            // });
            // console.log('end:e');
            result
                .then(function () {
                    console.log('Created Entities', createdDoc.properties.name);
                    var text = prepareText(doc, entities).replace(/\r?\n/g, '<br />');
                    var query = [
                        "MATCH (n:Document)",
                        "WHERE id(n) = {id}",
                        'SET n.parsedText = {text}',
                        'RETURN n',
                    ].join('\n');

                    var params = {
                        text: text,
                        id: +createdDoc._id
                    };

                    db.cypher({
                        query: query,
                        params: params,
                    }, function (err, results) {
                        console.log('updated doc text', doc.name);
                        if (err) return reject(err);
                        resolve(createdDoc.properties.name);
                    });

                })
            // .then();
        });
    })
}

function extractEntities(doc, io) {
    // alchemy.entities(doc.text, {}, function(err, response) {
    //   if (err) throw err;

    //   // See http://www.alchemyapi.com/api/entity/htmlc.html for format of returned object
    //   var entities = response.entities;
    //   entities.forEach(function(entity) {
    //   	// addEntityToDocument(entity, doc);
    //   	doc.text = S(doc.text).replaceAll(entity.text, '<'+entity.type+'>'+entity.text+'</'+entity.type+'>').s;
    //   });
    //   createDocument(doc, entities, deferred);
    //   // console.log(text);
    //   // Do something with data
    // });
    return Q.Promise(function (resolve, reject, notify) {
        console.log("extracting entities", doc.name);
        http.post({url: 'http://localhost:9000/corenlp', form: {text: doc.text}}, function (err, httpResponse, body) {
            var entities = JSON.parse(body);
            createDocument(doc, entities)
                .then(function () {
                    //console.log("Done with doc creation!", doc.name);
                    resolve('done document', doc.name)
                    io.emit('document:processed', {document: doc});
                });
        });
    })
}

function readZip(path, io) {
    // reading archives
    var zip = new AdmZip(path);
    var zipEntries = zip.getEntries(); // an array of ZipEntry records
    var i = 0;
    var promises = [];
    //console.log('zip entries');
    while (i < 3) {
        var zipEntry = zipEntries[i];
        var name = zipEntry.entryName;
        if (name.match(/\.(txt)/g) && !S(name).startsWith("__MACOSX")) {
            console.log(zipEntry.entryName);
            var doc = {
                name: name,
                text: zip.readAsText(zipEntry.entryName).replace(/[^\x00-\x7F]/g, "")
            }
            promises.push(function (doc) {
                return function () {
                    return extractEntities(doc, io);
                }
            }(doc));
            // promises.push(deferred.promise);
        }
        i++;
    }
    console.log('zip entries end');
    // console.log(promises);
    // promises.reduce(Q.when, Q(0))
    // console.log('start');
    // promises.forEach(function(promise) {
    //   console.log(promise);
    // });
    // console.log('end');
    // promises.map(function (f) {
    //     return f();
    // });
    // var result = Q(0);
    // promises.forEach(function (f) {
    //     result = result.then(f);
    // });
    // return result;
    return promises.reduce(Q.when, Q(0));
    // return Q.all(promises)
    // createDocument(doc, reply);
    // console.log(zip.readAsText(zipEntry.entryName));
    // zipEntries.forEach(function(zipEntry) {
    //     // console.log(zipEntry.toString()); // outputs zip entries information
    //     console.log(zip.readAsText(zipEntry.entryName));
    // });
}

var upload = function (files, io) {
    //console.log('upload function', files);
    //return Q.Promise(function (resolve, reject, notify) {
        fs.readFile(files.file[0].path, function (err, data) {
            fs.writeFile(Path.join(__dirname, '../uploads/') + files.file[0].originalFilename, data, function (err) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log('uploading');
                var result = readZip(Path.join(__dirname, '../uploads/') + files.file[0].originalFilename, io);
                result.then(function () {
                    //console.log("loaded", arguments);
                    setTFDIF()
                        .then(function () {
                            io.emit('documents:processed');
                        })
                });
                // return reply('File uploaded to: ' + Path.join(__dirname, 'server/uploads/') + files.file[0].originalFilename);

            });
        });
    //});
};
module.exports = {
    uploadDocuments: function (request, reply) {
        var io = request.server.plugins['hapi-io'].io;
        var form = new multiparty.Form();
        form.parse(request.payload, function (err, fields, files) {
            //console.log('upload handler')
            if (err) return reply(err);
            upload(files, io);
            reply("uploaded documents");
        });
    }
};
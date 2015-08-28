var Path = require('path');
var Hapi = require('hapi');
var Inert = require('inert');
var AdmZip = require('adm-zip');
var fs = require('fs');
var multiparty = require('multiparty');
var neo4j = require("neo4j");
var AlchemyAPI = require('alchemy-api');
var swig = require('swig');
var S = require('string');
var _ = require('lodash');
var Q = require('q');
var natural = require('natural'),
    TfIdf = natural.TfIdf;

var http = require('request');

var alchemy = new AlchemyAPI('e611893e79748690d9a387240bab8b64f14b9a2b');

var db = new neo4j.GraphDatabase("http://vizit:0bp1mago6MgssAE46bH3@vizit.sb05.stations.graphenedb.com:24789");
// db.createConstraint({
//     label: 'Document',
//     property: 'name',
// }, function (err, constraint) {
//     if (err) throw err;     // Failing fast for now, by crash the application.
//     if (constraint) {
//         console.log('(Registered unique documents constraint.)');
//     } else {
//         // Constraint already present; no need to log anything.
//     }
// })
swig.setDefaults({ varControls: ['[[', ']]'] });

// Create a server with a host and port
var server = new Hapi.Server();

var upload = function(files) {
    console.log('upload function');
    return Q.Promise(function(resolve, reject, notify) {
      fs.readFile(files.file[0].path, function(err, data) {
          fs.writeFile(Path.join(__dirname, 'server/uploads/') + files.file[0].originalFilename, data, function(err) {
              if (err) return reply(err);
              console.log('uploading');
              var result = readZip(Path.join(__dirname, 'server/uploads/') + files.file[0].originalFilename);
              result.then(function() {
                console.log("loaded", arguments);
                setTFDIF()
                  .then(function(){
                    resolve("done with NER");
                  })
              })
              // return reply('File uploaded to: ' + Path.join(__dirname, 'server/uploads/') + files.file[0].originalFilename);

          });
      });
    });
};

function addEntity(entity, cb) {
   return Q.Promise(function(resolve, reject, notify) {
  		var query = [
  				"MERGE (n:Entity {text: {text}})",
  	      'ON CREATE SET n = {props}',
          'ON MATCH SET n.count = n.count + 1',
  	      'RETURN n',
  	  ].join('\n');

  	  var props = {
  	  	type: entity["NER"],
  	  	text: entity.word,
        count: 1
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
  return Q.Promise(function(resolve, reject, notify) {
      addEntity(entity)
        .then(function(result) {
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
              if (err) {}
              var createdRelation = results
              resolve(createdRelation);
              // console.log(createdRelation);
              // console.log(createdRelation);
          });
        })
  })
}

function extractEntities(doc) {
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
  return Q.Promise(function(resolve, reject, notify) {
    console.log("extracting entities", doc.name);
    http.post({url:'http://localhost:9000/corenlp', form: {text: doc.text}}, function(err,httpResponse,body){
          var entities = JSON.parse(body);
          createDocument(doc, entities)
            .then(function() {
              console.log("Done with doc creation!", doc.name);
              resolve('done document', doc.name)
            });
    });
  })
}

function prepareText(doc, entities) {
  var offset = 0;
  var text = doc.text;
  entities.forEach(function(entity) {
    var start = +entity.CharacterOffsetBegin;
    var end = +entity.CharacterOffsetEnd;
    var entityLength = entity["NER"].length;
    var entityType = entity["NER"];
    var entityId = entity.id;
    var entityIdLength = S(entityId).length;
    text = text.substr(0, start + offset) + "<" + entityType + " data-entity-id='" + entityId + "'>" + entity.word + "</" + entityType +">" + text.substr(end + offset, text.length);
    offset += (5 + 2 * entityLength + 18 + entityIdLength);
  });
  return text;
}

function createDocument(doc, entities) {
  return Q.Promise(function(resolve, reject, notify) {
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
        entities.forEach(function(entity) {
          funcs.push(function(entity, createdDoc) {
            return function() {
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
            .then(function() {
              console.log('Created Entities',createdDoc.properties.name);
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
function readZip(path) {
	// reading archives 
  var zip = new AdmZip(path);
  var zipEntries = zip.getEntries(); // an array of ZipEntry records 
 	var i = 0;
  var promises = [];
  console.log('zip entries');
 	while(i < 3) {
 		var zipEntry = zipEntries[i];
 		var name = zipEntry.entryName;
 		if(name.match(/\.(txt)/g) && !S(name).startsWith("__MACOSX")){
 			console.log(zipEntry.entryName);
 			var doc = {
 				name: name,
 				text: zip.readAsText(zipEntry.entryName).replace(/[^\x00-\x7F]/g, "")
 			}
      promises.push(function(doc){
        return function() {
          return extractEntities(doc);
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

function setTFDIF(reply) {
  return Q.Promise(function(resolve, reject, notify) {
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
        var documents = results.filter(function(doc) {
          return doc['n'].labels.indexOf('Document') > -1;
        });
        var entities = results.filter(function(entity) {
          return entity['n'].labels.indexOf('Entity') > -1;
        });
        // console.log(documents, entities);
        tfidf = new TfIdf();
        documents.forEach(function(doc) {
          tfidf.addDocument(doc['n'].properties.text);
        });
        entities.forEach(function(entity) {
          var totalMeasureArr = tfidf.tfidfs(entity['n'].properties.text, function(i, measure) {
              return measure;
          });
          var totalMeasure = _.reduce(totalMeasureArr, function(total, n) {
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
        })
        console.log('exit');
        resolve("Done setTFDIF");
    });
  })
}

function getDocuments(reply) {
	var query = [
    'MATCH (n:Document)-[r:DOCENTITY]->(e)',
    'RETURN n, collect(e) as entities, collect(r) as offsets',
  ].join('\n')

  db.cypher({
      query: query,
  }, function (err, results) {
      if (err) return reply(err);
      var documents = results.map(function(doc) {
          // console.log(doc['n']);
          var obj = doc['n'].properties;
          var text = obj.text;
          // console.log(doc['entities']);
          doc['entities'].forEach(function(entity) {
            var id = entity._id;
            entity = entity.properties;
            // text = S(text).replaceAll(entity.text, '<'+entity.type+' data-entity-id="' + id + '">'+entity.text+'</'+entity.type+'>').s;
          });
          obj.text = text;
          obj.entities = _.groupBy(doc['entities'].map(function(entity) {
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

function getEntities(reply) {
	var query = [
    'MATCH (n:Entity)',
    'RETURN n',
  ].join('\n')

  db.cypher({
      query: query,
  }, function (err, results) {
      if (err) return reply(err);
      var entities = results.map(function(entity) {
      		// console.log(doc['n']);
          var obj = entity['n'].properties;
          obj._id = entity['n']._id
          return obj;
      });
      reply(entities);
  });
}

server.register([
	require('vision'),
	Inert
	], function () {
    server.connection({ 
        host: 'localhost', 
        port: 8000 
    });

    server.views({
    	engines: {
    		html: swig
    	},
    	path: Path.join(__dirname, 'server/views')
    })
    // Add the route
    server.route({
        method: 'GET',
        path:'/', 
        handler: function (request, reply) {
        	// console.log(request);
         	reply.view('index', {title: 'Vizit'});
        }
    });

    server.route({
        method: 'GET',
        path:'/api/documents', 
        handler: function (request, reply) {
        	// console.log(request);
         	getDocuments(reply);
        }
    });

    server.route({
        method: 'GET',
        path:'/api/entities', 
        handler: function (request, reply) {
        	// console.log(request);
         	getEntities(reply);
        }
    });

    server.route({
        method: 'GET',
        path:'/api/tfidf', 
        handler: function (request, reply) {
          // console.log(request);
          setTFDIF(reply);
        }
    });

    server.route({
        method: 'GET',
        path:'/api/named-entities', 
        handler: function (request, reply) {
          var sentence = 'Jason John , 61 years old , will join the board as a nonexecutive director Nov. 29 . He works at Google';
          // var nameFinder = new openNLP().nameFinder;
          // nameFinder.find(sentence, function(err, results) {
          //     console.log(results.toString());
          //     reply(results.toString());
          // });
          coreNLP.process(sentence, function(err, result) {
                if(err)
                  throw err;
                else
                  reply(JSON.stringify(result));
            });
        }
    });

    server.route({
    	method: 'POST',
    	path: '/upload',
    	config: {
    		payload: {
            maxBytes: 209715200,
			      output: 'stream',
			      parse: false
        },
        timeout: {
          socket: false
        }
    	},
	    handler: function (request, reply) {
        var form = new multiparty.Form();
        form.parse(request.payload, function(err, fields, files) {
            console.log('upload handler')
            if (err) return reply(err);
            upload(files, reply)
                      .then(function() {
                        console.log("Finally Done");
                        reply("Finally Done");
                      });
        });
      }
    });

    server.route({
        method: 'GET',
        path:'/api/connections/{id}', 
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
              connections = connections.map(function(connection) {
                var obj = connection['e'].properties;
                obj._id = connection['e']._id;
                return obj;
              })
              reply(connections);
          });
        }
    });

    server.route({
    	method: 'GET',
    	path:'/public/{param*}',
    	handler: {
    		directory: {
    			path: 'public'
    		}
    	}
    })
});
// Start the server
server.start(function(err) {
	if (err) {
    throw err;
  }
  console.log('started server');
});
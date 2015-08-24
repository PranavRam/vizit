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

var openNLP = require("opennlp");
var NLP = require('stanford-corenlp');
var config = {
  'nlpPath': Path.join ( __dirname, '/corenlp'), //the path of corenlp
  'version':'3.5.2', //what version of corenlp are you using
  'annotators': ['tokenize','ssplit','pos','parse','sentiment','depparse','quote','lemma', 'ner'], //optional!
  'extra' : {
      'depparse.extradependencie': 'MAXIMAL'
    }

};
var coreNLP = new NLP.StanfordNLP(config);

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

var upload = function(files, reply) {
    fs.readFile(files.file[0].path, function(err, data) {
        fs.writeFile(Path.join(__dirname, 'server/uploads/') + files.file[0].originalFilename, data, function(err) {
            if (err) return reply(err);

            readZip(Path.join(__dirname, 'server/uploads/') + files.file[0].originalFilename, reply);
            // return reply('File uploaded to: ' + Path.join(__dirname, 'server/uploads/') + files.file[0].originalFilename);

        });
    });
};

function addEntity(entity, cb) {
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
	      cb(null, createdEntity);
	  });
}
function addEntityToDocument(entity, doc) {
	addEntity(entity, function(err, result) {
		if(err) {
			throw (err);
		}
		var createdEntity = result;
		var query = [
			"MATCH (a:Document),(b:Entity)",
			"WHERE id(a) = {document_id} AND id(b) = {entity_id}",
			"MERGE (a)-[r:DOCENTITY]->(b)",
      "ON CREATE SET r.startOffset = [{startOffset}], r.endOffset = [{endOffset}]",
      "ON MATCH SET r.startOffset = r.startOffset + [{startOffset}], r.endOffset = r.endOffset + [{endOffset}]",
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
        console.log(createdRelation);
		    // console.log(createdRelation);
		});
	});
}

function extractEntities(doc, deferred) {
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
  coreNLP.process(doc.text, function(err, result) {
      if(err)
        throw err;
      else
        var sentences = result.document.sentences.sentence;
        var allEntities = [];
      // console.log(sentences);
        sentences.forEach(function(sentence) {
          var tokens = sentence.tokens.token;
          var entities = tokens.filter(function(token) {
            return token["NER"] !== "O";
          });
          allEntities = allEntities.concat(entities);
        });
        console.log(allEntities);
        createDocument(doc, allEntities, deferred);
  });
}

function createDocument(doc, entities, deferred) {
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

      var createdDoc = results[0]['n'];
      entities.forEach(function(entity) {
      	addEntityToDocument(entity, createdDoc);
      });
      // console.log("deferred");
      deferred.resolve(createdDoc);
  });
}
function readZip(path, reply) {
	// reading archives 
  var zip = new AdmZip(path);
  var zipEntries = zip.getEntries(); // an array of ZipEntry records 
 	var i = 0;
  var promises = [];
 	while(i < 3) {
 		var zipEntry = zipEntries[i];
 		var name = zipEntry.entryName;
 		if(name.match(/\.(txt)/g) && !S(name).startsWith("__MACOSX")){
 			console.log(zipEntry.entryName);
      var deferred = Q.defer();
 			var doc = {
 				name: name,
 				text: zip.readAsText(zipEntry.entryName).replace(/[^\x00-\x7F]/g, "")
 			}
 			extractEntities(doc, deferred);
      promises.push(deferred.promise);
 		}
 		i++;
 	}
  console.log(promises);
 	Q.all(promises)
    .then(function() {
      // console.log("loaded")
      reply("successfully loaded");
    })
 	// createDocument(doc, reply);
 	// console.log(zip.readAsText(zipEntry.entryName));
  // zipEntries.forEach(function(zipEntry) {
  //     // console.log(zipEntry.toString()); // outputs zip entries information 
  //     console.log(zip.readAsText(zipEntry.entryName)); 
  // });
}

function setTFDIF(reply) {
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
      reply("Done setTFDIF");
  });
}

function getDocuments(reply) {
	var query = [
    'MATCH (n:Document)-[:DOCENTITY]->(e)',
    'WHERE e.tfidf > 0',
    'RETURN n, collect(e) as entities',
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
            text = S(text).replaceAll(entity.text, '<'+entity.type+' data-entity-id="' + id + '">'+entity.text+'</'+entity.type+'>').s;
          });
          console.log(text);
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
    	},
	    handler: function (request, reply) {
        var form = new multiparty.Form();
        form.parse(request.payload, function(err, fields, files) {
            if (err) return reply(err);
            else upload(files, reply);
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
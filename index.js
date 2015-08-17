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
				"MERGE (n:Entity {text: {text}} )",
	      'ON CREATE SET n = {props}',
        'ON MATCH SET n.count = n.count + {count}',
	      'RETURN n',
	  ].join('\n');

	  var props = {
	  	type: entity.type,
	  	text: entity.text,
      count: entity.count
	  };

	  var params = {
	      props: props,
	      text: entity.text,
        count: entity.count
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
			"CREATE UNIQUE (a)-[r:DOCENTITY]->(b)",
			"RETURN r"
		].join('\n');

		var params = {
		    document_id: doc._id,
		    entity_id: createdEntity._id
		};
		db.cypher({
		    query: query,
		    params: params,
		}, function (err, results) {
		    if (err) {}
		    // console.log(results);
		    var createdRelation = results[0]['r'];
		    // console.log(createdRelation);
		});
	});
}

function extractEntities(doc) {
	alchemy.entities(doc.text, {}, function(err, response) {
	  if (err) throw err;

	  // See http://www.alchemyapi.com/api/entity/htmlc.html for format of returned object
	  var entities = response.entities;
	  entities.forEach(function(entity) {
	  	// addEntityToDocument(entity, doc);
	  	doc.text = S(doc.text).replaceAll(entity.text, '<'+entity.type+'>'+entity.text+'</'+entity.type+'>').s;
	  });
	  createDocument(doc, entities);
	  // console.log(text);
	  // Do something with data
	});
}

function createDocument(doc, entities) {
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
      	addEntityToDocument(entity, createdDoc)
      });
  });
}
function readZip(path, reply) {
	// reading archives 
  var zip = new AdmZip(path);
  var zipEntries = zip.getEntries(); // an array of ZipEntry records 
 	var i = 0;
 	while(i < 10) {
 		var zipEntry = zipEntries[i];
 		var name = zipEntry.entryName;
 		if(name.match(/\.(txt)/g) && !S(name).startsWith("__MACOSX")){
 			console.log(zipEntry.entryName);
 			var doc = {
 				name: name,
 				text: zip.readAsText(zipEntry.entryName).replace(/[^\x00-\x7F]/g, "")
 			}
 			extractEntities(doc);
 		}
 		i++;
 	}
 	reply("Successful Upload");
 	// createDocument(doc, reply);
 	// console.log(zip.readAsText(zipEntry.entryName));
  // zipEntries.forEach(function(zipEntry) {
  //     // console.log(zipEntry.toString()); // outputs zip entries information 
  //     console.log(zip.readAsText(zipEntry.entryName)); 
  // });
}

function getDocuments(reply) {
	var query = [
    'MATCH (n:Document)',
    'RETURN n',
  ].join('\n')

  db.cypher({
      query: query,
  }, function (err, results) {
      if (err) return reply(err);
      var documents = results.map(function(doc) {
          // console.log(doc['n']);
          var obj = doc['n'].properties;
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
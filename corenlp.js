var Path = require('path');
var Hapi = require('hapi');
var Inert = require('inert');
var fs = require('fs');
var swig = require('swig');
var S = require('string');
var _ = require('lodash');
var Q = require('q');
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

swig.setDefaults({ varControls: ['[[', ']]'] });

// Create a server with a host and port
var server = new Hapi.Server();

function extractEntities(text) {
  return Q.Promise(function(resolve, reject, notify) {
    console.log("extracting entities", text);
    coreNLP.process(text, function(err, result) {
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
          resolve(allEntities);
    });
  })
}

server.register([
	require('vision'),
	Inert
	], function () {
    server.connection({ 
        host: 'localhost', 
        port: 9000 
    });

    server.views({
    	engines: {
    		html: swig
    	},
    	path: Path.join(__dirname, 'server/views')
    })
    // Add the route
    server.route({
        method: 'POST',
        path:'/corenlp',
        config: {
          timeout: {
            socket: false
          }
        }, 
        handler: function (request, reply) {
        	// console.log(request);
         	extractEntities(request.payload.text)
            .then(function(entities) {
              reply(entities);
            })
        }
    });
});
// Start the server
server.start(function(err) {
	if (err) {
    throw err;
  }
  console.log('started corenlp server');
});
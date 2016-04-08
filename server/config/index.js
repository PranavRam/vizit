var neo4j = require("neo4j");
var Parse = require('parse/node').Parse;
Parse.initialize("Tuu2ar77cy4IyW2rzVFNtkuEOxlAkn0VgsWSk8GJ", "5MIPDwq0WWzYvtFYtWfEdYsDDfZhc6udVdweZdDB");

var config = {
    root: '/',
    host: '0.0.0.0',
    port: parseInt(process.env.PORT, 10) || 3000,
    api: '',
    title: 'SCADE - Supportive Computational Analysis, Discovery and Exploration',
    parse: {
        hypothesis: Parse.Object.extend("Hypothesis"),
        notification: Parse.Object.extend("Notification")
    },
    db: new neo4j.GraphDatabase("http://vizit:0bp1mago6MgssAE46bH3@vizit.sb05.stations.graphenedb.com:24789")
    // db: new neo4j.GraphDatabase("http://localhost:7474")
}

module.exports = config;

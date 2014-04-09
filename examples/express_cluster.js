var cluster = require('cluster');
var express = require("express");
var harmony = require("node-harmony");


if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    var balanceServer = new harmony.server({
      persistent: true
      ,unavailable: function(e, c) {
        /* do something here if the server is unavailable */
        c.write("\0"); //write a null byte to socket
      }
      ,listenport: 3000
      ,adminport: 5001
    });

    var balanceClient = new harmony.client({
        balance:500 // I'm average at 500 weight
        ,listenport:3001
        ,adminport:5001
        ,ack:60*1000
    });

} else {
    var express = require('express');
    var app = express();

    app.get('/', function (req, res) {
        res.send('Hello World!');
    });

    app.listen(3001);
    console.log('Application running!');

}

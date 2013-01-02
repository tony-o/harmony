var harmony = require("./lib/harmony");
var http = require("http");

var s = new harmony.server({persistent:false});

var c1 = new harmony.client({balance:1000,listenport:1080});
var c2 = new harmony.client({balance:500,listenport:1090});

var s1 = http.createServer(function(q,s){
  console.log(1080);
  s.end("served from port 1080");
});
s1.listen(1080);

var s2 = http.createServer(function(q,s){
  console.log(1090);
  s.end("served from port 1090");
});
s2.listen(1090);


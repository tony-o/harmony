var harmony = require("./lib/harmony");
var http = require("http");

var s = new harmony.server({persistent:false,unavailable:function(e,c){
  c.write("Unavailable, holmes.");
}});

var c1 = new harmony.client({balance:1000,listenport:1080,ack:60*1000});
var c2 = new harmony.client({balance:500,listenport:1090,ack:60*1000});

var s1 = http.createServer(function(q,s){
  s.end("served from port 1080");
  c1.close();
  /*
    server will only use s2;
  */

});
s1.listen(1080);

var s2 = http.createServer(function(q,s){
  s.end("served from port 1090");
});
s2.listen(1090);


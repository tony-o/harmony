HARMONY.js
---

Harmony is a /smart/ balancing module for nodejs (or any type of TCP server cluster).  It's more than just a basic round robin balancer and is capable of persistent connections, detecting timeouts in servers, requeuing connections, and weighted balancing.

Example
---
```javascript
var harmony = require("harmony"); //awww, harmony

var http = require("http"); //only for this example

var s = new harmony.server({
  persistent:false // I don't care if connections *ALWAYS* go to the same server
  ,unavailable:function(e,c){
    c.write("Unavailable, holmes."); // If my connection attempt times out then I'll call this function
  }
});

var c1 = new harmony.client({
  balance:1000 // I'm big at 1000 weight
  ,listenport:1080 // My server is on port 1080 - I run alongside Express and other sugar
  ,ack:60*1000 // I want to send an "I'm alive" message every minute
});
var c2 = new harmony.client({
  balance:500 // I'm average at 500 weight
  ,listenport:1090
  ,ack:60*1000
});

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
```

There are a lot more options than what is shown here, they're discussed below.

Download
---
```
> npm install async
```

Docs
---

Server
------

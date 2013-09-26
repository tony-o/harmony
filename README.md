#HARMONY.js

Harmony is a /smart/ balancing module for nodejs (or any type of TCP server cluster).  It's more than just a basic round robin balancer and is capable of persistent connections, detecting timeouts in servers, requeuing connections, and weighted balancing.

This module is meant to grow encompass many different techniques and be suitable for /most/ applications.  If you have ideas or something isn't working properly then please submit a bug report.

##Single Server Example (All clients are on one server with the balancer)

```javascript
var harmony = require("node-harmony"); //awww, harmony

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

##Multiple Server Example (Clients are on different machines from the balancer)
In this example you have a balancer (balance.mydomain) and two servers you want to balance between (host#.mydomain).  On both servers you want to balance between you can connect them with the method below, even if your servers aren't written in node.js.  If your servers aren't written in node.js, EG you want to balance apache, then set the 'localport' option of the client to be whatever port apache is listening on. 

###Balancing server @ balance.mydomain
```javascript
var harmony = require("node-harmony"); //awww, harmony

var s = new harmony.server({
  persistent:false // I don't care if connections *ALWAYS* go to the same server
  ,unavailable:function(e,c){
    c.write("Unavailable, holmes."); // If my connection attempt times out then I'll call this function
  }
});
```

###Client Server #1 @ host1.mydomain
This code runs on host1.mydomain, not on the balancer
```javascript
var harmony = require("node-harmony");

var c1 = new harmony.client({
  balance:1000             // I'm big at 1000 weight
  ,listenport:1080         // My server is on port 1080 - I run alongside Express and other sugar
  ,ack:60*1000             // I want to send an "I'm alive" message every minute
  ,host:"balance.mydomain" // Hostname of the balancer 
});

/* If you already have a server running and just want to use the balancer then you don't need the code below, just set the listenport above to be whatever port your server is running on */
var http = require("http");
var s1 = http.createServer(function(q,s){
  s.end("served from port 1080, server 1");
  c1.close();
});
s1.listen(1080);
```

###Client Server #2 @ host2.mydomain
This code runs on host2.mydomain, not on the balancer
```javascript
var harmony = require("node-harmony");

var c2 = new harmony.client({
  balance:500 // I'm average at 500 weight
  ,listenport:1080
  ,ack:60*1000
  ,host:"balance.mydomain"
});

/* If you already have a server running and just want to use the balancer then you don't need the code below, just set the listenport above to be whatever port your server is running on */
var http = require("http");
var s2 = http.createServer(function(q,s){
  s.end("served from port 1080, server 2");
  c2.close();
});
s2.listen(1080);
```

There are a lot more options than what is shown here, they're discussed below.

##Download
```
> npm install node-harmony 
```

##Docs

###Server

```
var harmony = require("node-harmony");
var balancer = harmony.server(options);
```

The server expects load balancing servers to acknowledge their availability and to report in once in a while.  If the load target fails to ack within a certain established period then the server gives up on it and excludes it from it's pool of available targets until the target acknowledges.

It is the target's responsibility to report in to the server and provide port information on where it expects the server to pipe it's potential [external] clients to.  So while the server listens on port 3000, it may be proxying connections to ```server1:5000 , server1:5005 , server2:5000```.

####Options

The options are passed in via JSON Object and the following options are available:
#####Administration Port (adminport)
Default: ```1666```

This is the port the load balancer listens on for possible load bearing targets to balance traffic with.  This port is simply for administration and not for serving any content.

#####Listen Port (listenport)
Default: ```3000```

The port the server listens on for client connections to connect with the potential load bearing servers.

#####Persistent Connections (persistent)
Default: ```{ } ```

By default, the balancer will try to persist connections, if you don't need it or care about it, passing in a value of ```false``` will ignore persistence.

#####Host (host)
Default: ```localhost```

This is the host the server will attempt to listen on.

#####Concurrency (concurrency)
Default: ```-1```

Setting the concurrency will limit the load balancer to X number of open connections at a time.  Certain protocols choke on the way this blocks, including HTTP.  Setting this number to 0 or more will cause the server to only allow X number of connections at a time - 0 being paused and 1 or more allowing that number.

#####Requeue (requeue)
Default: ```1```

If the connection fails or something bad happens, the server will requeue the connection X number of times prior to displaying the 'unavailable' message described next.

#####Unavailable (unavailable)
Default: ```null```

This option can take two separate items, a 'function' or a string.  
If this option contains a string then the server will write out the string to client socket and then close the socket.
If the option is a function, it will call the function with parameters ```error, socket```.

#####Host Timeout (hostTimeout)
Default: ```1```

The time in minutes which a target load bearing server is considered 'not available' 

###Load Bearing Targets (Internal Clients)

```
var harmony = require("node-harmony");
var reporter = harmony.client(options);
```

The server expects load balancing servers to acknowledge their availability and to report in once in a while.  If the load target fails to ack within a certain established period then the server gives up on it and excludes it from it's pool of available targets until the target acknowledges.

It is the target's responsibility to report in to the server and provide port information on where it expects the server to pipe it's potential [external] clients to.  So while the server listens on port 3000, it may be proxying connections to ```server1:5000 , server1:5005 , server2:5000```.  

The load targets can be added and removed as desired and the load balancer should gracefully handle those adds/removes without any hiccups with the exception of persistent connections.

####Options

The options are passed in via JSON Object and the following options are available:
#####Host (host)
Default: ```localhost```

This is the host your balancer is running on, it may or not be the same machine.

#####Administration Port (adminport)
Default: ```1666```

This is the port your balancer is listening on.

#####Listening Port (listenport)
Default: ```80```

This is the port your load bearing server is listening on.  This is the port your balancing server will try to proxy connections with.

#####Balance (balance)
Default: ```500```

This is an arbitrary number used to weight the target.  The higher the number the higher the precedence on using that server.

IE:
 * LBServer1 weights 500 and will handle 25% of requests
 * LBServer2 weights 500 and will handle 25% 
 * LBServer3 weights 1000 and will handle 50% (if you're not receiving connections faster than LBServer3 can close them then LBServer3 will handle 100% of requests)

#####Acknowledge Time (ack)
Default: ```300,000```

This is a rough time that the load target will attempt to check in and acknowledge it's still alive.  Setting this to half or less of what the server expects would be ideal.


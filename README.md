#HARMONY.js

Harmony is a /smart/ balancing module for nodejs (or any type of TCP server cluster).  It's more than just a basic round robin balancer and is capable of persistent connections, detecting timeouts in servers, requeuing connections, and weighted balancing.

##Example

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

##Download
```
> npm install async
```

##Docs

###Server

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

By default, the balancer will try to persist connections, if you don't need it or care about it, passing in a value of 'false' will ignore persistence.

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


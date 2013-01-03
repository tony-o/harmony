var net = require("net");
var nq = require("skoconc");

var server = function(opt){
  var self = this;
  self.options = {
    adminport:1666
    ,listenport:3000
    ,persistent:{}
    ,host:"localhost"
    ,concurrency:-1 /* -1 = no limits */
    ,requeue:1
    ,unavailable:null
    ,hostTimeout:1 /* minutes */
  };
  self.targets = {};
  self.data = {};

  for(var i in opt){self.options[i] = opt[i];}
  nq.max(self.options.concurrency);
  var mater = function(dn,next){
    var unavailable = function(error,d){
      if(typeof self.options.unavailable == "function"){
        self.options.unavailable(error,d);
      }else if(self.options.unavailable !== null){
        try{
          d.on("error",function(){ return; });
          d.write(self.options.unavailable);
        }catch(e){ }
      }
    }
    if(dn.n.id == null){
      unavailable({code:"NOTARGET",msg:"No suitable targets"},dn.con);
      dn.con.end("");
      return;
    };
    var dest = net.createConnection(dn.n.data.port,dn.n.data.con.address);
    var src = dn.con;
    src.pipe(dest);
    dest.pipe(src);
    var requeue = true;
    dn.requeue = dn.requeue ? dn.requeue : self.options.requeue;
    dest.on("error",function(e){
      if(requeue && dn.requeue--){
        nq.push(mater,dn);
      }else if(!requeue){
        unavailable(e,dest);
      }
      next();
    });
    src.on("error",function(e){
      if(requeue && dn.requeue--){
        nq.push(mater,dn);
      }
      dest.end();
      next();
    });
    src.setNoDelay(true);
    dest.setNoDelay(true);
    dest.on("close",function(){next()});
    src.on("close",function(){next();});
  };

  self.piper = net.createServer(function(con){
    var n = null;
    if(self.options.persistent && self.options.persistent[con.address().address]){
      n = self.options.persistent[con.address().address];
    }else{
      n = self.next();
      if(self.options.persistent){
        self.options.persistent[con.address().address] = n;
      }
    }
    nq.push(mater, {con:con,n:n});
  });
  self.piper.listen(self.options.listenport);

  var minutesbetween = function(d1,d2){ return ((((d1 - d2) % 86400000) % 3600000) / 60000); };

  self.next = function(){
    var n = -1;
    var id = null;
    for(var i in self.targets){
      if(((self.targets[i].connections+1) / self.targets[i].perc < n || n == -1) && minutesbetween(new Date(),self.targets[i].lastack) < self.options.hostTimeout){
        id = i;
        n = (self.targets[i].connections+1) / self.targets[i].perc;
      }
    };
    self.targets[id] && self.targets[id].connections++;    
    return {id:id,data:self.targets[id]};
  };

  self.calculateLoads = function(){
    var total = 0;
    for(var i in self.targets){
      total += self.targets[i].balance;
    }
    for(var i in self.targets){
      self.targets[i].perc = self.targets[i].balance * 100 / total;
    }
  };

  self.sock = net.createServer(function(con){
    var buffer = [];
    con.setEncoding("utf-8");
    con.on("data",function(d){
      con.pause();
      d = d.toString().split(":");
      buffer.push.apply(buffer,d);
      for(var b=0;b<buffer.length;b++){
        if(buffer[b] == "NID" && b+1 < buffer.length){
          var id = null;
          do{
            id = require("crypto").createHash("md5").update((new Date()).toString()).digest("hex").toUpperCase();
          }while(self.targets[id] != null && self.targets[id] != undefined);
          con.id = id;
          self.targets[con.id] = {
            balance:500
            ,connections:0
            ,port:self.options.listenport
            ,con:con.address()
            ,lastack:(new Date())
          };
          console.log("server:nid:" + con.id + "("+self.targets[con.id].balance+")");
          con.write("NID:"+con.id+":");
          self.calculateLoads();
          buffer.splice(b,2);
          b--;
          continue;
        }
        if(buffer[b] == "ID" && b+1 < buffer.length){
          var id = buffer[b+1];
          if(self.targets[id] != null && self.targets[id] != undefined){
            con.id = id;
            con.write("ID:"+id+":");
            buffer.splice(b,2);
            b--;
            continue;
          }
          con.write("BID:"+id+":");
        }
        if(buffer[b] == "CLOSE" && b+1 < buffer.length){
          var id = buffer[b+1];
          self.targets[id].lastack = 0;
          con.write("CLOSE:"+id+":");
          buffer.splice(b,2);
          b--;
          continue;
        };
        if(buffer[b] == "SPORT" && b+1 < buffer.length){
          var port = buffer[b+1];
          self.targets[con.id].port = port;
          console.log("server:sport:" + con.id + ":" + port);
          con.write("SPORT:"+port+":");
          buffer.splice(b,2);
          b--;
          continue;
        };
        if(buffer[b] == "BAL" && b+1 < buffer.length){
          var bal = parseFloat(buffer[b+1]);
          bal = isNaN(bal) ? 500 : bal;
          self.targets[con.id].balance = bal;
          con.write("BAL:"+bal+":");
          console.log("server:bal:"+bal+":");
          buffer.splice(b,2);
          b--;
          continue;
        }
        if(buffer[b] == "ACK" && b+1 < buffer.length){
          self.targets[buffer[b+1]] && (self.targets[buffer[b+1]].lastack = new Date());
          console.log("server:ack:"+buffer[b+1]+":");
          con.write("ACK:"+buffer[b+1]+":");
          buffer.splice(b,2);
          b--;
          continue;
        }
        if(buffer[b] == "BYE"){
          buffer.splice(0,1);
          b--;
          con.end();
          continue;
        }
        if(buffer[b] == ""){
          buffer.splice(b,1);
          b--;
          continue;
        }
      }
      con.resume();
    });
  });
  
  self.sock.listen(self.options.adminport,self.options.host);
};

module.exports = server;

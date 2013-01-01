var net = require("net");
var nq = require("skonq");

var server = function(opt){
  var self = this;
  self.options = {
    adminport:1666
    ,listenport:3000
    ,persistent:{}
    ,host:"localhost"
    ,concurrency:1
    ,requeue:1
  };
  self.targets = {};
  self.data = {};

  for(var i in opt){self.options[i] = opt[i];}
  nq.setconcurrency(self.options.concurrency);
  var mater = function(dn,nxt){
    try{
      dn.con.address().address;
    }catch(e){ console.log("enxt");return nxt(); }
    var c = net.createConnection(dn.n.data.port,dn.n.data.con.address);
    var h = function(){
      console.log("hnxt");
      nxt();
      self.options.requeue > 0 && setTimeout(function(){
        nq.nq(mater,dn);
      },self.options.requeue);
    };
//    console.log("serv\t" + dn.con.address().address + " -> " + dn.n.data.con.address + ":" + dn.n.data.port); 
    c.on("error",h).on("timeout",h);
    dn.con.on("error",h).on("timeout",h);
    dn.con.pipe(c);
    c.pipe(dn.con);
    var cclose = false;
    var conclose = false;
    c.on("close",function(){
      if(cclose){ return; }
      console.log("dn");
      cclose = true;
      console.log("cnxt");
      nxt();
      c.end();
      dn.con.end();
    });
    dn.con.on("close",function(){
      if(conclose){ return; }
      console.log("dnc");
      conclose = true;
      dn.con.end();
      nxt();
      dn.n.data.connections--;
      c.end();
    });
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
    nq.nq(mater, {con:con,n:n});
  });
  self.piper.listen(self.options.listenport);

  self.next = function(){
    var n = -1;
    var id = null;
    for(var i in self.targets){

      if((self.targets[i].connections+1) / self.targets[i].perc < n || n == -1){
        id = i;
        n = (self.targets[i].connections+1) / self.targets[i].perc;
      }
    };
    self.targets[id].connections++;    
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
        if(buffer[b] == "ACK" && b+1 < buffer.length){
          con.write("ACK:" + buffer[b+1] + ":");
          console.log("server:ack:"+buffer[b+1]);
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

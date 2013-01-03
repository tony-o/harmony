var net = require("net");

var client = function(opt){
  var self = this;
  self.options = {
    host:"localhost"
    ,adminport:1666
    ,listenport:80
    ,balance:500
    ,ack:5 * 60 * 1000
    ,closed:false
  };
  for(var i in opt){self.options[i] = opt[i];}
  self.id = null;
  self.messages = [];
  self.removeMessages = function(find){
    for(var i = 0; i < self.messages.length; i++){
      if(self.messages[i] == find){
        self.messages.splice(i,1);
        i--;
      }
    }
  };
  self.close = function(){
    self.options.closed = true;
    self.messages.push("CLOSE:"+self.id+":");
    self.csock();
  };
  self.csock = function(){
    self.sock = net.connect(self.options.adminport, self.options.host, function(){
      if(self.id){
        self.messages.push("ID:" + self.id + ":");
      }else{
        self.messages.push("NID::");
        self.messages.push("BAL:" + self.options.balance + ":");
        self.setPort(self.options.listenport);
      }
      for(var m in self.messages){
        self.sock.write(self.messages[m]);
      }
      var buffer = [];
      self.sock.setEncoding("utf-8");
      self.sock.on("data",function(d){
        self.sock.pause();
        buffer.push.apply(buffer,d.split(":"));
        for(var b=0;b<buffer.length;b++){
          if(buffer[b] == "NID" && b+1 < buffer.length){
            self.id = buffer[b+1];
            //console.log("client:nid: " + self.id);
            buffer.splice(0,2);
            b--;
            self.removeMessages("NID::");
            continue;
          }
          if(buffer[b] == "ID" && b+1 < buffer.length){
            //console.log("client:id:" + buffer[b+1]);
            self.removeMessages("ID:" + self.id + ":");
            buffer.splice(0,2);
            b--;
            continue;
          }
          if(buffer[b] == "BID" && b+1 < buffer.length){
            self.messages.push("NID::");
          }
          if((buffer[b] == "BAL" || buffer[b] == "SPORT" || buffer[b] == "ACK") && b+1 < buffer.length){
            //console.log("client:" + buffer[b].toLowerCase() + ":" + buffer[b+1] + ":");
            self.removeMessages(buffer[b] + ":" + buffer[b+1] + ":");
            buffer.splice(0,2);
            b--;
            continue;
          }
        }
        if(self.messages.length == 0){
          self.sock.write("BYE:");
        }
        self.sock.resume();
      });
    });
  };
  self.setPort = function(port){
    self.messages.push("SPORT:" + port + ":");
    self.options.listenport = port;
  };
  self.ack = function(){
    if(self.options.closed === false){
      self.messages.push("ACK:"+self.id+":");
      self.csock();
    }
  };
  setInterval(self.ack,self.options.ack);
  self.csock();
};

module.exports = client;

var l = require("./skoconc.js");

l.max(1);

for(var i = 0; i < 10; i++){
  l.push(function(a,cb){
    setTimeout(function(){
      cb();
      if(a == 100){ l.max(25); }
      console.log("i:" + a);
      cb(); //doesn't do anything..
    },1000 - (i*i*2));
  }, i);
}


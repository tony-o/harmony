var queue = [];
var open = 0;
var max = 1;
var push = function(f,a){
  queue.push({f:f,a:a});
  next();
};
var next = function(){
  if(open >= max && max >= 0){
    return;
  }
  var i = queue.shift();
  if(i == null || typeof i.f != "function"){
    return;
  }
  var safe = 1;
  open++;
  i.f(i.a,function(){
    if(safe === 1){
      safe--;
      open--;
      next();
    }
  });
};
var setMax = function(m){ 
  var delta = m - max;
  max = m; 
  while(delta-- > 0){
    next();
  }
};
module.exports = {
  push:push
  ,next:next
  ,max:setMax
};

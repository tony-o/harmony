skoconc is intended to be a lightweight library for queuing functions with limited concurrency.  This module is intended to be very basic and simple to use.  

Using SKOCONC
-----------

From your project directory:
```bash
    $ npm install skoconc
```

Within your application:
```javascript
    var skoconc = require("skoconc");
    
    var somefunction = function(args,callback){ 
        /* do some stuff here */
        callback();
    };
    skoconc.max(5);    
    skoconc.push(somefunction, somefunctionsargs);
```

Is this All?
------------
Long answer: sho nuff.




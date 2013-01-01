skonq is intended to be a lightweight library for queuing functions.  This was born out of laziness - so it's very basic and simple to use.  I didn't need 95% of the functionality in ASYNC or STEP and I don't like the syntax for queuing functions with those so this was created, if you need more functionality then check out those 2 great libraries.

Using SKONQ
-----------

From your project directory:
```bash
    $ npm install skonq
```

Within your application:
```javascript
    var nq = require("skonq");
    
    var somefunction = function(){ 
        /* do some stuff here */
        nq.next();
    };
    
    nq.nq(somefunction, somefunctionsargs);
```

Is this All?
------------
Long answer: yes, what more do you need?



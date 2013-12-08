tcp-port-used
=============

A simple Node.js module to check if a TCP localhost port is currently in use. It
returns a promise from the q library.

Note: You must have admin privs to successfully test system ports (0-1023).

## Installation

    npm install tcp-port-used

## Examples
To check a port's state:

    var tcpPortUsed = require('tcp-port-used');

    tcpPortUsed.check(44201)
    .then(function(inUse) {
        console.log('Port 44201 usage: '+inUse);
    }, function(err) {
        console.error('Error on check: '+err.message);
    });

To wait until a port is available:

    tcpPortUsed.waitUntilFree(44203, 500, 4000)
    .then(function() {
        console.log('Port 44203 is now free.');
    }, function(err) {
        console.loh('Error: ', error.message);
    });

To wait until a port is accepting connections:

    tcpPortUsed.waitUntilUsed(44204, 500, 4000)
    .then(function() {
        console.log('Port 44204 is now in use.');
    }, function(err) {
        console.loh('Error: ', error.message);
    });

## API


### check(port)
Checks if a TCP port is in use by creating the socket and binding it to the
target port. Once bound, successfully, it's assume the port is availble.
After the socket is closed or in error, the promise is resolved.
Note: you have to be super user to correctly test system ports (0-1023).

**Param:**

**Number** *port* The port you are curious to see if available.

**Returns:**

**Object** A deferred Q promise.

### waitUntilFree(port, [retryTimeMs], [timeOutMs])
Creates a deferred promise and fulfills it only when the socket is free.
Will retry on an interval specified in retryTimeMs.
Note: you have to be super user to correctly test system ports (0-1023).

**Params:**

* **Number** *port* a valid TCP port number
* **Number** *[retryTimeMs]* the retry interval in milliseconds - defaultis is 100ms.
* **Number** *[timeOutMs]* the amount of time to wait until port is free. Default 300ms.

**Returns:**

**Object** A deferred Q promise.

### waitUntilUsed(port, [retryTimeMs], [timeOutMs])

Creates a deferred promise and fulfills it only when the socket is used.
Will retry on an interval specified in retryTimeMs.
Note: you have to be super user to correctly test system ports (0-1023).

**Params:**

* **Number** *port* a valid TCP port number
* **Number** *[retryTimeMs]* the retry interval in milliseconds - defaultis is 500ms
* **Number** *[timeOutMs]* the amount of time to wait until port is free

**Returns:**

**Object** A deferred Q promise.


## License

The MIT License (MIT)

Copyright (c) 2013 jut-io

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


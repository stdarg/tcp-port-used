tcp-port-used
=============

A simple Node.js module to check if a TCP port is currently in use. It returns
a promise from the q library.

Note: You have to admin privs to successfully tests system ports (0-1023).

## Installation

    npm install tcp-port-used

## Example

    var tcpPortUsed = require('tcp-port-used');

    tcpPortUsed.check(44201)
    .then(function(inUse) {
        console.log('Port 44201 usage: '+inUse);
    }, function(err) {
        console.error('Error on check: '+err.message);
    });

## API

### check(port)
Checks to see if the port in question is in use. Returns a deferred promise
that resolves to true if the socket is in use and false otherwise.

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

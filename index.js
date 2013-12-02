/**
 * @fileOverview
 * A simple promises-based check to see if a TCP port is already in use.
 *
 * Example usage:
 *
 * var tcpPortUsed = require('tcp-port-used');
 *
 * tcpPortUsed.check(22)
 * .then(function(inUse) {
 *    console.log('Port 22 usage: '+inUse);
 * }, function(err) {
 *    console.error('Error on check: '+util.inspect(err));
 * });
 */
'use strict';

// define the export first to avoid cyclic dependencies.
exports.check = check;

var is = require('is2');
var Q = require('q');
var net = require('net');
var util = require('util');

/**
 * Checks if a TCP port is in use by creating the socket and binding it to the
 * target port. Once bound, successfully, it's assume the port is availble.
 * After the socket is closed or in error, the promise is resolved.
 * @param {Number} port The port you are curious to see if available.
 * @return {Object} A deferred Q promise.
 */
function check(port) {

    var deferred = Q.defer();
    var inUse = true;

    if (!is.positiveInt(port) || port > 65535)
        deferred.reject(new Error('Invalid port: '+port));

    var server = net.createServer();

    server.once('error', function (err) {
        if (err.code === 'EADDRINUSE') {
            deferred.resolve(inUse);
        } else {
            console.log('Unexpected error: '+util.inspect(err));
            deferred.reject(err);
        }
    });

    server.once('listening', function() {
        server.once('close', function() {
            deferred.resolve(!inUse);
        });
        server.close();
    });

    server.listen(port);
    return deferred.promise;
}


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
 *    debug('Port 22 usage: '+inUse);
 * }, function(err) {
 *    console.error('Error on check: '+util.inspect(err));
 * });
 */
'use strict';

// define the exports first to avoid cyclic dependencies.
exports.check = check;
exports.waitUntilFree = waitUntilFree;
exports.waitUntilUsed = waitUntilUsed;

var is = require('is2');
var Q = require('q');
var net = require('net');
var util = require('util');
var debug = require('debug')('tcp-port-used');

/**
 * Checks if a TCP port is in use by creating the socket and binding it to the
 * target port. Once bound, successfully, it's assume the port is availble.
 * After the socket is closed or in error, the promise is resolved.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Number} port The port you are curious to see if available.
 * @return {Object} A deferred Q promise.
 */
function check(port) {

    var deferred = Q.defer();
    var inUse = true;

    if (!is.port(port))
        deferred.reject(new Error('Invalid port: '+util.inspect(port)));

    var server = net.createServer();

    function cleanup() {
        if (server) {
            server.removeAllListeners('error');
            server.removeAllListeners('listening');
            server.removeAllListeners('close');
        }
    }

    server.once('error', function (err) {
        if (err.code === 'EADDRINUSE') {
            deferred.resolve(inUse);
        } else {
            debug('Unexpected error: '+util.inspect(err));
            deferred.reject(err);
        }
        cleanup();
    });

    server.once('listening', function() {
        server.once('close', function() {
            cleanup();
            deferred.resolve(!inUse);
        });
        server.close();
    });

    server.listen(port);
    return deferred.promise;
}

/**
 * Creates a deferred promise and fulfills it only when the socket is free.
 * Will retry on an interval specified in retryTimeMs.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Number} port a valid TCP port number
 * @param {Number} [retryTimeMs] the retry interval in milliseconds - defaultis is 100ms.
 * @param {Number} [timeOutMs] the amount of time to wait until port is free. Default 300ms.
 */
function waitUntilFree(port, retryTimeMs, timeOutMs) {

    var deferred = Q.defer();
    var done = false;
    var timeoutId;

    if (!is.port(port)) {
        deferred.reject(new Error('waitUntilFree: invalid port: '+util.inspect(port)));
        return deferred.promise;
    }

    if (!is.positiveInt(timeOutMs))
        timeOutMs = 100;

    if (!is.positiveInt(timeOutMs))
        timeOutMs = 300;
    timeoutId = setTimeout(function() { done = true; }, timeOutMs);

    var server = net.createServer();
    var interval = setInterval(function() {
        if (done) {
            clearInterval(interval);
            deferred.reject(new Error('waitUntilFree: timeout after '+timeOutMs+' ms.'));
        }
        server.listen(port);
    }, retryTimeMs);

    var cleanup = function() {
        clearInterval(interval);
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (server) {
            server.removeAllListeners('close');
            server.removeAllListeners('error');
        }

    };

    server.on('error', function (err) {
        if (err.code !== 'EADDRINUSE') {
            cleanup();
            deferred.reject(err);
        }
    });

    server.once('listening', function() {
        clearInterval(interval);
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        server.once('close', function() {
            deferred.resolve();
        });
        server.close();
    });

    return deferred.promise;
}

/**
 * Creates a deferred promise and fulfills it only when the socket is used.
 * Will retry on an interval specified in retryTimeMs.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Number} port a valid TCP port number
 * @param {Number} [retryTimeMs] the retry interval in milliseconds - defaultis is 500ms
 * @param {Number} [timeOutMs] the amount of time to wait until port is free
 */
function waitUntilUsed(port, retryTimeMs, timeOutMs) {

    var deferred = Q.defer();
    var done = false;
    var timeoutId;

    if (!is.port(port)) {
        deferred.reject(new Error('waitUntilListening: invalid port: '+
                                  util.inspect(port)));
        return deferred.promise;
    }

    if (!is.positiveInt(retryTimeMs))
        timeOutMs = 100;

    if (!is.positiveInt(timeOutMs))
        timeOutMs = 300;

    if (is.positiveInt(timeOutMs))
        timeoutId = setTimeout(function() { done = true; }, timeOutMs);

    var interval = setInterval(function() {
        if (done) {
            cleanUp();
            deferred.reject(new Error('waitUntilListening: timeout.'));
        }

        var client;
        client = new net.Socket();

        function onConnectCb() {
            debug('connect - promise resolved');
            deferred.resolve();
            cleanUp();
        }

        function onErrorCb(err) {
            if (err.code !== 'ECONNREFUSED') {
                cleanUp();
                deferred.reject(err);
            } else
                debug('ECONNREFUSED');
        }

        function cleanUp() {
            if (client) {
                client.removeAllListeners('connect');
                client.removeAllListeners('error');
            }

            if (interval)
                clearInterval(interval);

            if (timeoutId)
                clearTimeout(timeoutId);

            debug('timers removed');
        }

        client.once('connect', onConnectCb);
        client.once('error', onErrorCb);
        client.connect({port: port});

    }, retryTimeMs);

    return deferred.promise;
}


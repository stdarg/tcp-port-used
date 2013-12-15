/**
 * @fileOverview
 * A simple promises-based check to see if a TCP port is already in use.
 */
'use strict';

// define the exports first to avoid cyclic dependencies.
exports.check = check;
exports.waitUntilFreeOnHost = waitUntilFreeOnHost;
exports.waitUntilFree = waitUntilFree;
exports.waitUntilUsedOnHost = waitUntilUsedOnHost;
exports.waitUntilUsed = waitUntilUsed;

var is = require('is2');
var Q = require('q');
var net = require('net');
var util = require('util');
var debug = require('debug')('tcp-port-used');

// Global Values
var TIMEOUT = 2000;
var RETRYTIME = 200;

/**
 * Checks if a TCP port is in use by creating the socket and binding it to the
 * target port. Once bound, successfully, it's assume the port is availble.
 * After the socket is closed or in error, the promise is resolved.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Number} port The port you are curious to see if available.
 * @param {String} [host] May be a DNS name or IP address. Default '127.0.0.1'
 * @return {Object} A deferred Q promise.
 *
 * Example usage:
 *
 * var tcpPortUsed = require('tcp-port-used');
 * tcpPortUsed.check(22, '127.0.0.1')
 * .then(function(inUse) {
 *    debug('Port 22 usage: '+inUse);
 * }, function(err) {
 *    console.error('Error on check: '+util.inspect(err));
 * });
 */
function check(port, host) {

    var deferred = Q.defer();
    var inUse = true;
    var client;

    if (!is.port(port)) {
        deferred.reject(new Error('invalid port: '+util.inspect(port)));
        return deferred.promise;
    }

    if (!is.hostAddress(host)) {
        debug('set host address to default 127.0.0.1');
        host = '127.0.0.1';
    }

    function cleanUp() {
        if (client) {
            client.removeAllListeners('connect');
            client.removeAllListeners('error');
        }
        debug('listeners removed');
    }

    function onConnectCb() {
        debug('check - promise resolved - in use');
        deferred.resolve(inUse);
        cleanUp();
    }

    function onErrorCb(err) {
        if (err.code !== 'ECONNREFUSED') {
            debug('check - promise rejected');
            deferred.reject(err);
            cleanUp();
        } else {
            debug('ECONNREFUSED');
            inUse = false;
            debug('check - promise resolved - not in use');
            deferred.resolve(inUse);
            cleanUp();
        }
    }

    client = new net.Socket();
    client.once('connect', onConnectCb);
    client.once('error', onErrorCb);
    client.connect({port: port, host: host});

    return deferred.promise;
}

/**
 * Creates a deferred promise and fulfills it only when the socket is free.
 * Will retry on an interval specified in retryTimeMs.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Number} port a valid TCP port number
 * @param {String} [host] The hostname or IP address of where the socket is.
 * @param {Number} [retryTimeMs] the retry interval in milliseconds - defaultis is 100ms.
 * @param {Number} [timeOutMs] the amount of time to wait until port is free. Default 300ms.
 *
 * Example usage:
 *
 * var tcpPortUsed = require('tcp-port-used');
 * tcpPortUsed.waitUntilFreeOnHost(44203, 'some.host.com', 500, 4000)
 * .then(function() {
 *     console.log('Port 44203 is now free.');
 *  }, function(err) {
 *     console.loh('Error: ', error.message);
 *  });
 */
function waitUntilFreeOnHost(port, host, retryTimeMs, timeOutMs) {

    var deferred = Q.defer();
    var timedout = false;
    var retryId;
    var timeoutId;

    if (!is.port(port)) {
        deferred.reject(new Error('invalid port: '+util.inspect(port)));
        return deferred.promise;
    }

    if (!is.hostAddress(host)) {
        host = '127.0.0.1';
        debug('waitUntilUsedOnHost set host to default "127.0.0.1"');
    }

    if (!is.positiveInt(timeOutMs)) {
        timeOutMs = RETRYTIME;
        debug('waitUntilFreeOnHost set timeout to default '+TIMEOUT+'ms');
    }

    if (!is.positiveInt(timeOutMs)) {
        timeOutMs = TIMEOUT;
        debug('waitUntilFreeOnHost set retryTime to default '+RETRYTIME+'ms');
    }

    function cleanUp() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (retryId) {
            clearTimeout(retryId);
        }
    }

    function timeoutFunc() {
        timedout = true;
        cleanUp();
        deferred.reject(new Error('timeout'));
    }
    timeoutId = setTimeout(timeoutFunc, timeOutMs);

    function doCheck() {
        check(port, host)
        .then(function(inUse) {
            if (timedout) {
                return;
            }
            if (inUse) {
                retryId = setTimeout(function() { doCheck(); }, retryTimeMs);
                return;
            } else {
                deferred.resolve();
                cleanUp();
                return;
            }
        }, function(err) {
            if (timedout) {
                return;
            }
            deferred.reject(err);
            cleanUp();
        });
    }

    doCheck();
    return deferred.promise;
}

/**
 * For compatibility with previous version of the module, that did not provide
 * arguements for hostnames. The host is set to the localhost '127.0.0.1'
 * @param {Number} port a valid TCP port number
 * @param {Number} [retryTimeMs] the retry interval in milliseconds - defaultis is 100ms.
 * @param {Number} [timeOutMs] the amount of time to wait until port is free. Default 300ms.
 *
 * Example usage:
 *
 * var tcpPortUsed = require('tcp-port-used');
 * tcpPortUsed.waitUntilFree(44203, 500, 4000)
 * .then(function() {
 *     console.log('Port 44203 is now free.');
 *  }, function(err) {
 *     console.loh('Error: ', error.message);
 *  });
 */
function waitUntilFree(port, retryTimeMs, timeOutMs) {
    return waitUntilFreeOnHost(port, '127.0.0.1', retryTimeMs, timeOutMs);
}

/**
 * Creates a deferred promise and fulfills it only when the socket is used.
 * Will retry on an interval specified in retryTimeMs.
 * Note: you have to be super user to correctly test system ports (0-1023).
 * @param {Number} port a valid TCP port number
 * @param {Number} [retryTimeMs] the retry interval in milliseconds - defaultis is 500ms
 * @param {Number} [timeOutMs] the amount of time to wait until port is free
 *
 * Example usage:
 *
 * var tcpPortUsed = require('tcp-port-used');
 * tcpPortUsed.waitUntilUsedOnHost(44204, 'some.host.com', 500, 4000)
 * .then(function() {
 *     console.log('Port 44204 is now in use.');
 * }, function(err) {
 *     console.log('Error: ', error.message);
 * });
 */
function waitUntilUsedOnHost(port, host, retryTimeMs, timeOutMs) {

    var deferred = Q.defer();
    var timeoutId;
    var timedout = false;
    var retryId;

    if (!is.port(port)) {
        deferred.reject(new Error('invalid port: '+util.inspect(port)));
        return deferred.promise;
    }

    if (!is.hostAddress(host)) {
        host = '127.0.0.1';
        debug('waitUntilUsedOnHost set host to default "127.0.0.1"');
    }

    if (!is.positiveInt(retryTimeMs)) {
        retryTimeMs = RETRYTIME;
        debug('waitUntilUsedOnHost set retryTime to default '+RETRYTIME+'ms');
    }

    if (!is.positiveInt(timeOutMs)) {
        timeOutMs = TIMEOUT;
        debug('waitUntilUsedOnHost set timeOutMs to default '+TIMEOUT+'ms');
    }

    function cleanUp() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (retryId) {
            clearTimeout(retryId);
        }
    }

    function timeoutFunc() {
        timedout = true;
        cleanUp();
        deferred.reject(new Error('timeout'));
    }
    timeoutId = setTimeout(timeoutFunc, timeOutMs);

    function doCheck() {
        check(port, host)
        .then(function(inUse) {
            if (timedout) {
                return;
            }
            if (inUse) {
                deferred.resolve();
                cleanUp();
                return;
            } else {
                retryId = setTimeout(function() { doCheck(); }, retryTimeMs);
                return;
            }
        }, function(err) {
            if (timedout) {
                return;
            }
            deferred.reject(err);
            cleanUp();
        });
    }

    doCheck();
    return deferred.promise;
}

/**
 * For compatibility to previous version of module which did not have support
 * for host addresses. This function works only for localhost.
 * @param {Number} port a valid TCP port number
 * @param {Number} [retryTimeMs] the retry interval in milliseconds - defaultis is 500ms
 * @param {Number} [timeOutMs] the amount of time to wait until port is free
 *
 * Example usage:
 *
 * var tcpPortUsed = require('tcp-port-used');
 * tcpPortUsed.waitUntilUsed(44204, 500, 4000)
 * .then(function() {
 *     console.log('Port 44204 is now in use.');
 * }, function(err) {
 *     console.log('Error: ', error.message);
 * });
 */
function waitUntilUsed(port, retryTimeMs, timeOutMs) {
    return waitUntilUsedOnHost(port, '127.0.0.1', retryTimeMs, timeOutMs);
}

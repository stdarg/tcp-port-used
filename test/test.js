'use strict';
var assert = require('assert');
var tcpPortUsed = require('../index');
var net = require('net');
var debug = require('debug')('tcp-port-used-test');

var server;

function freePort(cb) {
    if (!server)
        return cb(new Error('Port not in use'));

    server.close();
    server.unref();
    server = undefined;
    cb();
}

function bindPort(port, cb) {
    if (server)
        return cb(new Error('Free the server port, first.'));

    server = net.createServer();
    server.listen(port);

    function errEventCb(err) {
        server.close();
        if (cb) {
            rmListeners();
            cb(err);
        }
        server = undefined;
    }

    function listenEventCb() {
        if (cb) {
            rmListeners();
            cb();
        }
    }

    function rmListeners() {
        server.removeListener('error', errEventCb);
        server.removeListener('listening', listenEventCb);
    }

    server.on('error', errEventCb);
    server.on('listening', listenEventCb);
}

describe('check arguments', function() {
    it('Should not accept negative port numbers', function() {
        tcpPortUsed.check(-20)
        .then(function() {
            assert.ok(false);
        }, function(err) {
            assert.ok(err && err.message === 'Invalid port: -20');
        });
    });
    it('Should not accept invalid types for port numbers', function() {
        tcpPortUsed.check('hello')
        .then(function() {
            assert.ok(false);
        }, function(err) {
            assert.ok(err && err.message === 'Invalid port: hello');
        });
    });
    it('Should require an argument for a port number', function() {
        tcpPortUsed.check()
        .then(function() {
            assert.ok(false);
        }, function(err) {
            assert.ok(err && err.message === 'Invalid port: undefined');
        });
    });
    it('Should not accept port number > 65535', function() {
        tcpPortUsed.check(65536)
        .then(function() {
            assert.ok(false);
        }, function(err) {
            assert.ok(err && err.message === 'Invalid port: 65536');
        });
    });
});

describe('check functionality for unused port', function() {
    before(function(cb) {
        bindPort(44202, function(err) {
            cb(err);
        });
    });

    it('Should return true for a used port number: 44202', function() {
        tcpPortUsed.check(44202)
        .then(function(inUse) {
            assert.ok(inUse === true);
        }, function() {
            assert.ok(false);
        });
    });

    it('should return false for an unused port number: 44201', function() {
        tcpPortUsed.check(44201)
        .then(function(inUse) {
            assert.ok(inUse === false);
        }, function() {
            assert.ok(false);
        });
    });

    after(function(cb) {
        freePort(function(err) {
            cb(err);
        });
    });
});

describe('waitUntilFree functionality for used port', function() {
    this.timeout(5000);

    before(function(cb) {
        bindPort(44203, function(err) {
            cb(err);
        });
    });

    it('Should reject promise for used port number: 44202', function(done) {
        tcpPortUsed.waitUntilFree(44203, 500, 4000)
        .then(function() {
            done(new Error('waitUntilFree unexpectedly succeeded'));
        }, function(err) {
            if (err.message === 'waitUntilFree: timeout after 4000 ms.')
                done();
        });
    });

    after(function(cb) {
        freePort(function(err) {
            cb(err);
        });
    });
});

describe('waitUntilUsed', function() {

    before(function() {
        setTimeout(function() {
            bindPort(44204);
        }, 2000);
    });

    it('should wait until the port is listening', function(done) {
        this.timeout(5000);
        tcpPortUsed.waitUntilUsed(44204, 500, 4000)
        .then(function() {
            debug('promise fulfilled.');
            done();
        }, function(err) {
            debug('promise rejected.');
            done(err);
        });
    });

    it('should timeout when no port is ever ilstening', function(done) {
        this.timeout(3000);
        tcpPortUsed.waitUntilUsed(44205, 500, 2000)
        .then(function() {
            debug('promise fulfilled.');
            done(new Error('waitUntil used unexpectedly successful.'));
        }, function(err) {
            debug('promise rejected.');
            if (err.message === 'waitUntilListening: timeout.')
                done();
            else
                done(err);
        });
    });

    after(function(cb) {
        freePort(function(err) {
            cb(err);
        });
    });
});

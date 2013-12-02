'use strict';
var assert = require('assert');
var tcpPortUsed = require('../index');
var net = require('net');
var server;

function freePort(cb) {
    if (!server)
        return cb(new Error('Port not in use'));

    server.close(function(err) {
        server = undefined;
        cb(err);
    });
}

function bindPort(port, cb) {
    server = net.createServer();
    server.listen(port);

    server.on('error', function(err) {
        server.close();
        server = undefined;
        cb(err);
    });
    server.on('listening', function() {
        cb();
    });
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
    after(function(cb) {
        freePort(function(err) {
            cb(err);
        });
    });
});

describe('check functionality for unused port', function() {
    it('Should return false for an unused port number: 44201', function() {
        tcpPortUsed.check(44201)
        .then(function(inUse) {
            assert.ok(inUse === false);
        }, function() {
            assert.ok(false);
        });
    });
});


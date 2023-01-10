/* eslint-env mocha */
require('./setup');


var createServer = require('../lib/cors-anywhere').createServer;
//var createServer = require('../').createServer;
var request = require('supertest');
var path = require('path');
var http = require('http');
var https = require('https');
var fs = require('fs');
var assert = require('assert');

var helpTextPath = path.join(__dirname, '../lib/help.txt');
var helpText = fs.readFileSync(helpTextPath, {encoding: 'utf8'});

request.Test.prototype.expectJSON = function(json, done) {
  this.expect(function(res) {
    // Assume that the response can be parsed as JSON (otherwise it throws).
    var actual = JSON.parse(res.text);
    assert.deepEqual(actual, json);
  });
  return done ? this.end(done) : this;
};

request.Test.prototype.expectNoHeader = function(header, done) {
  this.expect(function(res) {
    if (header.toLowerCase() in res.headers) {
      return new Error('Unexpected header in response: ' + header);
    }
  });
  return done ? this.end(done) : this;
};

var cors_anywhere;
var cors_anywhere_port;
function stopServer(done) {
  cors_anywhere.close(function() {
    done();
  });
  cors_anywhere = null;
}

describe('Basic functionality', function() {
  before(function() {
    cors_anywhere = createServer();
    cors_anywhere_port = cors_anywhere.listen(0).address().port;
  });
  after(stopServer);

  it('GET /', function(done) {
    request(cors_anywhere)
      .get('/')
      .type('text/plain')
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200, helpText, done);
  });

  it('GET example.com:65536', function(done) {
    request(cors_anywhere)
      .get('')
      .set("target-url","example.com:65536" )
      .expect('Access-Control-Allow-Origin', '*')
      .expect(400, 'Port number too large: 65536', done);
  });

  it('GET example.com', function(done) {
    request(cors_anywhere)      
      .get('/')
      .set("target-url","http://example.com" )
      .expect('Access-Control-Allow-Origin', '*')
      .expect('x-request-url', 'http://example.com/')
      .expect(200, 'Response from example.com', done);
  });
 
});

describe('destination white list', function(){
  before(function() {
      cors_anywhere = createServer({
        destinationWhitelist: ['example.com']
      });
      cors_anywhere_port = cors_anywhere.listen(0).address().port;
  });
  after(stopServer);
  
    it('GET example.com', function(done) {
      request(cors_anywhere)      
        .get('/')
        .set("target-url","http://example.com" )        
        .expect(200, 'Response from example.com', done);
    });

    it('GET denied.com', function(done) {
      request(cors_anywhere)      
        .get('/')
        .set("target-url","http://denied.com" )
        .expect(403, 'The destination "denied.com" was not whitelisted.', done);
    });
});

describe('originBlacklist', function() {
  before(function() {
    cors_anywhere = createServer({
      originBlacklist: ['http://denied.origin.test'],
    });
    cors_anywhere_port = cors_anywhere.listen(0).address().port;
  });
  after(stopServer);

  it('GET /example.com with denied origin', function(done) {
    request(cors_anywhere)
      .get('/')
      .set("target-url","http://example.com" ) 
      .set('Origin', 'http://denied.origin.test')
      .expect('Access-Control-Allow-Origin', '*')
      .expect(403, done);
  });

  it('GET /example.com without denied origin', function(done) {
    request(cors_anywhere)
      .get('/')
      .set("target-url","example.com" ) 
      .set('Origin', 'https://denied.origin.test') // Note: different scheme!
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200, done);
  });

  it('GET /example.com without origin', function(done) {
    request(cors_anywhere)
      .get('/')
      .set("target-url","example.com" ) 
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200, done);
  });
});

describe('originWhitelist', function() {
  before(function() {
    cors_anywhere = createServer({
      originWhitelist: ['https://permitted.origin.test'],
    });
    cors_anywhere_port = cors_anywhere.listen(0).address().port;
  });
  after(stopServer);

  it('GET /example.com with permitted origin', function(done) {
    request(cors_anywhere)
      .get('/example.com/')
      .set("target-url","example.com" ) 
      .set('Origin', 'https://permitted.origin.test')
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200, done);
  });

  it('GET /example.com without permitted origin', function(done) {
    request(cors_anywhere)
      .get('/')
      .set("target-url","example.com" ) 
      .set('Origin', 'http://permitted.origin.test') // Note: different scheme!
      .expect('Access-Control-Allow-Origin', '*')
      .expect(403, done);
  });

  it('GET /example.com without origin', function(done) {
    request(cors_anywhere)
      .get('/')
      .set("target-url","example.com" ) 
      .expect('Access-Control-Allow-Origin', '*')
      .expect(403, done);
  });
});

describe('helpFile', function() {

  afterEach(stopServer);

  it('GET / with custom text helpFile', function(done) {
    var customHelpTextPath = path.join(__dirname, './customHelp.txt');
    var customHelpText = fs.readFileSync(customHelpTextPath, {encoding: 'utf8'});

    cors_anywhere = createServer({
      helpFile: customHelpTextPath,
    });
    cors_anywhere_port = cors_anywhere.listen(0).address().port;

    request(cors_anywhere)
      .get('/')
      .type('text/plain')
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200, customHelpText, done);
  });

  it('GET / with custom HTML helpFile', function(done) {
    var customHelpTextPath = path.join(__dirname, './customHelp.html');
    var customHelpText = fs.readFileSync(customHelpTextPath, {encoding: 'utf8'});

    cors_anywhere = createServer({
      helpFile: customHelpTextPath,
    });
    cors_anywhere_port = cors_anywhere.listen(0).address().port;

    request(cors_anywhere)
      .get('/')
      .type('text/html')
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200, customHelpText, done);
  });

  it('GET / with non-existent help file', function(done) {
    var customHelpTextPath = path.join(__dirname, 'Some non-existing file.');

    cors_anywhere = createServer({
      helpFile: customHelpTextPath,
    });
    cors_anywhere_port = cors_anywhere.listen(0).address().port;

    request(cors_anywhere)
      .get('/')
      .type('text/plain')
      .expect('Access-Control-Allow-Origin', '*')
      .expect(500, '', done);
  });
});

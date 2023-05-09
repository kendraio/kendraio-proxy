var fs = require('fs');

// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the denylist from the command-line so that we can update the denylist without deploying
// again. CORS Anywhere is open by design, and this denylist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originAllowlist instead.
var originDenylist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originAllowlist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
console.log('originDenylist', originDenylist);
console.log('originAllowlist', originAllowlist);

// load a allowlist from a text file, and remove everything after the first space, then remove empty rows
var pathAllowlist = {};
try {
  pathAllowlist = JSON.parse(fs.readFileSync('./conf/pathAllowlist.json'));
} catch (error) {
  console.log('Error reading or parsing pathAllowlist.json file:', error.message);
}
console.log('Allowed paths and hosts');
console.log(pathAllowlist);

var destinationAllowlist = [];
try {
  destinationAllowlist=fs.readFileSync('./conf/destinationAllowlist.txt').toString().split("\n").map( row => row.split(" ")[0]).filter(n=>n);
} catch (error) {
  console.log('Error reading destinationAllowlist.txt file:', error.message);
}

function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
  originDenylist: originDenylist,
  originAllowlist: originAllowlist,
  destinationAllowlist: destinationAllowlist,
  requireHeader: ['target-url'],
  pathAllowlist: pathAllowlist,
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // Other Heroku added debug headers
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
}).listen(port, host, function() {
  console.log('Running Kendraio CORS proxy on ' + host + ':' + port);

  if (destinationAllowlist.length) {
    console.log('Allowed destinations');
    console.log(destinationAllowlist);
  }

});

**Kendraio CORS Proxy**

The Kendraio CORS proxy is a fork of **CORS Anywhere**, a NodeJS proxy which adds CORS headers to the proxied request.


The url to proxy is taken from the "target-url" header. 

The proxy does not put any restrictions on the http methods or headers, except for
cookies. Requesting [user credentials](http://www.w3.org/TR/cors/#user-credentials) is disallowed.

## Documentation

### Fly.io

The proxy runs on fly.io. Settings for the fly.io installation are available in fly.toml. 
When running on fly.io, the proxy is available on the standard http and https ports. 

### Docker config

The server setup is defined in the Dockerfile. This file will be used by fly.io to build the proxy. 
The docker image is built on top of a standard node.js image, and simply installs the required packages,
copies in our code and starts the server. 

### Server

The module exports `createServer(options)`, which creates a server that handles
proxy requests. The following options are supported:

* function `getProxyForUrl` - If set, specifies which intermediate proxy to use for a given URL.
  If the return value is void, a direct request is sent. The default implementation is
  [`proxy-from-env`](https://github.com/Rob--W/proxy-from-env), which respects the standard proxy
  environment variables (e.g. `https_proxy`, `no_proxy`, etc.).  
* array of strings `originBlacklist` - If set, requests whose origin is listed are blocked.  
  Example: `['https://bad.example.com', 'http://bad.example.com']`
* array of strings `originWhitelist` - If set, requests whose origin is not listed are blocked.  
  If this list is empty, all origins are allowed.
  Example: `['https://good.example.com', 'http://good.example.com']`
* function `handleInitialRequest` - If set, it is called with the request, response and a parsed
  URL of the requested destination (null if unavailable). If the function returns true, the request
  will not be handled further. Then the function is responsible for handling the request.
  This feature can be used to passively monitor requests, for example for logging (return false).
* function `checkRateLimit` - If set, it is called with the origin (string) of the request. If this
  function returns a non-empty string, the request is rejected and the string is send to the client.
* boolean `redirectSameOrigin` - If true, requests to URLs from the same origin will not be proxied but redirected.
  The primary purpose for this option is to save server resources by delegating the request to the client
  (since same-origin requests should always succeed, even without proxying).
* array of strings `requireHeader` - If set, the request must include this header or the API will refuse to proxy.  
  Recommended if you want to prevent users from using the proxy for normal browsing.  
  Example: `['Origin', 'X-Requested-With']`.
* array of lowercase strings `removeHeaders` - Exclude certain headers from being included in the request.  
  Example: `["cookie"]`
* dictionary of lowercase strings `setHeaders` - Set headers for the request (overwrites existing ones).  
  Example: `{"x-powered-by": "CORS Anywhere"}`
* number `corsMaxAge` - If set, an Access-Control-Max-Age request header with this value (in seconds) will be added.  
  Example: `600` - Allow CORS preflight request to be cached by the browser for 10 minutes.
* string `helpFile` - Set the help file (shown at the homepage).  
  Example: `"myCustomHelpText.txt"`

For advanced users, the following options are also provided.

* `httpProxyOptions` - Under the hood, [http-proxy](https://github.com/nodejitsu/node-http-proxy)
  is used to proxy requests. Use this option if you really need to pass options
  to http-proxy. The documentation for these options can be found [here](https://github.com/nodejitsu/node-http-proxy#options).
* `httpsOptions` - If set, a `https.Server` will be created. The given options are passed to the
  [`https.createServer`](https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener) method.

For even more advanced usage (building upon CORS Anywhere),
see the sample code in [test/test-examples.js](test/test-examples.js).

### Demo server

A public demo of CORS Anywhere is available at https://cors-anywhere.herokuapp.com. This server is
only provided so that you can easily and quickly try out CORS Anywhere. To ensure that the service
stays available to everyone, the number of requests per period is limited, except for requests from
some explicitly whitelisted origins.

**Note: as of February 2021, access to the demo server requires an opt-in**,
see: https://github.com/Rob--W/cors-anywhere/issues/301

If you expect lots of traffic, please host your own instance of CORS Anywhere, and make sure that
the CORS Anywhere server only whitelists your site to prevent others from using your instance of
CORS Anywhere as an open proxy.

For instance, to run a CORS Anywhere server that accepts any request from some example.com sites on
port 8080, use:
```
export PORT=8080
export CORSANYWHERE_WHITELIST=https://example.com,http://example.com,http://example.com:8080
node server.js
```

This application can immediately be run on Heroku, see https://devcenter.heroku.com/articles/nodejs
for instructions. Note that their [Acceptable Use Policy](https://www.heroku.com/policy/aup) forbids
the use of Heroku for operating an open proxy, so make sure that you either enforce a whitelist as
shown above, or severly rate-limit the number of requests.

For example, to blacklist abuse.example.com and rate-limit everything to 50 requests per 3 minutes,
except for my.example.com and my2.example.com (which may be unlimited), use:

```
export PORT=8080
export CORSANYWHERE_BLACKLIST=https://abuse.example.com,http://abuse.example.com
export CORSANYWHERE_RATELIMIT='50 3 my.example.com my2.example.com'
node server.js
```


## License

Copyright (C) 2013 - 2021 Rob Wu <rob@robwu.nl>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

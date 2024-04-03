**Kendraio Proxy**

Kendraio Proxy is a fork of **CORS Anywhere**, a NodeJS proxy which adds CORS headers to the proxied request.

The url to proxy is taken from the "target-url" header.

The proxy does not put any restrictions on the http methods or headers, except for
cookies. Requesting [user credentials](http://www.w3.org/TR/cors/#user-credentials) is disallowed.

## Documentation

### Kendraio App proxy default

Proxy settings for Kendraio App are managed from the app settings page: https://app.kendra.io/core/settings

### Allowed destinations

The Kendraio implementation of the proxy is very restricted by default.
Only specified URLs are available for access. In order to use the proxy
with a new URL, the URL must be added to the destination whitelist.

The list of allowed destinations is managed in [./conf/destinationWhitelist.txt].
One hostnames per line, with any content after the first space removed.
This allows for any kind of additional information to be be added as comments. (Just make sure that there is no space at the beginning of your line.)
The rule checker expects a valid hostname only. No protocols or paths are allowed.
For allowing access to specific paths, see `pathAllowlist.json`

### Fly.io

The proxy runs on fly.io. Settings for the fly.io installation are available in fly.toml.

When running on fly.io, the proxy is available on the standard http and https ports.

Deployment is automated. Any changes to the master branch will be automatically deployed.

### Docker config

The server setup is defined in the Dockerfile. This file will be used by fly.io to build the proxy.
The docker image is built on top of a standard node.js image, and simply installs the required packages,
copies in our code and starts the server.

### Testing

Tests are run using the following command.

```cli
  npm test
```

Most of the original CORS Anywhere tests have been removed. The tests in this repo only cover functionality specific to app.kendra.io.

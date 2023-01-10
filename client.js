/**
 * A simple example client
 */

const http = require('http');

var optionsget = {
    headers: {
        'target-url': "example.com",
    },
    host: "localhost", 
    port: '8080',
    path: '/',
    method: 'GET' 
};


http.get(optionsget, res => {
  let data = [];
  console.log('Status Code:', res.statusCode);
  
  res.on('data', chunk => {
    console.log(`BODY: ${chunk}`);
  });

  res.on('end', () => {
    console.log('Response ended: ');    
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
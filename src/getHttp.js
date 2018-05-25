const http = require('http');
const https = require('https');

const getHttp = (url, callback) => {
  const client = (url.startsWith('https')) ? https : http;
  client.get(url, callback).on('error', (e) => {
    if (e.code === 'ETIMEDOUT') {
      console.warn(`WARN: timeout: ${url}`);
      getHttp(url, callback);
    } else {
      console.error(e);
    }
  });
};

module.exports = getHttp;

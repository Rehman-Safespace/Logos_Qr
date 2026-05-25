import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/tts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(res.statusCode);
    console.log(data);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify({ text: 'hello' }));
req.end();

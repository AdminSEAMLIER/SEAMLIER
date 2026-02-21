const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const files = {
    '/mysql-schema.sql': { path: './mysql-schema.sql', type: 'text/plain' },
    '/seamlier-mysql.zip': { path: './seamlier-mysql.zip', type: 'application/zip' },
  };
  
  const file = files[req.url];
  if (file && fs.existsSync(file.path)) {
    const stat = fs.statSync(file.path);
    res.writeHead(200, {
      'Content-Type': file.type,
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${path.basename(file.path)}"`,
    });
    fs.createReadStream(file.path).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>Fichiers disponibles :</h2><ul><li><a href="/mysql-schema.sql">mysql-schema.sql</a></li><li><a href="/seamlier-mysql.zip">seamlier-mysql.zip</a></li></ul>');
  }
});

server.listen(5000, '0.0.0.0', () => console.log('Download server on port 5000'));

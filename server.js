const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Map href="TChat.apk" in index.html to lowercase tchat.apk on Linux
app.get('/TChat.apk', (req, res) => {
  res.download(path.join(__dirname, 'tchat.apk'), 'TChat.apk');
});

// Prevent exposing server/package files while serving static assets from root
app.use((req, res, next) => {
  const blocked = new Set(['/server.js', '/package.json', '/package-lock.json']);
  if (blocked.has(req.path)) {
    return res.status(404).send('Not found');
  }
  next();
});

app.use(express.static(__dirname, { dotfiles: 'ignore' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

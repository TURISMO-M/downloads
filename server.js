const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const RELEASE_CATALOG = [
  {
    id: 'stock-manager-windows',
    appId: 'stock-manager',
    appName: 'Stock Manager',
    version: '1.0',
    category: 'desktop',
    platform: 'Windows',
    platformKey: 'windows',
    arch: 'x86-64 (64-bit)',
    format: '.exe',
    filePath: path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_Windows.exe'),
    downloadName: 'Stock_Manager_1-0_Windows.exe',
    downloadUrl: '/downloads/stock-manager/windows',
    directPath: '/Stock_Manager/Stock_Manager_1-0_Windows.exe'
  },
  {
    id: 'stock-manager-macos',
    appId: 'stock-manager',
    appName: 'Stock Manager',
    version: '1.0',
    category: 'desktop',
    platform: 'macOS',
    platformKey: 'macos',
    arch: 'Apple Silicon (arm64)',
    format: 'Mach-O Binary',
    filePath: path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_macOS'),
    downloadName: 'Stock_Manager_1-0_macOS',
    downloadUrl: '/downloads/stock-manager/macos',
    directPath: '/Stock_Manager/Stock_Manager_1-0_macOS'
  },
  {
    id: 'stock-manager-linux',
    appId: 'stock-manager',
    appName: 'Stock Manager',
    version: '1.0',
    category: 'desktop',
    platform: 'Linux',
    platformKey: 'linux',
    arch: 'x86-64 (GNU/Linux)',
    format: 'ELF Executable',
    filePath: path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_Linux'),
    downloadName: 'Stock_Manager_1-0_Linux',
    downloadUrl: '/downloads/stock-manager/linux',
    directPath: '/Stock_Manager/Stock_Manager_1-0_Linux'
  },
  {
    id: 'tchat-android',
    appId: 'tchat',
    appName: 'TChat',
    version: '1.31',
    category: 'mobile',
    platform: 'Android',
    platformKey: 'android',
    arch: 'Android 5.0+ (API 21)',
    format: '.apk',
    filePath: path.join(__dirname, 'TChat', 'tchat.apk'),
    downloadName: 'TChat.apk',
    downloadUrl: '/downloads/tchat/android',
    directPath: '/TChat/tchat.apk'
  }
];

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function computeFileMetadata(entry) {
  try {
    const stat = fs.statSync(entry.filePath);
    const buffer = fs.readFileSync(entry.filePath);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    return {
      id: entry.id,
      appId: entry.appId,
      appName: entry.appName,
      version: entry.version,
      category: entry.category,
      platform: entry.platform,
      platformKey: entry.platformKey,
      arch: entry.arch,
      format: entry.format,
      filename: entry.downloadName,
      downloadUrl: entry.downloadUrl,
      directPath: entry.directPath,
      sizeBytes: stat.size,
      sizeFormatted: formatBytes(stat.size),
      sha256,
      updatedAt: stat.mtime.toISOString(),
      available: true
    };
  } catch (err) {
    return {
      id: entry.id,
      appId: entry.appId,
      appName: entry.appName,
      version: entry.version,
      category: entry.category,
      platform: entry.platform,
      platformKey: entry.platformKey,
      arch: entry.arch,
      format: entry.format,
      filename: entry.downloadName,
      downloadUrl: entry.downloadUrl,
      directPath: entry.directPath,
      sizeBytes: 0,
      sizeFormatted: 'Unavailable',
      sha256: null,
      updatedAt: null,
      available: false
    };
  }
}

const cachedMetadata = new Map();
function getReleasesMetadata() {
  return RELEASE_CATALOG.map((entry) => {
    try {
      const stat = fs.statSync(entry.filePath);
      const cached = cachedMetadata.get(entry.id);
      if (cached && cached.mtimeMs === stat.mtimeMs && cached.sizeBytes === stat.size) {
        return cached.data;
      }
      const data = computeFileMetadata(entry);
      cachedMetadata.set(entry.id, { mtimeMs: stat.mtimeMs, sizeBytes: stat.size, data });
      return data;
    } catch {
      return computeFileMetadata(entry);
    }
  });
}

// Live release manifest API with real file sizes and SHA-256 hashes
app.get('/api/releases', (_req, res) => {
  res.json({
    publisher: 'TURISMO-M',
    releases: getReleasesMetadata()
  });
});

// Dedicated attachment download routes for every uploaded release binary
for (const entry of RELEASE_CATALOG) {
  app.get(entry.downloadUrl, (req, res) => {
    if (!fs.existsSync(entry.filePath)) {
      return res.status(404).send('Release file not found');
    }
    return res.download(entry.filePath, entry.downloadName);
  });
}

// Backward-compatible APK paths
app.get(['/TChat.apk', '/tchat.apk'], (_req, res) => {
  const apkPath = path.join(__dirname, 'TChat', 'tchat.apk');
  if (!fs.existsSync(apkPath)) {
    return res.status(404).send('TChat.apk not found');
  }
  return res.download(apkPath, 'TChat.apk');
});

// Serve generated assets under /src
app.use('/src', express.static(path.join(__dirname, 'src'), { dotfiles: 'ignore' }));

// Prevent exposing server/package internals while serving static files
app.use((req, res, next) => {
  const blocked = new Set([
    '/server.js',
    '/package.json',
    '/package-lock.json',
    '/bun.lock'
  ]);
  if (blocked.has(req.path) || req.path.startsWith('/node_modules')) {
    return res.status(404).send('Not found');
  }
  return next();
});

app.use(express.static(__dirname, { dotfiles: 'ignore' }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`TURISMO-M Downloads listening on http://${HOST}:${PORT}`);
});

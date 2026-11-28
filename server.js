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
    mimeType: 'application/vnd.microsoft.portable-executable',
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
    mimeType: 'application/octet-stream',
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
    mimeType: 'application/octet-stream',
    filePath: path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_Linux'),
    downloadName: 'Stock_Manager_1-0_Linux',
    downloadUrl: '/downloads/stock-manager/linux',
    directPath: '/Stock_Manager/Stock_Manager_1-0_Linux'
  },
  {
    id: 'stock-manager-android',
    appId: 'stock-manager',
    appName: 'Stock Manager',
    version: '1.0',
    category: 'mobile',
    platform: 'Android',
    platformKey: 'android',
    arch: 'Android APK',
    format: '.apk',
    mimeType: 'application/vnd.android.package-archive',
    filePath: path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_Android.apk'),
    downloadName: 'Stock_Manager_1-0_Android.apk',
    downloadUrl: '/downloads/stock-manager/android',
    directPath: '/Stock_Manager/Stock_Manager_1-0_Android.apk'
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
    mimeType: 'application/vnd.android.package-archive',
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
  } catch {
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
      sizeFormatted: 'Not uploaded',
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
      cachedMetadata.delete(entry.id);
      return computeFileMetadata(entry);
    }
  });
}

function sendBinaryFile(res, filePath, downloadName, mimeType) {
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `${downloadName} was not found on the server.` });
  }
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', String(stat.size));
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return fs.createReadStream(filePath).pipe(res);
}

app.get('/api/releases', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    publisher: 'TURISMO-M',
    releases: getReleasesMetadata()
  });
});

for (const entry of RELEASE_CATALOG) {
  app.get(entry.downloadUrl, (_req, res) => {
    return sendBinaryFile(res, entry.filePath, entry.downloadName, entry.mimeType);
  });
}

app.get(['/TChat.apk', '/tchat.apk'], (_req, res) => {
  const apkPath = path.join(__dirname, 'TChat', 'tchat.apk');
  return sendBinaryFile(res, apkPath, 'TChat.apk', 'application/vnd.android.package-archive');
});

app.use('/src', express.static(path.join(__dirname, 'src'), { dotfiles: 'ignore' }));

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

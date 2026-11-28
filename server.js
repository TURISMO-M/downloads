const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const GITHUB_PAGES_BASE = 'https://turismo-m.github.io/downloads';

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
    filePaths: [
      path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_Windows.exe'),
      path.join(__dirname, 'Stock_Manager_1-0_Windows.exe')
    ],
    downloadName: 'Stock_Manager_1-0_Windows.exe',
    downloadUrl: 'Stock_Manager/Stock_Manager_1-0_Windows.exe',
    legacyRoutes: ['/downloads/stock-manager/windows', '/stock_manager/Stock_Manager_1-0_Windows.exe', '/Stock_Manager_1-0_Windows.exe'],
    remoteUrl: `${GITHUB_PAGES_BASE}/Stock_Manager/Stock_Manager_1-0_Windows.exe`
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
    filePaths: [
      path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_macOS')
    ],
    downloadName: 'Stock_Manager_1-0_macOS',
    downloadUrl: 'Stock_Manager/Stock_Manager_1-0_macOS',
    legacyRoutes: ['/downloads/stock-manager/macos', '/stock_manager/Stock_Manager_1-0_macOS'],
    remoteUrl: `${GITHUB_PAGES_BASE}/Stock_Manager/Stock_Manager_1-0_macOS`
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
    filePaths: [
      path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_Linux')
    ],
    downloadName: 'Stock_Manager_1-0_Linux',
    downloadUrl: 'Stock_Manager/Stock_Manager_1-0_Linux',
    legacyRoutes: ['/downloads/stock-manager/linux', '/stock_manager/Stock_Manager_1-0_Linux'],
    remoteUrl: `${GITHUB_PAGES_BASE}/Stock_Manager/Stock_Manager_1-0_Linux`
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
    filePaths: [
      path.join(__dirname, 'Stock_Manager', 'Stock_Manager_1-0_Android.apk')
    ],
    downloadName: 'Stock_Manager_1-0_Android.apk',
    downloadUrl: 'Stock_Manager/Stock_Manager_1-0_Android.apk',
    legacyRoutes: ['/downloads/stock-manager/android', '/stock_manager/Stock_Manager_1-0_Android.apk'],
    remoteUrl: `${GITHUB_PAGES_BASE}/Stock_Manager/Stock_Manager_1-0_Android.apk`
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
    filePaths: [
      path.join(__dirname, 'TChat', 'tchat.apk')
    ],
    downloadName: 'TChat.apk',
    downloadUrl: 'TChat/tchat.apk',
    legacyRoutes: ['/downloads/tchat/android', '/TChat.apk', '/tchat.apk', '/tchat/tchat.apk'],
    remoteUrl: `${GITHUB_PAGES_BASE}/TChat/tchat.apk`
  }
];

function findExistingLocalPath(entry) {
  for (const candidate of entry.filePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

const cachedLocalMetadata = new Map();
const cachedRemoteMetadata = new Map();

async function getEntryMetadata(entry) {
  const localPath = findExistingLocalPath(entry);
  if (localPath) {
    const stat = fs.statSync(localPath);
    const cached = cachedLocalMetadata.get(entry.id);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.sizeBytes === stat.size) {
      return cached.data;
    }
    const buffer = fs.readFileSync(localPath);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const data = {
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
      sizeBytes: stat.size,
      sizeFormatted: formatBytes(stat.size),
      sha256,
      updatedAt: stat.mtime.toISOString(),
      source: 'local',
      available: true
    };
    cachedLocalMetadata.set(entry.id, { mtimeMs: stat.mtimeMs, sizeBytes: stat.size, data });
    return data;
  }

  // Fallback to GitHub Pages remote check if large binary was not synced into container
  const cachedRemote = cachedRemoteMetadata.get(entry.id);
  if (cachedRemote && Date.now() - cachedRemote.checkedAt < 60000) {
    return cachedRemote.data;
  }

  try {
    const headRes = await fetch(entry.remoteUrl, { method: 'HEAD' });
    if (headRes.ok) {
      const len = Number(headRes.headers.get('content-length')) || 0;
      const data = {
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
        sizeBytes: len,
        sizeFormatted: len > 0 ? formatBytes(len) : 'Available',
        sha256: null,
        updatedAt: headRes.headers.get('last-modified') || null,
        source: 'mirror',
        available: true
      };
      cachedRemoteMetadata.set(entry.id, { checkedAt: Date.now(), data });
      return data;
    }
  } catch {
    // Ignore outbound error and return unavailable
  }

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
    sizeBytes: 0,
    sizeFormatted: 'Unavailable',
    sha256: null,
    updatedAt: null,
    source: 'none',
    available: false
  };
}

async function serveReleaseEntry(req, res, entry) {
  const localPath = findExistingLocalPath(entry);
  if (localPath) {
    const stat = fs.statSync(localPath);
    res.setHeader('Content-Type', entry.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Content-Disposition', `attachment; filename="${entry.downloadName}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }
    return fs.createReadStream(localPath).pipe(res);
  }

  // Stream from GitHub Pages mirror when large file is absent from local container
  try {
    const upstream = await fetch(entry.remoteUrl, { method: req.method === 'HEAD' ? 'HEAD' : 'GET' });
    if (!upstream.ok) {
      return res.status(404).json({ error: `${entry.downloadName} was not found.` });
    }
    const len = upstream.headers.get('content-length');
    res.setHeader('Content-Type', entry.mimeType || 'application/octet-stream');
    if (len) res.setHeader('Content-Length', len);
    res.setHeader('Content-Disposition', `attachment; filename="${entry.downloadName}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'HEAD' || !upstream.body) {
      return res.status(200).end();
    }
    const { Readable } = require('stream');
    return Readable.fromWeb(upstream.body).pipe(res);
  } catch {
    return res.status(404).json({ error: `${entry.downloadName} was not found.` });
  }
}

app.get('/api/releases', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const releases = await Promise.all(RELEASE_CATALOG.map(getEntryMetadata));
  res.json({
    publisher: 'TURISMO-M',
    releases
  });
});

// Handle direct static-style routes, lowercase folder aliases, and legacy routes
for (const entry of RELEASE_CATALOG) {
  const routes = [`/${entry.downloadUrl}`, ...entry.legacyRoutes];
  app.get(routes, (req, res) => serveReleaseEntry(req, res, entry));
  app.head(routes, (req, res) => serveReleaseEntry(req, res, entry));
}

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

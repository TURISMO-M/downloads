(function () {
  'use strict';

  const FALLBACK_RELEASES = [
    {
      id: 'stock-manager-windows',
      appId: 'stock-manager',
      appName: 'Stock Manager',
      version: '1.1',
      category: 'desktop',
      platform: 'Windows',
      platformKey: 'windows',
      arch: 'Windows Setup (32/64-bit)',
      format: '.exe',
      filename: 'Stock-Manager-1.1-Windows-Setup.exe',
      downloadUrl: 'Stock_Manager/Stock-Manager-1.1-Windows-Setup.exe',
      sizeFormatted: '2.46 MB',
      sha256: '27e201ffb9b9cb9fac3dd165f5b72c711732a5656389eb22dc013121f52b325d',
      available: true
    },
    {
      id: 'stock-manager-macos',
      appId: 'stock-manager',
      appName: 'Stock Manager',
      version: '1.1',
      category: 'desktop',
      platform: 'macOS',
      platformKey: 'macos',
      arch: 'Apple Silicon (arm64)',
      format: '.dmg',
      filename: 'Stock-Manager-1.1-macOS.dmg',
      downloadUrl: 'Stock_Manager/Stock-Manager-1.1-macOS.dmg',
      sizeFormatted: '1.02 MB',
      sha256: '7c7cdda6627c1da3a0118bd3a3486e750d1f79bfe8f13b60969e60786d7d069c',
      available: true
    },
    {
      id: 'stock-manager-linux',
      appId: 'stock-manager',
      appName: 'Stock Manager',
      version: '1.1',
      category: 'desktop',
      platform: 'Linux',
      platformKey: 'linux',
      arch: 'amd64 (Debian/Ubuntu)',
      format: '.deb',
      filename: 'Stock-Manager-1.1-Linux-amd64.deb',
      downloadUrl: 'Stock_Manager/Stock-Manager-1.1-Linux-amd64.deb',
      sizeFormatted: '848.7 KB',
      sha256: '10c800bf0905f6e2e4313ea16757b3882bdac2c2d23d3761ba49aa67c3de128e',
      available: true
    },
    {
      id: 'stock-manager-android',
      appId: 'stock-manager',
      appName: 'Stock Manager',
      version: '1.1',
      category: 'mobile',
      platform: 'Android',
      platformKey: 'android',
      arch: 'Android APK',
      format: '.apk',
      filename: 'Stock-Manager-1.1-Android.apk',
      downloadUrl: 'Stock_Manager/Stock-Manager-1.1-Android.apk',
      sizeFormatted: '15.35 MB',
      sha256: '2bdce6df4e651f544b26048c6ca4f6c12aaa2725fd3a96660b73cadc0ae7be21',
      available: true
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
      filename: 'TChat.apk',
      downloadUrl: 'TChat/tchat.apk',
      sizeFormatted: 'Available',
      sha256: null,
      available: true
    }
  ];

  const PLATFORM_NOTES = {
    windows: 'Windows Setup installer (.exe). Run the installer to set up Stock Manager.',
    macos: 'macOS disk image (.dmg). Open the DMG and drag Stock Manager to Applications.',
    linux: 'Debian/Ubuntu amd64 package (.deb). Install with apt or dpkg.',
    android: 'Android APK package. Install directly on Android 5.0+ devices.'
  };

  const INSTALL_GUIDES = {
    windows: {
      steps: [
        [{ text: 'Download ' }, { strong: 'Stock-Manager-1.1-Windows-Setup.exe' }, { text: ' from the release panel above.' }],
        [{ text: 'Verify the SHA-256 checksum in PowerShell with ' }, { code: 'Get-FileHash .\\Stock-Manager-1.1-Windows-Setup.exe -Algorithm SHA256' }, { text: '.' }],
        [{ text: 'Run the Setup installer to install Stock Manager. If Windows SmartScreen prompts, choose ' }, { em: 'More info' }, { text: ' and ' }, { em: 'Run anyway' }, { text: '.' }]
      ],
      command: 'Get-FileHash .\\Stock-Manager-1.1-Windows-Setup.exe -Algorithm SHA256'
    },
    macos: {
      steps: [
        [{ text: 'Download ' }, { strong: 'Stock-Manager-1.1-macOS.dmg' }, { text: ' (macOS disk image).' }],
        [{ text: 'Verify the SHA-256 checksum with ' }, { code: 'shasum -a 256 Stock-Manager-1.1-macOS.dmg' }, { text: ', then double-click the ' }, { code: '.dmg' }, { text: ' to mount it.' }],
        [{ text: 'Drag ' }, { strong: 'Stock Manager' }, { text: ' into your ' }, { strong: 'Applications' }, { text: ' folder. If Gatekeeper prompts on first launch, right-click the app and choose ' }, { em: 'Open' }, { text: '.' }]
      ],
      command: 'shasum -a 256 ./Stock-Manager-1.1-macOS.dmg && open ./Stock-Manager-1.1-macOS.dmg'
    },
    linux: {
      steps: [
        [{ text: 'Download ' }, { strong: 'Stock-Manager-1.1-Linux-amd64.deb' }, { text: ' (64-bit Debian/Ubuntu package).' }],
        [{ text: 'Verify the checksum with ' }, { code: 'sha256sum Stock-Manager-1.1-Linux-amd64.deb' }, { text: '.' }],
        [{ text: 'Install the package using ' }, { code: 'apt' }, { text: ' (or ' }, { code: 'dpkg' }, { text: ') and launch Stock Manager from your app menu or terminal.' }]
      ],
      command: 'sudo apt install ./Stock-Manager-1.1-Linux-amd64.deb'
    },
    android: {
      steps: [
        [{ text: 'Download the ' }, { strong: '.apk' }, { text: ' package (' }, { strong: 'Stock-Manager-1.1-Android.apk' }, { text: ' or ' }, { strong: 'TChat.apk' }, { text: ') onto your Android device.' }],
        [{ text: 'Open your device file manager, navigate to Downloads, and tap the APK file.' }],
        [{ text: 'If prompted, enable ' }, { em: 'Install from unknown sources' }, { text: ' for your browser or file manager, then tap ' }, { strong: 'Install' }, { text: '.' }]
      ],
      command: 'adb install -r Stock-Manager-1.1-Android.apk'
    }
  };

  let releases = FALLBACK_RELEASES.slice();
  let activeStockOs = detectUserOs();
  let toastTimer = null;

  function detectUserOs() {
    const ua = navigator.userAgent || '';
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    const combined = `${ua} ${platform}`.toLowerCase();
    if (combined.includes('android')) return 'android';
    if (combined.includes('mac')) return 'macos';
    if (combined.includes('linux')) return 'linux';
    return 'windows';
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  function showToast(message) {
    const toast = document.getElementById('copy-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  async function copyText(text, label) {
    if (!text || text === 'Unavailable' || text === 'Checking checksum...' || text === 'Direct static file') {
      showToast('Nothing available to copy yet');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(label || 'Copied to clipboard');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(label || 'Copied to clipboard');
    }
  }

  // Inside preview iframes, fetch+Blob keeps session cookies intact; top-level uses native download
  function isInIframe() {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  async function triggerSafeDownload(anchor) {
    if (anchor.classList.contains('is-disabled')) return;
    const url = anchor.getAttribute('href');
    const filename = anchor.getAttribute('download') || 'download';
    if (!url || url.startsWith('#')) return;

    const labelSpan = anchor.querySelector('span:last-child');
    const originalText = labelSpan ? labelSpan.textContent : anchor.textContent;
    anchor.classList.add('is-downloading');
    if (labelSpan && anchor.classList.contains('btn-primary')) {
      labelSpan.textContent = 'Downloading...';
    }

    try {
      const response = await fetch(url, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = filename;
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      showToast(`Started download: ${filename}`);
    } catch (err) {
      console.error('Iframe fetch download failed, falling back to direct link:', err);
      const direct = document.createElement('a');
      direct.href = url;
      direct.download = filename;
      direct.style.display = 'none';
      document.body.appendChild(direct);
      direct.click();
      document.body.removeChild(direct);
    } finally {
      anchor.classList.remove('is-downloading');
      if (labelSpan && anchor.classList.contains('btn-primary')) {
        labelSpan.textContent = originalText;
      }
    }
  }

  function getReleaseByPlatform(appId, platformKey) {
    return releases.find((item) => item.appId === appId && item.platformKey === platformKey);
  }

  function updateHeroCta() {
    const detected = detectUserOs();
    const heroBtn = document.getElementById('hero-primary-cta');
    const heroLabel = document.getElementById('hero-cta-label');
    const detectedText = document.getElementById('detected-platform-text');

    const platformNames = {
      windows: 'Windows',
      macos: 'macOS',
      linux: 'Linux',
      android: 'Android'
    };

    if (detectedText) {
      detectedText.textContent = `Detected platform: ${platformNames[detected] || 'Desktop'}`;
    }

    if (!heroBtn || !heroLabel) return;

    if (detected === 'android') {
      const stockAndroid = getReleaseByPlatform('stock-manager', 'android');
      const tchat = getReleaseByPlatform('tchat', 'android');
      const target = stockAndroid && stockAndroid.available ? stockAndroid : tchat;
      if (target) {
        heroBtn.setAttribute('href', target.downloadUrl);
        heroBtn.setAttribute('download', target.filename);
        heroBtn.classList.toggle('is-disabled', !target.available);
        heroLabel.textContent = `Download ${target.appName} for Android`;
      }
    } else {
      const build = getReleaseByPlatform('stock-manager', detected) || getReleaseByPlatform('stock-manager', 'windows');
      if (build) {
        heroBtn.setAttribute('href', build.downloadUrl);
        heroBtn.setAttribute('download', build.filename);
        heroBtn.classList.toggle('is-disabled', !build.available);
        heroLabel.textContent = `Download Stock Manager for ${build.platform}`;
      }
    }
  }

  function renderStockManagerPanel() {
    const build = getReleaseByPlatform('stock-manager', activeStockOs);
    if (!build) return;

    const filenameEl = document.getElementById('sm-filename');
    const archEl = document.getElementById('sm-arch');
    const sizeEl = document.getElementById('sm-size');
    const hashEl = document.getElementById('sm-hash');
    const btnEl = document.getElementById('sm-download-btn');
    const btnLabelEl = document.getElementById('sm-download-label');
    const noteEl = document.getElementById('sm-platform-note');

    if (filenameEl) filenameEl.textContent = build.filename;
    if (archEl) archEl.textContent = `${build.arch} · ${build.format}`;
    if (sizeEl) sizeEl.textContent = build.sizeFormatted;
    if (hashEl) {
      hashEl.textContent = build.sha256 || (build.available ? 'Direct static file' : 'Unavailable');
      const copyBtn = hashEl.parentElement ? hashEl.parentElement.querySelector('.copy-btn') : null;
      if (copyBtn) copyBtn.hidden = !build.sha256;
    }

    if (btnEl) {
      btnEl.setAttribute('href', build.downloadUrl);
      btnEl.setAttribute('download', build.filename);
      btnEl.classList.toggle('is-disabled', !build.available);
      btnEl.setAttribute('aria-disabled', String(!build.available));
    }
    if (btnLabelEl) {
      btnLabelEl.textContent = build.available
        ? `Download for ${build.platform}`
        : `${build.filename} Unavailable`;
    }
    if (noteEl) {
      noteEl.textContent = build.available
        ? (PLATFORM_NOTES[build.platformKey] || '')
        : `${build.filename} could not be reached.`;
    }

    document.querySelectorAll('.os-tab').forEach((tab) => {
      const isSelected = tab.dataset.os === activeStockOs;
      tab.classList.toggle('is-active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
    });
  }

  function renderTChatPanel() {
    const tchat = getReleaseByPlatform('tchat', 'android');
    if (!tchat) return;

    const sizeEl = document.getElementById('tchat-size');
    const hashEl = document.getElementById('tchat-hash');
    const btnEl = document.getElementById('tchat-download-btn');

    if (sizeEl) sizeEl.textContent = tchat.sizeFormatted;
    if (hashEl) {
      hashEl.textContent = tchat.sha256 || (tchat.available ? 'Direct static file' : 'Unavailable');
      const copyBtn = hashEl.parentElement ? hashEl.parentElement.querySelector('.copy-btn') : null;
      if (copyBtn) copyBtn.hidden = !tchat.sha256;
    }
    if (btnEl) {
      btnEl.setAttribute('href', tchat.downloadUrl);
      btnEl.classList.toggle('is-disabled', !tchat.available);
      btnEl.setAttribute('aria-disabled', String(!tchat.available));
    }
  }

  function updateQuickLinks() {
    document.querySelectorAll('[data-release-link]').forEach((link) => {
      const id = link.getAttribute('data-release-link');
      const match = releases.find((r) => r.id === id);
      if (match) {
        link.classList.toggle('is-disabled', !match.available);
        link.setAttribute('aria-disabled', String(!match.available));
      }
    });

    document.querySelectorAll('[data-size-for]').forEach((el) => {
      const id = el.getAttribute('data-size-for');
      const match = releases.find((r) => r.id === id);
      if (match) {
        el.textContent = match.sizeFormatted;
      }
    });
  }

  function renderManifestTable() {
    const tbody = document.getElementById('manifest-tbody');
    if (!tbody) return;

    tbody.replaceChildren();

    releases.forEach((item) => {
      const tr = document.createElement('tr');

      const appTd = document.createElement('td');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'manifest-app-name';
      nameSpan.textContent = item.appName;
      const verSpan = document.createElement('span');
      verSpan.className = 'manifest-version mono';
      verSpan.textContent = `v${item.version}`;
      appTd.appendChild(nameSpan);
      appTd.appendChild(verSpan);

      const fileTd = document.createElement('td');
      fileTd.className = 'mono';
      fileTd.textContent = item.filename;

      const platTd = document.createElement('td');
      platTd.textContent = `${item.platform} · ${item.arch}`;

      const sizeTd = document.createElement('td');
      sizeTd.className = 'num-col mono tabular-nums';
      sizeTd.textContent = item.sizeFormatted;

      const hashTd = document.createElement('td');
      const hashWrap = document.createElement('div');
      hashWrap.className = 'hash-cell';
      const code = document.createElement('code');
      code.className = 'mono';
      code.textContent = item.sha256
        ? `${item.sha256.slice(0, 14)}…`
        : (item.available ? 'Verified static' : 'Unavailable');
      if (item.sha256) {
        code.title = item.sha256;
      }
      hashWrap.appendChild(code);

      if (item.sha256) {
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', () => {
          copyText(item.sha256, `Copied ${item.filename} SHA-256`);
        });
        hashWrap.appendChild(copyBtn);
      }
      hashTd.appendChild(hashWrap);

      const actionTd = document.createElement('td');
      actionTd.className = 'action-col';
      const link = document.createElement('a');
      link.className = item.available ? 'table-download-link' : 'table-download-link is-disabled';
      link.href = item.downloadUrl;
      link.setAttribute('download', item.filename);
      link.setAttribute('aria-disabled', String(!item.available));
      link.textContent = item.available ? 'Download' : 'Missing';
      actionTd.appendChild(link);

      tr.appendChild(appTd);
      tr.appendChild(fileTd);
      tr.appendChild(platTd);
      tr.appendChild(sizeTd);
      tr.appendChild(hashTd);
      tr.appendChild(actionTd);

      tbody.appendChild(tr);
    });
  }

  function renderInstallGuide(platformKey) {
    const guide = INSTALL_GUIDES[platformKey] || INSTALL_GUIDES.windows;
    const listEl = document.getElementById('guide-steps-list');
    const cmdEl = document.getElementById('guide-command-text');

    if (listEl) {
      listEl.replaceChildren();
      guide.steps.forEach((segments) => {
        const li = document.createElement('li');
        segments.forEach((seg) => {
          if (seg.strong) {
            const el = document.createElement('strong');
            el.textContent = seg.strong;
            li.appendChild(el);
          } else if (seg.code) {
            const el = document.createElement('code');
            el.className = 'mono';
            el.textContent = seg.code;
            li.appendChild(el);
          } else if (seg.em) {
            const el = document.createElement('em');
            el.textContent = seg.em;
            li.appendChild(el);
          } else if (seg.text) {
            li.appendChild(document.createTextNode(seg.text));
          }
        });
        listEl.appendChild(li);
      });
    }
    if (cmdEl) {
      cmdEl.textContent = guide.command;
    }

    document.querySelectorAll('[data-guide]').forEach((btn) => {
      const isSelected = btn.dataset.guide === platformKey;
      btn.classList.toggle('is-active', isSelected);
      btn.setAttribute('aria-selected', String(isSelected));
    });
  }

  async function probeStaticFiles() {
    const updated = await Promise.all(
      FALLBACK_RELEASES.map(async (item) => {
        try {
          const res = await fetch(item.downloadUrl, { method: 'HEAD', cache: 'no-store' });
          if (res.ok) {
            const encoding = res.headers.get('content-encoding');
            const isUncompressed = !encoding || encoding === 'identity';
            const len = isUncompressed ? (Number(res.headers.get('content-length')) || 0) : 0;
            return {
              ...item,
              sizeFormatted: len > 0 ? formatBytes(len) : item.sizeFormatted,
              available: true
            };
          }
          if (res.status === 405 || res.status === 501) {
            return { ...item, available: true };
          }
          return { ...item, available: false };
        } catch {
          return item;
        }
      })
    );
    releases = updated;
  }

  async function loadReleases() {
    let loadedFromApi = false;
    try {
      const response = await fetch('api/releases', { cache: 'no-store' });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const payload = await response.json();
          if (Array.isArray(payload.releases) && payload.releases.length > 0) {
            releases = payload.releases;
            loadedFromApi = true;
          }
        }
      }
    } catch {
      // Static host (e.g., GitHub Pages) has no /api/releases backend
    }

    if (!loadedFromApi) {
      await probeStaticFiles();
    }

    updateHeroCta();
    renderStockManagerPanel();
    renderTChatPanel();
    updateQuickLinks();
    renderManifestTable();
  }

  function bindEvents() {
    document.querySelectorAll('.os-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeStockOs = tab.dataset.os || 'windows';
        renderStockManagerPanel();
      });
    });

    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';
        document.querySelectorAll('[data-filter]').forEach((item) => {
          const isSelected = item === btn;
          item.classList.toggle('is-active', isSelected);
          item.setAttribute('aria-selected', String(isSelected));
        });
        document.querySelectorAll('.release-card').forEach((card) => {
          const cardCat = card.dataset.category;
          const isStockManager = card.id === 'stock-manager';
          const matches = filter === 'all' || cardCat === filter || (filter === 'mobile' && isStockManager);
          card.classList.toggle('is-hidden', !matches);
          if (filter === 'mobile' && isStockManager) {
            activeStockOs = 'android';
            renderStockManagerPanel();
          }
        });
      });
    });

    document.querySelectorAll('[data-guide]').forEach((btn) => {
      btn.addEventListener('click', () => {
        renderInstallGuide(btn.dataset.guide || 'windows');
      });
    });

    document.querySelectorAll('[data-copy-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-copy-target');
        const targetEl = targetId ? document.getElementById(targetId) : null;
        copyText(targetEl ? targetEl.textContent.trim() : '');
      });
    });

    // Inside preview iframe, intercept downloads via fetch+Blob; on standalone static hosts let native download run
    document.addEventListener('click', (event) => {
      const anchor = event.target.closest('a[download]');
      if (!anchor) return;
      if (anchor.classList.contains('is-disabled')) {
        event.preventDefault();
        return;
      }
      if (isInIframe()) {
        event.preventDefault();
        triggerSafeDownload(anchor);
      }
    });

    const refreshBtn = document.getElementById('refresh-manifest-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.textContent = 'Refreshing...';
        refreshBtn.disabled = true;
        await loadReleases();
        refreshBtn.textContent = 'Refresh Checksums';
        refreshBtn.disabled = false;
        showToast('Release manifest refreshed');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    renderInstallGuide(detectUserOs());
    loadReleases();
  });
})();

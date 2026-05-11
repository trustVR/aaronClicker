// ── PIXEL ART SPRITE GENERATOR ───────────────────────────────────────────────
const DEV_MODE = new URLSearchParams(window.location.search).get('dev') === '1'
  || window.location.hash === '#dev';
const devTools = {
  alwaysWinSlots: false,
  alwaysJackpotSlots: false,
  alwaysMegaJackpot: false,
  noRoadCrashes: false,
  alwaysSafeAir: false,
};
const APP_VERSION = '1.2.4';
const UPDATE_MANIFEST_URL = 'https://raw.githubusercontent.com/trustVR/aaronClicker/main/update-manifest.json';
const UPDATE_HELPER_URL = 'http://127.0.0.1:18172';

function compareVersions(a, b) {
  const left = String(a || '').split('.').map(n => parseInt(n, 10) || 0);
  const right = String(b || '').split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i++) {
    if ((left[i] || 0) > (right[i] || 0)) return 1;
    if ((left[i] || 0) < (right[i] || 0)) return -1;
  }
  return 0;
}

function requestAutoUpdate(latestVersion, bodyEl, buttonEl, laterBtn) {
  if (buttonEl && buttonEl.dataset.fallbackLauncher === '1') {
    try {
      window.location.href = new URL('../launch.bat', window.location.href).href;
    } catch (e) {}
    return;
  }

  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.textContent = 'UPDATING...';
  }
  if (laterBtn) laterBtn.disabled = true;
  if (bodyEl) bodyEl.textContent = 'Installing version ' + latestVersion + '. The game will reopen when it is done.';

  try { save(); } catch (e) {}

  fetch(UPDATE_HELPER_URL + '/update', {
    method: 'POST',
    body: latestVersion,
  }).then(() => {
    setTimeout(() => {
      try { window.open('', '_self'); } catch (e) {}
      try { window.close(); } catch (e) {}
      if (bodyEl) bodyEl.textContent = 'Update started. If this window stays open, close it and wait for the game to reopen.';
    }, 500);
  }).catch(() => {
    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.textContent = 'OPEN LAUNCHER';
      buttonEl.dataset.fallbackLauncher = '1';
    }
    if (laterBtn) laterBtn.disabled = false;
    if (bodyEl) bodyEl.textContent = 'The update helper is not running. Click OPEN LAUNCHER, or close this window and run launch.bat from the game folder.';
  });
}

function showUpdateAvailableBanner(latestVersion) {
  const dismissedKey = 'aaronclicker_update_dismissed_' + latestVersion;
  try {
    if (localStorage.getItem(dismissedKey) === '1') return;
  } catch (e) {}
  if (document.getElementById('zip-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'zip-update-banner';
  banner.className = 'updater-big';

  const copy = document.createElement('div');
  copy.id = 'zip-update-copy';

  const title = document.createElement('div');
  title.id = 'zip-update-title';
  title.textContent = 'UPDATE AVAILABLE';

  const body = document.createElement('div');
  body.id = 'zip-update-body';
  body.textContent = 'Version ' + latestVersion + ' is ready. Update now to install it and reopen the game automatically.';

  const actions = document.createElement('div');
  actions.id = 'zip-update-actions';

  const updateBtn = document.createElement('button');
  updateBtn.type = 'button';
  updateBtn.id = 'zip-update-now';
  updateBtn.textContent = 'UPDATE NOW';
  updateBtn.addEventListener('click', () => requestAutoUpdate(latestVersion, body, updateBtn, laterBtn));

  const laterBtn = document.createElement('button');
  laterBtn.type = 'button';
  laterBtn.id = 'zip-update-later';
  laterBtn.textContent = 'LATER';
  laterBtn.addEventListener('click', () => {
    try {
      localStorage.setItem(dismissedKey, '1');
    } catch (e) {}
    banner.remove();
  });

  copy.append(title, body);
  actions.append(updateBtn, laterBtn);
  banner.append(copy, actions);
  document.body.appendChild(banner);
}

function checkForUpdateBanner() {
  if (DEV_MODE || !UPDATE_MANIFEST_URL) return;
  fetch(UPDATE_MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(res => res.ok ? res.json() : null)
    .then(manifest => {
      if (!manifest || !manifest.version) return;
      if (compareVersions(manifest.version, APP_VERSION) > 0) {
        showUpdateAvailableBanner(manifest.version);
      }
    })
    .catch(() => {});
}

function drawFallbackAaron(canvas) {
  const ctx = canvas.getContext('2d');
  const S = 8;
  canvas.width  = 260;
  canvas.height = 260;

  const C = {
    bg:   '#18130f',
    skin: '#f5c07a',
    hair: '#3a1a00',
    eye:  '#1a0a2e',
    shirt:'#5a3b27',
    dark: '#2a1a08',
  };

  const grid = [
    '.........',
    '..HHHHH..',
    '.HHSSSSH.',
    '.HSSSSH..',
    '.HSSESH..',
    '.HSSSSH..',
    '..HSSSH..',
    '...SSSL..',
    '..TTTTT..',
    '..TTTTT..',
    '..T...T..',
    '..L...L..',
    '..L...L..',
    '..B...B..',
    '..B...B..',
  ];

  const map = { '.': C.bg, H: C.hair, S: C.skin, E: C.eye, T: C.shirt, L: C.dark, B: '#1a0a00' };

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  grid.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      ctx.fillStyle = map[ch] || C.skin;
      ctx.fillRect(c * S + 20, r * S + 20, S, S);
    });
  });
}

// ── UPGRADE ICON GENERATOR ───────────────────────────────────────────────────
function makeUpgradeIcon(id) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 56;
  const ctx = canvas.getContext('2d');

  const icons = {
    gay: {
      bg: '#1a0030',
      draw(ctx) {
        const colors = ['#ff0000','#ff8800','#ffff00','#00cc00','#0044ff','#8800cc'];
        colors.forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.fillRect(4, 4 + i * 8, 48, 8);
        });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(24, 24, 8, 8);
        ctx.fillRect(20, 27, 16, 2);
        ctx.fillRect(27, 20, 2, 16);
      }
    },
    subway: {
      bg: '#0a1a00',
      draw(ctx) {
        ctx.fillStyle = '#c8a020';
        ctx.fillRect(4, 18, 48, 20);
        ctx.fillStyle = '#a06010';
        ctx.fillRect(4, 32, 48, 10);
        ctx.fillStyle = '#40a020';
        ctx.fillRect(6, 22, 44, 4);
        ctx.fillStyle = '#e04020';
        for (let i = 0; i < 4; i++) ctx.fillRect(8 + i * 12, 26, 8, 6);
        ctx.fillStyle = '#f0e040';
        ctx.fillRect(4, 30, 48, 3);
      }
    },
    brody: {
      bg: '#001a1a',
      draw(ctx) {
        ctx.fillStyle = '#f5c07a';
        ctx.fillRect(12, 8, 32, 36);
        ctx.fillStyle = '#3a1a00';
        ctx.fillRect(12, 8, 32, 8);
        ctx.fillRect(8,  12, 4, 12);
        ctx.fillRect(44, 12, 4, 12);
        ctx.fillStyle = '#000000';
        ctx.fillRect(14, 20, 12, 8);
        ctx.fillRect(30, 20, 12, 8);
        ctx.fillRect(26, 22, 4, 4);
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(15, 21, 10, 6);
        ctx.fillRect(31, 21, 10, 6);
        ctx.fillStyle = '#3a1a00';
        ctx.fillRect(20, 36, 16, 2);
        ctx.fillRect(18, 34, 4, 2);
        ctx.fillRect(34, 34, 4, 2);
        ctx.fillStyle = '#8800cc';
        ctx.fillRect(10, 44, 36, 12);
      }
    },
    fat: {
      bg: '#200000',
      draw(ctx) {
        ctx.fillStyle = '#f5c07a';
        ctx.fillRect(14, 2, 28, 22);
        ctx.fillStyle = '#3a1a00';
        ctx.fillRect(14, 2, 28, 5);
        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(18, 12, 4, 3);
        ctx.fillRect(34, 12, 4, 3);
        ctx.fillStyle = '#f0a070';
        ctx.fillRect(14, 16, 6, 6);
        ctx.fillRect(36, 16, 6, 6);
        ctx.fillStyle = '#3a1a00';
        ctx.fillRect(20, 20, 16, 2);
        ctx.fillRect(18, 18, 4, 2);
        ctx.fillRect(34, 18, 4, 2);
        ctx.fillStyle = '#cc5500';
        ctx.fillRect(4, 24, 48, 28);
        ctx.fillStyle = '#ff8844';
        ctx.fillRect(14, 28, 28, 20);
        ctx.fillRect(10, 32, 36, 12);
        ctx.fillStyle = '#aa3300';
        ctx.fillRect(26, 38, 4, 4);
        ctx.fillStyle = '#f5c07a';
        ctx.fillRect(0, 24, 8, 20);
        ctx.fillRect(48, 24, 8, 20);
        ctx.fillStyle = '#2244aa';
        ctx.fillRect(8, 52, 16, 4);
        ctx.fillRect(32, 52, 16, 4);
      }
    },
    coffee: {
      bg: '#1a0a00',
      draw(ctx) {
        ctx.fillStyle = '#6a3010';
        ctx.fillRect(14, 10, 28, 36);
        ctx.fillStyle = '#f0e0c0';
        ctx.fillRect(16, 12, 24, 6);
        ctx.fillStyle = '#3a1800';
        ctx.fillRect(42, 22, 6, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(18, 14, 4, 2);
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(20, 4, 2, 4);
        ctx.fillRect(26, 2, 2, 6);
        ctx.fillRect(32, 4, 2, 4);
      }
    },
    bike: {
      bg: '#000a1a',
      draw(ctx) {
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(10, 28, 36, 4);
        ctx.fillRect(22, 12, 4, 18);
        ctx.fillRect(30, 20, 4, 12);
        ctx.fillStyle = '#404040';
        const wheel = (cx, cy) => {
          for (let dx = -8; dx <= 8; dx++) for (let dy = -8; dy <= 8; dy++) {
            if (dx*dx + dy*dy <= 64) ctx.fillRect(cx+dx, cy+dy, 1, 1);
          }
        };
        wheel(14, 38); wheel(42, 38);
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(10, 10, 14, 4);
      }
    },
    furrypregnancydelivery: {
      bg: '#1a1a00',
      draw(ctx) {
        ctx.fillStyle = '#f0f0e0';
        ctx.fillRect(10, 6, 36, 44);
        ctx.fillStyle = '#c0c0a0';
        for (let y = 14; y < 46; y += 6) ctx.fillRect(14, y, 28, 2);
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(12, 8, 2, 40);
        ctx.fillStyle = '#4040ff';
        ctx.fillRect(38, 6, 8, 8);
        ctx.fillRect(40, 8, 4, 4);
      }
    },
    keyboard: {
      bg: '#101018',
      draw(ctx) {
        ctx.fillStyle = '#2e3140';
        ctx.fillRect(6, 18, 44, 26);
        ctx.fillStyle = '#11131c';
        ctx.fillRect(8, 20, 40, 22);
        ctx.fillStyle = '#c9d3e8';
        for (let y = 23; y <= 35; y += 6) {
          for (let x = 11; x <= 39; x += 7) ctx.fillRect(x, y, 4, 3);
        }
        ctx.fillStyle = '#ffdd66';
        ctx.fillRect(18, 38, 20, 3);
        ctx.fillStyle = '#5ce1e6';
        ctx.fillRect(12, 12, 32, 3);
      }
    },
    megaphone: {
      bg: '#1b1210',
      draw(ctx) {
        ctx.fillStyle = '#f2d16b';
        ctx.fillRect(8, 24, 10, 12);
        ctx.fillRect(18, 20, 8, 20);
        ctx.fillStyle = '#d94f3d';
        ctx.fillRect(26, 14, 22, 32);
        ctx.fillStyle = '#8b281f';
        ctx.fillRect(44, 10, 6, 40);
        ctx.fillStyle = '#32201a';
        ctx.fillRect(14, 36, 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(30, 20, 10, 4);
        ctx.fillRect(30, 28, 8, 4);
      }
    },
    lab: {
      bg: '#091718',
      draw(ctx) {
        ctx.fillStyle = '#c8f7ff';
        ctx.fillRect(22, 8, 12, 22);
        ctx.fillStyle = '#6fe8c8';
        ctx.fillRect(18, 28, 20, 16);
        ctx.fillRect(14, 42, 28, 6);
        ctx.fillStyle = '#17343a';
        ctx.fillRect(24, 12, 8, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, 30, 16, 3);
        ctx.fillStyle = '#ff5bd6';
        ctx.fillRect(16, 20, 5, 5);
        ctx.fillStyle = '#ffdd66';
        ctx.fillRect(38, 14, 4, 4);
      }
    },
    rocket: {
      bg: '#090b1f',
      draw(ctx) {
        ctx.fillStyle = '#dfe7ff';
        ctx.fillRect(24, 8, 12, 30);
        ctx.fillStyle = '#8ea1d4';
        ctx.fillRect(20, 28, 4, 14);
        ctx.fillRect(36, 28, 4, 14);
        ctx.fillStyle = '#ff4f57';
        ctx.fillRect(24, 8, 12, 6);
        ctx.fillStyle = '#63d8ff';
        ctx.fillRect(27, 18, 6, 6);
        ctx.fillStyle = '#ffb000';
        ctx.fillRect(24, 38, 12, 6);
        ctx.fillStyle = '#ff5a1f';
        ctx.fillRect(26, 44, 8, 8);
      }
    },
    mc_pickaxe: {
      bg: '#1a1a2e',
      draw(ctx) {
        ctx.fillStyle = '#44dfff';
        ctx.fillRect(8, 8, 32, 10); ctx.fillRect(8, 8, 10, 20);
        ctx.fillStyle = '#8b5e3c';
        ctx.fillRect(28, 18, 6, 32);
        ctx.fillStyle = '#88ffff';
        ctx.fillRect(10, 10, 6, 4); ctx.fillRect(10, 14, 4, 4);
        ctx.fillStyle = '#22aabb';
        ctx.fillRect(36, 8, 4, 10); ctx.fillRect(8, 14, 4, 4);
      }
    },
    fn_builder: {
      bg: '#1a0d00',
      draw(ctx) {
        ctx.fillStyle = '#7a4a1e';
        ctx.fillRect(4, 28, 22, 22);
        ctx.fillStyle = '#5a3010';
        for (let y = 32; y < 50; y += 8) ctx.fillRect(4, y, 22, 2);
        ctx.fillStyle = '#4466aa';
        ctx.fillRect(30, 20, 22, 30);
        ctx.fillStyle = '#2244aa';
        for (let y = 24; y < 50; y += 8) ctx.fillRect(30, y, 22, 2);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(10, 8, 6, 6); ctx.fillRect(20, 4, 6, 6); ctx.fillRect(30, 8, 6, 6);
      }
    },
    hoverboard: {
      bg: '#1a001a',
      draw(ctx) {
        ctx.fillStyle = '#ff44cc';
        ctx.fillRect(6, 32, 44, 8);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(6, 38, 44, 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(8, 40, 8, 6); ctx.fillRect(40, 40, 8, 6);
        ctx.fillStyle = '#ff88ff';
        ctx.fillRect(10, 34, 36, 2);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) ctx.fillRect(10 + i * 8, 22, 4, 2);
        ctx.fillStyle = '#aaaaff';
        for (let i = 0; i < 4; i++) ctx.fillRect(14 + i * 8, 26, 6, 2);
      }
    },
    creeper: {
      bg: '#002200',
      draw(ctx) {
        ctx.fillStyle = '#44aa44';
        ctx.fillRect(12, 4, 32, 52);
        ctx.fillStyle = '#228822';
        ctx.fillRect(14, 4, 6, 52); ctx.fillRect(36, 4, 8, 52);
        ctx.fillStyle = '#000';
        ctx.fillRect(16, 12, 10, 10); ctx.fillRect(30, 12, 10, 10);
        ctx.fillRect(22, 28, 12, 12);
        ctx.fillRect(16, 36, 8, 8); ctx.fillRect(36, 36, 8, 8);
        ctx.fillStyle = '#55cc55';
        ctx.fillRect(18, 14, 4, 4); ctx.fillRect(32, 14, 4, 4);
      }
    },
    fn_llama: {
      bg: '#2a0020',
      draw(ctx) {
        ctx.fillStyle = '#22ccbb';
        ctx.fillRect(12, 20, 32, 28); ctx.fillRect(32, 8, 12, 18); ctx.fillRect(28, 4, 18, 14);
        ctx.fillStyle = '#ff4488';
        ctx.fillRect(16, 24, 8, 8); ctx.fillRect(32, 24, 8, 8);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(22, 30, 12, 6); ctx.fillRect(24, 22, 8, 22);
        ctx.fillStyle = '#ff44aa';
        ctx.fillRect(28, 4, 6, 6);
        ctx.fillStyle = '#222';
        ctx.fillRect(38, 8, 4, 4);
        ctx.fillStyle = '#22ccbb';
        ctx.fillRect(14, 46, 8, 10); ctx.fillRect(34, 46, 8, 10);
      }
    },
    jetpack: {
      bg: '#1a0a00',
      draw(ctx) {
        ctx.fillStyle = '#888';
        ctx.fillRect(16, 8, 24, 38);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(18, 10, 20, 6); ctx.fillRect(18, 20, 20, 6); ctx.fillRect(18, 30, 20, 6);
        ctx.fillStyle = '#444';
        ctx.fillRect(14, 42, 12, 6); ctx.fillRect(30, 42, 12, 6);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(16, 48, 8, 8); ctx.fillRect(32, 48, 8, 8);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(18, 50, 4, 6); ctx.fillRect(34, 50, 4, 6);
        ctx.fillStyle = '#dd2200';
        ctx.fillRect(20, 8, 16, 2); ctx.fillRect(20, 14, 16, 2);
      }
    },
    diamond_armor: {
      bg: '#001a2a',
      draw(ctx) {
        ctx.fillStyle = '#22ddff';
        ctx.fillRect(4, 10, 18, 14); ctx.fillRect(34, 10, 18, 14); ctx.fillRect(14, 10, 28, 36);
        ctx.fillStyle = '#001a2a';
        ctx.fillRect(20, 10, 16, 8); ctx.fillRect(4, 24, 10, 4); ctx.fillRect(42, 24, 10, 4);
        ctx.fillStyle = '#88ffff';
        ctx.fillRect(18, 14, 6, 10); ctx.fillRect(16, 16, 2, 6);
        ctx.fillStyle = '#0088aa';
        ctx.fillRect(4, 22, 48, 2); ctx.fillRect(14, 44, 28, 2);
      }
    },
    fn_storm: {
      bg: '#0a0015',
      draw(ctx) {
        ctx.fillStyle = '#6600cc';
        for (let dx=-14;dx<=14;dx++) for (let dy=-14;dy<=14;dy++) { const d=dx*dx+dy*dy; if(d>=160&&d<=196) ctx.fillRect(28+dx,28+dy,1,1); }
        ctx.fillStyle = '#9933ff';
        for (let dx=-9;dx<=9;dx++) for (let dy=-9;dy<=9;dy++) { const d=dx*dx+dy*dy; if(d>=64&&d<=81) ctx.fillRect(28+dx,28+dy,1,1); }
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(26, 12, 8, 14); ctx.fillRect(22, 24, 12, 6); ctx.fillRect(26, 30, 8, 14);
        ctx.fillStyle = '#cc88ff';
        ctx.fillRect(24, 24, 8, 8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(25, 25, 3, 3);
      }
    },
    coin_magnet: {
      bg: '#001a00',
      draw(ctx) {
        ctx.fillStyle = '#dd2222';
        ctx.fillRect(8, 4, 16, 32); ctx.fillRect(32, 4, 16, 32);
        for (let dx=-12;dx<=12;dx++) for (let dy=-12;dy<=12;dy++) { const d=dx*dx+dy*dy; if(d>=100&&d<=144&&dy<0) ctx.fillRect(28+dx,16+dy,1,1); }
        ctx.fillStyle = '#fff';
        ctx.fillRect(8, 36, 16, 6);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(32, 36, 16, 6);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(20, 44, 8, 8); ctx.fillRect(34, 44, 8, 8);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(22, 46, 4, 4); ctx.fillRect(36, 46, 4, 4);
      }
    },
    enchant_table: {
      bg: '#1a0028',
      draw(ctx) {
        ctx.fillStyle = '#1a0028';
        ctx.fillRect(8, 38, 40, 16);
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(4, 28, 48, 14);
        ctx.fillStyle = '#aa1111';
        ctx.fillRect(4, 28, 48, 4);
        ctx.fillStyle = '#cc9922';
        ctx.fillRect(14, 14, 12, 16); ctx.fillRect(30, 14, 12, 16);
        ctx.fillStyle = '#ffcc44';
        ctx.fillRect(24, 16, 8, 12);
        ctx.fillStyle = '#aa44ff';
        ctx.fillRect(6, 6, 4, 4); ctx.fillRect(46, 10, 4, 4); ctx.fillRect(20, 4, 4, 4); ctx.fillRect(38, 6, 4, 4);
        ctx.fillStyle = '#ff88ff';
        ctx.fillRect(8, 18, 2, 2); ctx.fillRect(46, 20, 2, 2); ctx.fillRect(12, 30, 2, 2); ctx.fillRect(44, 32, 2, 2);
      }
    },
    golden_scar: {
      bg: '#1a1400',
      draw(ctx) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(4, 24, 40, 6);
        ctx.fillStyle = '#cc9900';
        ctx.fillRect(34, 26, 12, 18); ctx.fillRect(4, 24, 8, 16);
        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(28, 26, 8, 10);
        ctx.fillStyle = '#1a1400';
        ctx.fillRect(30, 28, 4, 6);
        ctx.fillStyle = '#888800';
        ctx.fillRect(12, 16, 18, 8);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(14, 18, 14, 4);
        ctx.fillStyle = '#fff0aa';
        ctx.fillRect(6, 25, 30, 2);
        ctx.fillStyle = '#ccaa00';
        ctx.fillRect(44, 25, 8, 4); ctx.fillRect(48, 23, 4, 8);
      }
    },
    super_sneakers: {
      bg: '#001a2a',
      draw(ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(4, 28, 48, 20);
        ctx.fillStyle = '#333';
        ctx.fillRect(4, 44, 48, 8);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(18, 28, 8, 20);
        ctx.fillStyle = '#4444ff';
        ctx.fillRect(26, 28, 8, 20);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(4, 20, 8, 12); ctx.fillRect(4, 18, 6, 6); ctx.fillRect(4, 14, 4, 6);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(36, 20, 16, 12);
        ctx.fillStyle = '#888';
        for (let i=0;i<3;i++) ctx.fillRect(20, 30+i*4, 18, 2);
      }
    },
    mc_beacon: {
      bg: '#0a001a',
      draw(ctx) {
        ctx.fillStyle = '#44aaaa';
        ctx.fillRect(16, 40, 24, 8);
        ctx.fillStyle = '#888';
        ctx.fillRect(10, 44, 36, 8);
        ctx.fillStyle = '#44aaaa';
        ctx.fillRect(4, 48, 48, 8);
        ctx.fillStyle = '#88ffdd';
        ctx.fillRect(20, 30, 16, 14);
        ctx.fillStyle = '#44ccaa';
        ctx.fillRect(22, 32, 12, 10);
        ctx.fillStyle = '#88ffdd';
        ctx.fillRect(24, 4, 8, 28);
        ctx.fillStyle = '#aaffee';
        ctx.fillRect(26, 4, 4, 28);
        ctx.fillStyle = '#44ffcc';
        ctx.fillRect(20, 4, 16, 2); ctx.fillRect(18, 6, 20, 2); ctx.fillRect(16, 8, 24, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(27, 4, 2, 2);
      }
    },
    battle_bus: {
      bg: '#000a1a',
      draw(ctx) {
        ctx.fillStyle = '#1144cc';
        ctx.fillRect(4, 18, 46, 28);
        ctx.fillStyle = '#aaccff';
        ctx.fillRect(8, 22, 10, 10); ctx.fillRect(22, 22, 10, 10); ctx.fillRect(36, 22, 10, 10);
        ctx.fillStyle = '#0022aa';
        ctx.fillRect(4, 36, 46, 4);
        ctx.fillStyle = '#222';
        ctx.fillRect(8, 44, 12, 10); ctx.fillRect(34, 44, 12, 10);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(20, 8, 4, 12); ctx.fillRect(32, 8, 4, 12);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(14, 4, 10, 6); ctx.fillRect(32, 4, 10, 6);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(14, 38, 28, 4);
      }
    },
    score_x2: {
      bg: '#001a00',
      draw(ctx) {
        ctx.fillStyle = '#ffdd00';
        for (let dx=-18;dx<=18;dx++) for (let dy=-18;dy<=18;dy++) { if(dx*dx+dy*dy<=324) ctx.fillRect(28+dx,28+dy,1,1); }
        ctx.fillStyle = '#cc9900';
        for (let dx=-18;dx<=18;dx++) for (let dy=-18;dy<=18;dy++) { const d=dx*dx+dy*dy; if(d<=324&&d>=256) ctx.fillRect(28+dx,28+dy,1,1); }
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(16,20,4,4); ctx.fillRect(28,20,4,4); ctx.fillRect(20,24,4,4); ctx.fillRect(16,28,4,4); ctx.fillRect(28,28,4,4);
        ctx.fillRect(36,20,8,4); ctx.fillRect(40,24,4,4); ctx.fillRect(36,28,8,4); ctx.fillRect(36,32,4,4); ctx.fillRect(36,36,8,4);
      }
    },
    nether_portal: {
      bg: '#1a0020',
      draw(ctx) {
        ctx.fillStyle = '#1a001a';
        ctx.fillRect(6, 4, 10, 48); ctx.fillRect(40, 4, 10, 48);
        ctx.fillRect(6, 4, 44, 10); ctx.fillRect(6, 42, 44, 10);
        ctx.fillStyle = '#8800ff';
        ctx.fillRect(16, 14, 24, 28);
        ctx.fillStyle = '#aa44ff';
        ctx.fillRect(18, 16, 20, 24);
        ctx.fillStyle = '#cc88ff';
        ctx.fillRect(22, 18, 12, 20);
        ctx.fillStyle = '#fff';
        ctx.fillRect(20, 20, 2, 2); ctx.fillRect(30, 24, 2, 2); ctx.fillRect(24, 32, 2, 2);
        ctx.fillStyle = '#440088';
        ctx.fillRect(4, 4, 2, 48); ctx.fillRect(50, 4, 2, 48);
      }
    },
    fn_skin: {
      bg: '#080a1a',
      draw(ctx) {
        ctx.fillStyle = '#334466';
        ctx.fillRect(18, 18, 20, 24);
        ctx.fillStyle = '#f5c07a';
        ctx.fillRect(20, 6, 16, 14);
        ctx.fillStyle = '#111122';
        ctx.fillRect(20, 10, 16, 6);
        ctx.fillStyle = '#0044ff';
        ctx.fillRect(22, 11, 12, 4);
        ctx.fillStyle = '#6677aa';
        ctx.fillRect(18, 22, 4, 14); ctx.fillRect(34, 22, 4, 14);
        ctx.fillStyle = '#888800';
        ctx.fillRect(18, 36, 20, 4); ctx.fillRect(26, 33, 4, 6);
        ctx.fillStyle = '#223344';
        ctx.fillRect(18, 42, 8, 14); ctx.fillRect(30, 42, 8, 14);
        ctx.fillStyle = '#ff4422';
        ctx.fillRect(4, 10, 6, 20); ctx.fillRect(6, 8, 4, 6);
        ctx.fillStyle = '#ff8844';
        ctx.fillRect(5, 12, 4, 14);
      }
    },
    train_rails: {
      bg: '#0a0808',
      draw(ctx) {
        ctx.fillStyle = '#888';
        ctx.fillRect(22, 4, 4, 52); ctx.fillRect(30, 4, 4, 52);
        ctx.fillRect(12, 40, 6, 4); ctx.fillRect(38, 40, 6, 4);
        ctx.fillRect(8, 48, 6, 4);  ctx.fillRect(42, 48, 6, 4);
        ctx.fillRect(18, 24, 5, 3); ctx.fillRect(33, 24, 5, 3);
        ctx.fillRect(16, 32, 5, 3); ctx.fillRect(35, 32, 5, 3);
        ctx.fillStyle = '#6a3a10';
        for (let y=4;y<56;y+=8) { const s=Math.floor((y/56)*10); ctx.fillRect(21-s,y,14+s*2,3); }
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(24, 4, 8, 4);
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(25, 4, 6, 2);
      }
    },
    ender_dragon: {
      bg: '#0a0010',
      draw(ctx) {
        ctx.fillStyle = '#2a0040';
        ctx.fillRect(14, 12, 28, 20);
        ctx.fillStyle = '#1a0028';
        ctx.fillRect(14, 14, 28, 18);
        ctx.fillStyle = '#2a0040';
        ctx.fillRect(8, 22, 12, 10); ctx.fillRect(8, 28, 14, 4);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(18, 18, 6, 6); ctx.fillRect(32, 18, 6, 6);
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(19, 19, 3, 3); ctx.fillRect(33, 19, 3, 3);
        ctx.fillStyle = '#440060';
        ctx.fillRect(16, 4, 4, 10); ctx.fillRect(36, 4, 4, 10);
        ctx.fillRect(14, 6, 2, 6);  ctx.fillRect(42, 6, 2, 6);
        ctx.fillStyle = '#1a0030';
        ctx.fillRect(2, 16, 12, 24); ctx.fillRect(42, 16, 12, 24);
        ctx.fillStyle = '#3a0060';
        ctx.fillRect(4, 20, 8, 4); ctx.fillRect(44, 20, 8, 4);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(4, 22, 6, 8);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(2, 24, 4, 4);
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(6, 20, 4, 12);
      }
    },
    god_mode: {
      bg: '#1a1400',
      draw(ctx) {
        ctx.fillStyle = '#ffdd00';
        for (let dx=-16;dx<=16;dx++) for (let dy=-16;dy<=16;dy++) { const d=dx*dx+dy*dy; if(d>=196&&d<=256) ctx.fillRect(28+dx,16+dy,1,1); }
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(22, 18, 12, 10); ctx.fillRect(18, 28, 20, 16);
        ctx.fillRect(14, 28, 6, 14); ctx.fillRect(36, 28, 6, 14);
        ctx.fillRect(20, 44, 8, 12); ctx.fillRect(28, 44, 8, 12);
        ctx.fillStyle = '#fff0aa';
        ctx.fillRect(24, 20, 8, 6); ctx.fillRect(22, 30, 12, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(6, 8, 4, 4); ctx.fillRect(46, 10, 4, 4); ctx.fillRect(8, 40, 4, 4); ctx.fillRect(44, 36, 4, 4);
        ctx.fillRect(10, 22, 2, 2); ctx.fillRect(44, 24, 2, 2);
        ctx.fillStyle = '#ffffcc';
        ctx.fillRect(25, 21, 6, 4);
      }
    },
    subway_pass: {
      bg: '#001a2a',
      draw(ctx) {
        // subway card
        ctx.fillStyle = '#1166cc'; ctx.fillRect(8, 16, 40, 26);
        ctx.fillStyle = '#0044aa'; ctx.fillRect(8, 16, 40, 8);
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(12, 20, 18, 4);
        ctx.fillStyle = '#fff'; ctx.fillRect(12, 28, 28, 3); ctx.fillRect(12, 33, 20, 3);
        // chip
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(32, 27, 10, 8);
        ctx.fillStyle = '#cc9900'; ctx.fillRect(34, 29, 6, 4);
        // tap symbol
        ctx.fillStyle = '#88ccff'; ctx.fillRect(42, 10, 6, 6); ctx.fillRect(44, 8, 2, 10); ctx.fillRect(42, 8, 6, 2);
      }
    },
    double_cheeseburger: {
      bg: '#1a0800',
      draw(ctx) {
        // bun top
        ctx.fillStyle = '#c87020'; ctx.fillRect(10, 8, 36, 10);
        ctx.fillStyle = '#e89040'; ctx.fillRect(12, 6, 32, 6);
        ctx.fillStyle = '#f0a850'; ctx.fillRect(14, 4, 28, 4);
        // sesame seeds
        ctx.fillStyle = '#fff8e0'; ctx.fillRect(18, 5, 3, 2); ctx.fillRect(28, 4, 3, 2); ctx.fillRect(36, 6, 3, 2);
        // cheese 1
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(8, 18, 40, 4);
        // patty 1
        ctx.fillStyle = '#5a2a08'; ctx.fillRect(10, 22, 36, 6);
        ctx.fillStyle = '#7a3a10'; ctx.fillRect(12, 23, 32, 4);
        // cheese 2
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(8, 28, 40, 4);
        // patty 2
        ctx.fillStyle = '#5a2a08'; ctx.fillRect(10, 32, 36, 6);
        ctx.fillStyle = '#7a3a10'; ctx.fillRect(12, 33, 32, 4);
        // lettuce
        ctx.fillStyle = '#30a020'; ctx.fillRect(8, 38, 40, 4);
        // bun bottom
        ctx.fillStyle = '#c87020'; ctx.fillRect(10, 42, 36, 8);
      }
    },
    fat_underground: {
      bg: '#0a0a1a',
      draw(ctx) {
        // tunnel
        ctx.fillStyle = '#333'; ctx.fillRect(4, 20, 48, 30);
        ctx.fillStyle = '#555'; ctx.fillRect(6, 22, 44, 26);
        // fat aaron peeking in
        ctx.fillStyle = '#cc5500'; ctx.fillRect(14, 24, 28, 22);
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(18, 20, 20, 14);
        ctx.fillStyle = '#3a1a00'; ctx.fillRect(18, 20, 20, 4);
        ctx.fillStyle = '#1a0a2e'; ctx.fillRect(22, 26, 3, 3); ctx.fillRect(31, 26, 3, 3);
        // train windows
        ctx.fillStyle = '#88ccff'; ctx.fillRect(8, 28, 8, 6); ctx.fillRect(40, 28, 8, 6);
        // rails
        ctx.fillStyle = '#888'; ctx.fillRect(4, 48, 48, 3);
        ctx.fillStyle = '#666'; ctx.fillRect(4, 50, 48, 2);
        ctx.fillStyle = '#888'; ctx.fillRect(10, 45, 4, 7); ctx.fillRect(22, 45, 4, 7); ctx.fillRect(34, 45, 4, 7);
      }
    },
    buffet_mode: {
      bg: '#1a0a00',
      draw(ctx) {
        // long buffet table
        ctx.fillStyle = '#8b4513'; ctx.fillRect(4, 36, 48, 8);
        ctx.fillStyle = '#a0522d'; ctx.fillRect(4, 34, 48, 4);
        // trays of food
        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(6, 28, 12, 8); ctx.fillRect(22, 28, 12, 8); ctx.fillRect(38, 28, 12, 8);
        ctx.fillStyle = '#ff6622'; ctx.fillRect(8, 29, 8, 6);
        ctx.fillStyle = '#22aa22'; ctx.fillRect(24, 29, 8, 6);
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(40, 29, 8, 6);
        // fat aaron plate stacked
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(20, 10, 16, 14);
        ctx.fillStyle = '#3a1a00'; ctx.fillRect(20, 10, 16, 4);
        ctx.fillStyle = '#cc5500'; ctx.fillRect(16, 20, 24, 10);
        ctx.fillStyle = '#1a0a2e'; ctx.fillRect(24, 15, 3, 3); ctx.fillRect(29, 15, 3, 3);
      }
    },
    express_train: {
      bg: '#001010',
      draw(ctx) {
        // train body
        ctx.fillStyle = '#cc2200'; ctx.fillRect(4, 18, 48, 24);
        ctx.fillStyle = '#ff4422'; ctx.fillRect(4, 18, 48, 8);
        ctx.fillStyle = '#880000'; ctx.fillRect(4, 38, 48, 4);
        // nose
        ctx.fillStyle = '#ff4422'; ctx.fillRect(48, 22, 4, 12);
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(50, 26, 4, 4);
        // windows
        ctx.fillStyle = '#88ddff'; ctx.fillRect(8, 20, 10, 8); ctx.fillRect(22, 20, 10, 8); ctx.fillRect(36, 20, 10, 8);
        ctx.fillStyle = '#44aacc'; ctx.fillRect(8, 20, 10, 3); ctx.fillRect(22, 20, 10, 3); ctx.fillRect(36, 20, 10, 3);
        // wheels
        ctx.fillStyle = '#333'; ctx.fillRect(8, 42, 10, 8); ctx.fillRect(24, 42, 10, 8); ctx.fillRect(38, 42, 10, 8);
        ctx.fillStyle = '#888'; ctx.fillRect(10, 44, 6, 4); ctx.fillRect(26, 44, 6, 4); ctx.fillRect(40, 44, 6, 4);
        // tracks
        ctx.fillStyle = '#555'; ctx.fillRect(0, 50, 56, 4);
      }
    },
    aaron_supersized: {
      bg: '#0a0808',
      draw(ctx) {
        // SUPER fat aaron
        ctx.fillStyle = '#cc4400'; ctx.fillRect(6, 22, 44, 32);
        ctx.fillStyle = '#ee6622'; ctx.fillRect(10, 26, 36, 24);
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(16, 8, 24, 18);
        ctx.fillStyle = '#3a1a00'; ctx.fillRect(16, 8, 24, 6);
        ctx.fillStyle = '#1a0a2e'; ctx.fillRect(20, 16, 4, 4); ctx.fillRect(32, 16, 4, 4);
        // giant belly button
        ctx.fillStyle = '#aa3300'; ctx.fillRect(26, 38, 4, 4);
        // tiny legs
        ctx.fillStyle = '#2244aa'; ctx.fillRect(14, 54, 12, 2); ctx.fillRect(30, 54, 12, 2);
        // fries poking out
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(44, 14, 4, 12); ctx.fillRect(46, 12, 2, 14); ctx.fillRect(48, 16, 2, 10);
        ctx.fillStyle = '#cc0000'; ctx.fillRect(42, 24, 8, 4);
      }
    },
    subway_empire: {
      bg: '#000a00',
      draw(ctx) {
        // map of subway lines
        ctx.fillStyle = '#222'; ctx.fillRect(4, 4, 48, 48);
        // lines
        ctx.fillStyle = '#cc2200'; ctx.fillRect(8, 16, 40, 4);
        ctx.fillStyle = '#2244cc'; ctx.fillRect(8, 24, 40, 4);
        ctx.fillStyle = '#22aa22'; ctx.fillRect(8, 32, 40, 4);
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(8, 40, 40, 4);
        // stations (dots)
        ctx.fillStyle = '#fff';
        [16,28,40].forEach(x => {
          [16,24,32,40].forEach(y => {
            ctx.fillRect(x-2, y, 4, 4);
          });
        });
        // fat aaron conductor hat peeking
        ctx.fillStyle = '#111'; ctx.fillRect(22, 4, 12, 8);
        ctx.fillStyle = '#333'; ctx.fillRect(20, 10, 16, 4);
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(22, 6, 12, 6);
      }
    },
    food_coma: {
      bg: '#0a0005',
      draw(ctx) {
        // fat aaron passed out on pile of food
        ctx.fillStyle = '#cc5500'; ctx.fillRect(8, 28, 40, 26);
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(14, 16, 22, 16);
        ctx.fillStyle = '#3a1a00'; ctx.fillRect(14, 16, 22, 5);
        // X eyes = knocked out
        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(18, 22, 2, 2); ctx.fillRect(22, 22, 2, 2);
        ctx.fillRect(18, 24, 2, 2); ctx.fillRect(22, 24, 2, 2);
        ctx.fillRect(30, 22, 2, 2); ctx.fillRect(34, 22, 2, 2);
        ctx.fillRect(30, 24, 2, 2); ctx.fillRect(34, 24, 2, 2);
        // zzz
        ctx.fillStyle = '#aaaaff'; ctx.fillRect(38, 10, 6, 2); ctx.fillRect(40, 12, 6, 2); ctx.fillRect(38, 14, 8, 2);
        ctx.fillRect(44, 4, 4, 2); ctx.fillRect(46, 6, 4, 2); ctx.fillRect(44, 8, 6, 2);
        // food pile
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(4, 48, 20, 6);
        ctx.fillStyle = '#c87020'; ctx.fillRect(24, 46, 18, 8);
        ctx.fillStyle = '#ff4422'; ctx.fillRect(4, 44, 10, 6);
      }
    },
    conductor: {
      bg: '#060010',
      draw(ctx) {
        // conductor fat aaron
        ctx.fillStyle = '#1a3399'; ctx.fillRect(12, 24, 32, 28);
        ctx.fillStyle = '#2244cc'; ctx.fillRect(14, 26, 28, 24);
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(16, 10, 24, 18);
        ctx.fillStyle = '#111111'; ctx.fillRect(14, 6, 28, 10);
        ctx.fillStyle = '#333333'; ctx.fillRect(12, 14, 32, 4);
        ctx.fillStyle = '#ffdd00'; ctx.fillRect(14, 8, 8, 4); ctx.fillRect(20, 36, 16, 4);
        ctx.fillStyle = '#1a0a2e'; ctx.fillRect(20, 16, 4, 4); ctx.fillRect(32, 16, 4, 4);
        // whistle
        ctx.fillStyle = '#cc9900'; ctx.fillRect(40, 22, 10, 4);
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(46, 20, 6, 8);
        // ticket
        ctx.fillStyle = '#fff'; ctx.fillRect(6, 30, 10, 6);
        ctx.fillStyle = '#cc2200'; ctx.fillRect(8, 32, 6, 2);
      }
    },
    ayce: {
      bg: '#100a00',
      draw(ctx) {
        // all you can eat sign
        ctx.fillStyle = '#cc2200'; ctx.fillRect(4, 4, 48, 16);
        ctx.fillStyle = '#ff4422'; ctx.fillRect(6, 6, 44, 12);
        ctx.fillStyle = '#ffdd00';
        // A Y C E lettering (simple blocks)
        ctx.fillRect(8,8,2,8); ctx.fillRect(12,8,2,8); ctx.fillRect(8,12,6,2);  // A
        ctx.fillRect(16,8,2,4); ctx.fillRect(20,8,2,4); ctx.fillRect(17,12,4,4); // Y
        ctx.fillRect(24,8,4,2); ctx.fillRect(24,8,2,8); ctx.fillRect(24,14,4,2); // C
        ctx.fillRect(30,8,2,8); ctx.fillRect(32,8,4,2); ctx.fillRect(36,12,2,4); ctx.fillRect(30,14,6,2); // E
        // heaped plates
        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(4, 24, 14, 4); ctx.fillRect(20, 22, 14, 4); ctx.fillRect(36, 24, 14, 4);
        ctx.fillStyle = '#ff8844'; ctx.fillRect(6, 18, 10, 8);
        ctx.fillStyle = '#33cc33'; ctx.fillRect(22, 16, 10, 8);
        ctx.fillStyle = '#ffcc44'; ctx.fillRect(38, 18, 10, 8);
        // fat aaron hand reaching
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(22, 28, 12, 6); ctx.fillRect(26, 30, 20, 4);
        ctx.fillStyle = '#cc5500'; ctx.fillRect(20, 34, 16, 16);
      }
    },
    infinite_rails: {
      bg: '#000810',
      draw(ctx) {
        // perspective rails vanishing
        ctx.fillStyle = '#888'; ctx.fillRect(24, 8, 4, 6);
        ctx.fillRect(20, 14, 12, 4); ctx.fillRect(16, 20, 20, 4); ctx.fillRect(10, 28, 32, 5); ctx.fillRect(4, 36, 48, 6);
        ctx.fillRect(0, 44, 56, 10);
        // rail lines
        ctx.fillStyle = '#bbb';
        ctx.fillRect(26, 8, 2, 46); // center
        // cross ties perspective
        ctx.fillStyle = '#664422';
        [10, 18, 26, 34, 42].forEach((y, i) => {
          const w = 6 + i * 8;
          ctx.fillRect(28 - w/2, y, w, 3);
        });
        // glowing end of track
        ctx.fillStyle = '#44aaff'; ctx.fillRect(22, 4, 8, 6);
        ctx.fillStyle = '#88ddff'; ctx.fillRect(24, 2, 4, 4);
      }
    },
    fat_army: {
      bg: '#080012',
      draw(ctx) {
        // 3 fat aarons marching
        const drawFat = (x) => {
          ctx.fillStyle = '#cc5500'; ctx.fillRect(x, 28, 14, 20);
          ctx.fillStyle = '#f5c07a'; ctx.fillRect(x+2, 18, 10, 12);
          ctx.fillStyle = '#3a1a00'; ctx.fillRect(x+2, 18, 10, 3);
          ctx.fillStyle = '#1a0a2e'; ctx.fillRect(x+4, 22, 2, 2); ctx.fillRect(x+8, 22, 2, 2);
          ctx.fillStyle = '#2244aa'; ctx.fillRect(x+2, 48, 4, 6); ctx.fillRect(x+8, 48, 4, 6);
        };
        drawFat(4); drawFat(21); drawFat(38);
        // crowns
        ctx.fillStyle = '#ffcc00';
        [4,21,38].forEach(x => {
          ctx.fillRect(x+2, 14, 10, 4);
          ctx.fillRect(x+2, 12, 2, 4); ctx.fillRect(x+6, 10, 2, 4); ctx.fillRect(x+10, 12, 2, 4);
        });
      }
    },
    global_subway: {
      bg: '#000508',
      draw(ctx) {
        // globe
        ctx.fillStyle = '#1144aa'; ctx.fillRect(8, 8, 40, 40);
        // continents
        ctx.fillStyle = '#22aa44'; ctx.fillRect(10, 14, 14, 10); ctx.fillRect(28, 12, 16, 12);
        ctx.fillRect(12, 28, 10, 10); ctx.fillRect(32, 26, 14, 12);
        // subway lines across globe
        ctx.fillStyle = '#ff4422'; ctx.fillRect(8, 22, 40, 3);
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(8, 30, 40, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(22, 8, 3, 40); // prime meridian
        // orbit ring
        ctx.fillStyle = '#88ccff'; ctx.fillRect(4, 27, 48, 2);
        // station dots on globe
        ctx.fillStyle = '#fff'; ctx.fillRect(14,21,3,5); ctx.fillRect(30,21,3,5); ctx.fillRect(22,29,3,5);
      }
    },
    aarons_feast: {
      bg: '#0a0500',
      draw(ctx) {
        // giant turkey / feast spread
        ctx.fillStyle = '#8b4513'; ctx.fillRect(8, 28, 40, 8);  // table edge
        ctx.fillStyle = '#a0522d'; ctx.fillRect(6, 24, 44, 6);
        // turkey
        ctx.fillStyle = '#c87020'; ctx.fillRect(18, 12, 20, 16);
        ctx.fillStyle = '#e89040'; ctx.fillRect(20, 10, 16, 6);
        ctx.fillRect(16, 18, 24, 8);
        // drumstick
        ctx.fillStyle = '#c87020'; ctx.fillRect(10, 22, 10, 6); ctx.fillRect(8, 20, 6, 10);
        ctx.fillStyle = '#fff'; ctx.fillRect(6, 18, 4, 4);
        ctx.fillRect(38, 22, 10, 6); ctx.fillRect(46, 20, 6, 10);
        ctx.fillStyle = '#fff'; ctx.fillRect(48, 18, 4, 4);
        // plates
        ctx.fillStyle = '#ddd'; ctx.fillRect(4, 34, 12, 4); ctx.fillRect(40, 34, 12, 4);
        ctx.fillStyle = '#ff8844'; ctx.fillRect(6, 34, 8, 3);
        ctx.fillStyle = '#33cc33'; ctx.fillRect(42, 34, 8, 3);
        // fat aaron eating
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(20, 4, 16, 10);
        ctx.fillStyle = '#3a1a00'; ctx.fillRect(20, 4, 16, 3);
        ctx.fillStyle = '#1a0a2e'; ctx.fillRect(24, 8, 3, 2); ctx.fillRect(29, 8, 3, 2);
      }
    },
    god_gluttony: {
      bg: '#0a0000',
      draw(ctx) {
        // giant glowing fat aaron on a throne
        ctx.fillStyle = '#440000'; ctx.fillRect(6, 36, 44, 18); // throne
        ctx.fillStyle = '#660000'; ctx.fillRect(8, 24, 8, 30); ctx.fillRect(40, 24, 8, 30);
        ctx.fillStyle = '#880000'; ctx.fillRect(6, 22, 10, 6); ctx.fillRect(40, 22, 10, 6);
        // gold trim
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(6, 36, 44, 2); ctx.fillRect(6, 50, 44, 2);
        ctx.fillRect(8, 22, 2, 32); ctx.fillRect(46, 22, 2, 32);
        // massive fat aaron
        ctx.fillStyle = '#ff6600'; ctx.fillRect(14, 26, 28, 26);
        ctx.fillStyle = '#ff8833'; ctx.fillRect(16, 28, 24, 22);
        ctx.fillStyle = '#f5c07a'; ctx.fillRect(18, 10, 20, 18);
        ctx.fillStyle = '#3a1a00'; ctx.fillRect(18, 10, 20, 5);
        ctx.fillStyle = '#1a0a2e'; ctx.fillRect(22, 18, 4, 4); ctx.fillRect(30, 18, 4, 4);
        // halo
        ctx.fillStyle = '#ffee00';
        for (let dx=-12;dx<=12;dx++) for (let dy=-12;dy<=12;dy++) { const d=dx*dx+dy*dy; if(d>=100&&d<=144) ctx.fillRect(28+dx,6+dy,1,1); }
        // food offerings
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(4, 44, 8, 6);
        ctx.fillStyle = '#ff4422'; ctx.fillRect(44, 44, 8, 6);
      }
    },
  };

  const icon = icons[id];
  if (!icon) return null;

  ctx.fillStyle = icon.bg;
  ctx.fillRect(0, 0, 56, 56);
  icon.draw(ctx);

  return canvas.toDataURL();
}

// cache icon data URLs so we don't redraw per orbit icon
const iconCache = {};
function getIconSrc(id) {
  if (!iconCache[id]) iconCache[id] = makeUpgradeIcon(id);
  return iconCache[id];
}

// ── UPGRADE DEFINITIONS ───────────────────────────────────────────────────────
const UPGRADES = [
  {
    id:       'gay',
    name:     'Gay Upgrade',
    desc:     'Rainbow power! Aaron struts with extra pride.',
    baseCost: 15,
    baseEps:  1,
    costMult: 1.15,
    epsGrowth: 0.02,
  },
  {
    id:       'subway',
    name:     'Subway Run',
    desc:     'Send Aaron for a $5 footlong. Earns aarons fast.',
    baseCost: 100,
    baseEps:  1,
    costMult: 1.15,
  },
  {
    id:       'brody',
    name:     'Brody Upgrade',
    desc:     'Brody shows up and handles half the aarons.',
    baseCost: 500,
    baseEps:  2,
    costMult: 1.15,
  },
  {
    id:       'fat',
    name:     'Fat Aaron',
    desc:     'Aaron eats too much and somehow earns more aarons.',
    baseCost: 1200,
    baseEps:  5,
    costMult: 1.15,
  },
  {
    id:       'coffee',
    name:     'Coffee Break',
    desc:     'Aaron chugs espresso. Triple aaron speed.',
    baseCost: 2000,
    baseEps:  8,
    costMult: 1.15,
  },
  {
    id:       'bike',
    name:     'Aaron Bike',
    desc:     'Aaron zooms across town on a pixel bike.',
    baseCost: 8000,
    baseEps:  25,
    costMult: 1.15,
  },
  {
    id:       'furrypregnancydelivery',
    name:     'Furry Pregnancy Delivery',
    desc:     'Aaron delivers bundles of joy to furry families everywhere.',
    baseCost: 30000,
    baseEps:  80,
    costMult: 1.15,
  },
  {
    id:         'keyboard',
    name:       'Keyboard Frenzy',
    desc:       'Aaron mashes shortcuts. Each one adds +1 Aaron per click.',
    baseCost:   90000,
    baseEps:    180,
    clickPower: 1,
    costMult:   1.14,
  },
  {
    id:       'megaphone',
    name:     'Aaron Hype Squad',
    desc:     'The crowd chants Aaron until production gets ridiculous.',
    baseCost: 250000,
    baseEps:  420,
    costMult: 1.14,
  },
  {
    id:       'lab',
    name:     'Aaron Lab',
    desc:     'Questionable science finds a better way to make aarons.',
    baseCost: 1000000,
    baseEps:  1200,
    costMult: 1.13,
  },
  {
    id:       'rocket',
    name:     'Aaron Rocket',
    desc:     'Send Aaron to orbit and bring back cosmic aaron power.',
    baseCost: 7500000,
    baseEps:  5500,
    costMult: 1.12,
  },
  {
    id:         'mc_pickaxe',
    name:       'Diamond Pickaxe',
    desc:       'Mine faster. Each swing chips +2 Aarons per click.',
    baseCost:   30000000,
    baseEps:    0,
    clickPower: 2,
    costMult:   1.13,
  },
  {
    id:       'fn_builder',
    name:     'Fortnite Builder',
    desc:     'Build walls and farm mats. Structures rain Aarons.',
    baseCost: 80000000,
    baseEps:  15000,
    costMult: 1.13,
  },
  {
    id:         'hoverboard',
    name:       'Hoverboard',
    desc:       'Grind the rails of Aaron city. +4 Aarons per click.',
    baseCost:   200000000,
    baseEps:    0,
    clickPower: 4,
    costMult:   1.13,
  },
  {
    id:       'creeper',
    name:     'Creeper Swarm',
    desc:     'Creepers explode in Aaron factories 24/7.',
    baseCost: 500000000,
    baseEps:  40000,
    costMult: 1.13,
  },
  {
    id:         'fn_llama',
    name:       'Loot Llama',
    desc:       'Crack it open for +8 Aarons every click.',
    baseCost:   1500000000,
    baseEps:    0,
    clickPower: 8,
    costMult:   1.12,
  },
  {
    id:       'jetpack',
    name:     'Jetpack',
    desc:     'Aaron soars through Aaron clouds collecting passive income.',
    baseCost: 4000000000,
    baseEps:  100000,
    costMult: 1.12,
  },
  {
    id:         'diamond_armor',
    name:       'Diamond Armor',
    desc:       'Full prot IV set. Survive longer, click harder. +20/click.',
    baseCost:   12000000000,
    baseEps:    0,
    clickPower: 20,
    costMult:   1.12,
  },
  {
    id:       'fn_storm',
    name:     'The Storm',
    desc:     'The storm eye spawns Aarons as it shrinks.',
    baseCost: 35000000000,
    baseEps:  250000,
    costMult: 1.12,
  },
  {
    id:         'coin_magnet',
    name:       'Coin Magnet',
    desc:       'Suck up every Aaron on screen. +50 per click.',
    baseCost:   100000000000,
    baseEps:    0,
    clickPower: 50,
    costMult:   1.11,
  },
  {
    id:       'enchant_table',
    name:     'Enchantment Table',
    desc:     'Fortune III on everything. Aarons multiply by the bookshelf.',
    baseCost: 300000000000,
    baseEps:  600000,
    costMult: 1.11,
  },
  {
    id:         'golden_scar',
    name:       'Golden SCAR',
    desc:       'Legendary rarity. Each shot earns +120 Aarons per click.',
    baseCost:   1000000000000,
    baseEps:    0,
    clickPower: 120,
    costMult:   1.11,
  },
  {
    id:       'super_sneakers',
    name:     'Super Sneakers',
    desc:     'Winged kicks let Aaron run over passive Aaron rivers.',
    baseCost: 3000000000000,
    baseEps:  1500000,
    costMult: 1.11,
  },
  {
    id:         'mc_beacon',
    name:       'Beacon',
    desc:       'Haste II beam charges every click for +280 Aarons.',
    baseCost:   10000000000000,
    baseEps:    0,
    clickPower: 280,
    costMult:   1.10,
  },
  {
    id:       'battle_bus',
    name:     'Battle Bus',
    desc:     'Drops 100 Aarons every second. Honk honk.',
    baseCost: 30000000000000,
    baseEps:  4000000,
    costMult: 1.10,
  },
  {
    id:         'score_x2',
    name:       'Score Doubler',
    desc:       'X2 coin doubles every click. +650 per tap.',
    baseCost:   100000000000000,
    baseEps:    0,
    clickPower: 650,
    costMult:   1.10,
  },
  {
    id:       'nether_portal',
    name:     'Nether Portal',
    desc:     'Piglin trades generate Aarons at volcanic speed.',
    baseCost: 300000000000000,
    baseEps:  10000000,
    costMult: 1.10,
  },
  {
    id:         'fn_skin',
    name:       'Legendary Skin',
    desc:       'Looking this good earns respect — and +1500 per click.',
    baseCost:   1000000000000000,
    baseEps:    0,
    clickPower: 1500,
    costMult:   1.09,
  },
  {
    id:       'train_rails',
    name:     'Subway Rails',
    desc:     'Infinite track, infinite Aarons rolling in.',
    baseCost: 3000000000000000,
    baseEps:  25000000,
    costMult: 1.09,
  },
  {
    id:         'ender_dragon',
    name:       'Ender Dragon',
    desc:       'The End boss works for Aaron now. +3500 per click.',
    baseCost:   10000000000000000,
    baseEps:    0,
    clickPower: 3500,
    costMult:   1.09,
  },
  {
    id:       'god_mode',
    name:     'God Mode',
    desc:     'Aaron ascends. Reality itself produces Aarons.',
    baseCost: 30000000000000000,
    baseEps:  65000000,
    costMult: 1.09,
  },
  {
    id:       'subway_pass',
    name:     'Subway Pass',
    desc:     'Unlimited rides. Aaron tunnels through the city non-stop.',
    baseCost: 2e21,
    baseEps:  80000000,
    costMult: 1.09,
  },
  {
    id:         'double_cheeseburger',
    name:       'Double Cheeseburger',
    desc:       'Two patties, two cheeses, double the clicking power.',
    baseCost:   5e22,
    baseEps:    0,
    clickPower: 8000,
    costMult:   1.09,
  },
  {
    id:       'fat_underground',
    name:     'Fat Underground',
    desc:     'Fat Aaron runs a secret subway beneath the city.',
    baseCost: 8e24,
    baseEps:  200000000,
    costMult: 1.09,
  },
  {
    id:         'buffet_mode',
    name:       'Buffet Mode',
    desc:       'Unlimited plates. Each trip to the buffet clicks twice as hard.',
    baseCost:   3e26,
    baseEps:    0,
    clickPower: 20000,
    costMult:   1.09,
  },
  {
    id:       'express_train',
    name:     'Express Train',
    desc:     'Non-stop Aaron Express — no stops, all income.',
    baseCost: 1e28,
    baseEps:  500000000,
    costMult: 1.09,
  },
  {
    id:         'aaron_supersized',
    name:       'Aaron Supersized',
    desc:       'Supersized order, supersized clicks. +80K per click.',
    baseCost:   5e30,
    baseEps:    0,
    clickPower: 80000,
    costMult:   1.09,
  },
  {
    id:       'subway_empire',
    name:     'Subway Empire',
    desc:     'Aaron owns every line on the map. Passive income across the grid.',
    baseCost: 2e33,
    baseEps:  2000000000,
    costMult: 1.08,
  },
  {
    id:         'food_coma',
    name:       'Food Coma',
    desc:       'Aaron eats so much he dreams of clicking. +250K per click.',
    baseCost:   1.3e37,
    baseEps:    0,
    clickPower: 250000,
    costMult:   1.08,
  },
  {
    id:       'conductor',
    name:     'Aaron Conductor',
    desc:     'Fat Aaron blows the whistle. Every train car drips Aarons.',
    baseCost: 8e39,
    baseEps:  5000000000,
    costMult: 1.08,
  },
  {
    id:         'ayce',
    name:       'All You Can Eat',
    desc:       'The buffet never closes. Each trip earns +800K per click.',
    baseCost:   4e42,
    baseEps:    0,
    clickPower: 800000,
    costMult:   1.08,
  },
  {
    id:       'infinite_rails',
    name:     'Infinite Rails',
    desc:     'The subway loops forever, generating Aarons at every turn.',
    baseCost: 2e45,
    baseEps:  15000000000,
    costMult: 1.08,
  },
  {
    id:         'fat_army',
    name:       'Fat Aaron Army',
    desc:       'An army of crowned Fat Aarons marches for you. +3M per click.',
    baseCost:   1e48,
    baseEps:    0,
    clickPower: 3000000,
    costMult:   1.07,
  },
  {
    id:       'global_subway',
    name:     'Global Subway',
    desc:     'Aaron lines cross every continent. The whole world generates Aarons.',
    baseCost: 5e51,
    baseEps:  50000000000,
    costMult: 1.07,
  },
  {
    id:         'aarons_feast',
    name:       "Aaron's Feast",
    desc:       'A divine spread. Aaron feasts and every bite is +12M per click.',
    baseCost:   3e57,
    baseEps:    0,
    clickPower: 12000000,
    costMult:   1.07,
  },
  {
    id:       'god_gluttony',
    name:     'God of Gluttony',
    desc:     'Fat Aaron ascends to divinity on a throne of food. Aarons flow without end.',
    baseCost: 2e66,
    baseEps:  200000000000,
    costMult: 1.07,
  },
];

// ── GAME STATE ────────────────────────────────────────────────────────────────
const state = {
  aarons:      0,
  totalEarned: 0,
  clicks:      0,
  aps:         0,
  owned:       {},
  costs:       {},
  achievements: {},
  cards: {},
  minigames: {
    whackPlays: 0,
    whackHits: 0,
    whackBest: 0,
    matchWins: 0,
    matchPairs: 0,
    slotsPlays: 0,
    slotsWins: 0,
    slotsJackpots: 0,
    slotsStreak: 0,
    slotsBestStreak: 0,
    achievementClicks: 0,
    cratesPlays: 0,
    cratesWins: 0,
    cratesBombHits: 0,
    cratesAllClears: 0,
    followPlays: 0,
    followPerfect: 0,
    brokeClicks: 0,
    cardPacks: 0,
    nextAd: 0,
    adPending: false,
    adCurrentIdx: 0,
    adRewardBet: 0,
  },
};

UPGRADES.forEach(u => {
  state.owned[u.id] = 0;
  state.costs[u.id] = u.baseCost;
});

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const aaronCountEl   = document.getElementById('aaron-count');
const aaronRateEl    = document.getElementById('aaron-rate');
const appVersionEl   = document.getElementById('app-version');
const manualRateEl   = document.getElementById('manual-rate');
const upgradeList    = document.getElementById('upgrade-list');
const achievementSummary = document.getElementById('achievement-summary');
const achievementList = document.getElementById('achievement-list');
const bulkBtns = document.getElementById('bulk-btns');
const clickerWrapper = document.getElementById('clicker-wrapper');
const swayWrapper    = document.getElementById('sway-wrapper');
const orbitContainer = document.getElementById('orbit-container');
const clickFlash     = document.getElementById('click-flash');
const fallbackCanvas = document.getElementById('aaron-fallback');
const whackField = document.getElementById('whack-field');
const whackStartBtn = document.getElementById('whack-start');
const whackScoreEl = document.getElementById('whack-score');
const whackTimeEl = document.getElementById('whack-time');
const matchBoard = document.getElementById('match-board');
const matchStatusEl = document.getElementById('match-status');
const matchRewardEl = document.getElementById('match-reward');
const matchNewBtn = document.getElementById('match-new');

// ── CLICK SOUND ───────────────────────────────────────────────────────────────
// keep one decoded source; clone it per-click so sounds overlap freely
const SFX = 'sound effects/';
const clickAudioSrc    = new Audio(SFX + 'ClickSound.MP3');
const happyAudioSrc    = new Audio(SFX + 'Happy.MP3');
const upgradeAudioSrc  = new Audio(SFX + 'upgrade.MP3');
const jackpotAudioSrc  = new Audio(SFX + 'i-just-hit-the-jackpot.mp3');
const screamAudioSrc   = new Audio(SFX + 'aaron scream.mp3');
const partyAudioSrc       = new Audio(SFX + 'party.mp3');
const achievementAudioSrc = new Audio(SFX + 'Achievment.mp3');
const secretAudioSrc      = new Audio(SFX + 'secret.mp3');
const dingAudioSrc        = new Audio(SFX + 'ding-sound-effect_1.mp3');
const yoshiAudioSrc       = new Audio(SFX + 'yoshi-tongue.mp3');
const perfectAudioSrc     = new Audio(SFX + 'perfect.mp3');
const robloxWinAudioSrc   = new Audio(SFX + 'roblox-old-winning-sound-effect.mp3');

let footlongMusic  = null;
let isMuted        = false;
let isMusicMuted   = false;
let diddyModeEnd   = 0;

const MUSIC_VOL = 0.05;

function applyMusicVolume() {
  if (!footlongMusic) return;
  footlongMusic.volume = (isMuted || isMusicMuted) ? 0 : MUSIC_VOL;
}

function toggleMusicMute() {
  isMusicMuted = !isMusicMuted;
  const btn = document.getElementById('music-btn');
  if (btn) {
    btn.textContent = isMusicMuted ? '[ MUS OFF ]' : '[ MUS ]';
    btn.classList.toggle('muted', isMusicMuted);
  }
  applyMusicVolume();
  localStorage.setItem('aaronclicker_musicmute', isMusicMuted ? '1' : '0');
}

function startFootlongMusic() {
  if (!footlongMusic) {
    footlongMusic = new Audio(SFX + 'Footlong Aaron(1).mp3');
    footlongMusic.loop = true;
  }
  applyMusicVolume();
  footlongMusic.play().catch(() => {});
}

function startFootlongMusicIfAllAchievements() {
  if (!ACHIEVEMENTS.every(a => state.achievements[a.id])) return;
  startFootlongMusic();
  document.addEventListener('click', startFootlongMusic, { once: true });
}

function playClickSound() {
  if (isMuted) return;
  clickAudioSrc.cloneNode().play().catch(() => {});
}

// ── FALLBACK SPRITE ───────────────────────────────────────────────────────────
function stopAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}

drawFallbackAaron(fallbackCanvas);

// ── BUILD UPGRADE CARDS ───────────────────────────────────────────────────────
function buildUpgradeCards() {
  upgradeList.innerHTML = '';
  UPGRADES.forEach(u => {
    const card = document.createElement('div');
    card.className = 'upgrade-card locked';
    card.id = 'card-' + u.id;

    const img = document.createElement('img');
    img.className = 'upgrade-icon';
    img.src = getIconSrc(u.id) || '';

    const info = document.createElement('div');
    info.className = 'upgrade-info';

    const name = document.createElement('div');
    name.className = 'upgrade-name';
    name.textContent = u.name;

    const desc = document.createElement('div');
    desc.className = 'upgrade-desc';
    desc.textContent = u.desc;

    const statsRow = document.createElement('div');
    statsRow.className = 'upgrade-stats';

    const cost = document.createElement('div');
    cost.className = 'upgrade-cost';
    cost.id = 'cost-' + u.id;

    const owned = document.createElement('div');
    owned.className = 'upgrade-owned';
    owned.id = 'owned-' + u.id;
    owned.textContent = 'x0';

    const epsEl = document.createElement('div');
    epsEl.className = 'upgrade-eps';
    epsEl.textContent = u.clickPower
      ? '+' + u.clickPower + '/click each'
      : '+' + u.baseEps + '/s each';

    statsRow.append(cost, owned, epsEl);
    info.append(name, desc, statsRow);
    card.append(img, info);

    card.addEventListener('click', () => buyUpgrade(u.id));
    upgradeList.appendChild(card);
  });
}

// ── FORMAT NUMBERS ────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1e93) return (n / 1e93).toFixed(2) + ' Tg';
  if (n >= 1e90) return (n / 1e90).toFixed(2) + ' NvVg';
  if (n >= 1e87) return (n / 1e87).toFixed(2) + ' OcVg';
  if (n >= 1e84) return (n / 1e84).toFixed(2) + ' SpVg';
  if (n >= 1e81) return (n / 1e81).toFixed(2) + ' SxVg';
  if (n >= 1e78) return (n / 1e78).toFixed(2) + ' QiVg';
  if (n >= 1e75) return (n / 1e75).toFixed(2) + ' QaVg';
  if (n >= 1e72) return (n / 1e72).toFixed(2) + ' TVg';
  if (n >= 1e69) return (n / 1e69).toFixed(2) + ' DVg';
  if (n >= 1e66) return (n / 1e66).toFixed(2) + ' UVg';
  if (n >= 1e63) return (n / 1e63).toFixed(2) + ' Vg';
  if (n >= 1e60) return (n / 1e60).toFixed(2) + ' Nvd';
  if (n >= 1e57) return (n / 1e57).toFixed(2) + ' Ocd';
  if (n >= 1e54) return (n / 1e54).toFixed(2) + ' Spd';
  if (n >= 1e51) return (n / 1e51).toFixed(2) + ' Sxd';
  if (n >= 1e48) return (n / 1e48).toFixed(2) + ' Qid';
  if (n >= 1e45) return (n / 1e45).toFixed(2) + ' Qad';
  if (n >= 1e42) return (n / 1e42).toFixed(2) + ' Trd';
  if (n >= 1e39) return (n / 1e39).toFixed(2) + ' Dd';
  if (n >= 1e36) return (n / 1e36).toFixed(2) + ' Ud';
  if (n >= 1e33) return (n / 1e33).toFixed(2) + ' Dc';
  if (n >= 1e30) return (n / 1e30).toFixed(2) + ' No';
  if (n >= 1e27) return (n / 1e27).toFixed(2) + ' Oc';
  if (n >= 1e24) return (n / 1e24).toFixed(2) + ' Sp';
  if (n >= 1e21) return (n / 1e21).toFixed(2) + ' Sx';
  if (n >= 1e18) return (n / 1e18).toFixed(2) + ' Qi';
  if (n >= 1e15) return (n / 1e15).toFixed(2) + ' Qa';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + ' B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + ' M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1)  + ' K';
  return Math.floor(n).toString();
}

function totalOwnedUpgrades() {
  return UPGRADES.reduce((sum, u) => sum + (state.owned[u.id] || 0), 0);
}

function manualClickValue() {
  let v = 1;
  UPGRADES.forEach(u => {
    if (u.clickPower) v += u.clickPower * (state.owned[u.id] || 0);
  });
  return v;
}

function minigameTotalWins() {
  return state.minigames.whackPlays + state.minigames.matchWins + state.minigames.slotsWins;
}

const ACHIEVEMENTS = [];
function achievement(id, name, desc, test, lockedName = null, lockedDesc = null) {
  ACHIEVEMENTS.push({ id, name, desc, test, lockedName, lockedDesc });
}

const REMOVED_LUCKY_ACHIEVEMENT_PREFIXES = ['lucky-wins-', 'lucky-streak-', 'lucky-picks-'];
const REMOVED_LUCKY_MINIGAME_KEYS = ['luckyPicks', 'luckyWins', 'luckyBestStreak', 'luckyJackpots'];

function removeRemovedLuckyBoxProgress() {
  Object.keys(state.achievements).forEach(id => {
    if (REMOVED_LUCKY_ACHIEVEMENT_PREFIXES.some(prefix => id.startsWith(prefix))) {
      delete state.achievements[id];
    }
  });
  REMOVED_LUCKY_MINIGAME_KEYS.forEach(key => delete state.minigames[key]);
}

[
  [1, 'First Aaron'], [10, 'Finger Warmup'], [25, 'Aaron Tapper'], [50, 'Aaron Knuckles'],
  [100, 'Click Storm'], [250, 'Desk Drummer'], [500, 'Mouse Melter'], [1000, 'Thousand Tap Club'],
  [2500, 'Aaron Avalanche'], [5000, 'Click Machine'], [10000, 'Finger Legend'], [25000, 'Human Autoclicker'],
  [50000, 'Aaron Thunderhand'], [100000, 'Reality Clicker'],
].forEach(([n, name]) => achievement('clicks-' + n, name, 'Click Aaron ' + fmt(n) + ' times.', () => state.clicks >= n));

[
  [10, 'Pocket Aarons'], [50, 'Aaron Jar'], [100, 'Triple Digits'], [500, 'Aaron Pile'],
  [1000, 'Aaron Stack'], [5000, 'Aaron Shelf'], [10000, 'Aaron Vault'], [50000, 'Aaron Bank'],
  [100000, 'Aaron Treasury'], [500000, 'Aaron Empire'], [1000000, 'Million Aaron Hold'],
  [10000000, 'Aaron Mountain'], [100000000, 'Aaron Planet'], [1000000000, 'Aaron Galaxy'],
].forEach(([n, name]) => achievement('balance-' + n, name, 'Hold ' + fmt(n) + ' Aarons at once.', () => state.aarons >= n));

[
  [100, 'Aaron Income'], [1000, 'Earned It'], [10000, 'Aaron Payroll'], [100000, 'Aaron Factory'],
  [1000000, 'Million Made'], [10000000, 'Aaron Industrialist'], [100000000, 'Aaron Tycoon'],
  [1000000000, 'Aaron Billionaire'], [10000000000, 'Aaron Overlord'], [100000000000, 'Aaron Singularity'],
].forEach(([n, name]) => achievement('earned-' + n, name, 'Earn ' + fmt(n) + ' Aarons all time.', () => state.totalEarned >= n));

[
  [1, 'Passive Aaron'], [5, 'Aaron Drip'], [10, 'Double Digit Flow'], [50, 'Aaron Engine'],
  [100, 'Aaron Generator'], [500, 'Aaron Turbine'], [1000, 'Aaron Reactor'], [5000, 'Aaron Collider'],
  [10000, 'Aaron Beam'], [50000, 'Aaron Sun'], [100000, 'Aaron Supernova'],
].forEach(([n, name]) => achievement('aps-' + n, name, 'Reach ' + fmt(n) + ' Aarons per second.', () => state.aps >= n));

[
  [1, 'First Purchase'], [5, 'Upgrade Curious'], [10, 'Upgrade Collector'], [25, 'Upgrade Hoarder'],
  [50, 'Upgrade Fortress'], [100, 'Aaron Infrastructure'], [250, 'Aaron Megastore'],
  [500, 'Upgrade Universe'], [1000, 'Every Shelf Is Aaron'],
].forEach(([n, name]) => achievement('upgrades-total-' + n, name, 'Own ' + fmt(n) + ' total upgrades.', () => totalOwnedUpgrades() >= n));

UPGRADES.forEach(u => {
  [[1, 'Unlocked'], [10, 'Specialist'], [25, 'Expert'], [50, 'Master'], [100, 'Obsessed']].forEach(([n, rank]) => {
    achievement(u.id + '-' + n, u.name + ' ' + rank, 'Own ' + n + ' ' + u.name + ' upgrades.', () => (state.owned[u.id] || 0) >= n);
  });
});

[
  [1, 'Whack Initiate'], [5, 'Whack Regular'], [10, 'Whack Veteran'], [25, 'Whack Maniac'],
].forEach(([n, name]) => achievement('whack-plays-' + n, name, 'Play Aaron Whack ' + n + ' times.', () => state.minigames.whackPlays >= n));

[
  [5, 'Quick Bonk'], [10, 'Aaron Reflexes'], [20, 'Target Terror'], [30, 'Aaron Sniper'],
].forEach(([n, name]) => achievement('whack-best-' + n, name, 'Hit ' + n + ' Aarons in one Aaron Whack round.', () => state.minigames.whackBest >= n));

[
  [25, 'Lifetime Whacker'], [100, 'Hundred Hits'], [250, 'Pixel Punisher'], [500, 'Aaron Cleanup Crew'],
].forEach(([n, name]) => achievement('whack-hits-' + n, name, 'Hit ' + n + ' total Aaron Whack targets.', () => state.minigames.whackHits >= n));

[
  [1, 'First Match'], [5, 'Pair Finder'], [15, 'Memory Clicker'], [30, 'Aaron Card Shark'],
  [60, 'Perfect Recall'],
].forEach(([n, name]) => achievement('match-wins-' + n, name, 'Clear Aaron Match ' + n + ' times.', () => state.minigames.matchWins >= n));

[
  [10, 'Pair Starter'], [50, 'Pair Stack'], [150, 'Aaron Pattern Brain'], [300, 'Grid Genius'],
].forEach(([n, name]) => achievement('match-pairs-' + n, name, 'Find ' + n + ' Aaron Match pairs.', () => state.minigames.matchPairs >= n));

[
  [1, 'First Spin'], [10, 'Slot Regular'], [50, 'Slot Fiend'], [100, 'Aaron Gambler'],
].forEach(([n, name]) => achievement('slots-plays-' + n, name, 'Spin Aaron Slots ' + n + ' times.', () => state.minigames.slotsPlays >= n));

[
  [1, 'Lucky Lever'], [5, 'Hot Reel'], [20, 'Slot Shark'],
].forEach(([n, name]) => achievement('slots-wins-' + n, name, 'Win ' + n + ' times on Aaron Slots.', () => state.minigames.slotsWins >= n));

achievement('slots-jackpot-1', 'JACKPOT!', 'Hit a 3-of-a-kind on Aaron Slots.', () => state.minigames.slotsJackpots >= 1);
achievement('slots-jackpot-5', 'Aaron 777', 'Hit 5 jackpots on Aaron Slots.', () => state.minigames.slotsJackpots >= 5);

[
  [1, 'Double Dip'], [2, 'Triple Threat'], [3, 'Hot Machine'],
  [4, 'Unstoppable'], [6, 'Aaron Lucky Charm'],
].forEach(([n, name]) => achievement('slots-streak-' + n, name, 'Hit a ' + n + '-win streak on Aaron Slots.', () => state.minigames.slotsBestStreak >= n));

[
  [1, 'Mini Starter'], [10, 'Mini Grinder'], [25, 'Aaron Arcade Rat'], [50, 'Minigame Machine'],
  [100, 'Arcade Dimension'],
].forEach(([n, name]) => achievement('minigame-wins-' + n, name, 'Finish or win ' + n + ' total minigame rounds.', () => minigameTotalWins() >= n));

achievement('road-play-1',  'Road Crosser',     'Play Aaron Cross once.',                 () => (state.minigames.roadPlays    || 0) >= 1);
achievement('road-hop-5',  'Five Hops',        'Hop 5 tiles in one Aaron Cross run.',    () => (state.minigames.roadBestHops || 0) >= 5);
achievement('road-hop-10', 'Ten Hopper',       'Hop 10 tiles in one Aaron Cross run.',   () => (state.minigames.roadBestHops || 0) >= 10);
achievement('road-hop-15', 'Untouchable',      'Hop 15 tiles in one Aaron Cross run.',   () => (state.minigames.roadBestHops || 0) >= 15);
achievement('road-cashout','Smart Crosser',    'Cash out on Aaron Cross without dying.',  () => (state.minigames.roadCashouts || 0) >= 1);

achievement('crates-play-1',   'First Smash',      'Play Crate Smash once.',                     () => (state.minigames.cratesPlays    || 0) >= 1);
achievement('crates-play-10',  'Crate Regular',    'Play Crate Smash 10 times.',                 () => (state.minigames.cratesPlays    || 0) >= 10);
achievement('crates-play-50',  'Crate Addict',     'Play Crate Smash 50 times.',                 () => (state.minigames.cratesPlays    || 0) >= 50);
achievement('crates-win-1',    'Smart Smasher',    'Cash out on Crate Smash.',                   () => (state.minigames.cratesWins     || 0) >= 1);
achievement('crates-win-10',   'Crate Champion',   'Cash out on Crate Smash 10 times.',          () => (state.minigames.cratesWins     || 0) >= 10);
achievement('crates-bomb-1',   'Boom.',            'Hit a bomb in Crate Smash.',                 () => (state.minigames.cratesBombHits || 0) >= 1);
achievement('crates-bomb-10',  'Serial Bomber',    'Hit 10 bombs in Crate Smash.',               () => (state.minigames.cratesBombHits || 0) >= 10);
achievement('crates-allclear', 'All Clear!',       'Find all 20 Aarons without hitting a bomb.', () => (state.minigames.cratesAllClears || 0) >= 1);

achievement('plane-plays-1', 'First Flight',     'Take off in Aaron Air.',              () => (state.minigames.planePlays     || 0) >= 1);
achievement('plane-plays-10','Frequent Flyer',   'Fly Aaron Air 10 times.',             () => (state.minigames.planePlays     || 0) >= 10);
achievement('plane-fire-1',  'Hotshot',          'Land in fire on Aaron Air.',           () => (state.minigames.planeFireLands || 0) >= 1);
achievement('plane-fire-5',  'Pyromaniac Pilot', 'Land in fire 5 times on Aaron Air.',  () => (state.minigames.planeFireLands || 0) >= 5);

[
  ['all-upgrades-one', 'Full Menu Sampler', 'Own at least one of every upgrade.', () => UPGRADES.every(u => state.owned[u.id] > 0)],
  ['all-upgrades-ten', 'Ten Of Everything', 'Own at least ten of every upgrade.', () => UPGRADES.every(u => state.owned[u.id] >= 10)],
  ['birthday-button', 'Party Button', 'Trigger the birthday party.', () => !!state.achievements['birthday-button']],
  ['diddy-mode', 'Diddy Party', 'Click the Aaron count text.', () => !!state.achievements['diddy-mode'], '????', 'Alter a aaron?'],
  ['mega-slots-win', 'MEGA JACKPOT', 'Hit all 10 on the mega slot machine. (hint: click the slot machine title)', () => !!state.achievements['mega-slots-win'], '????', 'hint: something spins in a secret place...'],
  ['good-try', 'Good Try', 'Try to activate cheats.', () => !!state.achievements['good-try'], '????', 'scroll down... way down.'],
  ['no-job', 'I Have No Job', 'Click on any achievement 100 times.', () => (state.minigames.achievementClicks || 0) >= 100, '????', 'You seem bored...'],
  ['dont-like-game', "I Don't Like This Game", 'Have over 1 trillion Aarons.', () => state.aarons >= 1e12, '????', "you'll know when you get there..."],
  ['bad-luck', 'Dang', 'Lose 3 slots in a row and accept it.', () => !!state.achievements['bad-luck'], '????', 'just keep spinning...'],
  ['typed-aaron', 'Aaron', 'Type "aaron" on your keyboard.', () => !!state.achievements['typed-aaron'], '????', 'try typing something...'],
  ['typed-diddy', 'Diddy', 'Type "diddy" on your keyboard.', () => !!state.achievements['typed-diddy'], '????', 'try typing another name...'],
  ['typed-lyger', 'Lyger', 'Type "lyger" on your keyboard.', () => !!state.achievements['typed-lyger'], '????', 'try typing another name...'],
  ['passed-captcha', 'Not a Robot', 'Pass the CAPTCHA.', () => !!state.achievements['passed-captcha'], '????', 'are you a robot?'],
  ['broke-clicks',   'Window Shopping', 'Click an upgrade you cannot afford 5 times.', () => (state.minigames.brokeClicks || 0) >= 5, '????', 'try buying something you cant afford...'],
  ['follow-play-1',  'First Follower',  'Play Follow Aaron once.',              () => (state.minigames.followPlays   || 0) >= 1],
  ['follow-play-10', 'Aaron Stalker',   'Play Follow Aaron 10 times.',          () => (state.minigames.followPlays   || 0) >= 10],
  ['follow-perfect', 'Shadow',          'Stay on Aaron for 80%+ of the round.', () => (state.minigames.followPerfect || 0) >= 1, '????', 'keep that cursor glued to Aaron...'],
  ['card-first',     'First Pull',      'Open your first Aaron card.',           () => Object.keys(state.cards).length >= 1, '????', 'open a card pack...'],
  ['card-set',       'Complete Set',    'Collect all 13 Aaron cards.',           () => AARON_CARDS.every(c => (state.cards[c.id] || 0) >= 1)],
  ['card-legend',    'Got the Legend',  'Pull the Legendary Aaron card.',        () => (state.cards['card-cl'] || 0) >= 1, '????', 'very rare...'],
].forEach(a => achievement(a[0], a[1], a[2], a[3], a[4], a[5]));

function buildAchievementCards() {
  achievementList.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const card = document.createElement('div');
    card.className = 'achievement-card';
    card.id = 'achievement-' + a.id;

    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.textContent = '*';

    const info = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'achievement-name';
    const desc = document.createElement('div');
    desc.className = 'achievement-desc';
    const isUnlocked = !!state.achievements[a.id];
    name.textContent = (!isUnlocked && a.lockedName) ? a.lockedName : a.name;
    desc.textContent = (!isUnlocked && a.lockedDesc) ? a.lockedDesc : a.desc;

    info.append(name, desc);
    card.append(badge, info);
    achievementList.appendChild(card);
  });
}

function updateAchievementCards() {
  const unlocked = ACHIEVEMENTS.filter(a => state.achievements[a.id]).length;
  achievementSummary.textContent = unlocked + ' / ' + ACHIEVEMENTS.length + ' unlocked';
  ACHIEVEMENTS.forEach(a => {
    const card = document.getElementById('achievement-' + a.id);
    if (!card) return;
    const isUnlocked = !!state.achievements[a.id];
    card.classList.toggle('unlocked', isUnlocked);
    if (a.lockedName) {
      card.querySelector('.achievement-name').textContent = (!isUnlocked && a.lockedName) ? a.lockedName : a.name;
      card.querySelector('.achievement-desc').textContent = (!isUnlocked && a.lockedDesc) ? a.lockedDesc : a.desc;
    }
  });
}

function showAchievementToast(a) {
  if (!isMuted) { achievementAudioSrc.currentTime = 0; achievementAudioSrc.play().catch(() => {}); }
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.innerHTML = '<div class="achievement-toast-title">ACHIEVEMENT UNLOCKED</div><div class="achievement-toast-name"></div>';
  toast.querySelector('.achievement-toast-name').textContent = a.name;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3300);
}

let achievementCheckPending = false;
function checkAchievements(silent = false) {
  let changed = false;
  ACHIEVEMENTS.forEach(a => {
    if (state.achievements[a.id]) return;
    if (!a.test()) return;
    state.achievements[a.id] = true;
    changed = true;
    if (!silent) showAchievementToast(a);
  });
  if (changed) {
    updateAchievementCards();
    save();
    if (!silent && !state.achievements['all-achieve-celebrated']
        && ACHIEVEMENTS.every(a => state.achievements[a.id])) {
      state.achievements['all-achieve-celebrated']    = true;
      state.achievements['all-achieve-music-offered'] = true;
      save();
      setTimeout(celebrateAllAchievements, 600);
    }
    if (!silent && !state.achievements['ten-left-popup']) {
      const remaining = ACHIEVEMENTS.filter(a => !state.achievements[a.id]).length;
      if (remaining <= 10) {
        state.achievements['ten-left-popup'] = true;
        save();
        setTimeout(showTenLeftPopup, 500);
      }
    }
  }
}

function showTenLeftPopup() {
  if (document.getElementById('ten-left-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'ten-left-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 18000;
    background: rgba(0,0,0,0.82);
    display: flex; align-items: center; justify-content: center;
  `;
  const box = document.createElement('div');
  box.style.cssText = `
    background: #0f0c0a; border: 3px solid #5a3b27;
    padding: 36px 32px; max-width: 340px; width: 90%;
    text-align: center; font-family: 'Press Start 2P', monospace;
  `;
  const line1 = document.createElement('div');
  line1.textContent = '10 achievements left';
  line1.style.cssText = 'font-size: 11px; color: #ffdd00; margin-bottom: 18px; line-height: 1.8;';
  const line2 = document.createElement('div');
  line2.textContent = 'good luck';
  line2.style.cssText = 'font-size: 9px; color: #e8caa7; margin-bottom: 6px; line-height: 1.8;';
  const sig = document.createElement('div');
  sig.textContent = '-luuger';
  sig.style.cssText = 'font-size: 7px; color: #8d715e; margin-bottom: 28px;';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'OK';
  closeBtn.style.cssText = `
    font-family: 'Press Start 2P', monospace; font-size: 9px;
    background: #2a1a08; border: 2px solid #7a5020; color: #e8caa7;
    padding: 10px 24px; cursor: pointer;
  `;
  closeBtn.addEventListener('click', () => overlay.remove());
  box.append(line1, line2, sig, closeBtn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function scheduleAchievementCheck() {
  if (achievementCheckPending) return;
  achievementCheckPending = true;
  requestAnimationFrame(() => {
    achievementCheckPending = false;
    checkAchievements();
  });
}

function unlockAllAchievementsDev() {
  ACHIEVEMENTS.forEach(a => { state.achievements[a.id] = true; });
  updateAchievementCards();
  if (!state.achievements['all-achieve-celebrated']) {
    state.achievements['all-achieve-celebrated'] = true;
    setTimeout(celebrateAllAchievements, 600);
  }
  if (footlongMusic && footlongMusic.paused) {
    startFootlongMusicIfAllAchievements();
  }
}

function giveDevAarons(amount) {
  state.aarons += amount;
  state.totalEarned += amount;
  updateStats();
  updateCards();
}

function maxDevUpgrades() {
  UPGRADES.forEach(u => {
    state.owned[u.id] = Math.max(state.owned[u.id] || 0, 100);
    state.costs[u.id] = u.baseCost;
    addOrbitIcon(u.id);
  });
  recalcAps();
  updateStats();
  updateCards();
}

function createDevToolsPanel() {
  if (!DEV_MODE) return;

  const panel = document.createElement('div');
  panel.id = 'dev-tools-panel';
  panel.innerHTML = `
    <div id="dev-tools-title">DEV MODE</div>
    <button id="dev-give-aarons">+1T Aarons</button>
    <button id="dev-max-upgrades">100x Upgrades</button>
    <button id="dev-unlock-achievements">Unlock Achievements</button>
    <label><input type="checkbox" data-dev-toggle="alwaysWinSlots"> Win Slots</label>
    <label><input type="checkbox" data-dev-toggle="alwaysJackpotSlots"> Jackpot Slots</label>
    <label><input type="checkbox" data-dev-toggle="alwaysMegaJackpot"> Mega Jackpot</label>
    <label><input type="checkbox" data-dev-toggle="noRoadCrashes"> No Road Crashes</label>
    <label><input type="checkbox" data-dev-toggle="alwaysSafeAir"> Safe Aaron Air</label>
    <button id="dev-fresh-run">Fresh Run</button>
  `;
  document.body.appendChild(panel);

  document.getElementById('dev-give-aarons').addEventListener('click', () => giveDevAarons(1_000_000_000_000));
  document.getElementById('dev-max-upgrades').addEventListener('click', maxDevUpgrades);
  document.getElementById('dev-unlock-achievements').addEventListener('click', unlockAllAchievementsDev);
  document.getElementById('dev-fresh-run').addEventListener('click', () => location.reload());
  panel.querySelectorAll('[data-dev-toggle]').forEach(input => {
    input.addEventListener('change', () => {
      devTools[input.dataset.devToggle] = input.checked;
    });
  });
}

function awardAarons(amount, persist = false) {
  const reward = Math.max(0, Math.floor(amount));
  if (reward <= 0) return 0;
  state.aarons += reward;
  state.totalEarned += reward;
  updateStats();
  updateCards();
  if (persist) save();
  return reward;
}

function updateStats() {
  const inDiddyMode = Date.now() < diddyModeEnd;
  const clickValue = manualClickValue();
  aaronCountEl.textContent = fmt(state.aarons) + (inDiddyMode ? ' Diddys' : ' Aarons');
  aaronRateEl.textContent  = fmt(state.aps)    + ' aarons/sec';
  if (appVersionEl) appVersionEl.textContent = 'version ' + APP_VERSION;
  manualRateEl.textContent = '+' + fmt(clickValue) + ' aaron' + (clickValue === 1 ? '' : 's') + ' / click';
  scheduleAchievementCheck();
}

function updateCards() {
  UPGRADES.forEach(u => {
    const card    = document.getElementById('card-' + u.id);
    const costEl  = document.getElementById('cost-' + u.id);
    const ownedEl = document.getElementById('owned-' + u.id);

    const singleCost = state.costs[u.id];
    const totalCost = currentBulk === 1 ? singleCost : bulkCost(u.id, currentBulk);
    costEl.textContent  = fmt(totalCost) + ' aarons' + (currentBulk > 1 ? ' (x' + currentBulk + ')' : '');
    ownedEl.textContent = 'x' + state.owned[u.id];

    const canAfford = state.aarons >= totalCost;
    card.classList.toggle('locked', !canAfford);
    card.classList.toggle('affordable', canAfford);
  });
}

// ── ORBIT SYSTEM ─────────────────────────────────────────────────────────────
// Each entry: { upgradeId, angle, speed, wrapper, countEl }
const orbitEntries  = [];
const ORBIT_SPEED   = 0.5;

function makeOrbitEl(upgradeId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'orbit-icon';
  const img = document.createElement('img');
  img.src = getIconSrc(upgradeId);
  const countEl = document.createElement('span');
  countEl.className = 'orbit-count';
  wrapper.append(img, countEl);
  return { wrapper, countEl };
}

function addOrbitIcon(upgradeId) {
  const existing = orbitEntries.find(e => e.upgradeId === upgradeId);
  const count = state.owned[upgradeId];

  if (existing) {
    existing.countEl.textContent = count > 0 ? 'x' + count : '';
    existing.countEl.style.display = count > 0 ? 'block' : 'none';
    return;
  }

  if (count === 0) return;

  const { wrapper, countEl } = makeOrbitEl(upgradeId);
  countEl.textContent = 'x' + count;
  countEl.style.display = 'block';
  const startAngle = -Math.PI / 2 + orbitEntries.length * 0.9;
  const entry = { upgradeId, angle: startAngle, speed: ORBIT_SPEED, wrapper, countEl };
  orbitEntries.push(entry);
  orbitContainer.appendChild(wrapper);
}

function updateOrbitIcons(dt) {
  if (orbitEntries.length === 0) return;
  const radius = clickerWrapper.offsetWidth * 0.56;
  orbitEntries.forEach(item => {
    item.angle += item.speed * dt;
    const x = Math.cos(item.angle) * radius;
    const y = Math.sin(item.angle) * radius;
    item.wrapper.style.left = x + 'px';
    item.wrapper.style.top  = y + 'px';
  });
}

// ── BULK BUY ─────────────────────────────────────────────────────────────────
let currentBulk = 1;

function bulkCost(id, n) {
  const mult = UPGRADES.find(u => u.id === id).costMult;
  let total = 0, cost = state.costs[id];
  for (let i = 0; i < n; i++) { total += cost; cost = Math.ceil(cost * mult); }
  return total;
}

// ── BUY UPGRADE ───────────────────────────────────────────────────────────────
function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id);
  if (!u) return;
  if (state.aarons < bulkCost(id, currentBulk)) {
    if (!isMuted) { perfectAudioSrc.currentTime = 0; perfectAudioSrc.play().catch(() => {}); }
    state.minigames.brokeClicks = (state.minigames.brokeClicks || 0) + 1;
    checkAchievements(); save();
    return;
  }

  let bought = 0;
  for (let i = 0; i < currentBulk; i++) {
    if (state.aarons < state.costs[id]) break;
    state.aarons -= state.costs[id];
    state.costs[id] = Math.ceil(state.costs[id] * u.costMult);
    state.owned[id]++;
    addOrbitIcon(id);
    bought++;
  }
  if (bought > 0) {
    if (!isMuted) upgradeAudioSrc.cloneNode().play().catch(() => {});
    recalcAps();
    updateStats();
    updateCards();
    save();
  }
}

function recalcAps() {
  state.aps = 0;
  UPGRADES.forEach(u => {
    const owned = state.owned[u.id];
    const epsGrowth = u.epsGrowth ?? 0.01;
    state.aps += u.baseEps * owned * (1 + owned * epsGrowth);
  });
}

// ── CLICK HANDLER ─────────────────────────────────────────────────────────────
clickerWrapper.addEventListener('click', (e) => {
  const clickValue = manualClickValue();
  state.clicks++;
  awardAarons(clickValue);

  playClickSound();

  clickFlash.classList.add('flash');
  setTimeout(() => clickFlash.classList.remove('flash'), 120);

  const el = document.createElement('div');
  el.className = 'float-num';
  el.textContent = '+' + fmt(clickValue);
  el.style.left = (e.clientX + Math.random() * 20 - 10) + 'px';
  el.style.top  = (e.clientY - 10) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
});

// squish on mousedown — inline style overrides CSS animation
clickerWrapper.addEventListener('mousedown', () => {
  swayWrapper.style.transform = 'scale(0.88) rotate(0deg)';
});
document.addEventListener('mouseup', () => {
  swayWrapper.style.transform = '';
});

// ── PASSIVE INCOME + ORBIT TICK ───────────────────────────────────────────────
let lastTick = performance.now();
function tick(now) {
  const dt = Math.min((now - lastTick) / 1000, 0.1); // cap dt to avoid huge jumps
  lastTick = now;

  if (state.aps > 0) {
    const gained  = state.aps * dt;
    state.aarons      += gained;
    state.totalEarned += gained;
    updateStats();
    updateCards();
  }

  updateOrbitIcons(dt);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ── SAVE / LOAD ───────────────────────────────────────────────────────────────
function save() {
  if (DEV_MODE) return;
  try {
    removeRemovedLuckyBoxProgress();
    localStorage.setItem('aaronclicker', JSON.stringify({
      aarons:      state.aarons,
      totalEarned: state.totalEarned,
      clicks:      state.clicks,
      owned:       state.owned,
      costs:       state.costs,
      achievements: state.achievements,
      cards:       state.cards,
      minigames:   state.minigames,
    }));
  } catch (e) {}
}

function load() {
  if (DEV_MODE) return;
  try {
    const raw = localStorage.getItem('aaronclicker');
    if (!raw) return;
    const d = JSON.parse(raw);
    state.aarons      = d.aarons      ?? d.errands ?? 0;
    state.totalEarned = d.totalEarned ?? 0;
    state.clicks      = d.clicks      ?? 0;
    state.owned       = d.owned  || {};
    state.costs       = d.costs  || {};
    state.achievements = d.achievements || {};
    state.cards = d.cards || {};
    state.minigames = { ...state.minigames, ...(d.minigames || {}) };
    removeRemovedLuckyBoxProgress();
    slotsWinStreak = state.minigames.slotsStreak || 0;
    UPGRADES.forEach(u => {
      if (state.owned[u.id] === undefined) state.owned[u.id] = 0;
      if (state.costs[u.id] === undefined) state.costs[u.id] = u.baseCost;
    });
    recalcAps();

    // rebuild orbit icons from saved owned counts
    UPGRADES.forEach(u => addOrbitIcon(u.id));
  } catch (e) {}
}

setInterval(save, 10000);
window.addEventListener('pagehide', save);
window.addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save();
});

// ── FOOTLONG BACKGROUND MUSIC ────────────────────────────────────────────────
isMusicMuted = !DEV_MODE && localStorage.getItem('aaronclicker_musicmute') === '1';

// ── BIRTHDAY CONFETTI ─────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#ff2020','#ff8800','#ffff00','#20dd20',
  '#2080ff','#dd20dd','#20dddd','#ffffff',
  '#ff44aa','#ffcc00','#44ffaa','#ff6644',
];

function triggerBirthday() {
  if (document.getElementById('birthday-overlay')) return;
  const hadBirthdayAchievement = !!state.achievements['birthday-button'];
  state.achievements['birthday-button'] = true;
  updateAchievementCards();
  if (!hadBirthdayAchievement) {
    const birthdayAchievement = ACHIEVEMENTS.find(a => a.id === 'birthday-button');
    if (birthdayAchievement) showAchievementToast(birthdayAchievement);
  }
  save();
  if (!isMuted) { happyAudioSrc.currentTime = 0; happyAudioSrc.play().catch(() => {}); }

  const overlay = document.createElement('div');
  overlay.id = 'birthday-overlay';

  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const textEl = document.createElement('div');
  textEl.id = 'birthday-text';
  textEl.textContent = 'HAPPY BIRTHDAY';

  overlay.append(canvas, textEl);
  document.body.appendChild(overlay);

  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: 120 }, () => ({
    x:        Math.random() * canvas.width,
    y:        Math.random() * canvas.height * 0.4 - canvas.height * 0.5,
    vx:       (Math.random() - 0.5) * 4,
    vy:       Math.random() * 5 + 3,
    size:     Math.floor(Math.random() * 10 + 6),
    color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rot:      Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
  }));

  const startTime = performance.now();

  function animateConfetti(now) {
    const elapsed = (now - startTime) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height + p.size) {
        p.y = -p.size * 2;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (elapsed < 3.5) {
      requestAnimationFrame(animateConfetti);
    } else {
      overlay.style.transition = 'opacity 0.6s ease';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 650);
    }
  }

  requestAnimationFrame(animateConfetti);
}

const TYPED_ACHIEVEMENT_SEQUENCES = [
  { keys: ['a','a','r','o','n'], id: 'typed-aaron' },
  { keys: ['d','i','d','d','y'], id: 'typed-diddy' },
  { keys: ['l','y','g','e','r'], id: 'typed-lyger' },
];
const TYPED_ACHIEVEMENT_BUFFER_MAX = Math.max(...TYPED_ACHIEVEMENT_SEQUENCES.map(s => s.keys.length));
let typedAchievementKeyBuffer = [];

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    triggerBirthday();
  }

  const key = e.key.toLowerCase();
  if (key.length === 1) {
    typedAchievementKeyBuffer.push(key);
    if (typedAchievementKeyBuffer.length > TYPED_ACHIEVEMENT_BUFFER_MAX) typedAchievementKeyBuffer.shift();
    TYPED_ACHIEVEMENT_SEQUENCES.forEach(sequence => {
      const recentKeys = typedAchievementKeyBuffer.slice(-sequence.keys.length);
      if (recentKeys.join('') === sequence.keys.join('')) {
        typedAchievementKeyBuffer = [];
        if (state.achievements[sequence.id]) return;
        state.achievements[sequence.id] = true;
        const a = ACHIEVEMENTS.find(x => x.id === sequence.id);
        if (a) showAchievementToast(a);
        updateAchievementCards();
        save();
      }
    });
  }
});

// ── INIT ──────────────────────────────────────────────────────────────────────
function switchPanel(tab) {
  document.querySelectorAll('.panel-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.panel-view').forEach(view => view.classList.remove('active'));
  const target = tab === 'upgrades'
    ? upgradeList
    : document.getElementById(tab === 'achievements' ? 'achievement-panel' : 'minigame-panel');
  target.classList.add('active');
  bulkBtns.style.visibility = tab === 'upgrades' ? 'visible' : 'hidden';
  if (tab === 'achievements') updateAchievementCards();
}

let whackActive = false;
let whackScore = 0;
let whackEndTime = 0;
let whackTimer = null;
let whackSpawner = null;

function updateWhackLabels() {
  whackScoreEl.textContent = 'score ' + whackScore;
  if (!whackActive) return;
  const left = Math.max(0, Math.ceil((whackEndTime - Date.now()) / 1000));
  whackTimeEl.textContent = left + 's';
}

function spawnWhackTarget() {
  if (!whackActive) return;
  const target = document.createElement('button');
  target.className = 'whack-target';
  target.type = 'button';
  const maxX = Math.max(0, whackField.clientWidth - 60);
  const maxY = Math.max(0, whackField.clientHeight - 60);
  target.style.left = Math.floor(Math.random() * maxX) + 'px';
  target.style.top = Math.floor(Math.random() * maxY) + 'px';
  target.addEventListener('click', () => {
    whackScore++;
    state.minigames.whackHits++;
    updateWhackLabels();
    target.remove();
    playClickSound();
  });
  whackField.appendChild(target);
  setTimeout(() => target.remove(), 1300);
}

function endWhackGame() {
  whackActive = false;
  clearInterval(whackTimer);
  clearInterval(whackSpawner);
  whackField.innerHTML = '';
  whackStartBtn.disabled = false;
  state.minigames.whackPlays++;
  state.minigames.whackBest = Math.max(state.minigames.whackBest, whackScore);
  const paid = awardAarons(whackScore * 25 + whackScore * whackScore * 4 + Math.floor(state.aps), true);
  whackTimeEl.textContent = '+' + fmt(paid) + ' aarons';
  updateWhackLabels();
  save();
  checkAchievements();
}

function startWhackGame() {
  if (whackActive) return;
  whackActive = true;
  whackScore = 0;
  whackEndTime = Date.now() + 10000;
  whackField.innerHTML = '';
  whackStartBtn.disabled = true;
  updateWhackLabels();
  whackTimer = setInterval(() => {
    updateWhackLabels();
    if (Date.now() >= whackEndTime) endWhackGame();
  }, 200);
  whackSpawner = setInterval(spawnWhackTarget, 330);
  spawnWhackTarget();
}

let matchTiles = [];
let matchFirst = null;
let matchLocked = false;
let matchPairs = 0;

const MATCH_IMAGES = [
  { src: 'Aaron_match_pictures/1.jpg', pos: '50% 62%' },
  { src: 'Aaron_match_pictures/2.jpg', pos: '50% 45%' },
  { src: 'Aaron_match_pictures/3.jpg', pos: '50% 57%' },
  { src: 'Aaron_match_pictures/4.jpg', pos: '50% 50%' },
  { src: 'Aaron_match_pictures/5.jpg', pos: '50% 68%' },
];

const ALL_AARON_PICS = [
  { src: 'Aaron_match_pictures/1.jpg',       pos: '50% 62%' },
  { src: 'Aaron_match_pictures/2.jpg',       pos: '50% 45%' },
  { src: 'Aaron_match_pictures/3.jpg',       pos: '50% 57%' },
  { src: 'Aaron_match_pictures/4.jpg',       pos: '50% 50%' },
  { src: 'Aaron_match_pictures/5.jpg',       pos: '50% 68%' },
  { src: 'Aaron_match_pictures/6.jpg',       pos: '50% 50%' },
  { src: 'Aaron_match_pictures/7.jpg',       pos: '50% 50%' },
  { src: 'Aaron_match_pictures/8.jpg',       pos: '50% 50%' },
  { src: 'Aaron_match_pictures/9.jpg',       pos: '50% 50%' },
  { src: 'Aaron_match_pictures/10.jpg',      pos: '50% 50%' },
  { src: 'Aaron_match_pictures/11.png',      pos: '50% 50%' },
  { src: 'Aaron_match_pictures/12.png',      pos: '50% 50%' },
  { src: 'Aaron_match_pictures/Clicker.png', pos: '50% 50%' },
];

// 5 random images picked each session for the slot machine
const SLOT_IMAGES = (() => {
  const pool = [...ALL_AARON_PICS];
  const out = [];
  while (out.length < 5) out.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
  return out;
})();

// ── AARON CARD DEFINITIONS ──────────────────────────────────────────────────
const AARON_CARDS = [
  { id: 'card-1',  src: 'Aaron_match_pictures/1.jpg',       name: 'Aaron #1',        rarity: 'common',    weight: 30 },
  { id: 'card-2',  src: 'Aaron_match_pictures/2.jpg',       name: 'Aaron #2',        rarity: 'common',    weight: 30 },
  { id: 'card-3',  src: 'Aaron_match_pictures/3.jpg',       name: 'Aaron #3',        rarity: 'common',    weight: 30 },
  { id: 'card-4',  src: 'Aaron_match_pictures/4.jpg',       name: 'Aaron #4',        rarity: 'common',    weight: 30 },
  { id: 'card-5',  src: 'Aaron_match_pictures/5.jpg',       name: 'Aaron #5',        rarity: 'uncommon',  weight: 15 },
  { id: 'card-6',  src: 'Aaron_match_pictures/6.jpg',       name: 'Aaron #6',        rarity: 'uncommon',  weight: 15 },
  { id: 'card-7',  src: 'Aaron_match_pictures/7.jpg',       name: 'Aaron #7',        rarity: 'uncommon',  weight: 15 },
  { id: 'card-8',  src: 'Aaron_match_pictures/8.jpg',       name: 'Aaron #8',        rarity: 'rare',      weight: 7  },
  { id: 'card-9',  src: 'Aaron_match_pictures/9.jpg',       name: 'Aaron #9',        rarity: 'rare',      weight: 7  },
  { id: 'card-10', src: 'Aaron_match_pictures/10.jpg',      name: 'Aaron #10',       rarity: 'rare',      weight: 7  },
  { id: 'card-11', src: 'Aaron_match_pictures/11.png',      name: 'Aaron #11',       rarity: 'epic',      weight: 3  },
  { id: 'card-12', src: 'Aaron_match_pictures/12.png',      name: 'Aaron #12',       rarity: 'epic',      weight: 3  },
  { id: 'card-cl', src: 'Aaron_match_pictures/Clicker.png', name: 'Aaron (Legend)',  rarity: 'legendary', weight: 2  },
];
const CARD_RARITY_COLOR = {
  common:    '#888',
  uncommon:  '#2ecc71',
  rare:      '#3498db',
  epic:      '#9b59b6',
  legendary: '#f1c40f',
};

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function updateMatchLabels() {
  const reward = (matchPairs + 1) * 45 + Math.floor(state.aps / 2);
  matchStatusEl.textContent = matchPairs + ' / 5 pairs';
  matchRewardEl.textContent = 'next +' + fmt(reward);
}

function buildMatchGame() {
  matchTiles = shuffle([...MATCH_IMAGES, ...MATCH_IMAGES]).map((img, index) => ({
    img,
    index,
    matched: false,
  }));
  matchFirst = null;
  matchLocked = false;
  matchPairs = 0;
  matchBoard.innerHTML = '';
  matchTiles.forEach(tile => {
    const btn = document.createElement('button');
    btn.className = 'match-tile';
    btn.type = 'button';

    const label = document.createElement('span');
    label.className = 'match-tile-label';
    label.textContent = '?';

    const photo = document.createElement('img');
    photo.src = tile.img.src;
    photo.style.objectPosition = tile.img.pos;
    photo.className = 'match-tile-img';
    photo.draggable = false;

    btn.append(label, photo);
    btn.addEventListener('click', () => revealMatchTile(tile.index));
    matchBoard.appendChild(btn);
  });
  updateMatchLabels();
}

function revealMatchTile(index) {
  if (matchLocked) return;
  const tile = matchTiles[index];
  const btn = matchBoard.children[index];
  if (tile.matched || btn.classList.contains('revealed')) return;
  btn.classList.add('revealed');

  if (matchFirst === null) {
    matchFirst = index;
    return;
  }

  const firstTile = matchTiles[matchFirst];
  const firstBtn = matchBoard.children[matchFirst];
  if (firstTile.img.src === tile.img.src) {
    tile.matched = true;
    firstTile.matched = true;
    btn.classList.add('matched');
    firstBtn.classList.add('matched');
    matchPairs++;
    state.minigames.matchPairs++;
    const paid = awardAarons(matchPairs * 45 + Math.floor(state.aps / 2), true);
    matchRewardEl.textContent = '+' + fmt(paid) + ' aarons';
    matchFirst = null;
    if (matchPairs === 5) {
      state.minigames.matchWins++;
      const bonus = awardAarons(450 + Math.floor(state.aps * 2), true);
      matchStatusEl.textContent = 'cleared +' + fmt(bonus);
      save();
      checkAchievements();
    } else {
      updateMatchLabels();
    }
    return;
  }

  matchLocked = true;
  setTimeout(() => {
    btn.classList.remove('revealed');
    firstBtn.classList.remove('revealed');
    matchFirst = null;
    matchLocked = false;
  }, 650);
}

// ── AARON SLOTS ────────────────────────────────────────────────────────────────
const SLOT_CELL_H   = 90;   // px — must match CSS .slot-cell height
const SLOT_NUM_IMGS = 5;
const SLOT_STRIP_REPS = 30; // 150 images per strip — resets after each spin

const MEGA_COLS      = 10;
const MEGA_CELL_H    = 60;
const MEGA_REPS      = 40;
const megaStrips     = new Array(MEGA_COLS).fill(null);
const megaStripPos   = new Array(MEGA_COLS).fill(0);
let   megaSpinning   = false;

const slotStrips   = [null, null, null];
const slotStripPos = [0, 0, 0]; // absolute index of center image per strip
let slotsSpinning  = false;
let nearMissReel   = -1;  // which reel gets the 1-cell visual offset
let nearMissDir    =  1;  // +1 = jackpot img goes to top row, -1 = bottom row
let slotsWinStreak  = 0;
let slotsLossStreak = 0;

function buildSlotStrips() {
  for (let col = 0; col < 3; col++) {
    const stripEl = document.getElementById('slot-strip-' + col);
    slotStrips[col] = stripEl;
    stripEl.innerHTML = '';
    for (let r = 0; r < SLOT_STRIP_REPS; r++) {
      SLOT_IMAGES.forEach(img => {
        const cell = document.createElement('div');
        cell.className = 'slot-cell';
        const photo = document.createElement('img');
        photo.src = img.src;
        photo.style.objectPosition = img.pos;
        photo.draggable = false;
        cell.appendChild(photo);
        stripEl.appendChild(cell);
      });
    }
    // start at mid-strip, each column on a different image so they look distinct
    const initImg = (col + 1) % SLOT_NUM_IMGS;
    const absIdx  = Math.floor(SLOT_STRIP_REPS / 2) * SLOT_NUM_IMGS + initImg;
    stripEl.style.transition = 'none';
    stripEl.style.transform  = `translateY(${-(absIdx - 1) * SLOT_CELL_H}px)`;
    slotStripPos[col] = absIdx;
  }
}

function spinSlotStrip(col, resultImgIdx, duration, onStop) {
  const stripEl       = slotStrips[col];
  const currentAbsIdx = slotStripPos[col];
  const extraRots     = 5 + col * 2;

  // near-miss: bake the 1-cell offset into the spin itself so no post-landing jump occurs
  const landIdx = col === nearMissReel
    ? (resultImgIdx + nearMissDir + SLOT_NUM_IMGS) % SLOT_NUM_IMGS
    : resultImgIdx;

  const targetAbsIdx = (Math.floor(currentAbsIdx / SLOT_NUM_IMGS) + extraRots)
                       * SLOT_NUM_IMGS + landIdx;
  const targetY      = -(targetAbsIdx - 1) * SLOT_CELL_H;

  stripEl.classList.add('slot-strip-spinning');
  stripEl.style.transition = `transform ${duration}ms cubic-bezier(0.04,0.9,0.18,1), filter 0.3s`;
  stripEl.style.transform  = `translateY(${targetY}px)`;

  setTimeout(() => stripEl.classList.remove('slot-strip-spinning'), duration - 280);

  setTimeout(() => {
    const resetAbsIdx = Math.floor(SLOT_STRIP_REPS / 2) * SLOT_NUM_IMGS + landIdx;
    stripEl.style.transition = 'none';
    stripEl.style.transform  = `translateY(${-(resetAbsIdx - 1) * SLOT_CELL_H}px)`;
    slotStripPos[col]        = resetAbsIdx;
    onStop();
  }, duration);
}

function computeNearMiss(rawResults) {
  const counts = {};
  rawResults.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const maxMatch = Math.max(...Object.values(counts));

  let spinTargets    = [...rawResults];
  let displayResults = [...rawResults];
  nearMissReel = -1;
  nearMissDir  = Math.random() < 0.5 ? 1 : -1;

  if (maxMatch === 3) {
    // true jackpot — no near-miss, leave as-is
  } else if (maxMatch === 2 && Math.random() < 0.35) {
    // 2-match → show jackpot image just off-payline on the odd reel
    const matchImg = parseInt(Object.keys(counts).find(k => counts[k] === 2), 10);
    const oddReel  = rawResults.findIndex(r => r !== matchImg);
    spinTargets[oddReel]    = matchImg;
    nearMissReel            = oddReel;
    displayResults          = [...rawResults];
    displayResults[oddReel] = (matchImg + nearMissDir + SLOT_NUM_IMGS) % SLOT_NUM_IMGS;
  }

  return { spinTargets, displayResults };
}

function startSlotsClickTicker(totalDuration) {
  const t0 = Date.now();
  function next() {
    const elapsed = Date.now() - t0;
    if (elapsed >= totalDuration) return;
    playClickSound();
    const prog  = Math.min(1, elapsed / totalDuration);
    const delay = Math.round(55 + prog * prog * 300); // 55 ms fast → 355 ms slow
    setTimeout(next, delay);
  }
  next();
}

function slotsFireConfetti(cx, cy, count) {
  for (let i = 0; i < count; i++) {
    const p     = document.createElement('div');
    p.className = 'slots-confetti-piece';
    const angle = Math.random() * Math.PI * 2;
    const dist  = 80 + Math.random() * 320;
    p.style.left       = cx + 'px';
    p.style.top        = cy + 'px';
    p.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    p.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
    p.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
    p.style.setProperty('--dr', (Math.random() * 900 - 450) + 'deg');
    p.style.setProperty('--dur', (1.1 + Math.random() * 0.9) + 's');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2200);
  }
}

function triggerSlotsJackpot(results, onComplete) {
  // violent repeating shake
  const machine = document.getElementById('slots-machine');
  for (let i = 0; i < 7; i++) {
    setTimeout(() => {
      machine.classList.remove('slot-machine-shake');
      void machine.offsetWidth;
      machine.classList.add('slot-machine-shake');
    }, i * 140);
  }
  setTimeout(() => machine.classList.remove('slot-machine-shake'), 7 * 140 + 200);

  // full-screen flash
  const flash = document.createElement('div');
  flash.className = 'slots-jackpot-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1400);

  // JACKPOT! text
  const text = document.createElement('div');
  text.className = 'slots-jackpot-text';
  text.textContent = 'JACKPOT!!!';
  document.body.appendChild(text);
  setTimeout(() => text.remove(), 3200);

  // glow all three reels
  [0, 1, 2].forEach(col => {
    const win = document.querySelector('#slot-col-' + col + ' .slot-window');
    win.classList.add('slot-win-glow');
    setTimeout(() => win.classList.remove('slot-win-glow'), 3200);
  });

  // confetti from machine center
  const cardRect = document.getElementById('slots-card').getBoundingClientRect();
  slotsFireConfetti(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2, 120);

  // second burst from random corners
  setTimeout(() => slotsFireConfetti(
    cardRect.left + Math.random() * cardRect.width,
    cardRect.top  + Math.random() * cardRect.height, 60), 400);

  if (!isMuted) { robloxWinAudioSrc.currentTime = 0; robloxWinAudioSrc.play().catch(() => {}); }

  if (onComplete) setTimeout(onComplete, 1400);
}

function triggerSlotsWin(results, matchImgIdx) {
  if (!isMuted) { robloxWinAudioSrc.currentTime = 0; robloxWinAudioSrc.play().catch(() => {}); }
  const card = document.getElementById('slots-card');
  card.style.position = 'relative';
  const text = document.createElement('div');
  text.className = 'slots-win-text';
  text.textContent = 'WIN!';
  card.appendChild(text);
  setTimeout(() => text.remove(), 2200);

  results.forEach((r, col) => {
    if (r === matchImgIdx) {
      const win = document.querySelector('#slot-col-' + col + ' .slot-window');
      win.classList.add('slot-win-glow');
      setTimeout(() => win.classList.remove('slot-win-glow'), 2200);
    }
  });
}

function triggerSlotsLose() {
  const machine = document.getElementById('slots-machine');
  machine.classList.add('slot-lose-shake');
  setTimeout(() => machine.classList.remove('slot-lose-shake'), 450);
}

function showBadLuckPopup() {
  if (document.getElementById('bad-luck-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'bad-luck-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 15000;
    background: rgba(0,0,0,0.88);
    display: flex; align-items: center; justify-content: center;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background: #0f0c0a; border: 3px solid #5a3b27;
    padding: 36px 32px; max-width: 360px; width: 90%;
    text-align: center; font-family: 'Press Start 2P', monospace;
  `;

  const title = document.createElement('div');
  title.textContent = 'looks like you have bad luck';
  title.style.cssText = 'font-size: 13px; color: #e8caa7; margin-bottom: 24px; line-height: 1.8;';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display: flex; gap: 12px; justify-content: center; margin-top: 8px;';

  const dangBtn = document.createElement('button');
  dangBtn.textContent = 'Dang';
  dangBtn.style.cssText = `
    font-family: 'Press Start 2P', monospace; font-size: 10px;
    background: #2a1a08; border: 2px solid #7a5020; color: #e8caa7;
    padding: 10px 18px; cursor: pointer;
  `;
  dangBtn.addEventListener('click', () => {
    overlay.remove();
    if (!state.achievements['bad-luck']) {
      state.achievements['bad-luck'] = true;
      const a = ACHIEVEMENTS.find(x => x.id === 'bad-luck');
      if (a) showAchievementToast(a);
      updateAchievementCards();
      save();
    }
  });

  const hateBtn = document.createElement('button');
  hateBtn.textContent = 'I hate this game';
  hateBtn.style.cssText = `
    font-family: 'Press Start 2P', monospace; font-size: 10px;
    background: #1a0808; border: 2px solid #5a1010; color: #cc4444;
    padding: 10px 18px; cursor: pointer;
  `;
  hateBtn.addEventListener('click', () => {
    window.close();
  });

  btnRow.append(dangBtn, hateBtn);
  box.append(title, btnRow);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

// ── UNSKIPPABLE AD ────────────────────────────────────────────────────────────
const AD_FILES = ['ads/AD1.mkv', 'ads/AD2.mkv', 'ads/AD3.mkv'];
let activeAdVideo = null; // for K / Space playback toggle

// K and Space toggle the ad video play/pause
document.addEventListener('keydown', e => {
  if (!activeAdVideo) return;
  if (e.code === 'KeyK' || e.code === 'Space') {
    e.preventDefault();
    activeAdVideo.paused ? activeAdVideo.play().catch(() => {}) : activeAdVideo.pause();
  }
});

function showAdPopup(bet) {
  if (document.getElementById('ad-overlay')) return;

  const adIdx = state.minigames.nextAd % AD_FILES.length;
  state.minigames.adPending    = true;
  state.minigames.adCurrentIdx = adIdx;
  state.minigames.adRewardBet  = bet;
  save();

  const overlay = document.createElement('div');
  overlay.id = 'ad-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 25000;
    background: #000;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px;
  `;

  const topBar = document.createElement('div');
  topBar.style.cssText = `
    font-family: 'Press Start 2P', monospace; font-size: 7px;
    color: #888; letter-spacing: 1px; text-align: center;
  `;
  topBar.textContent = 'AD ' + (adIdx + 1) + ' / ' + AD_FILES.length + '   —   watch the full ad to claim your JACKPOT';

  const vid = document.createElement('video');
  vid.src = AD_FILES[adIdx];
  vid.style.cssText = 'max-width: 92vw; max-height: 72vh; display: block; background: #111; cursor: pointer;';
  activeAdVideo = vid;

  // prevent seeking
  let lastSafe = 0;
  vid.addEventListener('timeupdate', () => { lastSafe = vid.currentTime; });
  vid.addEventListener('seeking',    () => { vid.currentTime = lastSafe; });

  const progWrap = document.createElement('div');
  progWrap.style.cssText = `
    width: 80%; max-width: 620px; height: 7px;
    background: #1a1208; border: 1px solid #3f3026; border-radius: 4px; overflow: hidden;
  `;
  const progBar = document.createElement('div');
  progBar.style.cssText = 'height: 100%; width: 0%; background: #e8caa7;';
  progWrap.appendChild(progBar);
  vid.addEventListener('timeupdate', () => {
    if (vid.duration) progBar.style.width = (vid.currentTime / vid.duration * 100) + '%';
  });

  const rewardLbl = document.createElement('div');
  rewardLbl.style.cssText = `
    font-family: 'Press Start 2P', monospace; font-size: 7px;
    color: #5a3b27; letter-spacing: 1px;
  `;
  rewardLbl.textContent = 'reward: ' + fmt(bet * 10) + ' aarons (jackpot!)';

  const hintLbl = document.createElement('div');
  hintLbl.style.cssText = `
    font-family: 'Press Start 2P', monospace; font-size: 6px;
    color: #3a2a18; letter-spacing: 1px;
  `;
  hintLbl.textContent = '[SPACE] or [K] to pause/resume';

  // click-to-play prompt shown when autoplay is blocked
  const playPrompt = document.createElement('div');
  playPrompt.style.cssText = `
    position: absolute; font-family: 'Press Start 2P', monospace;
    font-size: 11px; color: #e8caa7; background: rgba(0,0,0,0.7);
    padding: 16px 24px; border: 2px solid #5a3b27; cursor: pointer;
    display: none;
  `;
  playPrompt.textContent = '▶  CLICK TO START AD';
  overlay.style.position = 'fixed';

  overlay.append(topBar, vid, progWrap, rewardLbl, hintLbl);
  overlay.appendChild(playPrompt);
  document.body.appendChild(overlay);

  // try autoplay; if blocked show click-to-play
  const tryPlay = () => vid.play().catch(() => {
    playPrompt.style.display = 'block';
  });
  tryPlay();

  // clicking the prompt or the video starts playback
  playPrompt.addEventListener('click', () => {
    vid.play().catch(() => {});
    playPrompt.style.display = 'none';
  });
  vid.addEventListener('click', () => {
    if (vid.paused) { vid.play().catch(() => {}); playPrompt.style.display = 'none'; }
  });

  // also start on first user interaction anywhere on the overlay
  overlay.addEventListener('pointerdown', () => {
    if (vid.paused && vid.readyState >= 2) {
      vid.play().catch(() => {});
      playPrompt.style.display = 'none';
    }
  }, { once: true });

  vid.addEventListener('ended', () => {
    activeAdVideo = null;
    state.minigames.adPending = false;
    state.minigames.nextAd    = (adIdx + 1) % AD_FILES.length;
    const reward = state.minigames.adRewardBet * 10;
    awardAarons(reward, true);
    save();

    overlay.innerHTML = '';
    overlay.style.justifyContent = 'center';

    const msg = document.createElement('div');
    msg.style.cssText = `
      font-family: 'Press Start 2P', monospace; font-size: 16px;
      color: #ffdd00; text-align: center; line-height: 2;
      text-shadow: 0 0 18px #ffaa00;
    `;
    msg.textContent = 'JACKPOT!';

    const sub = document.createElement('div');
    sub.style.cssText = `
      font-family: 'Press Start 2P', monospace; font-size: 9px;
      color: #e8caa7; text-align: center; margin: 10px 0 28px;
    `;
    sub.textContent = '+' + fmt(reward) + ' aarons';

    const collectBtn = document.createElement('button');
    collectBtn.textContent = 'COLLECT';
    collectBtn.style.cssText = `
      font-family: 'Press Start 2P', monospace; font-size: 10px;
      background: #2a1a08; border: 2px solid #c87020; color: #ffdd00;
      padding: 12px 28px; cursor: pointer;
    `;
    collectBtn.addEventListener('click', () => overlay.remove());

    overlay.append(msg, sub, collectBtn);

    if (!isMuted) { robloxWinAudioSrc.currentTime = 0; robloxWinAudioSrc.play().catch(() => {}); }
    const cardRect = document.getElementById('slots-card').getBoundingClientRect();
    slotsFireConfetti(cardRect.left + cardRect.width / 2, cardRect.top + cardRect.height / 2, 140);
  });

  vid.addEventListener('error', () => {
    activeAdVideo = null;
    topBar.textContent = 'ad failed to load — jackpot awarded!';
    setTimeout(() => vid.dispatchEvent(new Event('ended')), 800);
  });
}

function resumeAdIfPending() {
  if (!state.minigames.adPending) return;
  const bet = state.minigames.adRewardBet || 0;
  // restore to the interrupted ad index before calling showAdPopup
  state.minigames.nextAd = state.minigames.adCurrentIdx;
  // wait for first user gesture so autoplay isn't blocked on resume
  const startOnGesture = () => {
    document.removeEventListener('pointerdown', startOnGesture);
    document.removeEventListener('keydown', startOnGesture);
    showAdPopup(bet);
  };
  // show immediately — browser may allow autoplay if triggered fast enough
  setTimeout(() => showAdPopup(bet), 400);
}

// ── CAPTCHA POPUP ─────────────────────────────────────────────────────────────
const CAPTCHA_DECOYS = ['🚗','🌊','🏠','☁️','🚦','🌳','🐦','🍕','🎮','🛸','🔥','💧','🏔️','🌺','🐟','🎲','🍔','✈️'];

function showCaptchaPopup(topText) {
  if (document.getElementById('captcha-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'captcha-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 20000;
    background: rgba(0,0,0,0.92);
    display: flex; align-items: center; justify-content: center;
  `;

  const box = document.createElement('div');
  box.style.cssText = `
    background: #f9f9f9; border: 2px solid #ccc; border-radius: 4px;
    padding: 24px 28px; max-width: 380px; width: 92%;
    font-family: Arial, sans-serif; position: relative; color: #333;
  `;

  const xBtn = document.createElement('button');
  xBtn.textContent = 'X';
  xBtn.style.cssText = `
    position: absolute; top: 8px; right: 10px; background: none; border: none;
    font-size: 16px; cursor: pointer; color: #888; line-height: 1;
  `;
  xBtn.addEventListener('click', () => window.close());

  if (topText) {
    const msg = document.createElement('div');
    msg.textContent = topText;
    msg.style.cssText = `
      font-family: 'Press Start 2P', monospace; font-size: 9px;
      color: #5a3b27; margin-bottom: 16px; line-height: 1.8; text-align: center;
    `;
    box.appendChild(msg);
  }

  const phase1 = document.createElement('div');
  phase1.id = 'captcha-phase1';

  const checkRow = document.createElement('div');
  checkRow.style.cssText = `
    display: flex; align-items: center; gap: 14px;
    border: 1px solid #ccc; border-radius: 4px; padding: 16px 18px;
    background: #fff; margin-bottom: 12px;
  `;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.style.cssText = 'width: 24px; height: 24px; cursor: pointer; accent-color: #1a73e8;';

  const checkLabel = document.createElement('label');
  checkLabel.textContent = "I'm not a robot";
  checkLabel.style.cssText = 'font-size: 14px; cursor: pointer; user-select: none;';

  const rcLogo = document.createElement('div');
  rcLogo.textContent = '🤖';
  rcLogo.style.cssText = 'margin-left: auto; font-size: 28px;';

  checkRow.append(checkbox, checkLabel, rcLogo);
  phase1.appendChild(checkRow);

  const smallPrint = document.createElement('div');
  smallPrint.textContent = 'reCAPTCHA  Privacy - Terms';
  smallPrint.style.cssText = 'font-size: 10px; color: #aaa; text-align: right;';
  phase1.appendChild(smallPrint);

  box.appendChild(xBtn);
  box.appendChild(phase1);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  checkbox.addEventListener('change', () => {
    if (!checkbox.checked) return;
    setTimeout(() => showCaptchaPhase2(box, phase1), 400);
  });
}

function showCaptchaPhase2(box, phase1) {
  phase1.remove();

  const aaronImgSrc = 'Aaron_match_pictures/Clicker.png';
  const totalCells = 9;
  const numAarons = 3 + Math.floor(Math.random() * 2);
  const aaronIdxs = new Set();
  while (aaronIdxs.size < numAarons) {
    aaronIdxs.add(Math.floor(Math.random() * totalCells));
  }

  const decoyPool = [...CAPTCHA_DECOYS].sort(() => Math.random() - 0.5);

  const title = document.createElement('div');
  title.textContent = 'Select all images with Aaron';
  title.style.cssText = `
    font-size: 13px; font-weight: bold; margin-bottom: 12px;
    background: #1a73e8; color: #fff; padding: 10px 14px; margin: -24px -28px 16px;
    border-radius: 2px 2px 0 0;
  `;

  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 14px;
  `;

  const selectedCells = new Set();
  let decoyIdx = 0;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.style.cssText = `
      width: 100%; aspect-ratio: 1; border: 3px solid transparent;
      cursor: pointer; border-radius: 2px; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      background: #eee; font-size: 42px; user-select: none;
      transition: border-color 0.15s;
    `;

    if (aaronIdxs.has(i)) {
      const img = document.createElement('img');
      img.src = aaronImgSrc;
      img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
      cell.appendChild(img);
    } else {
      cell.textContent = decoyPool[decoyIdx++] || '?';
    }

    cell.addEventListener('click', () => {
      if (selectedCells.has(i)) {
        selectedCells.delete(i);
        cell.style.borderColor = 'transparent';
      } else {
        selectedCells.add(i);
        cell.style.borderColor = '#1a73e8';
      }
    });

    grid.appendChild(cell);
  }

  const verifyBtn = document.createElement('button');
  verifyBtn.textContent = 'VERIFY';
  verifyBtn.style.cssText = `
    font-family: Arial, sans-serif; font-size: 13px; font-weight: bold;
    background: #1a73e8; color: #fff; border: none; border-radius: 4px;
    padding: 10px 24px; cursor: pointer; float: right;
  `;

  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'Skip';
  skipBtn.style.cssText = `
    font-family: Arial, sans-serif; font-size: 13px;
    background: none; color: #1a73e8; border: none;
    padding: 10px 12px; cursor: pointer; float: right; margin-right: 8px;
  `;
  skipBtn.addEventListener('click', () => window.close());

  verifyBtn.addEventListener('click', () => {
    const correctSelections = [...selectedCells].every(i => aaronIdxs.has(i));
    const allAaronsSelected = [...aaronIdxs].every(i => selectedCells.has(i));
    const passed = correctSelections && allAaronsSelected;

    if (passed) {
      const overlay = document.getElementById('captcha-overlay');
      if (overlay) overlay.remove();
      if (!state.achievements['passed-captcha']) {
        state.achievements['passed-captcha'] = true;
        const a = ACHIEVEMENTS.find(x => x.id === 'passed-captcha');
        if (a) showAchievementToast(a);
        updateAchievementCards();
        save();
      }
    } else {
      verifyBtn.textContent = 'WRONG';
      verifyBtn.style.background = '#cc2222';
      grid.style.opacity = '0.4';
      grid.style.pointerEvents = 'none';
      setTimeout(() => window.close(), 1200);
    }
  });

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'overflow: hidden; margin-top: 4px;';
  btnRow.append(verifyBtn, skipBtn);

  box.insertBefore(title, box.firstChild);
  box.appendChild(grid);
  box.appendChild(btnRow);
}
function onAllSlotsStopped(rawResults, displayResults, bet) {
  slotsSpinning = false;
  document.getElementById('slots-spin').disabled = false;

  // payout determined by actual roll, not the near-miss visual
  const counts  = {};
  rawResults.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const maxMatch = Math.max(...Object.values(counts));

  let payout  = 0;
  let winType = 'none';

  if (maxMatch === 3) {
    payout  = bet * 10;
    winType = 'jackpot';
    state.minigames.slotsJackpots++;
    state.minigames.slotsWins++;
  } else if (maxMatch === 2) {
    payout  = bet * 3;
    winType = 'win';
    state.minigames.slotsWins++;
  }

  const statusEl  = document.getElementById('slots-status');
  const streakEl  = document.getElementById('slots-streak');

  if (payout > 0) {
    slotsWinStreak++;
    slotsLossStreak = 0;
    state.minigames.slotsStreak   = slotsWinStreak;
    state.minigames.slotsBestStreak = Math.max(state.minigames.slotsBestStreak, slotsWinStreak);
    awardAarons(payout, true);
    const net = payout - bet;
    statusEl.textContent = (net >= 0 ? '+' : '') + fmt(net) + ' aarons';
  } else {
    slotsWinStreak = 0;
    slotsLossStreak++;
    state.minigames.slotsStreak = 0;
    statusEl.textContent = '-' + fmt(bet) + ' aarons';
    if (slotsLossStreak === 3 && !state.achievements['bad-luck']) {
      state.achievements['bad-luck'] = true;
      const a = ACHIEVEMENTS.find(x => x.id === 'bad-luck');
      if (a) showAchievementToast(a);
      updateAchievementCards();
    }
    save();
  }

  streakEl.textContent = 'streak ' + slotsWinStreak;
  streakEl.className   = slotsWinStreak >= 5 ? 'slots-streak-fire'
                       : slotsWinStreak >= 3 ? 'slots-streak-hot'
                       : '';

  if (winType === 'jackpot') {
    triggerSlotsJackpot(displayResults, () => showDoubleOrNothing(payout));
  } else if (winType === 'win') {
    const matchImgIdx = parseInt(Object.keys(counts).find(k => counts[k] === 2), 10);
    triggerSlotsWin(displayResults, matchImgIdx);
  } else {
    triggerSlotsLose();
  }

  checkAchievements();
}

// Weighted slot outcome: jackpot 9%, 2-match 33%, bust 58%
function rollSlotResults() {
  if (DEV_MODE && devTools.alwaysJackpotSlots) return [0, 0, 0];
  if (DEV_MODE && devTools.alwaysWinSlots) return [0, 0, 1];

  const r = Math.random();
  if (r < 0.09) {
    // jackpot — all 3 identical
    const img = Math.floor(Math.random() * SLOT_NUM_IMGS);
    return [img, img, img];
  } else if (r < 0.42) {
    // 2-match — one reel differs
    const matchImg = Math.floor(Math.random() * SLOT_NUM_IMGS);
    const oddReel  = Math.floor(Math.random() * 3);
    let oddImg;
    do { oddImg = Math.floor(Math.random() * SLOT_NUM_IMGS); } while (oddImg === matchImg);
    const res = [matchImg, matchImg, matchImg];
    res[oddReel] = oddImg;
    return res;
  } else {
    // bust — all 3 different (shuffle pick)
    const pool = Array.from({ length: SLOT_NUM_IMGS }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return [pool[0], pool[1], pool[2]];
  }
}

function spinSlots() {
  if (slotsSpinning) return;
  const betEl = document.getElementById('slots-bet');
  const bet   = Math.max(1, Math.floor(Number(betEl.value) || 1));
  if (bet > state.aarons) {
    document.getElementById('slots-status').textContent = 'not enough aarons!';
    return;
  }

  state.aarons -= bet;
  updateStats();
  updateCards();

  slotsSpinning = true;
  document.getElementById('slots-spin').disabled = true;
  document.getElementById('slots-status').textContent = 'spinning...';
  state.minigames.slotsPlays++;

  const rawResults                      = rollSlotResults();
  const { spinTargets, displayResults } = computeNearMiss(rawResults);
  const DURATIONS = [1900, 2650, 3400];

  startSlotsClickTicker(DURATIONS[2]);

  let stopped = 0;
  for (let col = 0; col < 3; col++) {
    spinSlotStrip(col, spinTargets[col], DURATIONS[col], () => {
      stopped++;
      if (stopped === 3) onAllSlotsStopped(rawResults, displayResults, bet);
    });
  }
}

// ── DOUBLE OR NOTHING ──────────────────────────────────────────────────────────
const DON_CELL_H    = 66;
const DON_NUM_IMGS  = 3;   // only 3 images → better odds (1/9 jackpot vs 1/25)
const DON_STRIP_REPS = 20;
const DON_IMAGES    = SLOT_IMAGES.slice(0, 3);

const donStrips   = [null, null, null];
const donStripPos = [0, 0, 0];

function buildDonStrips() {
  for (let col = 0; col < 3; col++) {
    const stripEl = document.getElementById('don-strip-' + col);
    if (!stripEl) return;
    donStrips[col] = stripEl;
    stripEl.innerHTML = '';
    for (let r = 0; r < DON_STRIP_REPS; r++) {
      DON_IMAGES.forEach(img => {
        const cell  = document.createElement('div');
        cell.className = 'don-cell';
        const photo = document.createElement('img');
        photo.src   = img.src;
        photo.style.objectPosition = img.pos;
        photo.draggable = false;
        cell.appendChild(photo);
        stripEl.appendChild(cell);
      });
    }
    const initIdx = Math.floor(DON_STRIP_REPS / 2) * DON_NUM_IMGS + col;
    stripEl.style.transition = 'none';
    stripEl.style.transform  = `translateY(${-(initIdx - 1) * DON_CELL_H}px)`;
    donStripPos[col] = initIdx;
  }
}

function spinDonStrip(col, resultImgIdx, duration, onStop) {
  const stripEl       = donStrips[col];
  const currentAbsIdx = donStripPos[col];
  const extraRots     = 4 + col * 2;
  const targetAbsIdx  = (Math.floor(currentAbsIdx / DON_NUM_IMGS) + extraRots)
                        * DON_NUM_IMGS + resultImgIdx;
  const targetY       = -(targetAbsIdx - 1) * DON_CELL_H;

  stripEl.classList.add('slot-strip-spinning');
  stripEl.style.transition = `transform ${duration}ms cubic-bezier(0.04,0.9,0.18,1), filter 0.3s`;
  stripEl.style.transform  = `translateY(${targetY}px)`;
  setTimeout(() => stripEl.classList.remove('slot-strip-spinning'), duration - 200);

  setTimeout(() => {
    const resetAbsIdx = Math.floor(DON_STRIP_REPS / 2) * DON_NUM_IMGS + resultImgIdx;
    stripEl.style.transition = 'none';
    stripEl.style.transform  = `translateY(${-(resetAbsIdx - 1) * DON_CELL_H}px)`;
    donStripPos[col] = resetAbsIdx;
    onStop();
  }, duration);
}

function triggerInsaneCoinShower() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const origins = [
    [W * 0.5, H * 0.35],
    [W * 0.1, H * 0.15],
    [W * 0.9, H * 0.15],
    [W * 0.15, H * 0.8],
    [W * 0.85, H * 0.8],
    [W * 0.5,  H * 0.5],
  ];

  origins.forEach(([cx, cy], i) => {
    setTimeout(() => slotsFireConfetti(cx, cy, 80), i * 180);
  });

  // coin rain from the top across the whole screen
  for (let i = 0; i < 120; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'slots-confetti-piece slots-coin-rain';
      p.style.left = (Math.random() * W) + 'px';
      p.style.top  = '-24px';
      const sz = 10 + Math.floor(Math.random() * 12);
      p.style.width  = sz + 'px';
      p.style.height = sz + 'px';
      p.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      p.style.setProperty('--dx', (Math.random() - 0.5) * 120 + 'px');
      p.style.setProperty('--dy', (H + 40) + 'px');
      p.style.setProperty('--dr', (Math.random() * 1080) + 'deg');
      p.style.setProperty('--dur', (2.2 + Math.random() * 1.6) + 's');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 4200);
    }, Math.random() * 2200);
  }

  // extra late burst
  setTimeout(() => origins.slice(0, 4).forEach(([cx, cy], i) =>
    setTimeout(() => slotsFireConfetti(cx, cy, 60), i * 120)
  ), 1800);

  if (!isMuted) { happyAudioSrc.currentTime = 0; happyAudioSrc.play().catch(() => {}); }
}

function spinDon(jackpotAmount) {
  const riskBtn = document.getElementById('don-risk-btn');
  const takeBtn = document.getElementById('don-take-btn');
  const msgEl   = document.getElementById('don-msg');
  if (!riskBtn) return;

  riskBtn.disabled = true;
  takeBtn.disabled = true;
  msgEl.textContent = '';

  const results   = [0, 1, 2].map(() => Math.floor(Math.random() * DON_NUM_IMGS));
  const DURATIONS = [1500, 2100, 2700];

  startSlotsClickTicker(DURATIONS[2]);

  let stopped = 0;
  for (let col = 0; col < 3; col++) {
    spinDonStrip(col, results[col], DURATIONS[col], () => {
      stopped++;
      if (stopped < 3) return;

      // Evaluate
      const counts   = {};
      results.forEach(r => counts[r] = (counts[r] || 0) + 1);
      const maxMatch = Math.max(...Object.values(counts));

      if (maxMatch === 3) {
        // DOUBLE WIN
        awardAarons(jackpotAmount, true);   // award jackpot again (total = 2×)
        msgEl.className = 'don-msg-jackpot';
        msgEl.textContent = 'DOUBLE WIN! +' + fmt(jackpotAmount * 2) + '!';
        if (!isMuted) { jackpotAudioSrc.currentTime = 0; jackpotAudioSrc.play().catch(() => {}); }
        [0, 1, 2].forEach(c => {
          const w = document.querySelector('#don-col-' + c + ' .don-window');
          if (w) w.classList.add('slot-win-glow');
        });
        triggerInsaneCoinShower();
        setTimeout(() => closeDon(), 5000);
      } else if (maxMatch === 2) {
        // SAFE — keep original jackpot (already awarded, no change)
        msgEl.className = 'don-msg-safe';
        msgEl.textContent = 'SAFE! +' + fmt(jackpotAmount) + ' kept';
        const matchImg = parseInt(Object.keys(counts).find(k => counts[k] === 2), 10);
        results.forEach((r, c) => {
          if (r === matchImg) {
            const w = document.querySelector('#don-col-' + c + ' .don-window');
            if (w) { w.classList.add('slot-win-glow'); setTimeout(() => w.classList.remove('slot-win-glow'), 2000); }
          }
        });
        setTimeout(() => closeDon(), 3000);
      } else {
        // BUST — lose the jackpot
        state.aarons = Math.max(0, state.aarons - jackpotAmount);
        updateStats();
        updateCards();
        save();
        msgEl.className = 'don-msg-bust';
        msgEl.textContent = 'BUSTED! -' + fmt(jackpotAmount);
        if (!isMuted) { screamAudioSrc.currentTime = 0; screamAudioSrc.play().catch(() => {}); }
        const machine = document.getElementById('don-machine');
        if (machine) { machine.classList.add('slot-lose-shake'); setTimeout(() => machine.classList.remove('slot-lose-shake'), 500); }
        setTimeout(() => closeDon(), 3000);
      }

      takeBtn.textContent = 'CLOSE';
      takeBtn.disabled    = false;
    });
  }
}

function closeDon() {
  const overlay = document.getElementById('don-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.4s';
    overlay.style.opacity    = '0';
    setTimeout(() => overlay.remove(), 420);
  }
}

function showDoubleOrNothing(jackpotAmount) {
  if (document.getElementById('don-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'don-overlay';
  overlay.innerHTML = `
    <div id="don-card">
      <div id="don-header">JACKPOT!</div>
      <div id="don-won">you won <span>${fmt(jackpotAmount)} aarons</span></div>
      <div id="don-question">DOUBLE OR NOTHING?</div>
      <div id="don-machine">
        <div class="don-column" id="don-col-0"><div class="don-window"><div class="don-strip" id="don-strip-0"></div></div></div>
        <div class="don-column" id="don-col-1"><div class="don-window"><div class="don-strip" id="don-strip-1"></div></div></div>
        <div class="don-column" id="don-col-2"><div class="don-window"><div class="don-strip" id="don-strip-2"></div></div></div>
        <div class="don-payline"></div>
      </div>
      <div id="don-msg"></div>
      <div id="don-btns">
        <button id="don-take-btn" class="don-btn don-btn-safe">TAKE IT</button>
        <button id="don-risk-btn" class="don-btn don-btn-risk">DOUBLE UP &#9654;</button>
      </div>
      <div id="don-odds-hint">3 match: ×2 jackpot &nbsp;|&nbsp; 2 match: keep it &nbsp;|&nbsp; 0-1: bust</div>
    </div>
  `;
  document.body.appendChild(overlay);

  buildDonStrips();

  document.getElementById('don-take-btn').addEventListener('click', closeDon);
  document.getElementById('don-risk-btn').addEventListener('click', () => {
    document.getElementById('don-risk-btn').style.display = 'none';
    document.getElementById('don-take-btn').textContent   = 'CLOSE';
    document.getElementById('don-question').textContent   = 'spinning...';
    spinDon(jackpotAmount);
  });
}

buildUpgradeCards();
buildAchievementCards();
achievementList.addEventListener('click', () => {
  state.minigames.achievementClicks = (state.minigames.achievementClicks || 0) + 1;
  checkAchievements();
  save();
});
buildMatchGame();
load();
resumeAdIfPending();
updateStats();
updateCards();
updateAchievementCards();
updateCheatBtnVisibility();
checkAchievements(true);
createDevToolsPanel();
checkForUpdateBanner();
setInterval(checkForUpdateBanner, 10 * 1000);
startFootlongMusicIfAllAchievements();

// bulk buy button wiring
document.querySelectorAll('.bulk-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentBulk = parseInt(btn.dataset.bulk, 10);
    document.querySelectorAll('.bulk-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateCards();
  });
});

document.querySelectorAll('.panel-tab').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.tab));
});

whackStartBtn.addEventListener('click', startWhackGame);
matchNewBtn.addEventListener('click', buildMatchGame);

buildSlotStrips();
document.getElementById('slots-spin').addEventListener('click', spinSlots);
document.querySelectorAll('.slots-pct-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pct    = parseInt(btn.dataset.pct, 10);
    const amount = Math.max(1, Math.floor(state.aarons * pct / 100));
    document.getElementById('slots-bet').value = amount;
  });
});

// ── AARON CROSS THE ROAD ─────────────────────────────────────────────────────
const ROAD_COLS   = 1;   // single tile per hop
const ROAD_ROWS   = 8;   // visible rows (row 0 = start, row 7 = furthest)
const ROAD_CRASH_CHANCE_BASE = 0.18; // per hop, grows with depth
const ROAD_AARON_X_OFFSET = -12;

let roadActive    = false;
let roadHops      = 0;
let roadPot       = 0;
let roadBet       = 0;
let roadPlayerRow = 0; // 0 = start safe row
let roadDead      = false;

function roadRewardForHop(hop) {
  // hop 1 = +2% … grows toward +10% at hop 10+
  const pct = Math.min(10, 2 + (hop - 1) * 0.9);
  return Math.max(1, Math.floor(roadBet * pct / 100));
}

function roadCrashChance(hop) {
  return Math.min(0.55, ROAD_CRASH_CHANCE_BASE + (hop - 1) * 0.025);
}

function buildRoadField() {
  const field = document.getElementById('road-field');
  field.innerHTML = '';
  // rows from top (far) to bottom (near/start)
  for (let row = ROAD_ROWS - 1; row >= 0; row--) {
    const rowEl = document.createElement('div');
    rowEl.className = 'road-row';
    rowEl.dataset.row = row;

    for (let col = 0; col < ROAD_COLS; col++) {
      const tile = document.createElement('div');
      tile.className = 'road-tile';
      tile.dataset.col = col;
      tile.dataset.row = row;

      // pot value label
      const label = document.createElement('div');
      label.className = 'road-tile-label';
      if (row > 0) {
        const gain = roadRewardForHop(row);
        label.textContent = '+' + fmt(gain);
      } else {
        label.textContent = 'START';
      }
      tile.appendChild(label);

      if (row === 0) {
        tile.classList.add('road-start-row');
      }

      tile.addEventListener('click', () => onRoadTileClick(row, col, tile));
      rowEl.appendChild(tile);
    }

    // Aaron on start row
    if (row === roadPlayerRow) {
      rowEl.querySelector('.road-tile[data-col="0"]').classList.add('road-has-aaron');
    }

    field.appendChild(rowEl);
  }
}

function updateRoadField(skipAddAaronClass = false) {
  const field = document.getElementById('road-field');
  for (let row = 0; row < ROAD_ROWS; row++) {
    const rowEl = field.querySelector(`.road-row[data-row="${row}"]`);
    if (!rowEl) continue;
    rowEl.querySelectorAll('.road-tile').forEach(t => {
      t.classList.remove('road-has-aaron', 'road-active-row');
      const label = t.querySelector('.road-tile-label');
      if (row > 0) {
        const gain = roadRewardForHop(row);
        const pct  = Math.min(10, 2 + (row - 1) * 0.9).toFixed(1);
        label.textContent = '+' + fmt(gain) + ' (' + pct + '%)';
      }
    });
    if (row === roadPlayerRow) {
      rowEl.classList.add('road-active-row');
      if (!skipAddAaronClass) rowEl.querySelector('.road-tile[data-col="0"]').classList.add('road-has-aaron');
    }
    rowEl.querySelectorAll('.road-tile').forEach(t => {
      t.classList.toggle('road-tile-locked', parseInt(t.dataset.row) <= roadPlayerRow);
    });
  }
  document.getElementById('road-pot').textContent = 'pot: ' + fmt(roadPot);
}

function setRoadAaronTile(tile) {
  document.querySelectorAll('#road-field .road-has-aaron').forEach(t => t.classList.remove('road-has-aaron'));
  tile.classList.add('road-has-aaron');
}

function getRoadAaronAnchor(tile, fieldRect) {
  const zoom  = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  if (!fieldRect) fieldRect = document.getElementById('road-field').getBoundingClientRect();
  const r = tile.getBoundingClientRect();
  const w = r.width  / zoom;
  const h = r.height / zoom;
  const size    = Math.max(20, Math.min(h - 4, 34));
  const centerX = (r.left - fieldRect.left) / zoom + w / 2;
  const centerY = (r.top  - fieldRect.top)  / zoom + h / 2;
  return { centerX, centerY, size, left: centerX - size / 2, top: centerY - size / 2 };
}

function animateAaronHop(fromTile, toTile, onDone) {
  const field     = document.getElementById('road-field');
  const zoom      = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  const fieldRect = field.getBoundingClientRect();
  const fromR     = fromTile.getBoundingClientRect();
  const toR       = toTile.getBoundingClientRect();

  // Convert all rects to CSS pixels (divide out the zoom)
  const fromLeft = (fromR.left - fieldRect.left) / zoom;
  const fromTop  = (fromR.top  - fieldRect.top)  / zoom;
  const toLeft   = (toR.left   - fieldRect.left) / zoom;
  const toTop    = (toR.top    - fieldRect.top)   / zoom;
  const w        = fromR.width  / zoom;
  const h        = fromR.height / zoom;

  fromTile.classList.remove('road-has-aaron');

  const sprite = document.createElement('div');
  sprite.className = 'aaron-hop-sprite';
  sprite.style.width  = w + 'px';
  sprite.style.height = h + 'px';
  sprite.style.left   = fromLeft + 'px';
  sprite.style.top    = fromTop  + 'px';
  field.appendChild(sprite);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    sprite.style.left = toLeft + 'px';
    sprite.style.top  = toTop  + 'px';
  }));

  setTimeout(() => { sprite.remove(); onDone(); }, 260);
}

function onRoadTileClick(row, col, tile) {
  if (!roadActive || roadDead || row <= roadPlayerRow) return;
  if (row !== roadPlayerRow + 1) return;

  playClickSound();

  const hop         = row;
  const crashChance = roadCrashChance(hop);
  const crashed     = !(DEV_MODE && devTools.noRoadCrashes) && Math.random() < crashChance;
  const currentTile = document.querySelector('#road-field .road-has-aaron');

  if (crashed) {
    roadDead = true;
    roadActive = false;
    roadPlayerRow = row;
    roadHops = row;
    document.getElementById('road-cashout').disabled = true;
    document.getElementById('road-status').textContent = 'CRUSHED! lost ' + fmt(roadPot) + ' aarons';
    document.getElementById('road-pot').textContent = 'pot: 0';
    state.minigames.roadPlays    = (state.minigames.roadPlays    || 0) + 1;
    state.minigames.roadBestHops = Math.max(state.minigames.roadBestHops || 0, roadHops);
    checkAchievements(); save();

    const doEat = () => {
      tile.classList.add('road-crash');
      setRoadAaronTile(tile);
      triggerFatAaronEat(tile, roadPot, () => setTimeout(() => startRoadGame(), 600));
    };
    if (currentTile && currentTile !== tile) {
      animateAaronHop(currentTile, tile, doEat);
    } else {
      doEat();
    }
  } else {
    roadPlayerRow = row;
    roadHops      = row;
    const gain    = roadRewardForHop(hop);
    roadPot      += gain;

    tile.classList.add('road-safe');
    document.getElementById('road-status').textContent = 'hop ' + hop + ' — +' + fmt(gain) + ' aarons!';
    document.getElementById('road-cashout').disabled = false;
    updateRoadField(true); // labels + locks, animation adds road-has-aaron

    animateAaronHop(currentTile || tile, tile, () => {
      setRoadAaronTile(tile);
      if (roadPlayerRow >= ROAD_ROWS - 1) doCashOut();
    });
  }
}

function triggerFatAaronEat(tile, lostAmount, onDone) {
  const field = document.getElementById('road-field');
  if (!isMuted) { yoshiAudioSrc.currentTime = 0; yoshiAudioSrc.play().catch(() => {}); }

  const fieldRect = field.getBoundingClientRect();
  const tileRect  = tile.getBoundingClientRect();
  const anchor = getRoadAaronAnchor(tile, fieldRect);
  const wrapLeft = Math.max(0, anchor.centerX - 112);
  const topOffset = anchor.centerY - 36;

  const wrap = document.createElement('div');
  wrap.className = 'fat-eater-wrap';
  wrap.style.left = wrapLeft + 'px';
  wrap.style.top = topOffset + 'px';

  // Draw fat Aaron sprite
  const cvs = document.createElement('canvas');
  cvs.width = 72; cvs.height = 72;
  const fctx = cvs.getContext('2d');
  fctx.imageSmoothingEnabled = false;
  fctx.scale(72 / 56, 72 / 56);
  fctx.fillStyle = '#f5c07a'; fctx.fillRect(14, 2, 28, 22);
  fctx.fillStyle = '#3a1a00'; fctx.fillRect(14, 2, 28, 5);
  fctx.fillStyle = '#1a0a2e'; fctx.fillRect(18, 12, 4, 3); fctx.fillRect(34, 12, 4, 3);
  fctx.fillStyle = '#f0a070'; fctx.fillRect(14, 16, 6, 6); fctx.fillRect(36, 16, 6, 6);
  fctx.fillStyle = '#3a1a00'; fctx.fillRect(20, 20, 16, 2); fctx.fillRect(18, 18, 4, 2); fctx.fillRect(34, 18, 4, 2);
  fctx.fillStyle = '#cc5500'; fctx.fillRect(4, 24, 48, 28);
  fctx.fillStyle = '#ff8844'; fctx.fillRect(14, 28, 28, 20); fctx.fillRect(10, 32, 36, 12);
  fctx.fillStyle = '#aa3300'; fctx.fillRect(26, 38, 4, 4);
  fctx.fillStyle = '#f5c07a'; fctx.fillRect(0, 24, 8, 20); fctx.fillRect(48, 24, 8, 20);
  fctx.fillStyle = '#2244aa'; fctx.fillRect(8, 52, 16, 4); fctx.fillRect(32, 52, 16, 4);
  wrap.appendChild(cvs);

  // Tongue
  const tongue = document.createElement('div');
  tongue.className = 'fat-tongue';
  const tongueLen = Math.max(34, anchor.centerX - (wrapLeft + 76));
  wrap.appendChild(tongue);

  field.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('eating'));

  // Tongue extends at 500ms → Aaron slides along it into mouth
  setTimeout(() => {
    tongue.style.width = tongueLen + 'px';

    const fR  = field.getBoundingClientRect();
    const currentAnchor = getRoadAaronAnchor(tile, fR);
    const sz  = currentAnchor.size;
    const aaronFloat = document.createElement('div');
    aaronFloat.className = 'aaron-hop-sprite';
    aaronFloat.style.width  = sz + 'px';
    aaronFloat.style.height = sz + 'px';
    aaronFloat.style.left   = currentAnchor.left + 'px';
    aaronFloat.style.top    = currentAnchor.top + 'px';
    field.appendChild(aaronFloat);
    tile.classList.remove('road-has-aaron');

    // Slide Aaron into fat Aaron's mouth
    setTimeout(() => {
      aaronFloat.style.transition = 'left 0.28s ease-in, top 0.22s ease-in, transform 0.28s ease-in, opacity 0.1s 0.22s ease-in';
      aaronFloat.style.left      = (wrapLeft + 40 - sz / 2) + 'px';
      aaronFloat.style.top       = (topOffset + 28 - sz / 2) + 'px';
      aaronFloat.style.transform = 'scale(0.15)';
      aaronFloat.style.opacity   = '0';
    }, 80);

    setTimeout(() => aaronFloat.remove(), 430);
  }, 500);

  // Loss text floats up from the tile
  setTimeout(() => {
    const lostEl = document.createElement('div');
    lostEl.className = 'road-loss-text';
    const tR = tile.getBoundingClientRect();
    const fR = field.getBoundingClientRect();
    lostEl.textContent = '-' + fmt(lostAmount) + ' aarons';
    const _z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    lostEl.style.left = ((tR.left - fR.left) / _z + tR.width  / _z / 2) + 'px';
    lostEl.style.top  = ((tR.top  - fR.top)  / _z + tR.height / _z / 2) + 'px';
    field.appendChild(lostEl);
    requestAnimationFrame(() => lostEl.classList.add('floating'));
    setTimeout(() => lostEl.remove(), 1200);
  }, 750);

  setTimeout(() => { tongue.style.width = '0'; }, 950);
  setTimeout(() => { wrap.remove(); onDone(); }, 1600);
}

function doCashOut() {
  if (!roadPot) return;
  roadActive = false;
  awardAarons(roadPot, true);
  document.getElementById('road-status').textContent = 'cashed out +' + fmt(roadPot) + ' aarons!';
  document.getElementById('road-pot').textContent = 'pot: 0';
  document.getElementById('road-cashout').disabled = true;
  if (!isMuted) { dingAudioSrc.currentTime = 0; dingAudioSrc.play().catch(() => {}); }

  state.minigames.roadPlays    = (state.minigames.roadPlays    || 0) + 1;
  state.minigames.roadBestHops = Math.max(state.minigames.roadBestHops || 0, roadHops);
  state.minigames.roadCashouts = (state.minigames.roadCashouts || 0) + 1;
  checkAchievements(); save();

  setTimeout(() => startRoadGame(), 1800);
}

function startRoadGame() {
  roadBet       = Math.max(1, Math.floor(state.aarons * 0.01)); // 1% of balance
  roadPot       = roadBet; // start with 1% as the pot seed
  roadHops      = 0;
  roadPlayerRow = 0;
  roadDead      = false;
  roadActive    = true;

  // Deduct the bet seed
  state.aarons = Math.max(0, state.aarons - roadBet);
  updateStats(); updateCards();

  document.getElementById('road-status').textContent = 'click the row above Aaron to hop!';
  document.getElementById('road-pot').textContent    = 'pot: ' + fmt(roadPot);
  document.getElementById('road-cashout').disabled   = true;
  buildRoadField();
}

// ── AARON AIR ────────────────────────────────────────────────────────────────
const AIR_W   = 72,  AIR_H   = 34;
const AIR_CVS = 580, AIR_CVS_H = 300;
const AIR_GND = 242; // y where plane bottom contacts ground

const AIR_SEGS = [
  { t:'rwy', x1:0,        x2:60       },  // 60px runway
  { t:'fir', x1:60,       x2:220      },  // 160px fire
  { t:'rwy', x1:220,      x2:244      },  // 24px gap
  { t:'fir', x1:244,      x2:430      },  // 186px fire
  { t:'rwy', x1:430,      x2:446      },  // 16px gap
  { t:'fir', x1:446,      x2:562      },  // 116px fire
  { t:'rwy', x1:562,      x2:AIR_CVS  },  // 18px landing strip
];
// fire total: 160+186+116 = 462px / 580 = ~80%

const AIR_STARS = [[40,14],[118,8],[196,28],[306,6],[386,22],[496,12],[546,24],[80,38],[268,18],[458,32]];
const AIR_BLDGS = [[0,80,44],[54,52,48],[112,68,40],[162,38,62],[234,58,44],[290,34,68],[370,52,46],[430,24,58],[500,48,44],[556,62,28]];

const aaronAirImg = new Image();
aaronAirImg.src = 'Aaron_match_pictures/Clicker.png';
let airRAF = null;

function airSegAt(cx) {
  cx = Math.max(0, Math.min(AIR_CVS - 1, cx));
  return (AIR_SEGS.find(s => cx >= s.x1 && cx < s.x2) || AIR_SEGS[0]).t;
}

function calcRingPos() {
  let px = -AIR_W, py = 18, vy = 0.42;
  const targetX = 170;
  while (px + AIR_W / 2 < targetX) {
    vy += 0.006;
    py = Math.max(4, Math.min(AIR_GND - AIR_H - 4, py + vy));
    px += 1.8;
  }
  return { x: targetX, y: py + AIR_H / 2 };
}

function mkAirBombs() {
  const bombs = [];
  // Circle on the natural flight path — 70% green (safe), 30% red (bad)
  const ring = calcRingPos();
  const safe = Math.random() < 0.5;
  bombs.push({ x: ring.x, y: ring.y, guaranteed: true, safe, hit: false, flash: 0 });

  // Left side: even mix, fewer bombs
  const leftCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < leftCount; i++) {
    bombs.push({
      x: 40 + Math.random() * 200,
      y: 28 + Math.random() * (AIR_GND - 100),
      plus: Math.random() < 0.5,
      val: 5 + Math.floor(Math.random() * 11),
      hit: false, flash: 0,
    });
  }
  // Right side: mostly positive (helpful)
  const rightCount = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < rightCount; i++) {
    bombs.push({
      x: 260 + Math.random() * (AIR_CVS - 300),
      y: 28 + Math.random() * (AIR_GND - 100),
      plus: Math.random() < 0.65,
      val: 5 + Math.floor(Math.random() * 11),
      hit: false, flash: 0,
    });
  }
  return bombs;
}

function startAaronAir(bet) {
  if (airRAF) { cancelAnimationFrame(airRAF); airRAF = null; }
  stopAudio(screamAudioSrc);
  const canvas = document.getElementById('plane-canvas');
  const ctx    = canvas.getContext('2d');

  const g = {
    phase: 'fly',
    px: -AIR_W, py: 18,
    vx: 1.8,    vy: 0.42,
    grav: 0.006,
    bombs: mkAirBombs(),
    fa: 0, bet, result: null,
  };

  function tick() {
    g.fa += 0.12;
    if (g.phase === 'fly') {
      g.vy += g.grav;
      g.py += g.vy;
      g.px += g.vx;
      g.bombs.forEach(b => {
        if (b.hit) return;
        const dx = (g.px + AIR_W/2) - b.x, dy = (g.py + AIR_H/2) - b.y;
        const hitR = b.guaranteed ? 28 : 22;
        if (dx*dx + dy*dy < hitR*hitR) {
          b.hit = true; b.flash = 14;
          if (b.guaranteed) {
            if (b.safe) g.vy = Math.max(g.vy - 1.8, -1.5); // green: launch plane up
            else        g.vy = Math.min(g.vy + 1.8,  4.5);  // red: shove plane down
          } else if (b.plus) {
            g.vy = Math.max(g.vy - b.val * 0.05, -1.5);
          } else {
            g.vy = Math.min(g.vy + b.val * 0.05,  4.5);
          }
        }
      });
      if (g.py < 4) { g.py = 4; g.vy = 0.1; }
      if (g.py + AIR_H >= AIR_GND) {
        g.py = AIR_GND - AIR_H; g.vy = 0;
        g.vx = Math.max(g.vx * 1.2, 3.0); // lurch forward on touchdown
        g.phase = 'roll';
      }
    } else if (g.phase === 'roll') {
      g.px += g.vx;
      g.vx *= 0.954;
      if (g.vx < 0.12 || g.px > AIR_CVS + AIR_W) {
        g.phase = 'done';
        g.result = airSegAt(Math.min(g.px + AIR_W/2, AIR_CVS - 1));
      }
    }
    drawAaronAir(ctx, g);
    if (g.phase !== 'done') { airRAF = requestAnimationFrame(tick); }
    else { airRAF = null; endAaronAir(g); }
  }
  airRAF = requestAnimationFrame(tick);
}

function drawAaronAir(ctx, g) {
  // Sky
  const sk = ctx.createLinearGradient(0, 0, 0, AIR_GND);
  sk.addColorStop(0, '#050e1c'); sk.addColorStop(1, '#0d2545');
  ctx.fillStyle = sk; ctx.fillRect(0, 0, AIR_CVS, AIR_GND);

  // Stars
  ctx.fillStyle = '#ffffffaa';
  AIR_STARS.forEach(([x,y]) => ctx.fillRect(x, y, 2, 2));

  // Buildings
  AIR_BLDGS.forEach(([bx, bh, bw]) => {
    ctx.fillStyle = '#091526';
    ctx.fillRect(bx, AIR_GND - bh, bw, bh);
    for (let wy = AIR_GND - bh + 8; wy < AIR_GND - 6; wy += 14) {
      for (let wx = bx + 5; wx < bx + bw - 6; wx += 10) {
        ctx.fillStyle = (Math.floor(wx/10) + Math.floor(wy/14)) % 3 !== 2
          ? 'rgba(255,220,60,0.22)' : 'rgba(80,120,220,0.12)';
        ctx.fillRect(wx, wy, 5, 7);
      }
    }
  });

  // Ground base
  ctx.fillStyle = '#0c0904';
  ctx.fillRect(0, AIR_GND, AIR_CVS, AIR_CVS_H - AIR_GND);

  // Runway & fire segments
  AIR_SEGS.forEach(seg => {
    const sw = seg.x2 - seg.x1;
    if (seg.t === 'rwy') {
      ctx.fillStyle = '#282828'; ctx.fillRect(seg.x1, AIR_GND, sw, AIR_CVS_H - AIR_GND);
      ctx.fillStyle = '#ffffffcc';
      const my = AIR_GND + Math.floor((AIR_CVS_H - AIR_GND) / 2) - 2;
      for (let dx = seg.x1 + 6; dx < seg.x2 - 4; dx += 18) ctx.fillRect(dx, my, 10, 4);
      ctx.fillStyle = '#ffffff55'; ctx.fillRect(seg.x1, AIR_GND, sw, 2);
    } else {
      ctx.fillStyle = '#180400'; ctx.fillRect(seg.x1, AIR_GND, sw, AIR_CVS_H - AIR_GND);
      for (let fx = seg.x1 + 2; fx < seg.x2; fx += 7) {
        const fh = 14 + Math.sin(g.fa + fx * 0.38) * 9 + Math.cos(g.fa * 1.6 + fx * 0.22) * 5;
        const fg = ctx.createLinearGradient(fx, AIR_GND - fh, fx, AIR_GND);
        fg.addColorStop(0, 'rgba(255,220,0,0)');
        fg.addColorStop(0.35, 'rgba(255,110,0,0.88)');
        fg.addColorStop(1, 'rgba(190,20,0,1)');
        ctx.fillStyle = fg; ctx.fillRect(fx, AIR_GND - fh, 5, fh + 1);
      }
    }
  });

  // Bombs + guaranteed ring
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  g.bombs.forEach(b => {
    if (b.hit) { if (b.flash > 0) b.flash--; else return; }

    if (b.guaranteed) {
      const pulse = 0.6 + Math.sin(g.fa * 4) * 0.4;
      ctx.globalAlpha = b.hit ? b.flash / 14 : pulse;
      const col = b.safe ? '#22dd44' : '#ee2222';
      const colFill = b.safe ? 'rgba(30,200,60,0.22)' : 'rgba(220,30,30,0.22)';
      ctx.fillStyle = colFill;
      ctx.beginPath(); ctx.arc(b.x, b.y, 26, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, 26, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    ctx.globalAlpha = b.hit ? b.flash / 10 : 1;
    const gr = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 26);
    gr.addColorStop(0, b.plus ? 'rgba(50,255,90,0.38)' : 'rgba(255,40,20,0.38)');
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, 26, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x, b.y, 18, 0, Math.PI*2);
    ctx.fillStyle = b.plus ? '#0c2810' : '#2c0c08'; ctx.fill();
    ctx.strokeStyle = b.plus ? '#28ee58' : '#ff2818'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = b.plus ? '#48ff78' : '#ff4838';
    ctx.font = 'bold 8px monospace';
    ctx.fillText((b.plus ? '+' : '-') + b.val + '%', b.x, b.y);
    ctx.globalAlpha = 1;
  });
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

  // Ground shadow as plane descends
  if (g.phase === 'fly' && g.py > AIR_GND - 130) {
    const sa = Math.min(0.45, (g.py - (AIR_GND - 130)) / 130 * 0.45);
    ctx.fillStyle = `rgba(0,0,0,${sa})`;
    ctx.beginPath(); ctx.ellipse(g.px + AIR_W/2, AIR_GND - 1, 28, 5, 0, 0, Math.PI*2); ctx.fill();
  }

  // Plane
  ctx.save();
  ctx.translate(g.px + AIR_W/2, g.py + AIR_H/2);
  const tilt = g.phase === 'roll' ? 0 : Math.max(-0.32, Math.min(0.32, g.vy * 0.09));
  ctx.rotate(tilt);

  // Exhaust trail
  if (g.phase === 'fly') {
    const ex = ctx.createLinearGradient(-AIR_W/2 - 22, 0, -AIR_W/2, 0);
    ex.addColorStop(0, 'transparent'); ex.addColorStop(1, 'rgba(180,200,255,0.55)');
    ctx.fillStyle = ex; ctx.fillRect(-AIR_W/2 - 20, -3, 20, 6);
  }

  // Fuselage
  ctx.fillStyle = '#d2e6f2';
  ctx.beginPath(); ctx.ellipse(0, 0, AIR_W/2, AIR_H * 0.42, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#88aec4'; ctx.lineWidth = 1.5; ctx.stroke();
  // Nose
  ctx.fillStyle = '#eaf6ff';
  ctx.beginPath(); ctx.ellipse(AIR_W/2 - 10, 0, 12, AIR_H * 0.26, 0, 0, Math.PI*2); ctx.fill();
  // Wings
  ctx.fillStyle = '#a8c2d4';
  ctx.beginPath(); ctx.moveTo(2,-AIR_H*0.42); ctx.lineTo(-20,-AIR_H*1.15); ctx.lineTo(-24,-AIR_H*1.15); ctx.lineTo(-5,-AIR_H*0.42); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2,AIR_H*0.42); ctx.lineTo(-20,AIR_H*1.15); ctx.lineTo(-24,AIR_H*1.15); ctx.lineTo(-5,AIR_H*0.42); ctx.closePath(); ctx.fill();
  // Tail fin
  ctx.fillStyle = '#a8c2d4';
  ctx.beginPath(); ctx.moveTo(-AIR_W/2+8,-AIR_H*0.4); ctx.lineTo(-AIR_W/2+8,-AIR_H*0.95); ctx.lineTo(-AIR_W/2+22,-AIR_H*0.4); ctx.closePath(); ctx.fill();
  // Cockpit
  ctx.beginPath(); ctx.arc(10, 0, 11, 0, Math.PI*2);
  ctx.fillStyle = '#1c3248'; ctx.fill();
  ctx.strokeStyle = '#58a0c0'; ctx.lineWidth = 1.5; ctx.stroke();
  if (aaronAirImg.complete && aaronAirImg.naturalWidth) {
    ctx.save(); ctx.beginPath(); ctx.arc(10, 0, 10, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(aaronAirImg, 0, -10, 20, 20); ctx.restore();
  }
  // Wheels on ground
  if (g.phase === 'roll') {
    ctx.fillStyle = '#222';
    [-12, 12].forEach(wx => { ctx.beginPath(); ctx.arc(wx, AIR_H*0.42+5, 5, 0, Math.PI*2); ctx.fill(); });
    // Axles
    ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
    [-12, 12].forEach(wx => { ctx.beginPath(); ctx.moveTo(wx, AIR_H*0.42); ctx.lineTo(wx, AIR_H*0.42+5); ctx.stroke(); });
  }
  ctx.restore();

  // Result overlay
  if (g.phase === 'done') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, AIR_CVS, AIR_CVS_H);
    const isF = g.result === 'fir';
    ctx.fillStyle = isF ? '#ff8800' : '#40ee80';
    ctx.font = '12px "Press Start 2P",monospace'; ctx.textAlign = 'center';
    ctx.fillText(isF ? 'FIRE! BURNED!' : 'SAFE LANDING!', AIR_CVS/2, AIR_CVS_H/2 - 14);
    ctx.font = '8px "Press Start 2P",monospace'; ctx.fillStyle = '#e8caa7';
    ctx.fillText((isF ? '-' : '+') + fmt(g.bet) + ' aarons', AIR_CVS/2, AIR_CVS_H/2 + 12);
    ctx.textAlign = 'left';
  }
}

function endAaronAir(g) {
  if (DEV_MODE && devTools.alwaysSafeAir) g.result = 'rwy';
  const isF = g.result === 'fir';
  if (isF) {
    // bet already deducted — fire = total loss
    if (!isMuted) { screamAudioSrc.currentTime = 0; screamAudioSrc.play().catch(() => {}); }
    document.getElementById('plane-status').textContent = 'FIRE! -100%  -' + fmt(g.bet) + ' aarons';
  } else {
    const payout = g.bet * 2; // return bet + equal profit
    awardAarons(payout, true);
    if (!isMuted) { dingAudioSrc.currentTime = 0; dingAudioSrc.play().catch(() => {}); }
    document.getElementById('plane-status').textContent = 'SAFE! +100%  +' + fmt(g.bet) + ' aarons';
  }
  document.getElementById('plane-start').disabled = false;
  state.minigames.planePlays     = (state.minigames.planePlays     || 0) + 1;
  if (isF) state.minigames.planeFireLands = (state.minigames.planeFireLands || 0) + 1;
  checkAchievements();
  save();
}

// Draw initial idle state on canvas
(function initAirCanvas() {
  const canvas = document.getElementById('plane-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Just draw the sky + ground so it's not blank
  const sk = ctx.createLinearGradient(0, 0, 0, AIR_GND);
  sk.addColorStop(0, '#050e1c'); sk.addColorStop(1, '#0d2545');
  ctx.fillStyle = sk; ctx.fillRect(0, 0, AIR_CVS, AIR_GND);
  AIR_STARS.forEach(([x,y]) => { ctx.fillStyle='#ffffffaa'; ctx.fillRect(x,y,2,2); });
  AIR_BLDGS.forEach(([bx,bh,bw]) => { ctx.fillStyle='#091526'; ctx.fillRect(bx, AIR_GND-bh, bw, bh); });
  ctx.fillStyle = '#0c0904'; ctx.fillRect(0, AIR_GND, AIR_CVS, AIR_CVS_H - AIR_GND);
  AIR_SEGS.forEach(seg => {
    if (seg.t === 'rwy') {
      ctx.fillStyle='#282828'; ctx.fillRect(seg.x1,AIR_GND,seg.x2-seg.x1,AIR_CVS_H-AIR_GND);
      ctx.fillStyle='#ffffffcc';
      const my=AIR_GND+Math.floor((AIR_CVS_H-AIR_GND)/2)-2;
      for (let dx=seg.x1+6;dx<seg.x2-4;dx+=18) ctx.fillRect(dx,my,10,4);
    } else {
      ctx.fillStyle='#180400'; ctx.fillRect(seg.x1,AIR_GND,seg.x2-seg.x1,AIR_CVS_H-AIR_GND);
      ctx.fillStyle='rgba(190,20,0,0.8)'; ctx.fillRect(seg.x1,AIR_GND-8,seg.x2-seg.x1,8);
    }
  });
  ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.font='9px "Press Start 2P",monospace';
  ctx.textAlign='center'; ctx.fillText('SET BET AND PRESS FLY', AIR_CVS/2, AIR_GND/2);
  ctx.textAlign='left';
})();

// ── MEGA SLOTS ────────────────────────────────────────────────────────────────
function buildMegaSlotStrips(container) {
  for (let col = 0; col < MEGA_COLS; col++) {
    const colEl  = document.createElement('div');
    colEl.className = 'mega-slot-column';

    const win = document.createElement('div');
    win.className = 'mega-slot-window';

    const strip = document.createElement('div');
    strip.className = 'mega-slot-strip';
    strip.id = 'mega-strip-' + col;

    for (let r = 0; r < MEGA_REPS; r++) {
      SLOT_IMAGES.forEach(img => {
        const cell = document.createElement('div');
        cell.className = 'mega-slot-cell';
        const photo = document.createElement('img');
        photo.src = img.src;
        photo.style.objectPosition = img.pos;
        photo.draggable = false;
        cell.appendChild(photo);
        strip.appendChild(cell);
      });
    }

    win.appendChild(strip);
    colEl.appendChild(win);
    container.appendChild(colEl);

    megaStrips[col] = strip;
    const initImg = col % SLOT_NUM_IMGS;
    const absIdx  = Math.floor(MEGA_REPS / 2) * SLOT_NUM_IMGS + initImg;
    strip.style.transition = 'none';
    strip.style.transform  = `translateY(${-(absIdx - 1) * MEGA_CELL_H}px)`;
    megaStripPos[col] = absIdx;
  }
}

function spinMegaStrip(col, resultImgIdx, duration, onStop) {
  const strip = megaStrips[col];
  const cur   = megaStripPos[col];
  const rots  = 8;
  const target = (Math.floor(cur / SLOT_NUM_IMGS) + rots) * SLOT_NUM_IMGS + resultImgIdx;

  strip.style.transition = `transform ${duration}ms cubic-bezier(0.04,0.9,0.18,1)`;
  strip.style.transform  = `translateY(${-(target - 1) * MEGA_CELL_H}px)`;

  setTimeout(() => {
    const reset = Math.floor(MEGA_REPS / 2) * SLOT_NUM_IMGS + resultImgIdx;
    strip.style.transition = 'none';
    strip.style.transform  = `translateY(${-(reset - 1) * MEGA_CELL_H}px)`;
    megaStripPos[col] = reset;
    onStop();
  }, duration);
}

function spinMegaSlots(bet) {
  if (megaSpinning) return;
  megaSpinning = true;

  const spinBtn  = document.getElementById('mega-spin-btn');
  const statusEl = document.getElementById('mega-status');
  if (spinBtn) spinBtn.disabled = true;
  if (statusEl) statusEl.textContent = 'spinning...';

  const isJackpot  = (DEV_MODE && devTools.alwaysMegaJackpot) || Math.random() < 0.02;
  const jackpotImg = Math.floor(Math.random() * SLOT_NUM_IMGS);
  const results    = isJackpot
    ? new Array(MEGA_COLS).fill(jackpotImg)
    : Array.from({ length: MEGA_COLS }, () => Math.floor(Math.random() * SLOT_NUM_IMGS));

  // prevent accidental jackpot on non-jackpot roll
  if (!isJackpot && results.every(r => r === results[0])) {
    results[MEGA_COLS - 1] = (results[0] + 1) % SLOT_NUM_IMGS;
  }

  const SPIN_DURATION = 2600;
  const DURATIONS = results.map(() => SPIN_DURATION);
  startSlotsClickTicker(SPIN_DURATION);

  let stopped = 0;
  for (let col = 0; col < MEGA_COLS; col++) {
    spinMegaStrip(col, results[col], DURATIONS[col], () => {
      stopped++;
      if (stopped < MEGA_COLS) return;

      megaSpinning = false;
      if (spinBtn) spinBtn.disabled = false;

      const allMatch = results.every(r => r === results[0]);
      if (allMatch) {
        const payout = bet * 100;
        awardAarons(payout, true);
        if (statusEl) statusEl.textContent = 'JACKPOT! +' + fmt(payout) + ' aarons!';
        if (!isMuted) { jackpotAudioSrc.currentTime = 0; jackpotAudioSrc.play().catch(() => {}); }
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        for (let i = 0; i < 8; i++) {
          setTimeout(() => slotsFireConfetti(
            cx + (Math.random() - 0.5) * 500,
            cy + (Math.random() - 0.5) * 300, 70
          ), i * 200);
        }
        if (!state.achievements['mega-slots-win']) {
          state.achievements['mega-slots-win'] = true;
          const a = ACHIEVEMENTS.find(x => x.id === 'mega-slots-win');
          if (a) showAchievementToast(a);
          updateAchievementCards();
          save();
        }
      } else {
        if (statusEl) statusEl.textContent = '-' + fmt(bet) + ' aarons';
        const machine = document.getElementById('mega-machine');
        if (machine) {
          machine.classList.add('slot-lose-shake');
          setTimeout(() => machine.classList.remove('slot-lose-shake'), 450);
        }
      }
    });
  }
}

function showMegaSlots() {
  if (document.getElementById('mega-slots-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'mega-slots-overlay';
  overlay.innerHTML = `
    <div id="mega-slots-card">
      <div id="mega-slots-header">MEGA SLOTS</div>
      <div id="mega-slots-sub">10 REELS OF DOOM</div>
      <div id="mega-status">place your bet</div>
      <div id="mega-machine-wrap">
        <div id="mega-machine"></div>
        <div id="mega-payline-bar">
          <span class="slots-payline-arrow">&#9654;</span>
          <span class="slots-payline-arrow">&#9664;</span>
        </div>
      </div>
      <div id="mega-bet-row">
        <input id="mega-bet" type="number" min="1" value="10" />
        <button class="mega-pct-btn" data-mega-pct="10">10%</button>
        <button class="mega-pct-btn" data-mega-pct="50">50%</button>
        <button class="mega-pct-btn" data-mega-pct="100">ALL</button>
      </div>
      <button id="mega-spin-btn" class="minigame-btn">&#9654; SPIN</button>
      <div class="slots-odds-row">all 10 match: &#215;100 &nbsp;|&nbsp; win chance: ~2%</div>
      <button id="mega-close-btn">&#215; CLOSE</button>
    </div>
  `;
  document.body.appendChild(overlay);

  buildMegaSlotStrips(document.getElementById('mega-machine'));


  overlay.querySelectorAll('.mega-pct-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = parseInt(btn.dataset.megaPct, 10);
      document.getElementById('mega-bet').value = Math.max(1, Math.floor(state.aarons * pct / 100));
    });
  });

  document.getElementById('mega-spin-btn').addEventListener('click', () => {
    const bet = Math.max(1, Math.floor(Number(document.getElementById('mega-bet').value) || 1));
    if (bet > state.aarons) {
      document.getElementById('mega-status').textContent = 'not enough aarons!';
      return;
    }
    state.aarons -= bet;
    updateStats();
    updateCards();
    spinMegaSlots(bet);
  });

  document.getElementById('mega-close-btn').addEventListener('click', () => {
    if (megaSpinning) return;
    overlay.remove();
    for (let col = 0; col < MEGA_COLS; col++) { megaStrips[col] = null; megaStripPos[col] = 0; }
  });
}

// ── AARON CROSS WIRING ───────────────────────────────────────────────────────
document.getElementById('road-cashout').addEventListener('click', doCashOut);
document.getElementById('road-reset').addEventListener('click', () => {
  if (airRAF) return; // don't interfere with running air game
  roadActive = false;
  roadDead   = false;
  startRoadGame();
});
startRoadGame();

// ── AARON AIR WIRING ─────────────────────────────────────────────────────────
document.getElementById('plane-start').addEventListener('click', () => {
  const bet = Math.max(1, Math.floor(Number(document.getElementById('plane-bet').value) || 1));
  if (bet > state.aarons) { document.getElementById('plane-status').textContent = 'not enough aarons!'; return; }
  state.aarons -= bet;
  updateStats(); updateCards();
  document.getElementById('plane-start').disabled = true;
  document.getElementById('plane-status').textContent = 'flying...';
  startAaronAir(bet);
});
document.querySelectorAll('[data-plane-pct]').forEach(btn => {
  btn.addEventListener('click', () => {
    const pct = parseInt(btn.dataset.planePct, 10);
    document.getElementById('plane-bet').value = Math.max(1, Math.floor(state.aarons * pct / 100));
  });
});

// ── MEGA SLOTS TRIGGER ────────────────────────────────────────────────────────
const slotsTitleEl = document.querySelector('#slots-card .minigame-title');
slotsTitleEl.style.cursor = 'pointer';
slotsTitleEl.title = '...';
slotsTitleEl.addEventListener('click', showMegaSlots);

// ── DIDDY MODE ────────────────────────────────────────────────────────────────
document.getElementById('aaron-count').style.cursor = 'pointer';
document.getElementById('aaron-count').addEventListener('click', () => {
  diddyModeEnd = Date.now() + 5 * 60 * 1000;
  if (!isMuted) { partyAudioSrc.currentTime = 0; partyAudioSrc.play().catch(() => {}); }
  updateStats();
  if (!state.achievements['diddy-mode']) {
    state.achievements['diddy-mode'] = true;
    const a = ACHIEVEMENTS.find(x => x.id === 'diddy-mode');
    if (a) showAchievementToast(a);
    updateAchievementCards();
    save();
  }
});

// ── FOLLOW AARON ─────────────────────────────────────────────────────────────
const FOLLOW_W        = 580;
const FOLLOW_H        = 200;
const FOLLOW_SIZE     = 58;
const FOLLOW_DURATION = 15;
const FOLLOW_SPEED    = 130;

let followActive   = false;
let followRaf      = null;
let followLastTs   = 0;
let followAX       = 0, followAY = 0;
let followVX       = 0, followVY = 0;
let followDirTimer = 0;
let followMouseX   = -999, followMouseY = -999;
let followTimeOn   = 0,  followTimeOff  = 0;
let followElapsed  = 0;

function followPickDir() {
  const angle = Math.random() * Math.PI * 2;
  followVX = Math.cos(angle) * FOLLOW_SPEED;
  followVY = Math.sin(angle) * FOLLOW_SPEED;
  followDirTimer = 1.2 + Math.random() * 1.8;
}

function startFollowGame() {
  const canvas = document.getElementById('follow-canvas');
  followActive   = true;
  followAX       = FOLLOW_W / 2 - FOLLOW_SIZE / 2;
  followAY       = FOLLOW_H / 2 - FOLLOW_SIZE / 2;
  followTimeOn   = 0;
  followTimeOff  = 0;
  followElapsed  = 0;
  followMouseX   = -999;
  followMouseY   = -999;
  followPickDir();
  document.getElementById('follow-start').style.display  = 'none';
  document.getElementById('follow-status').textContent   = 'keep your cursor on Aaron!';
  document.getElementById('follow-timer').textContent    = FOLLOW_DURATION + 's';
  if (followRaf) cancelAnimationFrame(followRaf);
  followLastTs = performance.now();
  followRaf = requestAnimationFrame(followLoop);
}

function followLoop(ts) {
  if (!followActive) return;
  const dt = Math.min((ts - followLastTs) / 1000, 0.05);
  followLastTs = ts;

  followElapsed += dt;
  const secsLeft = Math.max(0, FOLLOW_DURATION - followElapsed);

  // Move Aaron
  followAX += followVX * dt;
  followAY += followVY * dt;
  if (followAX < 0)                        { followAX = 0;                        followVX = Math.abs(followVX); }
  if (followAX + FOLLOW_SIZE > FOLLOW_W)   { followAX = FOLLOW_W - FOLLOW_SIZE;   followVX = -Math.abs(followVX); }
  if (followAY < 0)                        { followAY = 0;                        followVY = Math.abs(followVY); }
  if (followAY + FOLLOW_SIZE > FOLLOW_H)   { followAY = FOLLOW_H - FOLLOW_SIZE;   followVY = -Math.abs(followVY); }

  followDirTimer -= dt;
  if (followDirTimer <= 0) followPickDir();

  // Check if mouse on Aaron (canvas coords)
  const onAaron = followMouseX >= followAX && followMouseX <= followAX + FOLLOW_SIZE
               && followMouseY >= followAY && followMouseY <= followAY + FOLLOW_SIZE;

  if (onAaron) followTimeOn  += dt;
  else         followTimeOff += dt;

  // Draw
  const canvas = document.getElementById('follow-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, FOLLOW_W, FOLLOW_H);

  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, FOLLOW_W, FOLLOW_H);

  // Progress bar along bottom
  ctx.fillStyle = '#1a1208';
  ctx.fillRect(0, FOLLOW_H - 6, FOLLOW_W, 6);
  ctx.fillStyle = secsLeft < 5 ? '#cc4422' : '#c87020';
  ctx.fillRect(0, FOLLOW_H - 6, FOLLOW_W * (secsLeft / FOLLOW_DURATION), 6);

  // Glow ring when on Aaron
  if (onAaron) {
    ctx.save();
    ctx.shadowColor = '#88ff88';
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = 'rgba(80,200,80,0.18)';
    ctx.fillRect(followAX - 4, followAY - 4, FOLLOW_SIZE + 8, FOLLOW_SIZE + 8);
    ctx.restore();
  }

  // Draw Aaron sprite
  if (aaronAirImg.complete && aaronAirImg.naturalWidth) {
    ctx.drawImage(aaronAirImg, followAX, followAY, FOLLOW_SIZE, FOLLOW_SIZE);
  } else {
    ctx.fillStyle = '#c87020';
    ctx.fillRect(followAX, followAY, FOLLOW_SIZE, FOLLOW_SIZE);
  }

  // Cursor dot
  if (followMouseX >= 0 && followMouseX <= FOLLOW_W) {
    ctx.fillStyle = onAaron ? 'rgba(100,255,100,0.9)' : 'rgba(255,100,100,0.9)';
    ctx.beginPath();
    ctx.arc(followMouseX, followMouseY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Timer label
  document.getElementById('follow-timer').textContent = Math.ceil(secsLeft) + 's';

  if (followElapsed >= FOLLOW_DURATION) {
    followActive = false;
    endFollowGame();
    return;
  }

  followRaf = requestAnimationFrame(followLoop);
}

function endFollowGame() {
  const balance  = state.aarons;
  const earned   = followTimeOn  * (balance * 0.04);
  const lost     = followTimeOff * (balance * 0.05);
  const net      = Math.floor(earned - lost);

  if (net > 0) {
    awardAarons(net, true);
  } else if (net < 0) {
    state.aarons = Math.max(0, state.aarons + net);
    updateStats(); updateCards();
  }

  const pct = Math.round((followTimeOn / FOLLOW_DURATION) * 100);
  document.getElementById('follow-status').textContent =
    pct + '% on Aaron  |  ' + (net >= 0 ? '+' : '') + fmt(net) + ' aarons';
  document.getElementById('follow-timer').textContent = 'done';

  const btn = document.getElementById('follow-start');
  btn.textContent     = 'PLAY AGAIN';
  btn.style.display   = '';

  state.minigames.followPlays = (state.minigames.followPlays || 0) + 1;
  if (pct >= 80) state.minigames.followPerfect = (state.minigames.followPerfect || 0) + 1;
  checkAchievements(); save();

  // Draw final static frame
  const canvas = document.getElementById('follow-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, FOLLOW_W, FOLLOW_H);
  ctx.fillStyle = net >= 0 ? '#44cc44' : '#cc4444';
  ctx.font = 'bold 18px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText((net >= 0 ? '+' : '') + fmt(net) + ' aarons', FOLLOW_W / 2, FOLLOW_H / 2 - 10);
  ctx.fillStyle = '#a88972';
  ctx.font = '11px "Press Start 2P", monospace';
  ctx.fillText(pct + '% time on Aaron', FOLLOW_W / 2, FOLLOW_H / 2 + 20);
  ctx.textAlign = 'left';
}

// Mouse tracking for follow canvas
(function() {
  const canvas = document.getElementById('follow-canvas');
  canvas.addEventListener('mousemove', e => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    followMouseX = (e.clientX - rect.left) * scaleX;
    followMouseY = (e.clientY - rect.top)  * scaleY;
  });
  canvas.addEventListener('mouseleave', () => {
    followMouseX = -999;
    followMouseY = -999;
  });
})();

document.getElementById('follow-start').addEventListener('click', startFollowGame);

// Draw idle state
(function() {
  const canvas = document.getElementById('follow-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, FOLLOW_W, FOLLOW_H);
  ctx.fillStyle = '#3a2a18';
  ctx.font = '11px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('press START to begin', FOLLOW_W / 2, FOLLOW_H / 2);
  ctx.textAlign = 'left';
})();

// ── CRATE SMASH ───────────────────────────────────────────────────────────────
const CRATE_ROWS   = 5;
const CRATE_COLS   = 5;
const CRATE_TOTAL  = CRATE_ROWS * CRATE_COLS; // 25
const CRATE_BOMBS  = 5;
const CRATE_SAFE   = CRATE_TOTAL - CRATE_BOMBS; // 20

let cratesBombs   = new Set();
let cratesRevealed = new Set();
let cratesGained  = 0;
let cratesActive  = false;

function buildCrateGrid() {
  const grid = document.getElementById('crates-grid');
  grid.innerHTML = '';
  for (let i = 0; i < CRATE_TOTAL; i++) {
    const cell = document.createElement('div');
    cell.className = 'crate-cell';
    cell.dataset.idx = i;
    cell.textContent = '📦';
    cell.addEventListener('click', onCrateClick);
    grid.appendChild(cell);
  }
}

function startCrateRound() {
  cratesBombs.clear();
  cratesRevealed.clear();
  cratesGained  = 0;
  cratesActive  = true;

  while (cratesBombs.size < CRATE_BOMBS) {
    cratesBombs.add(Math.floor(Math.random() * CRATE_TOTAL));
  }

  buildCrateGrid();
  document.getElementById('crates-status').textContent = 'smash a crate!';
  document.getElementById('crates-pot').textContent    = '+0 aarons';
  document.getElementById('crates-cashout').disabled   = true;
}

function onCrateClick(e) {
  if (!cratesActive) return;
  const cell = e.currentTarget;
  const idx  = parseInt(cell.dataset.idx, 10);
  if (cratesRevealed.has(idx)) return;

  cratesRevealed.add(idx);
  cell.classList.add('revealed');

  if (cratesBombs.has(idx)) {
    // Bomb hit
    const lost = Math.floor(state.aarons * 0.20);
    state.aarons = Math.max(0, state.aarons - lost);
    cratesActive = false;

    cell.classList.add('crate-bomb');
    cell.textContent = '💣';

    // Reveal all remaining bombs
    document.querySelectorAll('.crate-cell').forEach(c => {
      const ci = parseInt(c.dataset.idx, 10);
      if (cratesBombs.has(ci) && ci !== idx) {
        c.classList.add('revealed', 'crate-bomb-show');
        c.textContent = '💣';
      }
    });

    document.getElementById('crates-status').textContent = 'BOOM! -' + fmt(lost) + ' aarons!';
    document.getElementById('crates-pot').textContent    = '+' + fmt(cratesGained) + ' aarons';
    document.getElementById('crates-cashout').disabled   = true;

    state.minigames.cratesBombHits = (state.minigames.cratesBombHits || 0) + 1;
    state.minigames.cratesPlays    = (state.minigames.cratesPlays    || 0) + 1;
    checkAchievements(); save();
    updateStats(); updateCards();

    setTimeout(() => startCrateRound(), 2200);
  } else {
    // Aaron found
    const gained = Math.floor(state.aarons * 0.05);
    cratesGained += gained;
    awardAarons(gained, true);

    cell.classList.add('crate-aaron');
    cell.innerHTML = '<img src="Aaron_match_pictures/Clicker.png" style="width:70%;height:70%;object-fit:contain;image-rendering:auto;">';

    const safeLeft = CRATE_SAFE - (cratesRevealed.size - [...cratesRevealed].filter(i => cratesBombs.has(i)).length);
    document.getElementById('crates-status').textContent = safeLeft + ' crates left';
    document.getElementById('crates-pot').textContent    = '+' + fmt(cratesGained) + ' aarons';
    document.getElementById('crates-cashout').disabled   = false;

    if (!isMuted) { dingAudioSrc.currentTime = 0; dingAudioSrc.play().catch(() => {}); }

    // All safe crates found — auto cash out
    const safesOpened = [...cratesRevealed].filter(i => !cratesBombs.has(i)).length;
    if (safesOpened >= CRATE_SAFE) {
      cratesActive = false;
      document.getElementById('crates-status').textContent = 'ALL CLEAR! +' + fmt(cratesGained) + ' aarons!';
      document.getElementById('crates-cashout').disabled   = true;
      state.minigames.cratesPlays     = (state.minigames.cratesPlays     || 0) + 1;
      state.minigames.cratesWins      = (state.minigames.cratesWins      || 0) + 1;
      state.minigames.cratesAllClears = (state.minigames.cratesAllClears || 0) + 1;
      checkAchievements(); save();
      setTimeout(() => startCrateRound(), 2000);
    }
  }
}

document.getElementById('crates-cashout').addEventListener('click', () => {
  if (!cratesActive || cratesGained === 0) return;
  cratesActive = false;
  document.getElementById('crates-status').textContent = 'cashed out +' + fmt(cratesGained) + ' aarons!';
  document.getElementById('crates-cashout').disabled   = true;
  if (!isMuted) { dingAudioSrc.currentTime = 0; dingAudioSrc.play().catch(() => {}); }
  state.minigames.cratesPlays = (state.minigames.cratesPlays || 0) + 1;
  state.minigames.cratesWins  = (state.minigames.cratesWins  || 0) + 1;
  checkAchievements(); save();
  setTimeout(() => startCrateRound(), 1800);
});

document.getElementById('crates-newround').addEventListener('click', () => {
  startCrateRound();
});

startCrateRound();

// ── AARON CARDS ───────────────────────────────────────────────────────────────
const CARD_TOTAL_WEIGHT = AARON_CARDS.reduce((s, c) => s + c.weight, 0);

function drawRandomCard() {
  let roll = Math.random() * CARD_TOTAL_WEIGHT;
  for (const c of AARON_CARDS) {
    roll -= c.weight;
    if (roll <= 0) return c;
  }
  return AARON_CARDS[AARON_CARDS.length - 1];
}

function cardUniqueCount() {
  return AARON_CARDS.filter(c => (state.cards[c.id] || 0) >= 1).length;
}

function updateCardUI() {
  const countEl = document.getElementById('cards-pack-count');
  const statusEl = document.getElementById('cards-pack-status');
  const openBtn  = document.getElementById('cards-open-btn');
  const cost = Math.floor(1e12 * Math.pow(5, state.minigames.cardPacks || 0));
  if (countEl) countEl.textContent = cardUniqueCount() + ' / ' + AARON_CARDS.length;
  if (statusEl) statusEl.textContent = 'cost: ' + fmt(cost) + ' aarons';
  if (openBtn && !openBtn.disabled) openBtn.textContent = 'OPEN PACK (' + fmt(cost) + ')';
  buildCardCollection();
}

function buildCardCollection() {
  const grid = document.getElementById('cards-collection');
  if (!grid) return;
  grid.innerHTML = '';
  AARON_CARDS.forEach(c => {
    const owned = (state.cards[c.id] || 0) >= 1;
    const cell = document.createElement('div');
    cell.className = 'card-coll-cell' + (owned ? ' card-coll-owned' : '');
    cell.style.borderColor = owned ? CARD_RARITY_COLOR[c.rarity] : '#333';
    if (owned) cell.style.boxShadow = '0 0 6px ' + CARD_RARITY_COLOR[c.rarity] + '88';

    const img = document.createElement('img');
    img.src = c.src;
    img.draggable = false;
    if (!owned) img.style.filter = 'grayscale(1) brightness(0.3)';

    const label = document.createElement('div');
    label.className = 'card-coll-label';
    label.textContent = owned ? c.name : '???';
    label.style.color = owned ? CARD_RARITY_COLOR[c.rarity] : '#444';

    const count = document.createElement('div');
    count.className = 'card-coll-count';
    count.textContent = owned ? ('×' + (state.cards[c.id] || 0)) : '';

    cell.append(img, label, count);
    grid.appendChild(cell);
  });
}

function openCardPack() {
  const cost = Math.floor(1e12 * Math.pow(5, state.minigames.cardPacks || 0));
  if (state.aarons < cost) {
    document.getElementById('cards-pack-status').textContent = 'not enough aarons!';
    return;
  }

  const btn = document.getElementById('cards-open-btn');
  btn.disabled = true;

  state.aarons -= cost;
  state.minigames.cardPacks = (state.minigames.cardPacks || 0) + 1;
  updateStats();
  updateCards();

  const card = drawRandomCard();
  state.cards[card.id] = (state.cards[card.id] || 0) + 1;

  const inner = document.getElementById('cards-flip-inner');
  const frontFace = document.getElementById('cards-flip-front');

  // put the revealed card on the front face
  frontFace.innerHTML = '';
  const img = document.createElement('img');
  img.src = card.src;
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  const rarityBar = document.createElement('div');
  rarityBar.className = 'card-rarity-bar';
  rarityBar.textContent = card.rarity.toUpperCase();
  rarityBar.style.background = CARD_RARITY_COLOR[card.rarity];
  const nameLbl = document.createElement('div');
  nameLbl.className = 'card-name-lbl';
  nameLbl.textContent = card.name;
  frontFace.append(img, rarityBar, nameLbl);

  // flip animation: 0 → 90 (hide) → swap → 90 → 0 (reveal)
  inner.style.transition = 'transform 0.35s ease-in';
  inner.style.transform  = 'rotateY(90deg)';

  setTimeout(() => {
    inner.style.transition = 'none';
    inner.style.transform  = 'rotateY(-90deg)';
    // swap to show front
    document.getElementById('cards-flip-back').style.display = 'none';
    frontFace.style.display = 'flex';

    requestAnimationFrame(() => {
      inner.style.transition = 'transform 0.4s ease-out';
      inner.style.transform  = 'rotateY(0deg)';
    });
  }, 360);

  // glow the card border with rarity colour
  setTimeout(() => {
    const wrap = document.getElementById('cards-flip-wrap');
    if (wrap) {
      wrap.style.boxShadow = '0 0 24px 8px ' + CARD_RARITY_COLOR[card.rarity];
      setTimeout(() => { wrap.style.boxShadow = ''; }, 1800);
    }
  }, 750);

  setTimeout(() => {
    updateCardUI();
    checkAchievements();
    save();

    // reset card after 2.4 s: hide front, show back, unflip
    setTimeout(() => {
      document.getElementById('cards-flip-back').style.display = '';
      frontFace.style.display = 'none';
      inner.style.transition = 'none';
      inner.style.transform  = 'rotateY(0deg)';
      btn.disabled = false;
      updateCardUI();
    }, 2400);
  }, 800);
}

document.getElementById('cards-open-btn').addEventListener('click', openCardPack);

updateCardUI();

// ── CHEAT BUTTON EASTER EGG ───────────────────────────────────────────────────
function updateCheatBtnVisibility() {
  const wrap = document.getElementById('cheat-btn-wrap');
  if (wrap) wrap.style.display = state.achievements['good-try'] ? 'none' : 'flex';
}

document.getElementById('activate-cheats-btn').addEventListener('click', () => {
  if (!isMuted) { secretAudioSrc.currentTime = 0; secretAudioSrc.play().catch(() => {}); }
  if (!state.achievements['good-try']) {
    state.achievements['good-try'] = true;
    const a = ACHIEVEMENTS.find(x => x.id === 'good-try');
    if (a) showAchievementToast(a);
    updateAchievementCards();
    save();
  }
  updateCheatBtnVisibility();
});

// ── MUTE BUTTON ───────────────────────────────────────────────────────────────
function toggleMute() {
  isMuted = !isMuted;
  const btn = document.getElementById('mute-btn');
  btn.textContent = isMuted ? '[ MUTED ]' : '[ SFX ]';
  btn.classList.toggle('muted', isMuted);
  const namedVol = isMuted ? 0 : 1;
  happyAudioSrc.volume   = namedVol;
  upgradeAudioSrc.volume = namedVol;
  jackpotAudioSrc.volume = namedVol;
  dingAudioSrc.volume    = namedVol;
  yoshiAudioSrc.volume   = namedVol;
  perfectAudioSrc.volume   = namedVol;
  robloxWinAudioSrc.volume = namedVol;
  applyMusicVolume();
}

let mutePressCount  = 0;
let vidOverlayActive = false;

document.getElementById('mute-btn').addEventListener('click', () => {
  toggleMute();
  if (vidOverlayActive) return;
  mutePressCount++;
  if (mutePressCount >= 5) {
    mutePressCount = 0;
    vidOverlayActive = true;

    const overlay = document.createElement('div');
    overlay.id = 'vid-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;display:flex;align-items:center;justify-content:center;';

    const vid = document.createElement('video');
    vid.src = SFX + 'vid.mov';
    vid.autoplay = true;
    vid.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
    vid.play().catch(() => {});

    overlay.appendChild(vid);
    document.body.appendChild(overlay);

    const cleanup = () => {
      overlay.remove();
      vidOverlayActive = false;
    };
    setTimeout(cleanup, 63000);
    vid.addEventListener('ended', cleanup);
  }
});

document.getElementById('music-btn').addEventListener('click', toggleMusicMute);

// restore music-mute state for users who already have music running
(function syncMusicBtn() {
  const btn = document.getElementById('music-btn');
  if (btn && isMusicMuted) {
    btn.textContent = '[ MUS OFF ]';
    btn.classList.add('muted');
  }
})();

// ── ALL-ACHIEVEMENTS CELEBRATION ──────────────────────────────────────────────
function celebrateAllAchievements() {
  // massive multi-burst coin shower
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < 8; i++) {
    setTimeout(() => slotsFireConfetti(
      cx + (Math.random() - 0.5) * window.innerWidth  * 0.6,
      cy + (Math.random() - 0.5) * window.innerHeight * 0.5,
      70
    ), i * 250);
  }

  // play jackpot audio
  if (!isMuted) { jackpotAudioSrc.currentTime = 0; jackpotAudioSrc.play().catch(() => {}); }

  // spin the whole Aaron (sway wrapper) while glowing
  const swayEl = document.getElementById('sway-wrapper');
  swayEl.classList.add('aaron-all-achieve-spin');
  setTimeout(() => swayEl.classList.remove('aaron-all-achieve-spin'), 6000);

  startFootlongMusicIfAllAchievements();

  // offer the music after the celebration settles
  setTimeout(showAllAchieveMusicOffer, 3200);
}

// ── ALL-ACHIEVEMENTS CELEBRATION CARD ─────────────────────────────────────────
function showAllAchieveMusicOffer() {
  if (document.getElementById('all-achieve-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'all-achieve-overlay';
  overlay.innerHTML = `
    <div id="all-achieve-card">
      <div id="all-achieve-header">ALL ACHIEVEMENTS!</div>
      <div id="all-achieve-sub">COMPLETE COLLECTION</div>
      <div id="all-achieve-body">
        You got every single achievement.<br>
        <span id="all-achieve-music-label">&#9835; Footlong Aaron &#9835;</span><br>
        is playing in your honour.
      </div>
      <div id="all-achieve-btns">
        <button class="prestige-btn prestige-btn-yes" id="all-achieve-close">NICE</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('all-achieve-close').addEventListener('click', () => overlay.remove());
}

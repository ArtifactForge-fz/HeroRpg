// Bundles the HeroRPG static site into one self-contained HTML fragment for a Claude Artifact.
// - inlines css/theme.css
// - embeds all assets/icons/*.png as data URIs in window.HERORPG_ICONS
// - patches the single icon-path line in js/ui/icons.js to prefer the embedded map
// - adds an in-memory localStorage fallback (Artifact iframes may have an opaque origin)
// - preserves the exact <script> order and the inline boot script from index.html
const fs = require('fs');
const path = require('path');

const ROOT = 'D:/Claude - collection folder/HeroRPG';
const OUT = path.join(__dirname, 'herorpg_artifact.html');

// Normalize CRLF: the repo stores LF but a core.autocrlf checkout materializes CRLF, which
// broke the boot-script regex below (it anchors on '<script>\n').
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');

// Shell markup: everything between <body> and the first <script
const bodyStart = indexHtml.indexOf('<body>') + '<body>'.length;
const firstScript = indexHtml.indexOf('<script', bodyStart);
const shell = indexHtml.slice(bodyStart, firstScript).trim();

// Script order from index.html
const order = [...indexHtml.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
if (order.length < 20) throw new Error('unexpected script count: ' + order.length);

// Inline boot script (the <script> block with no src)
const bootMatch = indexHtml.match(/<script>\n([\s\S]*?)<\/script>\s*<\/body>/);
if (!bootMatch) throw new Error('boot script not found');
const boot = bootMatch[1];

const css = fs.readFileSync(path.join(ROOT, 'css/theme.css'), 'utf8');

// Icons -> data URI map
const iconDir = path.join(ROOT, 'assets/icons');
const icons = {};
for (const f of fs.readdirSync(iconDir).filter(f => f.endsWith('.png'))) {
  icons[f.replace(/\.png$/, '')] = 'data:image/png;base64,' + fs.readFileSync(path.join(iconDir, f)).toString('base64');
}

// Game JS, concatenated in order, with the one icon-path line patched
let gameJs = '';
for (const rel of order) {
  let src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (rel === 'js/ui/icons.js') {
    const needle = "img.src = 'assets/icons/' + id + '.png';";
    if (!src.includes(needle)) throw new Error('icon needle not found');
    src = src.replace(needle,
      "img.src = (window.HERORPG_ICONS && window.HERORPG_ICONS[id]) || ('assets/icons/' + id + '.png');");
  }
  gameJs += '\n// ===== ' + rel + ' =====\n' + src;
}

const shim = `// Artifact runtime shims: sandboxed iframes can have an opaque origin where localStorage
// throws on access. Fall back to an in-memory store so play works; the game's own Export/Import
// save-string buttons remain the cross-session persistence path.
(function () {
  var ok = false;
  try { window.localStorage.setItem('__t', '1'); window.localStorage.removeItem('__t'); ok = true; } catch (e) {}
  if (!ok) {
    var mem = {};
    var fake = {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; }
    };
    try { Object.defineProperty(window, 'localStorage', { value: fake, configurable: true }); } catch (e2) {}
  }
})();
window.HERORPG_ICONS = ${JSON.stringify(icons)};`;

const out = `<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HeroRPG</title>
<style>
${css}
</style>
${shell}
<script>
${shim}
</script>
<script>
${gameJs}
</script>
<script>
${boot}
</script>
`;

fs.writeFileSync(OUT, out);
// verification: mobile M0 (docs/SPEC-MOBILE-UI.md §4/§5) — both the site and this artifact must
// carry the viewport meta, or phones render at ~980px virtual width again.
if (!indexHtml.includes('name="viewport"')) throw new Error('index.html lost its viewport meta (mobile M0)');
if (!out.includes('name="viewport"')) throw new Error('artifact template lost its viewport meta (mobile M0)');
// verification: syntax-check each embedded script block
new Function(shim.replace('window.HERORPG_ICONS', 'var __icons'));
new Function(gameJs); // throws on syntax error (does not execute)
new Function(boot);
console.log('scripts:', order.length, '| icons:', Object.keys(icons).length,
  '| size:', (fs.statSync(OUT).size / 1024 / 1024).toFixed(2) + ' MB');

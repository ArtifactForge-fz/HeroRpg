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

// v1.8 P4 (Task D, SPEC-V1.8-TECHS-AND-REACHABILITY.md §3): index.html's footer links to
// changelog.html/wiki.html, but the single-file artifact bundles only index.html's own <script>
// list (`order` above), so those two links are dead inside the artifact. Rather than ship
// separate pages (impossible in a single file), the footer becomes in-page overlay toggles
// (patched into the shell below) that render the SAME content the standalone pages show —
// wiki.html's Game.Wiki.render needs js/ui/wiki.js, which index.html itself never loads (only
// wiki.html does), so it's appended here, artifact-build-only, and NOT added to `order`/
// index.html's own script list (the multi-file site keeps loading it only from wiki.html).
const wikiJsSrc = fs.readFileSync(path.join(ROOT, 'js/ui/wiki.js'), 'utf8');
gameJs += '\n// ===== js/ui/wiki.js (artifact-only inline for the Reference-Wiki overlay; NOT in index.html\'s own script list) =====\n' + wikiJsSrc;

// v1.8 P4 (Task D): patch the two footer <a href> targets (changelog.html/wiki.html — dead links
// in a single file) into in-page overlay toggles, and append the two overlay containers to the
// shell. Artifact-only — index.html on disk is never touched, so the multi-file site's footer
// keeps navigating to the real standalone pages exactly as before.
const patchedVersionLog = shell.replace(
  '<a href="changelog.html" id="versionloglink">Version Log</a>',
  '<a href="javascript:void(0)" id="versionloglink" onclick="window.HRPG_openChangelogOverlay(); return false;">Version Log</a>'
);
if (patchedVersionLog === shell) throw new Error('artifact footer: Version Log link not found to patch');
const patchedWiki = patchedVersionLog.replace(
  '<a href="wiki.html">Reference Wiki</a>',
  '<a href="javascript:void(0)" onclick="window.HRPG_openWikiOverlay(); return false;">Reference Wiki</a>'
);
if (patchedWiki === patchedVersionLog) throw new Error('artifact footer: Reference Wiki link not found to patch');

const overlaysHtml = `
<div id="artifact-changelog-overlay" class="artifact-overlay" style="display:none;">
  <div class="artifact-overlay-box panelsurround">
    <div class="tcat">Version Log <span class="infobox-close" onclick="window.HRPG_closeOverlay('artifact-changelog-overlay')"> [x]</span></div>
    <div id="artifact-changelog-body" class="artifact-overlay-body"></div>
  </div>
</div>
<div id="artifact-wiki-overlay" class="artifact-overlay" style="display:none;">
  <div class="artifact-overlay-box panelsurround">
    <div class="tcat">Reference Wiki <span class="infobox-close" onclick="window.HRPG_closeOverlay('artifact-wiki-overlay')"> [x]</span></div>
    <div id="artifact-wiki-body" class="artifact-overlay-body"></div>
  </div>
</div>`;

const patchedShell = patchedWiki + overlaysHtml;

// Overlay-only CSS, appended to the inlined theme.css — reuses existing theme tokens
// (panelsurround/tcat/infobox-close) rather than inventing new colors, per the artifact-design
// discipline the rest of this bundle already follows.
const overlayCss = `
/* v1.8 P4 (Task D): artifact-only footer overlays (Version Log / Reference Wiki) — full-screen,
   theme-consistent, scrollable. Never shipped in css/theme.css itself; the multi-file site has
   no equivalent element to style. */
.artifact-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 9999;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
}
.artifact-overlay-box { max-width: 900px; margin: 0 auto; padding: 10px; }
.artifact-overlay-body { max-height: 80vh; overflow-y: auto; margin-top: 8px; }
`;

// Overlay glue JS: lazily renders each overlay's content on first open. Changelog rendering is
// the same ~30-line renderer changelog.html's own inline script uses (Game.Data.changelog ->
// DOM), reproduced here rather than shared via a module (no module system, per CLAUDE.md — "No
// modules, no fetch"); the wiki overlay just calls the now-inlined Game.Wiki.render once.
const overlayJs = `// v1.8 P4 (Task D): footer overlay glue, artifact-build-only (tools/build_artifact.js) — never
// present in index.html itself. Defines window.HRPG_open*/HRPG_closeOverlay referenced by the
// patched footer links above; safe to define before gameJs finishes loading since these are only
// INVOKED on click, well after full page load.
(function () {
  var wikiRendered = false;

  function renderChangelogOverlay() {
    var wrap = document.getElementById('artifact-changelog-body');
    if (!wrap) return;
    wrap.innerHTML = '';
    var entries = (window.Game && window.Game.Data && window.Game.Data.changelog) || [];
    entries.forEach(function (entry) {
      var section = document.createElement('div');
      section.style.marginBottom = '10px';

      var header = document.createElement('div');
      header.className = 'tcat';
      header.textContent = entry.version + ' — ' + entry.title + ' — ' + entry.date;
      section.appendChild(header);

      var panel = document.createElement('div');
      panel.className = 'panel';

      var meta = document.createElement('div');
      meta.className = 'smallfont';
      meta.style.marginBottom = '4px';
      meta.textContent = 'Save version: ' + entry.saveVersion;
      panel.appendChild(meta);

      var list = document.createElement('ul');
      list.style.margin = '0';
      list.style.paddingLeft = '18px';
      (entry.highlights || []).forEach(function (line) {
        var li = document.createElement('li');
        li.className = 'smallfont';
        li.textContent = line;
        list.appendChild(li);
      });
      panel.appendChild(list);

      section.appendChild(panel);
      wrap.appendChild(section);
    });
  }

  window.HRPG_openChangelogOverlay = function () {
    renderChangelogOverlay();
    var overlay = document.getElementById('artifact-changelog-overlay');
    if (overlay) overlay.style.display = 'block';
  };

  window.HRPG_openWikiOverlay = function () {
    var wrap = document.getElementById('artifact-wiki-body');
    if (wrap && !wikiRendered && window.Game && window.Game.Wiki) {
      window.Game.Wiki.render(wrap);
      wikiRendered = true;
    }
    var overlay = document.getElementById('artifact-wiki-overlay');
    if (overlay) overlay.style.display = 'block';
  };

  window.HRPG_closeOverlay = function (id) {
    var overlay = document.getElementById(id);
    if (overlay) overlay.style.display = 'none';
  };
})();`;

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
${overlayCss}
</style>
${patchedShell}
<script>
${shim}
</script>
<script>
${gameJs}
</script>
<script>
${overlayJs}
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
new Function(overlayJs);
new Function(boot);
// verification: v1.8 P4 (Task D) — the two footer overlays must actually be present in the
// output (patched links + both overlay containers), not just syntactically valid JS.
if (!out.includes('id="artifact-changelog-overlay"')) throw new Error('artifact: changelog overlay missing');
if (!out.includes('id="artifact-wiki-overlay"')) throw new Error('artifact: wiki overlay missing');
if (!out.includes('HRPG_openChangelogOverlay') || !out.includes('HRPG_openWikiOverlay')) throw new Error('artifact: overlay open handlers missing');
if (out.includes('href="changelog.html"') || out.includes('href="wiki.html"')) throw new Error('artifact: a footer link still points at a standalone page that does not exist in the bundle');
console.log('scripts:', order.length, '| icons:', Object.keys(icons).length,
  '| size:', (fs.statSync(OUT).size / 1024 / 1024).toFixed(2) + ' MB');

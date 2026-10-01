(function () {
  var STORAGE_KEY = 'kag-token-overrides';
  var root = document.documentElement;
  var panel = document.getElementById('design-system');
  var toggle = document.querySelector('.ds-toggle');
  var fieldsRoot = panel && panel.querySelector('[data-ds-fields]');
  var closeBtn = panel && panel.querySelector('.ds-panel__close');
  var resetBtn = panel && panel.querySelector('.ds-panel__reset');
  var exportBtn = panel && panel.querySelector('.ds-panel__export');

  var THEME_COLORS = [
    { key: '--background', label: 'Tło' },
    { key: '--surface', label: 'Powierzchnia' },
    { key: '--background-deep', label: 'Tło głębokie' },
    { key: '--text', label: 'Tekst' },
    { key: '--text-secondary', label: 'Tekst drugorzędny' },
    { key: '--text-muted', label: 'Tekst stłumiony' },
    { key: '--border', label: 'Obramowanie' },
    { key: '--accent-brass', label: 'Mosiądz' },
    { key: '--accent-brass-hover', label: 'Mosiądz — hover' },
    { key: '--accent-alert', label: 'Alert' }
  ];
  var SHARED_COLORS = [
    { key: '--call-green', label: 'Przycisk Zadzwoń — zieleń' }
  ];
  var TYPE_TOKENS = [
    { key: '--font-heading', label: 'Font nagłówków', kind: 'font' },
    { key: '--font-body', label: 'Font treści', kind: 'font' },
    { key: '--size-h1', label: 'H1 (rem)', kind: 'rem' },
    { key: '--size-h2', label: 'H2 (rem)', kind: 'rem' },
    { key: '--size-h3', label: 'H3 (rem)', kind: 'rem' },
    { key: '--size-lead', label: 'Lead (rem)', kind: 'rem' },
    { key: '--size-body', label: 'Treść (rem)', kind: 'rem' },
    { key: '--size-small', label: 'Drobny tekst (rem)', kind: 'rem' }
  ];
  var SPACE_TOKENS = [
    { key: '--space-section-y', label: 'Odstęp sekcji (rem)', kind: 'rem' },
    { key: '--space-section-y-lg', label: 'Odstęp sekcji LG (rem)', kind: 'rem' }
  ];
  var FONTS = [
    "'Bodoni Moda', serif",
    "'IBM Plex Sans', sans-serif",
    "Georgia, 'Times New Roman', serif",
    "system-ui, sans-serif"
  ];
  var MANAGED = THEME_COLORS.concat(SHARED_COLORS, TYPE_TOKENS, SPACE_TOKENS).map(function (t) {
    return t.key;
  });

  function currentTheme() {
    return root.getAttribute('data-theme') || 'dark';
  }

  function emptyStore() {
    return { dark: {}, light: {}, shared: {} };
  }

  function loadStore() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '');
      return {
        dark: parsed.dark || {},
        light: parsed.light || {},
        shared: parsed.shared || {}
      };
    } catch (e) {
      return emptyStore();
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function clearManaged() {
    MANAGED.forEach(function (key) {
      root.style.removeProperty(key);
    });
  }

  function applyStore(store) {
    clearManaged();
    Object.keys(store.shared).forEach(function (key) {
      root.style.setProperty(key, store.shared[key]);
    });
    var themeMap = store[currentTheme()] || {};
    Object.keys(themeMap).forEach(function (key) {
      root.style.setProperty(key, themeMap[key]);
    });
  }

  function tokenValue(key) {
    var raw = getComputedStyle(root).getPropertyValue(key).trim();
    return raw;
  }

  function toHex(value) {
    if (!value) return '#000000';
    if (value.charAt(0) === '#') {
      if (value.length === 4) {
        return ('#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3]).toLowerCase();
      }
      return value.slice(0, 7).toLowerCase();
    }
    var m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return '#000000';
    return '#' + [m[1], m[2], m[3]].map(function (n) {
      return ('0' + Number(n).toString(16)).slice(-2);
    }).join('');
  }

  function remNumber(value) {
    var n = parseFloat(value);
    return isNaN(n) ? '' : String(n);
  }

  function setToken(key, value, bucket) {
    var store = loadStore();
    store[bucket][key] = value;
    saveStore(store);
    root.style.setProperty(key, value);
  }

  function groupEl(title) {
    var wrap = document.createElement('section');
    wrap.className = 'ds-group';
    var h = document.createElement('h3');
    h.className = 'ds-group__title';
    h.textContent = title;
    wrap.appendChild(h);
    return wrap;
  }

  function addTokenLine(parent, token) {
    var line = document.createElement('div');
    line.className = 'ds-field';
    var name = document.createElement('label');
    name.textContent = token.label;
    var hint = document.createElement('span');
    hint.className = 'ds-field__token';
    hint.textContent = token.key;
    var control = document.createElement('div');
    control.className = 'ds-field__control';
    name.setAttribute('for', 'ds-' + token.key.slice(2));
    line.appendChild(name);
    line.appendChild(control);
    line.appendChild(hint);
    parent.appendChild(line);
    return { control: control, id: 'ds-' + token.key.slice(2) };
  }

  function bindColor(parent, token, bucket) {
    var built = addTokenLine(parent, token);
    var color = document.createElement('input');
    color.type = 'color';
    color.id = built.id;
    var text = document.createElement('input');
    text.type = 'text';
    text.spellcheck = false;
    function sync() {
      var hex = toHex(tokenValue(token.key));
      color.value = hex;
      text.value = hex;
    }
    function commit(value) {
      var hex = toHex(value);
      setToken(token.key, hex, bucket);
      color.value = hex;
      text.value = hex;
    }
    color.addEventListener('input', function () { commit(color.value); });
    text.addEventListener('change', function () { commit(text.value); });
    built.control.appendChild(color);
    built.control.appendChild(text);
    sync();
    return sync;
  }

  function bindFont(parent, token) {
    var built = addTokenLine(parent, token);
    var select = document.createElement('select');
    select.id = built.id;
    FONTS.forEach(function (font) {
      var opt = document.createElement('option');
      opt.value = font;
      opt.textContent = font.replace(/'/g, '').split(',')[0];
      select.appendChild(opt);
    });
    function sync() {
      var current = tokenValue(token.key);
      var match = FONTS.filter(function (font) {
        return current.indexOf(font.split(',')[0].replace(/'/g, '')) !== -1;
      })[0];
      select.value = match || FONTS[0];
    }
    select.addEventListener('change', function () {
      setToken(token.key, select.value, 'shared');
    });
    built.control.appendChild(select);
    sync();
    return sync;
  }

  function bindRem(parent, token) {
    var built = addTokenLine(parent, token);
    var input = document.createElement('input');
    input.type = 'number';
    input.id = built.id;
    input.min = '0';
    input.step = '0.125';
    function sync() {
      input.value = remNumber(tokenValue(token.key));
    }
    input.addEventListener('change', function () {
      setToken(token.key, input.value + 'rem', 'shared');
    });
    built.control.appendChild(input);
    sync();
    return sync;
  }

  var syncers = [];

  function buildFields() {
    if (!fieldsRoot) return;
    fieldsRoot.innerHTML = '';
    syncers = [];
    var themeGroup = groupEl('Kolory — motyw ' + (currentTheme() === 'light' ? 'jasny' : 'ciemny'));
    themeGroup.setAttribute('data-ds-theme-group', '');
    THEME_COLORS.forEach(function (token) {
      syncers.push(bindColor(themeGroup, token, currentTheme()));
    });
    var introGroup = groupEl('Intro (wspólne)');
    SHARED_COLORS.forEach(function (token) {
      syncers.push(bindColor(introGroup, token, 'shared'));
    });
    var typeGroup = groupEl('Typografia');
    TYPE_TOKENS.forEach(function (token) {
      syncers.push(token.kind === 'font' ? bindFont(typeGroup, token) : bindRem(typeGroup, token));
    });
    var spaceGroup = groupEl('Odstępy');
    SPACE_TOKENS.forEach(function (token) {
      syncers.push(bindRem(spaceGroup, token));
    });
    fieldsRoot.appendChild(themeGroup);
    fieldsRoot.appendChild(introGroup);
    fieldsRoot.appendChild(typeGroup);
    fieldsRoot.appendChild(spaceGroup);
  }

  function openPanel() {
    buildFields();
    panel.hidden = false;
    panel.offsetWidth;
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    if (location.hash !== '#design-system') {
      history.replaceState(null, '', '#design-system');
    }
  }

  function closePanel() {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (location.hash === '#design-system') {
      history.replaceState(null, '', location.pathname + location.search);
    }
    window.setTimeout(function () {
      if (!panel.classList.contains('is-open')) panel.hidden = true;
    }, 220);
  }

  applyStore(loadStore());

  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      if (panel.classList.contains('is-open')) closePanel();
      else openPanel();
    });
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
    });
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        localStorage.removeItem(STORAGE_KEY);
        clearManaged();
        buildFields();
      });
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var lines = MANAGED.map(function (key) {
          return '  ' + key + ': ' + tokenValue(key) + ';';
        });
        var css = ':root[data-theme="' + currentTheme() + '"] {\n' + lines.join('\n') + '\n}';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(css).then(function () {
            exportBtn.textContent = 'Skopiowano';
            window.setTimeout(function () { exportBtn.textContent = 'Kopiuj CSS'; }, 1400);
          });
        }
      });
    }
  }

  new MutationObserver(function () {
    applyStore(loadStore());
    if (panel && panel.classList.contains('is-open')) buildFields();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  if (location.hash === '#design-system') openPanel();
})();

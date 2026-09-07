(() => {
  'use strict';

  const root = document.getElementById('root');
  if (!root) return;

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const profileName = () => {
    const active = qs('.profile-switcher button.active');
    return active?.textContent?.replace(/Unsaved changes|Browser only|Connected file|Conflict|Local changes/gi, '').trim() || 'Personal';
  };
  const profileKey = () => `northstar-lite-notes-${profileName().toLowerCase()}`;
  const clickLegacy = (text) => {
    const button = qsa('button').find((candidate) => candidate.textContent.trim().toLowerCase().startsWith(text.toLowerCase()));
    if (button) button.click();
  };
  const setInputValue = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const localDate = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const humanDate = (raw) => {
    if (!raw) return { text: '', className: '' };
    const today = new Date(`${localDate()}T12:00:00`);
    const target = new Date(`${raw}T12:00:00`);
    const diff = Math.round((target - today) / 86400000);
    if (diff < 0) return { text: 'Overdue', className: 'is-overdue' };
    if (diff === 0) return { text: 'Today', className: 'is-today' };
    if (diff === 1) return { text: 'Tomorrow', className: '' };
    return { text: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), className: '' };
  };

  const create = (tag, attrs = {}, children = []) => {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') element.className = value;
      else if (key === 'textContent') element.textContent = value;
      else if (key === 'dataset') Object.assign(element.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value);
    });
    children.forEach((child) => element.append(child));
    return element;
  };

  function buildShell(legacy) {
    legacy.classList.add('legacy-app');
    const shell = create('main', { className: 'lite-canvas', 'aria-label': 'NorthStar Lite task canvas' });
    const topbar = create('header', { className: 'lite-topbar' });
    const date = create('time', { className: 'lite-date', dateTime: localDate(), textContent: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) });
    const switcher = create('div', { className: 'lite-switcher', role: 'group', 'aria-label': 'Workspace' });
    const captureWrap = create('div', { className: 'lite-capture-wrap' });
    const capture = create('input', { className: 'lite-capture', id: 'lite-capture', placeholder: 'Add a task…', 'aria-label': 'Add a task or search' });
    const modeButton = create('button', { className: 'lite-mode-button', type: 'button', 'aria-label': 'Search tasks', textContent: '⌕' });
    const save = create('button', { className: 'lite-save', type: 'button', 'aria-label': 'Save to Markdown', title: 'Save to Markdown', textContent: '☁' });
    const menuButton = create('button', { className: 'lite-menu-button', type: 'button', 'aria-label': 'Open file menu', title: 'File menu', textContent: '•••' });
    const menu = create('div', { className: 'lite-menu', role: 'menu', hidden: true });
    const menuTitle = create('div', { className: 'lite-menu-title', textContent: 'File' });
    const menuItems = [
      ['⇩', 'Download copy', () => clickLegacy('Download copy')],
      ['⇧', 'Import Markdown', () => clickLegacy('Import replacement')],
      ['↶', `Restore ${profileName().toLowerCase()}`, () => clickLegacy(`Recovery (${profileName().toLowerCase()})`)],
      ['⚙', 'Settings', () => window.dispatchEvent(new CustomEvent('northstar:settings'))],
    ];
    menu.append(menuTitle, ...menuItems.map(([icon, label, action]) => {
      const item = create('button', { className: 'lite-menu-item', role: 'menuitem' }, [create('span', { className: 'lite-menu-icon', textContent: icon }), create('span', { textContent: label })]);
      item.addEventListener('click', () => { action(); menu.hidden = true; });
      return item;
    }));

    qsa('.profile-switcher button', legacy).forEach((legacyButton) => {
      const name = legacyButton.textContent.replace(/Unsaved\s*changes|Browser\s*only|Connected\s*file|Conflict|Local\s*changes/gi, '').trim().split(/\s+/)[0];
      const button = create('button', { className: 'lite-switch', type: 'button', textContent: name, 'aria-pressed': 'false', dataset: { workspace: name.toLowerCase() } });
      button.addEventListener('click', () => legacyButton.click());
      switcher.append(button);
    });
    captureWrap.append(capture, modeButton);
    topbar.append(create('div', { className: 'lite-identity' }, [date, switcher]), create('div', { className: 'lite-actions' }, [captureWrap, save, menuButton, menu]));

    const stage = create('section', { className: 'lite-stage', 'aria-label': 'Priority canvas' });
    const vertical = create('div', { className: 'lite-axis lite-axis-y', 'aria-hidden': 'true' }, [create('span', { className: 'axis-label axis-important', textContent: 'Important' }), create('span', { className: 'axis-label axis-not-important', textContent: 'Not Important' })]);
    const horizontal = create('div', { className: 'lite-axis lite-axis-x', 'aria-hidden': 'true' }, [create('span', { className: 'axis-label', textContent: 'Not Urgent' }), create('div', { className: 'timeline' }, ['Sep 5', 'Sep 6', 'Sep 8', 'Sep 9'].map((label) => create('span', { textContent: label }))), create('span', { className: 'axis-label', textContent: 'Urgent' })]);
    const taskLayer = create('div', { className: 'lite-task-layer', role: 'list', 'aria-label': 'Active tasks' });
    const notes = create('section', { className: 'lite-notes', 'aria-label': `${profileName()} notes` });
    const notesHeading = create('div', { className: 'lite-notes-heading' }, [create('span', { className: 'notes-glyph', textContent: '▧' }), create('strong', { textContent: 'Notes' })]);
    const notesInput = create('textarea', { className: 'lite-notes-input', id: 'lite-notes-input', placeholder: 'Jot down ideas, thoughts, or reminders…', 'aria-label': 'Notes', spellcheck: 'true' });
    notes.append(notesHeading, notesInput);
    stage.append(vertical, horizontal, taskLayer, notes);
    shell.append(topbar, stage);
    root.prepend(shell);

    let searchMode = false;
    let lastProfile = profileName();
    const loadNotes = () => { notesInput.value = localStorage.getItem(profileKey()) || ''; };
    notesInput.addEventListener('input', () => localStorage.setItem(profileKey(), notesInput.value));
    const setSearchMode = (enabled) => {
      searchMode = enabled;
      shell.classList.toggle('searching', enabled);
      capture.placeholder = enabled ? 'Search tasks…' : 'Add a task…';
      capture.value = '';
      modeButton.textContent = enabled ? '×' : '⌕';
      modeButton.setAttribute('aria-label', enabled ? 'Exit search' : 'Search tasks');
      render();
      if (enabled) capture.focus();
    };
    modeButton.addEventListener('click', () => setSearchMode(!searchMode));
    capture.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && searchMode) { setSearchMode(false); return; }
      if (event.key !== 'Enter' || searchMode || !capture.value.trim()) return;
      const oldInput = qs('#capture', legacy);
      if (oldInput) {
        const normalized = capture.value.trim().replace(/\bless important\b/gi, 'less-important').replace(/\bimportant\b/gi, '!important');
        setInputValue(oldInput, normalized);
        oldInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        capture.value = '';
        setTimeout(render, 80);
      }
    });
    save.addEventListener('click', () => clickLegacy('Save to Markdown'));
    menuButton.addEventListener('click', (event) => { event.stopPropagation(); menu.hidden = !menu.hidden; });
    document.addEventListener('click', (event) => { if (!menu.hidden && !menu.contains(event.target) && event.target !== menuButton) menu.hidden = true; });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { menu.hidden = true; if (searchMode) setSearchMode(false); } });

    function render() {
      const current = profileName();
      if (current !== lastProfile) { lastProfile = current; loadNotes(); capture.value = ''; }
      date.textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      date.dateTime = localDate();
      qsa('.lite-switch', switcher).forEach((button) => { const active = button.dataset.workspace === current.toLowerCase(); button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
      const query = searchMode ? capture.value.trim().toLowerCase() : '';
      taskLayer.replaceChildren();
      const details = qs('.details', legacy);
      if (details && !qs('.lite-delete-task', details)) {
        const deleteButton = create('button', { className: 'lite-delete-task', type: 'button', textContent: 'Delete task' });
        deleteButton.addEventListener('click', async () => {
          const titleInput = qs('input', details);
          const title = titleInput?.value?.trim();
          if (!title || !window.confirm(`Delete “${title}”?`)) return;
          const request = indexedDB.open('northstar');
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction('liteProfiles', 'readwrite');
            const store = transaction.objectStore('liteProfiles');
            const profileId = profileName().toLowerCase();
            const getRequest = store.get(profileId);
            getRequest.onsuccess = () => {
              const record = getRequest.result;
              if (!record?.profile) return;
              const nextProfile = { ...record.profile, tasks: (record.profile.tasks || []).filter((task) => task.title !== title) };
              store.put({ ...record, profile: nextProfile, dirty: true, lastLocalEdit: new Date().toISOString() });
            };
            transaction.oncomplete = () => window.location.reload();
          };
        });
        details.append(deleteButton);
      }
      const cards = qsa('.task-card', legacy);
      cards.forEach((card, index) => {
        const main = qs('.card-main', card);
        const title = qs('strong', main)?.textContent?.trim() || main?.textContent?.replace(/Due .*/, '').trim() || 'Untitled task';
        const due = main?.textContent?.match(/Due (\d{4}-\d{2}-\d{2})/)?.[1] || '';
        if (query && !`${title} ${due}`.toLowerCase().includes(query)) return;
        const quadrant = card.closest('[data-quadrant]')?.dataset.quadrant || 'later';
        const dueView = humanDate(due);
        const task = create('article', { className: `lite-task task-${quadrant}`, role: 'listitem', draggable: 'true', tabindex: '0', dataset: { title, due, profile: current } });
        const dot = create('span', { className: 'lite-task-dot', 'aria-hidden': 'true' });
        const label = create('button', { className: 'lite-task-label', type: 'button', 'aria-label': `Edit ${title}` }, [create('span', { className: 'lite-task-title', textContent: title })]);
        if (dueView.text) label.append(create('span', { className: `lite-task-due ${dueView.className}`, textContent: dueView.text }));
        task.append(dot, label);
        const position = JSON.parse(localStorage.getItem(`northstar-lite-position-${current}-${title}`) || 'null') || { x: quadrant === 'schedule' || quadrant === 'later' ? 18 + (index % 3) * 14 : 68 + (index % 3) * 9, y: quadrant === 'schedule' || quadrant === 'do-first' ? 18 + (index % 4) * 12 : 59 + (index % 4) * 10 };
        task.style.setProperty('--x', `${Math.min(92, Math.max(6, position.x))}%`);
        task.style.setProperty('--y', `${Math.min(88, Math.max(9, position.y))}%`);
        const openEditor = () => { main?.click(); setTimeout(() => { const details = qs('.details', legacy); details?.classList.add('lite-editor-open'); }, 40); };
        label.addEventListener('click', openEditor);
        task.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openEditor(); } });
        task.addEventListener('dragstart', () => task.classList.add('is-dragging'));
        task.addEventListener('dragend', () => task.classList.remove('is-dragging'));
        task.addEventListener('dragover', (event) => event.preventDefault());
        task.addEventListener('drop', (event) => { event.preventDefault(); const bounds = stage.getBoundingClientRect(); const x = ((event.clientX - bounds.left) / bounds.width) * 100; const y = ((event.clientY - bounds.top) / bounds.height) * 100; localStorage.setItem(`northstar-lite-position-${current}-${title}`, JSON.stringify({ x, y })); render(); });
        taskLayer.append(task);
      });
      loadNotes();
    }
    const observer = new MutationObserver(() => { render(); });
    observer.observe(legacy, { subtree: true, childList: true, characterData: true, attributes: true });
    render();
  }

  const waitForLegacy = () => {
    const legacy = qs('.app-shell');
    if (!legacy || qs('.lite-canvas')) return;
    try {
      buildShell(legacy);
    } catch (error) {
      console.error('NorthStar Lite enhancement failed', error);
      const failure = document.createElement('div');
      failure.className = 'lite-enhancement-error';
      failure.textContent = `Lite shell failed: ${error.message}`;
      document.body.append(failure);
    }
  };
  const bootObserver = new MutationObserver(waitForLegacy);
  bootObserver.observe(root, { childList: true, subtree: true });
  waitForLegacy();
})();

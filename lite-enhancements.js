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

  const icon = (name) => {
    const paths = {
      plus: '<path d="M12 5v14M5 12h14"/>',
      search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
      cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .7-7.94A6.5 6.5 0 0 0 5.7 9.2 4.7 4.7 0 0 0 7 18.5Z"/><path d="M12 10v7M9.4 12.6 12 10l2.6 2.6"/>',
      more: '<circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
      download: '<path d="M12 3v12M8 11l4 4 4-4M5 20h14"/>',
      upload: '<path d="M12 16V4M8 8l4-4 4 4M5 20h14"/>',
      history: '<path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7"/><path d="M4 4v4.7h4.7M12 8v4l2.8 1.7"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56v.1h-3v-.1a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.04 15 1.7 1.7 0 0 0 5.5 14H5.4v-3h.1A1.7 1.7 0 0 0 7.04 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.72 4.8v-.1h3v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06A1.7 1.7 0 0 0 19.4 10c.24.58.8.96 1.43 1H21v3h-.1c-.63.04-1.19.42-1.5 1Z"/>',
      note: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>'
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'lite-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = paths[name] || '';
    return svg;
  };

  function buildShell(legacy) {
    legacy.classList.add('legacy-app');
    const shell = create('main', { className: 'lite-canvas', 'aria-label': 'NorthStar Lite task canvas' });
    const topbar = create('header', { className: 'lite-topbar' });
    const date = create('time', { className: 'lite-date', dateTime: localDate(), textContent: new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) });
    const switcher = create('div', { className: 'lite-switcher', role: 'group', 'aria-label': 'Workspace' });
    const captureWrap = create('div', { className: 'lite-capture-wrap' });
    const capture = create('input', { className: 'lite-capture', id: 'lite-capture', placeholder: 'Add a task…', 'aria-label': 'Add a task or search' });
    const modeButton = create('button', { className: 'lite-mode-button', type: 'button', 'aria-label': 'Search tasks' }, [icon('search')]);
    const save = create('button', { className: 'lite-save', type: 'button', 'aria-label': 'Save to Markdown', title: 'Save to Markdown' }, [icon('cloud')]);
    const menuButton = create('button', { className: 'lite-menu-button', type: 'button', 'aria-label': 'Open file menu', title: 'File menu', 'aria-expanded': 'false' }, [icon('more')]);
    const menu = create('div', { className: 'lite-menu', role: 'menu', hidden: true });
    const menuTitle = create('div', { className: 'lite-menu-title', textContent: 'File' });
    const menuItems = [
      ['download', 'Download copy', () => clickLegacy('Download copy')],
      ['upload', 'Import Markdown', () => clickLegacy('Import replacement')],
      ['history', `Restore ${profileName().toLowerCase()}`, () => clickLegacy(`Recovery (${profileName().toLowerCase()})`)],
      ['settings', 'Settings', () => window.dispatchEvent(new CustomEvent('northstar:settings'))],
    ];
    let restoreMenuLabel;
    const makeMenuItem = ([iconName, label, action]) => {
      const labelNode = create('span', { textContent: label });
      const item = create('button', { className: 'lite-menu-item', role: 'menuitem' }, [create('span', { className: 'lite-menu-icon' }, [icon(iconName)]), labelNode]);
      if (label.startsWith('Restore ')) restoreMenuLabel = labelNode;
      item.addEventListener('click', () => { action(); menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); });
      return item;
    };
    const undoItem = create('button', { className: 'lite-menu-undo', type: 'button', role: 'menuitem', hidden: true });
    menu.append(menuTitle, undoItem, makeMenuItem(menuItems[0]), makeMenuItem(menuItems[1]), create('div', { className: 'lite-menu-separator' }), create('div', { className: 'lite-menu-section', textContent: 'Recovery' }), makeMenuItem(menuItems[2]), create('div', { className: 'lite-menu-separator' }), makeMenuItem(menuItems[3]));

    qsa('.profile-switcher button', legacy).forEach((legacyButton) => {
      const name = legacyButton.textContent.replace(/Unsaved\s*changes|Browser\s*only|Connected\s*file|Conflict|Local\s*changes/gi, '').trim().split(/\s+/)[0];
      const button = create('button', { className: 'lite-switch', type: 'button', textContent: name, 'aria-pressed': 'false', dataset: { workspace: name.toLowerCase() } });
      button.addEventListener('click', () => legacyButton.click());
      switcher.append(button);
    });
    captureWrap.append(create('span', { className: 'lite-capture-icon', 'aria-hidden': 'true' }, [icon('plus')]), capture, modeButton);
    topbar.append(create('div', { className: 'lite-identity' }, [date, switcher]), create('div', { className: 'lite-actions' }, [captureWrap, save, menuButton, menu]));

    const stage = create('section', { className: 'lite-stage', 'aria-label': 'Priority canvas' });
    const vertical = create('div', { className: 'lite-axis lite-axis-y', 'aria-hidden': 'true' }, [create('span', { className: 'axis-label axis-important', textContent: 'Important' }), create('span', { className: 'axis-label axis-not-important', textContent: 'Not Important' })]);
    const horizontal = create('div', { className: 'lite-axis lite-axis-x', 'aria-hidden': 'true' }, [create('span', { className: 'axis-label', textContent: 'Not Urgent' }), create('div', { className: 'timeline' }, ['Sep 5', 'Sep 6', 'Sep 8', 'Sep 9'].map((label) => create('span', { textContent: label }))), create('span', { className: 'axis-label', textContent: 'Urgent' })]);
    const taskLayer = create('div', { className: 'lite-task-layer', role: 'list', 'aria-label': 'Active tasks' });
    const notes = create('section', { className: 'lite-notes', 'aria-label': `${profileName()} notes` });
    const notesHeading = create('div', { className: 'lite-notes-heading' }, [create('span', { className: 'notes-glyph', 'aria-hidden': 'true' }, [icon('note')]), create('strong', { textContent: 'Notes' })]);
    const notesHelper = create('p', { className: 'lite-notes-helper', textContent: 'Jot down ideas, thoughts, or reminders...' });
    const notesInput = create('textarea', { className: 'lite-notes-input', id: 'lite-notes-input', placeholder: '', 'aria-label': 'Notes', spellcheck: 'true' });
    notes.append(notesHeading, notesHelper, notesInput);
    stage.append(vertical, horizontal, taskLayer, notes);
    shell.append(topbar, stage);
    const settings = create('section', { className: 'lite-settings', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'lite-settings-title', hidden: true });
    const settingsClose = create('button', { className: 'lite-settings-close', type: 'button', 'aria-label': 'Close settings', textContent: '×' });
    const resetLayout = create('button', { className: 'lite-reset-layout', type: 'button', textContent: 'Reset task positions' });
    settings.append(create('div', { className: 'lite-settings-card' }, [create('div', { className: 'lite-settings-header' }, [create('h2', { id: 'lite-settings-title', textContent: 'Settings' }), settingsClose]), create('p', { textContent: 'Notes and task positions stay in this browser and are kept separately for each workspace.' }), resetLayout]));
    shell.append(settings);
    root.prepend(shell);

    let searchMode = false;
    let lastProfile = profileName();
    let draggedTask = null;
    let selectedTask = null;
    let undoEntry = null;
    const editorTitle = create('input', { className: 'lite-editor-title', type: 'text', 'aria-label': 'Task title' });
    const editorDue = create('input', { className: 'lite-editor-field', type: 'date', 'aria-label': 'Due date' });
    const editorImportance = create('select', { className: 'lite-editor-field', 'aria-label': 'Importance' }, [create('option', { value: 'important', textContent: 'Important' }), create('option', { value: 'less-important', textContent: 'Not important' })]);
    const editorNotes = create('textarea', { className: 'lite-editor-notes', 'aria-label': 'Task notes', placeholder: 'Add task notes...' });
    const saveTask = create('button', { className: 'lite-editor-save', type: 'button', textContent: 'Save changes' });
    const deleteTask = create('button', { className: 'lite-editor-delete', type: 'button', textContent: 'Delete task' });
    const notesDefault = () => notes.replaceChildren(notesHeading, notesHelper, notesInput);
    const loadNotes = () => { notesInput.value = localStorage.getItem(profileKey()) || ''; };
    notesInput.addEventListener('input', () => localStorage.setItem(profileKey(), notesInput.value));
    const updateStoredTask = (title, update, after) => {
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
          const now = new Date().toISOString();
          const tasks = (record.profile.tasks || []).map((task) => task.title === title ? update(task, now) : task);
          store.put({ ...record, profile: { ...record.profile, tasks }, dirty: true, lastLocalEdit: now });
        };
        transaction.oncomplete = () => after?.();
      };
    };
    const hideEditor = () => { selectedTask = null; notes.classList.remove('is-editing'); notes.setAttribute('aria-label', `${profileName()} notes`); notesDefault(); loadNotes(); };
    const showEditor = ({ title, due, quadrant }) => {
      selectedTask = { title, due, quadrant };
      notes.classList.add('is-editing');
      notes.setAttribute('aria-label', `Edit ${title}`);
      editorTitle.value = title;
      editorDue.value = due || '';
      editorImportance.value = quadrant === 'schedule' || quadrant === 'do-first' ? 'important' : 'less-important';
      editorNotes.value = '';
      notes.replaceChildren(create('div', { className: 'lite-editor-kicker', textContent: 'Task' }), editorTitle, create('label', { className: 'lite-editor-label', textContent: 'Due date' }, [editorDue]), create('label', { className: 'lite-editor-label', textContent: 'Priority' }, [editorImportance]), create('label', { className: 'lite-editor-label', textContent: 'Notes' }, [editorNotes]), create('div', { className: 'lite-editor-actions' }, [saveTask, deleteTask]));
      const request = indexedDB.open('northstar');
      request.onsuccess = () => {
        const transaction = request.result.transaction('liteProfiles', 'readonly');
        const getRequest = transaction.objectStore('liteProfiles').get(profileName().toLowerCase());
        getRequest.onsuccess = () => {
          const task = getRequest.result?.profile?.tasks?.find((item) => item.title === title);
          if (!task || selectedTask?.title !== title) return;
          editorDue.value = task.dueDate || '';
          editorImportance.value = task.importance || editorImportance.value;
          editorNotes.value = task.notes || '';
        };
      };
      editorTitle.focus();
    };
    saveTask.addEventListener('click', () => {
      if (!selectedTask || !editorTitle.value.trim()) return;
      const originalTitle = selectedTask.title;
      updateStoredTask(originalTitle, (task, now) => ({ ...task, title: editorTitle.value.trim(), dueDate: editorDue.value || null, importance: editorImportance.value, notes: editorNotes.value, updatedAt: now }), () => window.location.reload());
    });
    deleteTask.addEventListener('click', () => {
      if (!selectedTask || !window.confirm(`Delete “${selectedTask.title}”? It will remain in Markdown history.`)) return;
      updateStoredTask(selectedTask.title, (task, now) => ({ ...task, status: 'cancelled', deletedAt: now, updatedAt: now }), () => window.location.reload());
    });
    undoItem.addEventListener('click', () => {
      if (!undoEntry) return;
      const { title } = undoEntry;
      updateStoredTask(title, (task, now) => ({ ...task, status: 'open', completedAt: null, updatedAt: now }), () => window.location.reload());
    });
    const setSearchMode = (enabled) => {
      searchMode = enabled;
      shell.classList.toggle('searching', enabled);
      capture.placeholder = enabled ? 'Search tasks…' : 'Add a task…';
      capture.value = '';
      modeButton.replaceChildren(enabled ? create('span', { textContent: '×', 'aria-hidden': 'true' }) : icon('search'));
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
    const closeMenu = () => { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); };
    const closeSettings = () => { settings.hidden = true; };
    menuButton.addEventListener('click', (event) => { event.stopPropagation(); menu.hidden = !menu.hidden; menuButton.setAttribute('aria-expanded', String(!menu.hidden)); });
    document.addEventListener('click', (event) => { if (!menu.hidden && !menu.contains(event.target) && event.target !== menuButton) closeMenu(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeMenu(); closeSettings(); if (searchMode) setSearchMode(false); if (selectedTask) hideEditor(); } });
    window.addEventListener('northstar:settings', () => { settings.hidden = false; settingsClose.focus(); });
    settingsClose.addEventListener('click', closeSettings);
    resetLayout.addEventListener('click', () => {
      if (!window.confirm(`Reset saved task positions for ${profileName()}?`)) return;
      const prefix = `northstar-lite-position-${profileName()}-`;
      Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key) => key?.startsWith(prefix)).forEach((key) => localStorage.removeItem(key));
      closeSettings();
      render();
    });

    stage.addEventListener('dragover', (event) => { if (draggedTask) event.preventDefault(); });
    stage.addEventListener('drop', (event) => {
      if (!draggedTask) return;
      event.preventDefault();
      const bounds = stage.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      localStorage.setItem(`northstar-lite-position-${draggedTask.profile}-${draggedTask.title}`, JSON.stringify({ x, y }));
      draggedTask = null;
      render();
    });
    stage.addEventListener('click', (event) => { if (selectedTask && (event.target === stage || event.target === taskLayer)) hideEditor(); });

    function render() {
      const current = profileName();
      if (current !== lastProfile) { lastProfile = current; loadNotes(); capture.value = ''; }
      date.textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      date.dateTime = localDate();
      notes.setAttribute('aria-label', `${current} notes`);
      if (restoreMenuLabel) restoreMenuLabel.textContent = `Restore ${current.toLowerCase()}`;
      qsa('.lite-switch', switcher).forEach((button) => { const active = button.dataset.workspace === current.toLowerCase(); button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
      const query = searchMode ? capture.value.trim().toLowerCase() : '';
      taskLayer.replaceChildren();
      undoItem.hidden = !undoEntry;
      if (undoEntry) undoItem.textContent = `Undo completion: ${undoEntry.title}`;
      const cards = qsa('.task-card', legacy);
      cards.forEach((card, index) => {
        const main = qs('.card-main', card);
        const title = qs('strong', main)?.textContent?.trim() || main?.textContent?.replace(/Due .*/, '').trim() || 'Untitled task';
        const due = main?.textContent?.match(/Due (\d{4}-\d{2}-\d{2})/)?.[1] || '';
        if (query && !`${title} ${due}`.toLowerCase().includes(query)) return;
        const quadrant = card.closest('[data-quadrant]')?.dataset.quadrant || 'later';
        const dueView = humanDate(due);
        const task = create('article', { className: `lite-task task-${quadrant}`, role: 'listitem', draggable: 'true', tabindex: '0', dataset: { title, due, profile: current } });
        const dot = create('button', { className: 'lite-task-dot', type: 'button', 'aria-label': `Mark ${title} complete`, title: `Mark ${title} complete` });
        const label = create('button', { className: 'lite-task-label', type: 'button', 'aria-label': `Edit ${title}` }, [create('span', { className: 'lite-task-title', textContent: title })]);
        if (dueView.text) label.append(create('span', { className: `lite-task-due ${dueView.className}`, textContent: dueView.text }));
        task.append(dot, label);
        const savedPosition = JSON.parse(localStorage.getItem(`northstar-lite-position-${current}-${title}`) || 'null');
        const defaults = quadrant === 'schedule'
          ? { x: 12 + (index % 3) * 14, y: 18 + (index % 4) * 12 }
          : quadrant === 'do-first'
            ? { x: 68 + (index % 3) * 9, y: 18 + (index % 4) * 12 }
            : quadrant === 'later'
              ? { x: 52 + (index % 3) * 8, y: 68 + (index % 3) * 9 }
              : { x: 68 + (index % 3) * 9, y: 59 + (index % 4) * 10 };
        const position = savedPosition && !(quadrant === 'later' && savedPosition.x < 50 && savedPosition.y > 48) ? savedPosition : defaults;
        task.style.setProperty('--x', `${Math.min(92, Math.max(6, position.x))}%`);
        task.style.setProperty('--y', `${Math.min(88, Math.max(9, position.y))}%`);
        const openEditor = () => showEditor({ title, due, quadrant });
        label.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); openEditor(); });
        dot.addEventListener('click', (event) => {
          event.stopPropagation();
          const complete = qs('.complete', card);
          if (!complete) return;
          undoEntry = { title, profile: current };
          complete.click();
          setTimeout(render, 80);
        });
        task.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openEditor(); } });
        task.addEventListener('dragstart', (event) => { draggedTask = { profile: current, title }; event.dataTransfer?.setData('text/plain', title); task.classList.add('is-dragging'); });
        task.addEventListener('dragend', () => { draggedTask = null; task.classList.remove('is-dragging'); });
        taskLayer.append(task);
      });
    }
    const observer = new MutationObserver(() => { render(); });
    observer.observe(legacy, { subtree: true, childList: true, characterData: true, attributes: true });
    loadNotes();
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

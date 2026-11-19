(() => {
  'use strict';

  const KEYS = {
    name: 'tdld.displayName',
    tasks: 'tdld.tasks',
    links: 'tdld.quickLinks',
    theme: 'tdld.theme'
  };

  const Storage = {
    load(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const value = JSON.parse(raw);
        if (key === KEYS.tasks || key === KEYS.links) return Array.isArray(value) ? value : fallback;
        if (key === KEYS.name) return value === null || typeof value === 'string' ? value : fallback;
        if (key === KEYS.theme) return value === 'light' || value === 'dark' ? value : fallback;
        return value;
      } catch (_) { return fallback; }
    },
    save(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch (_) { return false; }
    }
  };

  const $ = (id) => document.getElementById(id);
  const state = {
    displayName: Storage.load(KEYS.name, null),
    tasks: Storage.load(KEYS.tasks, []),
    links: Storage.load(KEYS.links, []),
    theme: Storage.load(KEYS.theme, 'light'),
    timer: { total: 1500, remaining: 1500, startMs: null, interval: null, running: false }
  };

  const clockDisplay = $('clockDisplay');
  const dateDisplay = $('dateDisplay');
  const greetingText = $('greetingText');
  const timerDisplay = $('timerDisplay');
  const timerStatus = $('timerStatus');
  const timerProgress = $('timerProgress');

  function updateClock() {
    const now = new Date();
    if (clockDisplay) clockDisplay.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
    if (dateDisplay) dateDisplay.textContent = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    renderGreeting();
  }

  function greetingForHour(hour) {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }

  function renderGreeting() {
    if (!greetingText) return;
    const name = state.displayName ? `, ${state.displayName}` : '';
    greetingText.innerHTML = `${greetingForHour(new Date().getHours())}${escapeHtml(name)}<span class="accent-dot">.</span>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function showMessage(id, message, success = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = message;
    el.style.color = success ? 'var(--success)' : 'var(--danger)';
  }

  $('nameForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('nameInput');
    const name = input.value.trim();
    if (name.length < 1 || name.length > 50) return showMessage('nameError', 'Please enter a name between 1 and 50 characters.');
    if (!Storage.save(KEYS.name, name)) return showMessage('nameError', 'Could not save your name in this browser.');
    state.displayName = name;
    renderGreeting();
    showMessage('nameError', 'Name saved!', true);
  });
  if (state.displayName && $('nameInput')) $('nameInput').value = state.displayName;

  function formatTimer(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function renderTimer() {
    timerDisplay.textContent = formatTimer(state.timer.remaining);
    timerProgress.style.strokeDashoffset = 603.19 * (1 - state.timer.remaining / state.timer.total);
    timerStatus.textContent = state.timer.running ? 'FOCUS IN PROGRESS' : state.timer.remaining === 0 ? 'SESSION COMPLETE' : state.timer.remaining === state.timer.total ? 'READY WHEN YOU ARE' : 'SESSION PAUSED';
  }
  function stopTimer() {
    clearInterval(state.timer.interval);
    state.timer.interval = null;
    state.timer.running = false;
    renderTimer();
  }
  $('timerStart')?.addEventListener('click', () => {
    if (state.timer.running || state.timer.remaining <= 0) return;
    state.timer.startMs = Date.now() - (state.timer.total - state.timer.remaining) * 1000;
    state.timer.running = true;
    state.timer.interval = setInterval(() => {
      state.timer.remaining = Math.max(0, state.timer.total - Math.floor((Date.now() - state.timer.startMs) / 1000));
      renderTimer();
      if (state.timer.remaining === 0) stopTimer();
    }, 250);
    renderTimer();
  });
  $('timerStop')?.addEventListener('click', stopTimer);
  $('timerReset')?.addEventListener('click', () => {
    stopTimer();
    state.timer.remaining = state.timer.total;
    renderTimer();
  });
  renderTimer();

  function renderTasks() {
    const list = $('taskList');
    list.replaceChildren();
    $('taskCount').textContent = String(state.tasks.filter(task => !task.completed).length);
    $('emptyTasks').hidden = state.tasks.length > 0;
    state.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item${task.completed ? ' completed' : ''}`;
      const check = document.createElement('button');
      check.className = 'task-check';
      check.type = 'button';
      check.setAttribute('aria-label', task.completed ? 'Mark task incomplete' : 'Mark task complete');
      check.textContent = task.completed ? '✓' : '';
      check.addEventListener('click', () => {
        const next = state.tasks.map(item => item.id === task.id ? {...item, completed: !item.completed} : item);
        if (Storage.save(KEYS.tasks, next)) { state.tasks = next; renderTasks(); }
      });
      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;
      const actions = document.createElement('div');
      actions.className = 'task-actions';
      const edit = document.createElement('button');
      edit.className = 'small-action';
      edit.type = 'button';
      edit.textContent = '✎';
      edit.setAttribute('aria-label', 'Edit task');
      edit.addEventListener('click', () => {
        const revised = prompt('Edit task:', task.text);
        if (revised === null) return;
        const clean = revised.trim();
        if (!clean || clean.length > 200) return showMessage('taskMessage', 'Task must be 1–200 characters.');
        if (state.tasks.some(item => item.id !== task.id && item.text.trim() === clean)) return showMessage('taskMessage', 'That task already exists.');
        const next = state.tasks.map(item => item.id === task.id ? {...item, text: clean} : item);
        if (Storage.save(KEYS.tasks, next)) { state.tasks = next; renderTasks(); showMessage('taskMessage', 'Task updated.', true); }
      });
      const del = document.createElement('button');
      del.className = 'small-action delete';
      del.type = 'button';
      del.textContent = '×';
      del.setAttribute('aria-label', 'Delete task');
      del.addEventListener('click', () => {
        const next = state.tasks.filter(item => item.id !== task.id);
        if (Storage.save(KEYS.tasks, next)) { state.tasks = next; renderTasks(); }
      });
      actions.append(edit, del);
      li.append(check, text, actions);
      list.append(li);
    });
  }
  $('taskForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = $('taskInput');
    const text = input.value.trim();
    if (!text || text.length > 200) return showMessage('taskMessage', 'Task must be 1–200 characters.');
    if (state.tasks.some(task => task.text.trim() === text)) return showMessage('taskMessage', 'That task already exists.');
    const next = [...state.tasks, {id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, text, completed: false}];
    if (!Storage.save(KEYS.tasks, next)) return showMessage('taskMessage', 'Could not save tasks in this browser.');
    state.tasks = next;
    input.value = '';
    showMessage('taskMessage', 'Task added.', true);
    renderTasks();
  });
  renderTasks();

  function validHttpUrl(value) {
    try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; }
    catch (_) { return false; }
  }
  function renderLinks() {
    const container = $('quickLinks');
    container.replaceChildren();
    $('emptyLinks').hidden = state.links.length > 0;
    $('linkCount').textContent = `${state.links.length} / 20 saved`;
    state.links.forEach(link => {
      const card = document.createElement('div');
      card.className = 'quick-link';
      const open = document.createElement('button');
      open.className = 'link-open';
      open.type = 'button';
      const symbol = document.createElement('span');
      symbol.className = 'link-symbol';
      symbol.textContent = '↗';
      const label = document.createElement('span');
      label.className = 'link-label';
      label.textContent = link.label;
      open.append(symbol, label);
      open.addEventListener('click', () => window.open(link.url, '_blank', 'noopener,noreferrer'));
      const del = document.createElement('button');
      del.className = 'small-action delete';
      del.type = 'button';
      del.textContent = '×';
      del.setAttribute('aria-label', `Delete ${link.label}`);
      del.addEventListener('click', () => {
        const next = state.links.filter(item => item.id !== link.id);
        if (Storage.save(KEYS.links, next)) { state.links = next; renderLinks(); }
      });
      card.append(open, del);
      container.append(card);
    });
  }
  $('linkForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const label = $('linkLabel').value.trim();
    const url = $('linkUrl').value.trim();
    if (!label || label.length > 50) return showMessage('linkMessage', 'Link name must be 1–50 characters.');
    if (!url || url.length > 2048 || !validHttpUrl(url)) return showMessage('linkMessage', 'Enter a valid HTTP or HTTPS URL.');
    if (state.links.length >= 20) return showMessage('linkMessage', 'You can save up to 20 quick links.');
    const next = [...state.links, {id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, label, url}];
    if (!Storage.save(KEYS.links, next)) return showMessage('linkMessage', 'Could not save links in this browser.');
    state.links = next;
    $('linkLabel').value = '';
    $('linkUrl').value = '';
    showMessage('linkMessage', 'Quick link added.', true);
    renderLinks();
  });
  renderLinks();

  function applyTheme(theme) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    document.body.dataset.theme = state.theme;
    $('themeToggle').textContent = state.theme === 'dark' ? '☀' : '☾';
    $('themeToggle').setAttribute('aria-label', state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  applyTheme(state.theme);
  $('themeToggle')?.addEventListener('click', () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    Storage.save(KEYS.theme, next);
  });

  updateClock();
  setInterval(updateClock, 1000);
})();

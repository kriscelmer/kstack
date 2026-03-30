/**
 * kstack browse — Side Panel
 *
 * Shows live browser activity and the current ref map for headed QA sessions.
 * The side panel is a monitor for the shared browser runtime, not a second
 * assistant surface.
 */

const NAV_COMMANDS = new Set(['goto', 'back', 'forward', 'reload']);
const INTERACTION_COMMANDS = new Set(['click', 'fill', 'select', 'hover', 'type', 'press', 'scroll', 'wait', 'upload']);
const OBSERVE_COMMANDS = new Set(['snapshot', 'screenshot', 'diff', 'console', 'network', 'text', 'html', 'links', 'forms', 'accessibility', 'cookies', 'storage', 'perf']);

let lastId = 0;
let eventSource = null;
let serverUrl = null;
let serverToken = null;
let connState = 'disconnected';
let reconnectAttempts = 0;
let reconnectTimer = null;
const MAX_RECONNECT_ATTEMPTS = 30;

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (serverToken) headers.Authorization = `Bearer ${serverToken}`;
  return headers;
}

function setConnState(state) {
  const previous = connState;
  connState = state;
  const banner = document.getElementById('conn-banner');
  const bannerText = document.getElementById('conn-banner-text');
  const bannerActions = document.getElementById('conn-banner-actions');

  if (state === 'connected') {
    if (previous === 'reconnecting' || previous === 'dead') {
      banner.style.display = '';
      banner.className = 'conn-banner reconnected';
      bannerText.textContent = 'Reconnected';
      bannerActions.style.display = 'none';
      setTimeout(() => {
        banner.style.display = 'none';
      }, 5000);
    } else {
      banner.style.display = 'none';
    }
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
    return;
  }

  if (state === 'reconnecting') {
    banner.style.display = '';
    banner.className = 'conn-banner reconnecting';
    bannerText.textContent = `Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
    bannerActions.style.display = 'none';
    return;
  }

  if (state === 'dead') {
    banner.style.display = '';
    banner.className = 'conn-banner dead';
    bannerText.textContent = 'Server offline';
    bannerActions.style.display = '';
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
    return;
  }

  banner.style.display = 'none';
}

function startReconnect() {
  if (reconnectTimer) return;
  setConnState('reconnecting');
  reconnectTimer = setInterval(() => {
    reconnectAttempts++;
    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      setConnState('dead');
      return;
    }
    setConnState('reconnecting');
    tryConnect();
  }, 2000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getEntryClass(entry) {
  if (entry.status === 'error') return 'error';
  if (entry.type === 'command_start') return 'pending';
  const command = entry.command || '';
  if (NAV_COMMANDS.has(command)) return 'nav';
  if (INTERACTION_COMMANDS.has(command)) return 'interaction';
  if (OBSERVE_COMMANDS.has(command)) return 'observe';
  return '';
}

const pendingEntries = new Map();

function createEntryElement(entry) {
  const div = document.createElement('div');
  div.className = `activity-entry ${getEntryClass(entry)}`;
  div.setAttribute('role', 'article');
  div.tabIndex = 0;

  const argsText = entry.args ? entry.args.join(' ') : '';
  const statusIcon = entry.status === 'ok' ? '\u2713' : entry.status === 'error' ? '\u2717' : '';
  const statusClass = entry.status === 'ok' ? 'ok' : entry.status === 'error' ? 'err' : '';
  const duration = entry.duration ? `${entry.duration}ms` : '';

  div.innerHTML = `
    <div class="entry-header">
      <span class="entry-time">${formatTime(entry.timestamp)}</span>
      <span class="entry-command">${escapeHtml(entry.command || entry.type)}</span>
    </div>
    ${argsText ? `<div class="entry-args">${escapeHtml(argsText)}</div>` : ''}
    ${entry.type === 'command_end' ? `
      <div class="entry-status">
        <span class="${statusClass}">${statusIcon}</span>
        <span class="duration">${duration}</span>
      </div>
    ` : ''}
    ${entry.result ? `
      <div class="entry-detail">
        <div class="entry-result">${escapeHtml(entry.result)}</div>
      </div>
    ` : ''}
  `;

  div.addEventListener('click', () => div.classList.toggle('expanded'));
  return div;
}

function addEntry(entry) {
  const feed = document.getElementById('activity-feed');
  const empty = document.getElementById('empty-state');
  if (empty) empty.style.display = 'none';

  if (entry.type === 'command_end') {
    for (const [id, el] of pendingEntries) {
      if (el.querySelector('.entry-command')?.textContent === entry.command) {
        el.remove();
        pendingEntries.delete(id);
        break;
      }
    }
  }

  const el = createEntryElement(entry);
  feed.appendChild(el);
  if (entry.type === 'command_start') pendingEntries.set(entry.id, el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  lastId = Math.max(lastId, entry.id);
}

function connectSSE() {
  if (!serverUrl) return;
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  const tokenParam = serverToken ? `&token=${serverToken}` : '';
  const url = `${serverUrl}/activity/stream?after=${lastId}${tokenParam}`;
  eventSource = new EventSource(url);

  eventSource.addEventListener('activity', (event) => {
    try {
      addEntry(JSON.parse(event.data));
    } catch {}
  });

  eventSource.addEventListener('gap', (event) => {
    try {
      const data = JSON.parse(event.data);
      const feed = document.getElementById('activity-feed');
      const banner = document.createElement('div');
      banner.className = 'gap-banner';
      banner.textContent = `Missed ${data.availableFrom - data.gapFrom} events`;
      feed.appendChild(banner);
    } catch {}
  });
}

async function fetchRefs() {
  if (!serverUrl) return;
  try {
    const resp = await fetch(`${serverUrl}/refs`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(3000),
    });
    if (!resp.ok) return;
    const data = await resp.json();

    const list = document.getElementById('refs-list');
    const empty = document.getElementById('refs-empty');
    const footer = document.getElementById('refs-footer');

    if (!data.refs || data.refs.length === 0) {
      empty.style.display = '';
      list.innerHTML = '';
      footer.textContent = '';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = data.refs.map((ref) => `
      <div class="ref-row">
        <span class="ref-id">${escapeHtml(ref.ref)}</span>
        <span class="ref-role">${escapeHtml(ref.role)}</span>
        <span class="ref-name">"${escapeHtml(ref.name)}"</span>
      </div>
    `).join('');
    footer.textContent = `${data.refs.length} refs`;
  } catch {}
}

function selectTab(tabName) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });

  if (tabName === 'refs') {
    fetchRefs();
  }
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    selectTab(tab.dataset.tab);
  });
});

function updateConnection(url, token) {
  const wasConnected = !!serverUrl;
  serverUrl = url;
  serverToken = token || null;

  if (url) {
    document.getElementById('footer-dot').className = 'dot connected';
    document.getElementById('footer-port').textContent = `:${new URL(url).port}`;
    setConnState('connected');
    connectSSE();
    if (document.querySelector('.tab.active')?.dataset.tab === 'refs') {
      fetchRefs();
    }
    return;
  }

  document.getElementById('footer-dot').className = 'dot';
  document.getElementById('footer-port').textContent = '';
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (wasConnected) {
    startReconnect();
  }
}

const portLabel = document.getElementById('footer-port');
const portInput = document.getElementById('port-input');

portLabel.addEventListener('click', () => {
  portLabel.style.display = 'none';
  portInput.style.display = '';
  chrome.runtime.sendMessage({ type: 'getPort' }, (resp) => {
    portInput.value = resp?.port || '';
    portInput.focus();
    portInput.select();
  });
});

function savePort() {
  const port = parseInt(portInput.value, 10);
  if (port > 0 && port < 65536) {
    chrome.runtime.sendMessage({ type: 'setPort', port });
  }
  portInput.style.display = 'none';
  portLabel.style.display = '';
}

portInput.addEventListener('blur', savePort);
portInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') savePort();
  if (event.key === 'Escape') {
    portInput.style.display = 'none';
    portLabel.style.display = '';
  }
});

document.getElementById('refresh-refs').addEventListener('click', () => {
  fetchRefs();
  selectTab('refs');
});

document.getElementById('conn-reconnect').addEventListener('click', () => {
  reconnectAttempts = 0;
  startReconnect();
});

document.getElementById('conn-copy').addEventListener('click', () => {
  navigator.clipboard.writeText('/connect-chrome').then(() => {
    const btn = document.getElementById('conn-copy');
    btn.textContent = 'copied!';
    setTimeout(() => {
      btn.textContent = '/connect-chrome';
    }, 2000);
  });
});

function tryConnect() {
  chrome.runtime.sendMessage({ type: 'getPort' }, (resp) => {
    if (resp && resp.port && resp.connected) {
      updateConnection(`http://127.0.0.1:${resp.port}`, null);
      return;
    }
    setTimeout(tryConnect, 2000);
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'health') {
    if (msg.data) {
      updateConnection(`http://127.0.0.1:${msg.data.port || 34567}`, msg.data.token);
    } else {
      updateConnection(null, null);
    }
  }

  if (msg.type === 'refs' && document.querySelector('.tab.active')?.dataset.tab === 'refs') {
    fetchRefs();
  }
});

tryConnect();

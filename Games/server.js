/**
 * Teach Today — GameHub Multiplayer Server
 *
 * Run once on the classroom Mac:
 *   cd "Games"
 *   node server.js
 *
 * The server does TWO things on the same port (8765):
 *   • Serves all game files over HTTP  →  students open the URL in any browser
 *   • Handles WebSocket connections     →  multiplayer lobby & game relay
 *
 * Students never type an IP. They open the URL the terminal shows, and the
 * Game Hub auto-connects to multiplayer because the WS address === the page origin.
 */

'use strict';

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const { WebSocketServer } = require('ws');

const PORT     = 8765;
const GAME_DIR = __dirname;   // serve everything in the Games/ folder

// ── MIME types ────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.gif' : 'image/gif',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf' : 'font/ttf',
  '.pdf' : 'application/pdf',
  '.mp3' : 'audio/mpeg',
  '.wav' : 'audio/wav',
};

// ── Multiplayer state ─────────────────────────────────────────────────────────
const players = new Map();   // id → { ws, id, name, avatar, status, roomId }
const rooms   = new Map();   // roomId → { host, guest, game, createdAt }

// ── HTTP + file server ────────────────────────────────────────────────────────
const httpServer = http.createServer((req, res) => {
  // Health-check JSON for programmatic use
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, players: players.size, rooms: rooms.size }));
  }

  // Strip query string, decode URI, default to index.html
  let pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname === '/' || pathname === '') pathname = '/index.html';

  const filePath = path.join(GAME_DIR, pathname);

  // Security: don't let ".." escape GAME_DIR
  if (!filePath.startsWith(GAME_DIR)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found: ' + pathname);
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type'  : mime,
      'Cache-Control' : 'no-cache',
      'Content-Length': stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

// ── WebSocket server (same port, upgraded from HTTP) ──────────────────────────
const wss = new WebSocketServer({ server: httpServer });

// ── WS helpers ────────────────────────────────────────────────────────────────
const send   = (ws, msg)      => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); };
const sendTo = (pid, msg)     => { const p = players.get(pid); if (p) send(p.ws, msg); };

function broadcastLobby() {
  const list = [...players.values()].map(({ id, name, avatar, status }) => ({ id, name, avatar, status }));
  for (const p of players.values()) send(p.ws, { type: 'lobby', players: list });
}

// ── WS message handler ────────────────────────────────────────────────────────
function handle(playerId, msg) {
  const self = players.get(playerId);
  if (!self) return;

  switch (msg.type) {

    case 'join': {
      self.name   = (msg.name   || 'Player').slice(0, 32);
      self.avatar = (msg.avatar || '?').slice(0, 4);
      self.status = 'lobby';
      console.log(`  [join]  ${self.name}`);
      send(self.ws, { type: 'joined', id: playerId, name: self.name });
      broadcastLobby();
      break;
    }

    case 'invite': {
      const target = players.get(msg.targetId);
      if (!target || target.status !== 'lobby') {
        send(self.ws, { type: 'invite-fail', reason: 'Player is not available' }); return;
      }
      const roomId = Math.random().toString(36).slice(2, 10);
      send(target.ws, { type: 'invite', fromId: playerId, fromName: self.name,
                        fromAvatar: self.avatar, roomId, game: msg.game || 'letterSoccer' });
      self._pendingRoom = roomId; self._pendingTarget = target.id;
      console.log(`  [invite] ${self.name} → ${target.name}`);
      break;
    }

    case 'invite-accept': {
      const host = [...players.values()].find(p => p._pendingRoom === msg.roomId);
      if (!host) { send(self.ws, { type: 'invite-fail', reason: 'Invite expired' }); return; }
      // Save names/avatars so we can restore them when players rejoin after navigation
      const room = { host: host.id, guest: playerId, game: msg.game || 'letterSoccer', createdAt: Date.now(),
                     host_name: host.name, host_avatar: host.avatar,
                     guest_name: self.name, guest_avatar: self.avatar };
      rooms.set(msg.roomId, room);
      host.status = 'playing'; host.roomId = msg.roomId; host._pendingRoom = null;
      self.status = 'playing'; self.roomId = msg.roomId;
      console.log(`  [room]  ${host.name} vs ${self.name}`);
      const payload = { type: 'game-start', roomId: msg.roomId, game: room.game,
                        host: { id: host.id, name: host.name, avatar: host.avatar },
                        guest:{ id: self.id,  name: self.name,  avatar: self.avatar } };
      send(host.ws, payload); send(self.ws, payload); broadcastLobby();
      break;
    }

    case 'invite-decline': {
      const host = [...players.values()].find(p => p._pendingRoom === msg.roomId);
      if (host) { host._pendingRoom = null; host._pendingTarget = null;
                  send(host.ws, { type: 'invite-declined', byName: self.name }); }
      break;
    }

    case 'rejoin': {
      // Player's browser navigated to the game page — old WS closed, they reconnected fresh.
      // Slot them back into their room (held open for 30s after disconnect).
      const room = rooms.get(msg.roomId);
      if (!room) { send(self.ws, { type: 'rejoin-fail', reason: 'Room expired' }); return; }
      const role = msg.role; // 'host' | 'guest'
      if (!['host','guest'].includes(role)) return;
      room[role] = playerId;           // update slot to new connection id
      self.roomId = msg.roomId;
      self.status = 'playing';
      // Restore name/avatar that was saved at room creation
      self.name   = room[role + '_name']   || self.name;
      self.avatar = room[role + '_avatar'] || self.avatar;
      console.log(`  [rejoin] ${self.name} rejoined room ${msg.roomId} as ${role}`);
      send(self.ws, { type: 'rejoined', roomId: msg.roomId, role });
      const peerId = role === 'host' ? room.guest : room.host;
      if (peerId) sendTo(peerId, { type: 'peer-rejoined', name: self.name });
      broadcastLobby();
      break;
    }

    case 'game-state': {
      const room = rooms.get(msg.roomId);
      if (!room || room.host !== playerId) return;
      sendTo(room.guest, { type: 'game-state', state: msg.state }); break;
    }

    case 'game-input': {
      const room = rooms.get(msg.roomId);
      if (!room || room.guest !== playerId) return;
      sendTo(room.host, { type: 'game-input', input: msg.input }); break;
    }

    case 'chat': {
      const room = rooms.get(msg.roomId);
      if (!room) return;
      sendTo(room.host === playerId ? room.guest : room.host,
             { type: 'chat', fromName: self.name, text: msg.text }); break;
    }

    case 'game-end': {
      const room = rooms.get(msg.roomId);
      if (!room) return;
      for (const pid of [room.host, room.guest]) {
        const p = players.get(pid); if (p) { p.status = 'lobby'; p.roomId = null; }
      }
      rooms.delete(msg.roomId); console.log(`  [end]   room closed`); broadcastLobby(); break;
    }

    case 'ping': send(self.ws, { type: 'pong' }); break;
    default: console.warn(`  [?] unknown msg type: ${msg.type}`);
  }
}

// ── Connection lifecycle ───────────────────────────────────────────────────────
wss.on('connection', ws => {
  const id = Math.random().toString(36).slice(2, 10);
  players.set(id, { ws, id, name: '', avatar: '?', status: 'lobby', roomId: null, _pendingRoom: null });
  send(ws, { type: 'hello', id });

  ws.on('message', raw => { try { handle(id, JSON.parse(raw)); } catch (e) { /* ignore */ } });

  ws.on('close', () => {
    const p = players.get(id);
    if (p?.roomId) {
      const room = rooms.get(p.roomId);
      if (room) {
        // Only act if this connection is CURRENTLY in the room's active slots.
        // If the player already rejoined from a new tab/connection, the slot was
        // updated to the new connection id — this old connection is orphaned and
        // closing it must NOT evict the new live connection from the room.
        const role = room.host === id ? 'host'
                   : room.guest === id ? 'guest'
                   : null;
        if (role) {
          const peerId = role === 'host' ? room.guest : room.host;
          room[role] = null;
          sendTo(peerId, { type: 'peer-reconnecting', name: p.name });
          setTimeout(() => {
            const r = rooms.get(p.roomId);
            if (r && r[role] === null) {
              // Still disconnected after 30s — truly gone
              console.log(`  [timeout] ${p.name} did not rejoin — closing room`);
              const peer = players.get(peerId);
              sendTo(peerId, { type: 'peer-left', name: p.name });
              if (peer) { peer.status = 'lobby'; peer.roomId = null; }
              rooms.delete(p.roomId);
              broadcastLobby();
            }
          }, 30000);
        }
      }
    }
    players.delete(id); broadcastLobby();
  });

  ws.on('error', () => {});
});

// ── Startup banner ────────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
  // Collect network IPs
  const ifaces = Object.values(os.networkInterfaces()).flat()
    .filter(i => i.family === 'IPv4' && !i.internal);

  // macOS Bonjour hostname — stable across reboots even if IP changes
  const rawHost = os.hostname();
  const localHost = rawHost.endsWith('.local') ? rawHost : rawHost + '.local';

  const urls = [
    `http://${localHost}:${PORT}`,        // Bonjour — works on all Macs/iPads same network
    ...ifaces.map(i => `http://${i.address}:${PORT}`)
  ];

  const primary = urls[0]; // Bonjour URL — recommend this one

  // Pretty banner
  const W = 58;
  const line  = '─'.repeat(W);
  const pad   = s => ' ' + s + ' '.repeat(Math.max(0, W - s.length - 1));

  console.log(`\n┌${line}┐`);
  console.log(`│${pad('🏫  TEACH TODAY — GAMEHUB SERVER  🎮')}│`);
  console.log(`├${line}┤`);
  console.log(`│${pad('')}│`);
  console.log(`│${pad('  Students open this address in any browser:')}│`);
  console.log(`│${pad('')}│`);
  console.log(`│${pad('  ➜  ' + primary)}│`);
  console.log(`│${pad('')}│`);
  if (urls.length > 1) {
    console.log(`│${pad('  Also reachable at:')}│`);
    urls.slice(1).forEach(u => console.log(`│${pad('     ' + u)}│`));
    console.log(`│${pad('')}│`);
  }
  console.log(`│${pad('  Write the ➜ address on the board.')}│`);
  console.log(`│${pad('  The Bonjour (.local) address never changes,')}│`);
  console.log(`│${pad('  even if the router reassigns this Mac\'s IP.')}│`);
  console.log(`│${pad('')}│`);
  console.log(`└${line}┘\n`);

  // Print QR code for the primary URL
  try {
    const qr = require('qrcode-terminal');
    console.log('  Scan to open on a phone or tablet:\n');
    qr.generate(primary, { small: true });
  } catch (_) { /* qrcode-terminal optional */ }

  console.log('\n  Waiting for students…\n');
});

/**
 * Teach Today — GameHub Multiplayer Client
 * Include this script on pages that need multiplayer.
 * Usage: see MultiplayerClient below.
 */
'use strict';

class MultiplayerClient {
  /**
   * @param {string} serverUrl  e.g. "ws://192.168.1.5:8765"
   * @param {string} playerName Student's name from the hub
   * @param {string} [avatar]   1-2 char initials or emoji
   */
  constructor(serverUrl, playerName, avatar = '?') {
    this.serverUrl  = serverUrl;
    this.playerName = playerName;
    this.avatar     = avatar;
    this.id         = null;       // assigned by server on connect
    this.roomId     = null;
    this.role       = null;       // 'host' | 'guest'
    this.ws         = null;
    this.status     = 'disconnected'; // disconnected | connecting | lobby | playing

    // Callbacks — set by consumers
    this.onLobbyUpdate  = null;   // (players[]) => void
    this.onInvite       = null;   // ({fromId,fromName,roomId,game}) => void
    this.onGameStart    = null;   // ({roomId,role,host,guest}) => void
    this.onGameState    = null;   // (state) => void
    this.onGameInput    = null;   // (input) => void
    this.onChat         = null;   // ({fromName,text}) => void
    this.onPeerLeft     = null;   // ({name}) => void
    this.onInviteDeclined = null; // ({byName}) => void
    this.onDisconnect   = null;   // () => void
    this.onConnected    = null;   // () => void
    this.onError        = null;   // (msg) => void

    this._reconnectTimer = null;
    this._pingTimer      = null;
  }

  // ── Connect ─────────────────────────────────────────────────────────────────
  connect() {
    if (this.ws) this.ws.close();
    this.status = 'connecting';
    try {
      this.ws = new WebSocket(this.serverUrl);
    } catch (e) {
      this._err('Cannot connect: ' + e.message); return;
    }

    this.ws.onopen = () => {
      // Identify ourselves
      this._send({ type: 'join', name: this.playerName, avatar: this.avatar });
    };

    this.ws.onmessage = e => {
      try { this._handle(JSON.parse(e.data)); }
      catch (err) { console.error('[mp] parse error', err); }
    };

    this.ws.onclose = () => {
      this.status = 'disconnected';
      this.id = null;
      clearInterval(this._pingTimer);
      if (this.onDisconnect) this.onDisconnect();
    };

    this.ws.onerror = () => {
      this._err('Connection failed — make sure the GameHub server is running.');
    };
  }

  disconnect() {
    clearInterval(this._pingTimer);
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.status = 'disconnected';
  }

  // ── Lobby ───────────────────────────────────────────────────────────────────
  /** Invite another player (by their server-assigned id) to a game */
  sendInvite(targetId, game = 'letterSoccer') {
    this._send({ type: 'invite', targetId, game });
  }

  acceptInvite(roomId, game = 'letterSoccer') {
    this._send({ type: 'invite-accept', roomId, game });
  }

  declineInvite(roomId) {
    this._send({ type: 'invite-decline', roomId });
  }

  // ── In-game ─────────────────────────────────────────────────────────────────
  /** Host → server → guest: full serialised game state object */
  sendGameState(state) {
    if (!this.roomId) return;
    this._send({ type: 'game-state', roomId: this.roomId, state });
  }

  /** Guest → server → host: keyboard / touch input snapshot */
  sendInput(input) {
    if (!this.roomId) return;
    this._send({ type: 'game-input', roomId: this.roomId, input });
  }

  /** Send a quick-chat preset to the peer */
  sendChat(text) {
    if (!this.roomId) return;
    this._send({ type: 'chat', roomId: this.roomId, text });
  }

  /** Notify server that the game ended (returns both players to lobby) */
  endGame() {
    if (!this.roomId) return;
    this._send({ type: 'game-end', roomId: this.roomId });
    this.roomId = null; this.role = null;
    this.status = 'lobby';
  }

  // ── Internal ────────────────────────────────────────────────────────────────
  _send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  _handle(msg) {
    switch (msg.type) {

      case 'hello':
        this.id = msg.id;
        break;

      case 'joined':
        this.id     = msg.id;
        this.status = 'lobby';
        if (this.onConnected) this.onConnected();
        // Start keep-alive pings
        clearInterval(this._pingTimer);
        this._pingTimer = setInterval(() => this._send({ type: 'ping' }), 20000);
        break;

      case 'lobby':
        if (this.onLobbyUpdate) this.onLobbyUpdate(msg.players || []);
        break;

      case 'invite':
        if (this.onInvite) this.onInvite(msg);
        break;

      case 'invite-declined':
        if (this.onInviteDeclined) this.onInviteDeclined(msg);
        break;

      case 'invite-fail':
        this._err(msg.reason || 'Invite failed');
        break;

      case 'game-start':
        this.roomId = msg.roomId;
        this.role   = (msg.host.id === this.id) ? 'host' : 'guest';
        this.status = 'playing';
        if (this.onGameStart) this.onGameStart({
          roomId: msg.roomId,
          role:   this.role,
          host:   msg.host,
          guest:  msg.guest,
          game:   msg.game,
        });
        break;

      case 'game-state':
        if (this.onGameState) this.onGameState(msg.state);
        break;

      case 'game-input':
        if (this.onGameInput) this.onGameInput(msg.input);
        break;

      case 'chat':
        if (this.onChat) this.onChat(msg);
        break;

      case 'peer-left':
        this.roomId = null; this.role = null; this.status = 'lobby';
        if (this.onPeerLeft) this.onPeerLeft(msg);
        break;

      // Rejoin acknowledged — server put us back in our room after page navigation
      case 'rejoined':
        this.roomId = msg.roomId;
        this.role   = msg.role;
        this.status = 'playing';
        console.log('[mp] rejoined room', msg.roomId, 'as', msg.role);
        break;

      case 'rejoin-fail':
        console.warn('[mp] rejoin failed:', msg.reason);
        this._err('Could not reconnect to game: ' + (msg.reason || 'room expired'));
        break;

      case 'peer-reconnecting': break;  // peer's page is loading — they'll be back
      case 'peer-rejoined':     break;  // peer came back successfully

      // server echoes pong (optional — ignored here)
      case 'pong': break;
    }
  }

  _err(msg) {
    console.warn('[mp]', msg);
    if (this.onError) this.onError(msg);
  }
}

// Expose globally so hub and game pages can use it
window.MultiplayerClient = MultiplayerClient;

// ── Quick-chat preset messages for Letter Soccer ────────────────────────────
window.MP_CHAT_PRESETS = [
  { text: 'GG! 🤝',               label: 'GG' },
  { text: 'Nice kick! 🔥',         label: 'Nice kick' },
  { text: "I'm coming for you! 😤", label: 'Watch out' },
  { text: 'No way!! 😱',           label: 'No way' },
  { text: "Let's go again! 🔄",    label: 'Rematch' },
  { text: 'Lucky shot 😅',         label: 'Lucky shot' },
  { text: 'You got skills! 🌟',    label: 'Props' },
  { text: 'Bring it 💪',           label: 'Bring it' },
];

#!/usr/bin/env node
/**
 * ⚽ CLASICO Football Server
 *
 * Bridge between Claude Code hooks and the 3D football match.
 * Requires: ws (npm install ws)
 *
 * Usage:  node football-server.js [port]
 * Open:   football-match.html?bridge=3333
 */
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.argv[2]) || 3333;

/* ═══════════════════════ STATE ═══════════════════════ */
const state = {
    sessionActive: false,
    agents: new Map(),        // agent_id → { playerName, type }
    mainPlayer: 'Witsel',     // main session = captain
    toolCount: 0,
    goalCount: 0,
    wasilTackled: false,
    lastActivePlayer: null,
    usedSlots: new Set(),     // player names currently on field
    lastActionTime: 0,        // throttle actions
};

const ROSTER = [
    'Bodart','Siquet','Dussenne','Laifis','Gavory',
    'Raskin','Witsel','Carcela','Amallah','Emond','Mpoku',
];
let rosterCursor = 0;

// Agent type → preferred player
const TYPE_PLAYER = {
    'Explore':           'Carcela',
    'Plan':              'Raskin',
    'claude-code-guide': 'Defour',
};

// Tool → football action message
const TOOL_MSG = {
    Read:            i => `J'analyse ${sPath(i.file_path)}...`,
    Grep:            i => `Je cherche \`${cut(i.pattern,20)}\`...`,
    Glob:            i => `Je repère \`${cut(i.pattern,20)}\`...`,
    Edit:            i => `Tacle ! Je modifie ${sPath(i.file_path)}`,
    Write:           i => `FRAPPE ! Je crée ${sPath(i.file_path)}`,
    Bash:            i => `BOUM ! \`${cut(i.command,30)}\``,
    WebSearch:       i => `Stratégie : "${cut(i.query,25)}"`,
    WebFetch:        () => `J'écoute le briefing...`,
    Task:            () => `Passe décisive ! Agent lancé !`,
    AskUserQuestion: () => `Coach ! Quelle stratégie ?`,
    Skill:           () => `Je consulte le playbook...`,
    TodoWrite:       () => `Je note les tâches...`,
    NotebookEdit:    () => `Je code dans le notebook...`,
};

function sPath(p) {
    if (!p) return '`???`';
    return '`' + p.replace(/\\/g,'/').split('/').pop() + '`';
}
function cut(s, n) { return !s ? '???' : s.length > n ? s.slice(0,n)+'…' : s; }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ═══════════════════════ WEBSOCKET CLIENTS ═══════════════════════ */
const clients = new Set();

function broadcast(evt) {
    const json = JSON.stringify(evt);
    for (const c of clients) {
        if (c.readyState === 1) {  // ws.OPEN
            try { c.send(json); } catch(e) { /* ignore */ }
        }
    }
    const tag = evt.type === 'play' ? 'play(' + (evt.steps||[]).length + ' steps)'
        : `${evt.type}${evt.name ? ' '+evt.name : ''}`;
    console.log(`📡 ${tag}`);
}

/* ═══════════════════════ WS SERVER (via 'ws' package) ═══════════════════════ */
let wss;  // initialized after HTTP server is created

/* ═══════════════════════ PLAYER ASSIGNMENT ═══════════════════════ */
function assignPlayer(agentId, agentType) {
    if (state.agents.has(agentId)) return state.agents.get(agentId).playerName;

    // Preferred player for this agent type
    let name = TYPE_PLAYER[agentType];
    if (!name || state.usedSlots.has(name)) {
        // Cycle through roster for an available slot
        for (let i = 0; i < ROSTER.length; i++) {
            const c = ROSTER[(rosterCursor + i) % ROSTER.length];
            if (!state.usedSlots.has(c) && c !== state.mainPlayer) {
                name = c;
                rosterCursor = (rosterCursor + i + 1) % ROSTER.length;
                break;
            }
        }
        if (!name) name = ROSTER[rosterCursor % ROSTER.length];
    }
    state.agents.set(agentId, { playerName: name, type: agentType });
    return name;
}

function ensureOnField(name) {
    if (state.usedSlots.has(name)) return;
    state.usedSlots.add(name);
    broadcast({ type: 'join', name });
}

/* ═══════════════════════ WASIL TACKLE ═══════════════════════ */
function triggerWasilTackle() {
    if (state.wasilTackled) return;
    state.wasilTackled = true;
    console.log('💀 WASIL TACKLE TRIGGERED!');
    broadcast({ type: 'play', steps: [
        { type: 'chat', player: 'Witsel', message: 'Code review du code de Wasil... 🤮', duration: 2 },
        { type: 'move', player: 'Witsel', target: [0, 4], speed: 5 },
        { type: 'tackle', player: 'Witsel', victim: 'Wasil', brutal: true },
        { type: 'wait', duration: 2.5 },
        { type: 'chat', player: 'Witsel', message: '`rm -rf wasil/` — Refactoré.' },
    ]});
}

/* ═══════════════════════ HOOK → FOOTBALL ═══════════════════════ */
function processHook(h) {
    const evt = h.hook_event_name;

    switch (evt) {
        case 'SessionStart': {
            // Reset state
            state.sessionActive = true;
            state.toolCount = 0;
            state.goalCount = 0;
            state.wasilTackled = false;
            state.agents.clear();
            state.usedSlots.clear();
            state.lastActivePlayer = null;
            rosterCursor = 0;

            ensureOnField(state.mainPlayer);
            broadcast({ type: 'kickoff' });

            const model = h.model || 'Claude';
            broadcast({ type: 'chat', name: state.mainPlayer,
                message: `Session ${h.source || 'start'} ! Modèle : ${cut(model,20)}. On attaque !` });
            break;
        }

        case 'UserPromptSubmit': {
            const prompt = h.prompt || '';
            broadcast({ type: 'chat', name: state.mainPlayer,
                message: `Coach : "${cut(prompt, 40)}"` });
            break;
        }

        case 'PreToolUse': {
            state.toolCount++;
            const toolName = h.tool_name || 'Unknown';
            const input = h.tool_input || {};

            // Determine which player does this
            let player = state.mainPlayer;
            // If we can identify the agent from context, use it
            // For now, main session = Witsel, last assigned agent otherwise
            if (state.lastActivePlayer && state.lastActivePlayer !== state.mainPlayer) {
                // If a sub-agent was recently active, attribute to them
                // In practice, PreToolUse doesn't carry agent_id, so we use lastActive
            }
            // Check if a sub-agent is active (heuristic: if agents exist, use last one)
            for (const [, a] of state.agents) {
                player = a.playerName;  // last registered agent
            }
            if (!state.usedSlots.has(player)) player = state.mainPlayer;

            ensureOnField(player);

            // Throttle: max 1 action per 400ms
            const now = Date.now();
            if (now - state.lastActionTime > 400) {
                const msgFn = TOOL_MSG[toolName];
                const message = msgFn ? msgFn(input) : `Outil: ${toolName}`;
                broadcast({ type: 'action', name: player, action: message });
                state.lastActionTime = now;
            }
            state.lastActivePlayer = player;

            // Wasil tackle: after 15+ tool uses, on Edit/Bash
            if (!state.wasilTackled && state.toolCount >= 15) {
                if ((toolName === 'Edit' || toolName === 'Bash') && Math.random() < 0.4) {
                    triggerWasilTackle();
                }
            }
            // Force by tool 30
            if (!state.wasilTackled && state.toolCount >= 30) {
                triggerWasilTackle();
            }
            break;
        }

        case 'PostToolUse': {
            // Check for failures
            const resp = h.tool_response;
            let failed = false;
            if (resp && typeof resp === 'object') {
                if (resp.exitCode && resp.exitCode !== 0) failed = true;
                if (resp.error) failed = true;
            }
            if (typeof resp === 'string' && /error|failed|exception/i.test(resp)) {
                failed = true;
            }
            if (failed) {
                const player = state.lastActivePlayer || state.mainPlayer;
                broadcast({ type: 'chat', name: player, message: 'Oups ! Erreur... je retente !' });
            }
            break;
        }

        case 'SubagentStart': {
            const agentId = h.agent_id;
            const agentType = h.agent_type || 'general-purpose';
            const playerName = assignPlayer(agentId, agentType);
            ensureOnField(playerName);

            const typeLabel = { 'Explore':'éclaireur', 'Plan':'stratège',
                'general-purpose':'agent', 'claude-code-guide':'mentor' }[agentType] || 'agent';
            broadcast({ type: 'chat', name: playerName,
                message: `Agent ${typeLabel} en jeu ! (${cut(agentType,15)})` });
            state.lastActivePlayer = playerName;
            break;
        }

        case 'SubagentStop': {
            const agent = state.agents.get(h.agent_id);
            if (agent) {
                broadcast({ type: 'leave', name: agent.playerName });
                state.usedSlots.delete(agent.playerName);
                state.agents.delete(h.agent_id);
                if (state.lastActivePlayer === agent.playerName) {
                    state.lastActivePlayer = state.mainPlayer;
                }
            }
            break;
        }

        case 'TaskCompleted': {
            state.goalCount++;
            const scorer = state.lastActivePlayer || state.mainPlayer;
            const subject = h.task_subject || 'la tâche';

            // Spectacular goal: mini-play
            const tx = (Math.random() - 0.5) * 4;
            broadcast({ type: 'play', steps: [
                { type: 'dribble', player: scorer, target: [tx, 10], speed: 5 },
                { type: 'shoot', player: scorer, power: 18, arc: 1.5, targetX: tx * 0.5 },
            ]});

            // Commentary after goal (delayed to not overlap)
            setTimeout(() => {
                broadcast({ type: 'chat', name: scorer,
                    message: `BUUUT ! ${cut(subject, 30)} terminé !` });
            }, 3000);
            break;
        }

        case 'Stop': {
            broadcast({ type: 'chat', name: state.mainPlayer,
                message: 'Pause ! Le capitaine réfléchit...' });
            break;
        }

        case 'SessionEnd': {
            broadcast({ type: 'fulltime' });
            state.sessionActive = false;
            break;
        }

        case 'TeammateIdle': {
            // Ignore for now (player just idles on field)
            break;
        }
    }
}

/* ═══════════════════════ HTTP SERVER ═══════════════════════ */
const server = http.createServer((req, res) => {
    // Security: restrict CORS to localhost origins only
    const origin = req.headers.origin || '';
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'POST' && req.url === '/event') {
        let body = '';
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > 65536) { req.destroy(); return; }  // 64KB max
            body += chunk;
        });
        req.on('end', () => {
            try {
                processHook(JSON.parse(body));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end('{"ok":true}');
            } catch (e) {
                console.error('❌ Parse error:', e.message);
                res.writeHead(400);
                res.end('{"error":"bad json"}');
            }
        });
        return;
    }

    // Status page
    if (req.method === 'GET' && req.url === '/') {
        const players = escHtml([...state.usedSlots].join(', ') || 'aucun');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><head><title>Football Server</title>
<style>body{font-family:system-ui;max-width:600px;margin:40px auto;background:#1a1a2e;color:#eee}
h1{color:#E4002B}code{background:#333;padding:2px 6px;border-radius:3px}
.stat{margin:8px 0;padding:8px 12px;background:#222;border-radius:6px}</style></head>
<body><h1>⚽ CLASICO Football Server</h1>
<div class="stat">Session : ${state.sessionActive ? '🟢 Active' : '🔴 Inactive'}</div>
<div class="stat">Tool uses : <strong>${state.toolCount}</strong></div>
<div class="stat">Goals : <strong>${state.goalCount}</strong></div>
<div class="stat">Joueurs : ${players}</div>
<div class="stat">WS clients : ${clients.size}</div>
<div class="stat">Wasil tacklé : ${state.wasilTackled ? '💀 OUI' : '🦵 Pas encore...'}</div>
<hr><p>Match : <a href="football-match.html?bridge=${PORT}" style="color:#4fc3f7">
football-match.html?bridge=${PORT}</a></p>
<p><code>POST /event</code> pour envoyer les hooks</p></body></html>`);
        return;
    }

    res.writeHead(404); res.end('Not found');
});

const MAX_WS_CLIENTS = 20;
wss = new WebSocketServer({
    server,
    verifyClient: (info) => {
        // Security: only accept localhost origins
        const origin = info.origin || info.req.headers.origin || '';
        if (origin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return false;
        }
        return clients.size < MAX_WS_CLIENTS;
    }
});

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`🔌 Client connecté (${clients.size} total)`);
    ws.send(JSON.stringify({ type: 'chat', name: 'Serveur',
        message: `Connecté ! ${state.usedSlots.size} joueurs sur le terrain.` }));
    ws.on('close', () => {
        clients.delete(ws);
        console.log(`🔌 Déconnecté (${clients.size} clients)`);
    });
    ws.on('error', (e) => {
        clients.delete(ws);
        console.log(`🔌 Erreur WS: ${e.message}`);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('  ⚽ ═══════════════════════════════════════');
    console.log('  ⚽  CLASICO — Standard de Liège Football Server');
    console.log('  ⚽ ═══════════════════════════════════════');
    console.log(`  📡 HTTP:      http://localhost:${PORT}/`);
    console.log(`  🔌 WebSocket: ws://localhost:${PORT}/`);
    console.log(`  🖥️  Match:     football-match.html?bridge=${PORT}`);
    console.log('');
    console.log('  En attente des hooks Claude Code...');
    console.log('');
});

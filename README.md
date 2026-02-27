# CLASICO — Football Agent Visualization for Claude Code

A real-time 3D football match (Standard de Liege vs Anderlecht) that visualizes your Claude Code agent activity as a live football game. Every tool call, sub-agent, and completed task translates into on-field actions, passes, tackles, and goals.

**Standard always wins.**

![Three.js](https://img.shields.io/badge/Three.js-r170-black?logo=threedotjs)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)
![Claude Code](https://img.shields.io/badge/Claude%20Code-Hooks-7C3AED)

## What It Does

When you work with Claude Code, hooks capture every action and relay them to a football server, which broadcasts them to a 3D football pitch rendered in Three.js:

| Claude Code Event | Football Action |
|---|---|
| `SessionStart` | Kick-off, captain enters the field |
| `PreToolUse` (Read, Grep, Glob) | Player scans the field, reads the game |
| `PreToolUse` (Edit, Write) | Tackle, shot on goal |
| `PreToolUse` (Bash) | Power strike |
| `PreToolUse` (Task) | Assist pass to teammate |
| `SubagentStart` | New player enters from the tunnel |
| `SubagentStop` | Player leaves the field with applause |
| `TaskCompleted` | **GOAL!** Dribble + shot + celebration |
| `PostToolUse` (failure) | Player slips, tries again |
| `UserPromptSubmit` | Coach shouts instructions |
| `SessionEnd` | Final whistle, victory lap |

### Special Events

- **Wasil Tackle**: After 15-30 tool uses, Witsel brutally tackles the Anderlecht player "Wasil" — his leg flies off with blood splatter (it is a comedy feature)
- **Demo Mode**: A pre-scripted 73-second match with 6 spectacular goals, complete with choreographed passes, dribbles, headers, and celebrations

## Architecture

```
Claude Code (hooks on every event)
       |
       v
.claude/hooks/football-bridge.js    Reads hook JSON from stdin,
       |                             truncates large payloads,
       | HTTP POST                   POSTs to local server
       v
football-server.js                   Maps hooks to football events,
       |                             assigns agents to players,
       | WebSocket                   manages match state
       v
football-match.html                  Three.js 3D pitch with
                                     22 players, ball physics,
                                     choreography system, UI
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and working

### 1. Clone the repository

```bash
git clone https://github.com/kikounicou/football_agent.git
cd football_agent
npm install
```

### 2. Configure Claude Code hooks

Copy the hook configuration to your project directory (where you use Claude Code):

```bash
mkdir -p .claude/hooks
cp /path/to/football_agent/.claude/hooks/football-bridge.js .claude/hooks/
cp /path/to/football_agent/.claude/settings.local.json .claude/
```

**Or manually** add this to your project's `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "PostToolUse": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "SessionEnd": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "SubagentStart": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "SubagentStop": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "TaskCompleted": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }],
    "TeammateIdle": [{ "hooks": [{ "type": "command", "command": "node /absolute/path/to/football-bridge.js", "timeout": 5 }] }]
  }
}
```

> **Note**: If you use relative paths (like `node .claude/hooks/football-bridge.js`), the hook script must be in the same project directory. For absolute paths, adjust accordingly.

### 3. Start the football server

```bash
node football-server.js
```

The server starts on port 3333 by default. You can specify a different port:

```bash
node football-server.js 4444
```

### 4. Open the match in your browser

Open `football-match.html` in your browser with the bridge parameter:

```
file:///path/to/football_agent/football-match.html?bridge=3333
```

Or if you have a local web server (Apache, Nginx, etc.):

```
http://localhost:8080/football-match.html?bridge=3333
```

### 5. Use Claude Code normally

Start a Claude Code session in any project that has the hooks configured. Every action will appear on the football pitch in real-time!

For the best show, ask Claude to perform complex tasks with multiple sub-agents:

```
> Create an HTML calculator page using multiple agents
```

This will spawn several players on the field, each performing their own actions.

## Demo Mode

You can watch a pre-scripted demo match without any server connection:

1. Open `football-match.html` in your browser (no `?bridge=` parameter needed)
2. Click the **Demo Match** button
3. Watch Standard score 6 spectacular goals against Anderlecht

The demo showcases all animations: passes, dribbles, lob passes, headers, shots, the brutal Wasil tackle, celebrations, and the final whistle.

## Files

| File | Description |
|---|---|
| `football-match.html` | Three.js 3D match — the entire frontend in one file (~1850 lines) |
| `football-server.js` | Node.js bridge server — HTTP + WebSocket (~370 lines) |
| `.claude/hooks/football-bridge.js` | Hook script — reads stdin, POSTs to server (~50 lines) |
| `.claude/settings.local.json` | Claude Code hook configuration |
| `package.json` | Node.js dependencies (only `ws`) |

## Features

### 3D Scene
- Regulation football pitch with mowed stripe texture (canvas-generated)
- Two goals with posts and wireframe nets
- Four floodlight towers with SpotLights and shadows
- Stadium stands (200 Standard supporters, 15 Anderlecht supporters)
- "ALLEZ LES ROUCHES!" banner
- Starry night sky
- OrbitControls for camera movement

### Players
- Procedural 3D characters (body, shorts, socks, head, hair, eyes, jersey number)
- Deterministic skin/hair colors based on name hash
- Standard de Liege (red/white) — 11 players + 3 subs
- Anderlecht (purple/white) — 11 NPCs with unique idle behaviors:
  - Stargazing, tripping, slow-motion, spinning in circles, confused, buggy (glitching), nervous, old, daydreaming, posing for cameras

### Ball Physics
- Lerp-based flight with parabolic arcs
- Holder-following for dribbles (ball sticks to player's feet with bounce)
- Goal detection when ball crosses goal line
- Spin animation during flight

### Choreography System
- Sequential step execution queue
- Step types: `move`, `dribble`, `pass`, `lob`, `shoot`, `tackle`, `header`, `wait`, `chat`, `pickup`, `join`, `leave`, `kickoff`, `halftime`, `fulltime`
- Brutal tackle mode with flying body parts and blood particles

### UI
- Live scoreboard with animated score bumps
- Match clock
- Commentary panel with timestamped events
- Player list panel
- CSS2D player labels and speech bubbles
- GOOOAL! full-screen flash overlay
- WebSocket connection status indicator

## Security

This project is designed for **local use only** (localhost). Security measures:

- Server binds to `127.0.0.1` only (not accessible from the network)
- CORS restricted to localhost origins
- WebSocket origin verification (localhost only)
- `?ws=` URL parameter restricted to localhost
- All dynamic content is HTML-escaped before DOM insertion (XSS prevention)
- HTTP POST body size limited to 64KB
- Maximum 20 concurrent WebSocket clients
- Hook bridge silently fails if server is unreachable (zero impact on Claude Code)

## Technical Details

### Hook Bridge

Claude Code hooks receive a JSON payload on stdin for every event. The bridge script reads it, truncates `tool_response` if over 1000 bytes, and POSTs to `http://127.0.0.1:3333/event`. It silently exits if the server is unreachable (2s timeout), so it never blocks Claude Code.

### Football Server

Maintains match state and maps Claude Code events to football actions:

- **Agent-to-Player mapping**: Main session = Witsel (captain), Explore agents = Carcela, Plan agents = Raskin, other agents cycle through the roster
- **Wasil Tackle**: Triggers after 15+ tool uses (40% chance on Edit/Bash), force-triggered at 30 uses
- **Goals**: `TaskCompleted` hook triggers a dribble + shoot choreography

### 3D Client

Single-file Three.js application (ES modules via CDN). Uses CSS2DRenderer for labels, WebSocket with auto-reconnect, `requestAnimationFrame` with delta-time physics, and InstancedMesh for 200+ stadium supporters.

## License

MIT

## Credits

Built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) by Anthropic.

Three.js visualization inspired by the beautiful game and Standard de Liege.

*Allez les Rouches!*

# CLASICO — Football Agent Visualization for Claude Code

> **[Version francaise](#-version-francaise)** | **[English version](#-english-version)**

![Three.js](https://img.shields.io/badge/Three.js-r170-black?logo=threedotjs)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)
![Claude Code](https://img.shields.io/badge/Claude%20Code-Hooks-7C3AED)

---

# FR Version francaise

Un match de football 3D en temps reel (Standard de Liege vs Anderlecht) qui visualise l'activite de vos agents Claude Code sous forme de match live. Chaque appel d'outil, sous-agent et tache terminee se traduit par des actions sur le terrain : passes, dribbles, tacles et buts.

**Le Standard gagne TOUJOURS.**

## Ce que ca fait

Quand vous travaillez avec Claude Code, les hooks capturent chaque action et les transmettent a un serveur football, qui les diffuse vers un terrain 3D rendu en Three.js :

| Evenement Claude Code | Action football |
|---|---|
| `SessionStart` | Coup d'envoi, le capitaine entre sur le terrain |
| `PreToolUse` (Read, Grep, Glob) | Le joueur scanne le terrain, lit le jeu |
| `PreToolUse` (Edit, Write) | Tacle, frappe au but |
| `PreToolUse` (Bash) | Frappe de mule |
| `PreToolUse` (Task) | Passe decisive a un coequipier |
| `SubagentStart` | Un nouveau joueur entre du tunnel |
| `SubagentStop` | Le joueur quitte sous les applaudissements |
| `TaskCompleted` | **BUUUUT !** Dribble + tir + celebration |
| `PostToolUse` (echec) | Le joueur glisse, retente |
| `UserPromptSubmit` | Le coach crie ses instructions |
| `SessionEnd` | Coup de sifflet final, tour d'honneur |

### Evenements speciaux

- **Tacle de Wasil** : Apres 15-30 utilisations d'outils, Witsel tacle sauvagement le joueur d'Anderlecht "Wasil" — sa jambe s'envole avec des eclaboussures de sang (c'est une feature comique)
- **Mode Demo** : Un match pre-scripte de 73 secondes avec 6 buts spectaculaires, passes, dribbles, tetes, celebrations et le tacle brutal

## Architecture

```
Claude Code (hooks sur chaque evenement)
       |
       v
.claude/hooks/football-bridge.js    Lit le JSON du hook sur stdin,
       |                             tronque les gros payloads,
       | HTTP POST                   envoie au serveur local
       v
football-server.js                   Mappe les hooks en events foot,
       |                             assigne les agents aux joueurs,
       | WebSocket                   gere l'etat du match
       v
football-match.html                  Terrain 3D Three.js avec
                                     22 joueurs, physique du ballon,
                                     systeme de choregraphie, UI
```

## Installation

### Prerequis

- [Node.js](https://nodejs.org/) 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installe et fonctionnel

### 1. Cloner le depot

```bash
git clone https://github.com/kikounicou/football_agent.git
cd football_agent
npm install
```

### 2. Configurer les hooks Claude Code

Copiez la configuration des hooks dans votre repertoire de projet (la ou vous utilisez Claude Code) :

```bash
mkdir -p .claude/hooks
cp /chemin/vers/football_agent/.claude/hooks/football-bridge.js .claude/hooks/
cp /chemin/vers/football_agent/.claude/settings.local.json .claude/
```

**Ou manuellement**, ajoutez ceci dans le `.claude/settings.local.json` de votre projet :

```json
{
  "hooks": {
    "PreToolUse": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "PostToolUse": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "SessionEnd": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "SubagentStart": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "SubagentStop": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "TaskCompleted": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }],
    "TeammateIdle": [{ "hooks": [{ "type": "command", "command": "node /chemin/absolu/vers/football-bridge.js", "timeout": 5 }] }]
  }
}
```

> **Note** : Si vous utilisez des chemins relatifs (comme `node .claude/hooks/football-bridge.js`), le script hook doit etre dans le meme repertoire de projet. Pour des chemins absolus, adaptez en consequence.

### 3. Demarrer le serveur football

```bash
node football-server.js
```

Le serveur demarre sur le port 3333 par defaut. Vous pouvez specifier un autre port :

```bash
node football-server.js 4444
```

### 4. Ouvrir le match dans le navigateur

```
file:///chemin/vers/football_agent/football-match.html?bridge=3333
```

Ou avec un serveur web local (Apache, Nginx, etc.) :

```
http://localhost:8080/football-match.html?bridge=3333
```

### 5. Utilisez Claude Code normalement

Lancez une session Claude Code dans un projet qui a les hooks configures. Chaque action apparaitra sur le terrain en temps reel !

Pour le meilleur spectacle, demandez a Claude des taches complexes avec plusieurs sous-agents :

```
> Cree une page HTML de calculatrice en utilisant plusieurs agents
```

Plusieurs joueurs entreront sur le terrain, chacun effectuant ses propres actions.

## Mode Demo

Vous pouvez regarder un match pre-scripte sans connexion serveur :

1. Ouvrez `football-match.html` dans votre navigateur (sans parametre `?bridge=`)
2. Cliquez sur le bouton **Demo Match**
3. Regardez le Standard marquer 6 buts spectaculaires contre Anderlecht

## Pages demos

Le dossier `demos/` contient des pages HTML construites par les agents Claude Code pendant des sessions live. Ce sont les "produits" des matchs — pendant que les agents travaillaient, le terrain 3D affichait leurs actions en temps reel :

| Fichier | Description |
|---|---|
| `demos/calculator.html` | Calculatrice CLASICO |
| `demos/converter.html` | Convertisseur d'unites CLASICO |
| `demos/stopwatch.html` | Chronometre de match CLASICO |
| `demos/palette.html` | Generateur de palette de couleurs CLASICO |

---

# EN English version

A real-time 3D football match (Standard de Liege vs Anderlecht) that visualizes your Claude Code agent activity as a live football game. Every tool call, sub-agent, and completed task translates into on-field actions, passes, tackles, and goals.

**Standard always wins.**

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

- **Wasil Tackle**: After 15-30 tool uses, Witsel brutally tackles the Anderlecht player "Wasil" — his leg flies off with blood splatter (comedy feature)
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

```
file:///path/to/football_agent/football-match.html?bridge=3333
```

Or with a local web server (Apache, Nginx, etc.):

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

## Demo Pages

The `demos/` folder contains HTML pages built by Claude Code agents during live sessions. These are the "products" of the matches — while the agents were working, the 3D pitch was displaying their actions in real-time:

| File | Description |
|---|---|
| `demos/calculator.html` | CLASICO Calculator |
| `demos/converter.html` | CLASICO Unit Converter |
| `demos/stopwatch.html` | CLASICO Match Stopwatch |
| `demos/palette.html` | CLASICO Color Palette Generator |

---

# Files / Fichiers

| File | Description |
|---|---|
| `football-match.html` | Three.js 3D match — entire frontend (~1850 lines) |
| `football-server.js` | Node.js bridge server — HTTP + WebSocket (~370 lines) |
| `.claude/hooks/football-bridge.js` | Hook script — reads stdin, POSTs to server (~50 lines) |
| `.claude/settings.local.json` | Claude Code hook configuration |
| `.agents/skills/` | 10 Three.js reference skills for Claude Code (see below) |
| `demos/` | Sample pages built by Claude Code agents during live matches |
| `CLAUDE.md` | Project instructions for Claude Code (hook mappings, architecture) |
| `ROADMAP.md` | Development roadmap with completion status |
| `package.json` | Node.js dependencies (only `ws`) |

# Three.js Skills

This repo includes 10 Three.js skills that Claude Code can use as reference when working on 3D projects. They are installed in `.agents/skills/` and provide documentation and code examples.

| Skill | Description |
|---|---|
| `threejs-fundamentals` | Scene, camera, renderer, Object3D, coordinate systems |
| `threejs-animation` | Keyframe animation, skeletal animation, morph targets, mixing |
| `threejs-shaders` | GLSL, ShaderMaterial, uniforms, custom effects |
| `threejs-geometry` | Built-in shapes, BufferGeometry, custom geometry, instancing |
| `threejs-interaction` | Raycasting, controls, mouse/touch input, object selection |
| `threejs-materials` | PBR, Phong, shader materials, material properties |
| `threejs-postprocessing` | EffectComposer, bloom, DOF, screen effects |
| `threejs-lighting` | Light types, shadows, environment lighting |
| `threejs-textures` | Texture types, UV mapping, environment maps |
| `threejs-loaders` | GLTF, model/texture loading, async patterns |

These skills come from [cloudai-x/threejs-skills](https://github.com/cloudai-x/threejs-skills) and give Claude Code deep knowledge of Three.js when building or modifying 3D scenes.

# Features

### 3D Scene
- Regulation football pitch with mowed stripe texture (canvas-generated)
- Two goals with posts and wireframe nets
- Four floodlight towers with SpotLights and shadows
- Stadium stands (200 Standard supporters, 15 Anderlecht supporters)
- "ALLEZ LES ROUCHES!" banner
- Starry night sky, OrbitControls

### Players / Joueurs
- Procedural 3D characters (body, shorts, socks, head, hair, eyes, jersey number)
- Deterministic skin/hair colors based on name hash
- Standard de Liege (red/white) — 11 players + 3 subs
- Anderlecht (purple/white) — 11 NPCs with unique idle behaviors:
  - Stargazing, tripping, slow-motion, spinning in circles, confused, buggy (glitching), nervous, old, daydreaming, posing for cameras

### Ball Physics / Physique du ballon
- Lerp-based flight with parabolic arcs
- Holder-following for dribbles (ball sticks to player's feet with bounce)
- Goal detection when ball crosses goal line
- Spin animation during flight

### Choreography / Choregraphie
- Sequential step execution queue
- Step types: `move`, `dribble`, `pass`, `lob`, `shoot`, `tackle`, `header`, `wait`, `chat`, `pickup`, `join`, `leave`, `kickoff`, `halftime`, `fulltime`
- Brutal tackle mode with flying body parts and blood particles

### UI
- Live scoreboard with animated score bumps
- Match clock
- Commentary panel with timestamped events
- Player list, CSS2D labels, speech bubbles
- GOOOAL! full-screen flash overlay
- WebSocket connection status indicator

# Security / Securite

This project is designed for **local use only** (localhost). Security measures:

- Server binds to `127.0.0.1` only (not accessible from the network)
- CORS restricted to localhost origins
- WebSocket origin verification (localhost only)
- `?ws=` URL parameter restricted to localhost
- All dynamic content HTML-escaped before DOM insertion (XSS prevention)
- HTTP POST body size limited to 64KB
- Maximum 20 concurrent WebSocket clients
- Hook bridge silently fails if server is unreachable (zero impact on Claude Code)

# License

MIT

# Credits

Built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) by Anthropic.

Three.js visualization inspired by the beautiful game and Standard de Liege.

*Allez les Rouches!*

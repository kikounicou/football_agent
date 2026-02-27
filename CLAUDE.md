# CLASICO — Football Agent for Claude Code

Visualisation 3D temps reel de l'activite de Claude Code sous forme d'un **match de football**
entre le Standard de Liege (rouge et blanc) et Anderlecht (mauve et blanc).

**Le Standard gagne TOUJOURS.**

## Concept

- **Terrain de foot 3D** avec pelouse, lignes, buts, tribunes
- **Equipe Standard (rouge/blanc)** = Claude + ses agents (les heros)
- **Equipe Anderlecht (mauve/blanc)** = adversaires idiots (PNJs passifs qui se font ridiculiser)
- **Tableau de score** en temps reel : STANDARD X - 0 ANDERLECHT
- Chaque action Claude Code (hooks) se traduit en action de foot

## Mapping Hooks -> Football

| Hook Event | Action foot |
|---|---|
| `SessionStart` | Coup d'envoi, les joueurs entrent sur le terrain |
| `UserPromptSubmit` | Le coach crie des instructions depuis le banc |
| `PreToolUse` | Le joueur prend le ballon et prepare son action |
| `PostToolUse` (succes) | Belle passe, dribble, tir... selon l'outil |
| `PostToolUse` (echec) | Le joueur glisse, se releve, retente |
| `SubagentStart` | Un remplacant entre sur le terrain (echauffement + entree) |
| `SubagentStop` | Le joueur sort sous les applaudissements |
| `TaskCompleted` | BUUUUT ! Le score augmente, celebration |
| `Stop` | Mi-temps ou coup de sifflet, le capitaine leve les bras |
| `TeammateIdle` | Le joueur attend en position, fait des etirements |
| `SessionEnd` | Coup de sifflet final, tour d'honneur, Standard gagne |

## Mapping Outils -> Actions de jeu

| Outil | Action foot | Message joueur |
|---|---|---|
| `Read` | Lecture du jeu, regarde le terrain | "J'analyse la defense..." |
| `Grep` | Cherche une ouverture dans la defense | "Je cherche la faille..." |
| `Glob` | Scanne tout le terrain | "Je repere les positions..." |
| `Edit` | Tacle technique + contre-attaque | "Tacle ! Je modifie la ligne..." |
| `Write` | Tir au but ! Creation de contenu | "FRAPPE ! Je cree le fichier..." |
| `Bash` | Frappe de mule, execution directe | "BOUM ! J'execute..." |
| `WebSearch` | Consulte le tableau tactique | "Je regarde la strategie..." |
| `WebFetch` | Ecoute les infos du speaker | "J'ecoute le briefing..." |
| `Task` | Passe decisive a un coequipier | "Passe a [Nom] !" |
| `AskUserQuestion` | Le capitaine court vers le coach | "Coach ! Quelle strategie ?" |
| `Skill` | Sort le livre de tactiques | "Je consulte le playbook..." |

## Donnees exploitees depuis les hooks

Chaque hook recoit un JSON sur stdin avec ces champs cles :

**Commun a tous :**
- `session_id` : identifiant de session
- `cwd` : repertoire courant
- `hook_event_name` : nom de l'evenement
- `hook_version` : version du schema (1)

**PreToolUse (le plus riche) :**
- `tool_name` : nom de l'outil (Bash, Edit, Write, Read, Grep, Glob, Task, WebSearch, WebFetch, AskUserQuestion, Skill...)
- `tool_input` : parametres complets (command, file_path, old_string/new_string, pattern, prompt, query, url...)
- `tool_use_id` : identifiant unique de l'appel

**PostToolUse (le resultat) :**
- `tool_response` : resultat complet (stdout/stderr/exitCode pour Bash, contenu pour Read, etc.)
- Permet de savoir si l'action a reussi ou echoue -> reaction du joueur

**SessionStart :**
- `source` : startup/resume/compact/clear -> type de coup d'envoi
- `model` : modele utilise -> affiche sur le maillot

**Stop :**
- `last_assistant_message` : la reponse complete de Claude -> resume en commentaire sportif

**SubagentStart/Stop :**
- `agent_id` + `agent_type` (Explore, Plan, claude-code-guide, general-purpose) -> poste du joueur

**TaskCompleted :**
- `task_id`, `task_subject`, `task_description` -> description du but

**UserPromptSubmit :**
- `prompt` : le texte exact du coach

**SessionEnd :**
- `reason` : pourquoi le match se termine

## Architecture

```
Claude Code hooks (stdin JSON)
       |
       v
.claude/hooks/football-bridge.js  (POST vers serveur local)
       |
       v
football-server.js  (HTTP + WebSocket, port 3333)
       |
       v
football-match.html  (Three.js 3D, connecte en WebSocket)
```

## URLs

- **Match live** : `http://localhost:PORT/football-match.html?bridge=3333`
- **Match demo** : `http://localhost:PORT/football-match.html` (sans parametre bridge)
- **Serveur status** : `http://localhost:3333/`

## Fichiers du projet

- `football-match.html` : scene 3D Three.js complete (~1850 lignes)
  - Terrain avec texture canvas (bandes tondeuse, toutes les lignes reglementaires)
  - 2 buts (poteaux cylindriques + filet wireframe)
  - 4 tribunes (Standard remplies 200 supporters, Anderlecht clairsemees 15)
  - 4 pylones eclairage (SpotLights + housing emissif)
  - Banderole "ALLEZ LES ROUCHES !"
  - Ballon (IcosahedronGeometry vertex colors)
  - Ciel etoile (500 points)
  - 11 joueurs Anderlecht NPCs avec idle behaviors idiots par joueur
  - **Wasil** : joueur d'Anderlecht special (victime designee de Witsel, idle 'buggy')
  - Joueurs Standard dynamiques (entrent du tunnel, formation 4-3-3)
  - Scoreboard anime (score-bump sur chaque but), chrono, commentary panel, speech bubbles CSS2D
  - Events : join/leave/chat/action/goal/kickoff/halftime/fulltime
  - **Ball Physics** : ballState, kickBall(), updateBall() — passes au sol, lobs en cloche, tirs en arc
  - **Play Choreography System** : playQueue, executeStep/advancePlay/updatePlay
    - Steps : dribble, pass, lob, shoot, tackle (+ brutal!), header, move, pickup, wait, chat
  - **Animations corporelles** : kick (lean back), slide tackle (glisse), header (saut)
  - **Flying leg** : tacle brutal de Witsel sur Wasil = jambe qui s'envole en tournant !
  - **Demo mode choregraphie** : 6 buts spectaculaires avec vrai gameplay
    1. Emond (contre-attaque via aile gauche)
    2. Mpoku (frappe de loin apres tacle sauvage de Witsel sur Wasil)
    3. Witsel (combinaison avec Siquet)
    4. Defour (lob legendaire depuis le rond central)
    5. Emond (slalom zigzag a travers la defense)
    6. Van Buyten (tete sur corner)
  - **Commentary style agents** : les joueurs parlent comme des agents Claude Code qui construisent une calculatrice
  - WebSocket : `?ws=host:port` ou `?bridge=3333`
- `football-server.js` : serveur bridge HTTP+WebSocket (port 3333)
  - Zero npm deps (raw WebSocket handshake)
  - POST /event : recoit les hooks, traduit en events football
  - Mapping agents -> joueurs Standard (type -> role)
  - Tacle Wasil automatique apres ~15-30 tool uses
  - TaskCompleted -> GOAL avec mini-play choregraphie
  - Page status HTML sur GET /
- `.claude/hooks/football-bridge.js` : hook qui POST les events au serveur
  - Lit stdin JSON, tronque tool_response, POST localhost:3333/event
  - Echoue silencieusement si serveur pas lance
- `.claude/settings.local.json` : hooks configures pour tous les events

## Skills Three.js

10 skills Three.js de [`cloudai-x/threejs-skills`](https://github.com/cloudai-x/threejs-skills) disponibles dans `.agents/skills/` :

| Skill | Description |
|---|---|
| `threejs-fundamentals` | Scene, camera, renderer, Object3D, coordonnees |
| `threejs-animation` | Keyframes, skeletal animation, morph targets, mixing |
| `threejs-shaders` | GLSL, ShaderMaterial, uniforms, effets custom |
| `threejs-geometry` | Formes, BufferGeometry, geometries custom, instancing |
| `threejs-interaction` | Raycasting, controles, mouse/touch, selection d'objets |
| `threejs-materials` | PBR, Phong, shader materials, proprietes |
| `threejs-postprocessing` | EffectComposer, bloom, DOF, effets ecran |
| `threejs-lighting` | Types de lumieres, ombres, eclairage environnemental |
| `threejs-textures` | Types de textures, UV mapping, environment maps |
| `threejs-loaders` | GLTF, chargement de modeles/textures/images, async |

## Convention

- Utiliser Three.js via CDN (ES modules)
- Privilegier du code simple et lisible, c'est un projet d'apprentissage
- Le projet football doit etre fun, exagere, avec des celebrations ridicules

# ROADMAP - CLASICO : Standard vs Anderlecht

```
  ____  _____  _    _   _ ____    _    ____  ____
 / ___|_   _|/ \  | \ | |  _ \  / \  |  _ \|  _ \
 \___ \ | | / _ \ |  \| | | | |/ _ \ | |_) | | | |
  ___) || |/ ___ \| |\  | |_| / ___ \|  _ <| |_| |
 |____/ |_/_/   \_\_| \_|____/_/   \_\_| \_\____/

          6  -  0           ANDERLECHT
    (ca peut qu'augmenter)   (les nuls)
```

---

## PHASE 1 : Construire le stade (le terrain 3D) — FAIT

**Fichier : `football-match.html`**

### 1.1 - La pelouse — FAIT

- [x] Terrain reglementaire avec ses lignes blanches
- [x] Rond central, surfaces de reparation, points de penalty
- [x] Herbe avec texture procedurale (CanvasTexture, bandes tondeuse alternees clair/fonce)
- [ ] Leger relief / bumpmap pour le realisme

### 1.2 - Les buts — FAIT

- [x] 2 cages avec filets (wireframe mesh)
- [x] Poteaux metalliques (CylinderGeometry, materiau metal)
- [x] Le but Standard a gauche (on attaque vers la droite, vers Anderlecht)

### 1.3 - Le tableau de score — FAIT

- [x] Overlay CSS avec score anime
- [x] "STANDARD  [X] - [0]  ANDERLECHT"
- [x] Le score d'Anderlecht reste TOUJOURS a 0
- [x] Animation score-bump quand Standard marque
- [x] Chronometre qui tourne

### 1.4 - Les tribunes / ambiance — FAIT

- [x] Tribunes simplifiees (gradins geometriques)
- [x] Cote Standard : rempli de supporters rouges (200 supporters)
- [x] Cote Anderlecht : clairseme (15 supporters tristes)
- [x] Banderole "ALLEZ LES ROUCHES !" en CanvasTexture
- [ ] Particules de confettis rouges quand but

### 1.5 - Eclairage de stade — FAIT

- [x] 4 pylones d'eclairage aux coins (SpotLight + housing emissif)
- [x] Ambiance soiree de match (ciel etoile, projecteurs puissants)
- [x] Ombres portees des joueurs sur la pelouse

### 1.6 - Camera — FAIT

- [x] OrbitControls avec vue TV par defaut
- [x] Possibilite de zoomer sur l'action
- [ ] Camera cinematique qui suit le ballon

---

## PHASE 2 : Les joueurs — FAIT

### 2.1 - Joueurs Standard (rouge/blanc) = Agents Claude — FAIT

- [x] Maillot rouge, short blanc, chaussettes rouges
- [x] Generes proceduralement (body, shorts, socks, head, hair, eyes)
- [x] Numero dans le dos (CanvasTexture sur le maillot)
- [x] Couleurs peau/cheveux deterministes basees sur hash du nom
- [x] 11 joueurs max sur le terrain, formation 4-3-3
- [x] Entree dynamique depuis le tunnel

**Postes selon le type d'agent :**
| Agent type | Poste | Position terrain |
|---|---|---|
| Claude (principal) | Capitaine / Meneur de jeu (#10) | Centre du terrain |
| Explore | Ailier rapide | Cotes, court partout |
| Plan | Defenseur central | Arriere, organise |
| general-purpose | Attaquant | Devant, pret a marquer |
| claude-code-guide | Gardien / Libero | Derriere, consulte |
| User | Coach | Sur le banc, crie |

### 2.2 - Joueurs Anderlecht (mauve/blanc) = PNJs debiles — FAIT

- [x] Maillot mauve, short blanc
- [x] Toujours 11 sur le terrain (decoration)
- [x] Comportement idiot unique par joueur :
  - Regarde les etoiles (stargazing)
  - Tombe tout seul (tripping)
  - Au ralenti (slow-motion)
  - Tourne en rond (spinning)
  - Confus (confused)
  - Bugge / glitche (Wasil — victime designee)
  - Nerveux (nervous)
  - Vieux et lent (old)
  - Reve eveille (daydreaming)
  - Pose pour les cameras (posing)

### 2.3 - Animations des joueurs — FAIT

- [x] **Idle** : Sur place, legers mouvements (respiration)
- [x] **Course** : Bobbing + deplacement
- [x] **Dribble** : Course avec ballon aux pieds (ballon bounce)
- [x] **Tir** : Mouvement de frappe (lean back + kick)
- [x] **Tacle** : Glissade au sol (slide tackle)
- [x] **Tete** : Saut + frappe de la tete (header)
- [x] **Flying leg** : Tacle brutal de Witsel sur Wasil (jambe qui s'envole !)

---

## PHASE 3 : Le ballon et la logique de jeu — FAIT

### 3.1 - Le ballon — FAIT

- [x] IcosahedronGeometry avec vertex colors
- [x] Physique lerp-based avec arcs paraboliques
- [x] Effet de rotation (spin) pendant les passes et tirs
- [x] Trajectoire en arc pour les longues passes (lobs)
- [x] Detection de but quand le ballon franchit la ligne
- [x] Holder-following pour les dribbles (ballon aux pieds avec bounce)

### 3.2 - Mapping hooks -> actions de match — FAIT

```
                  UserPromptSubmit
                  "Le coach donne ses ordres"
                         |
                         v
   SessionStart -----> [COUP D'ENVOI]
                         |
                         v
                  PreToolUse (Read/Grep/Glob)
                  "Le joueur analyse, cherche"
                  -> joueur court vers le ballon, dribble
                         |
                         v
                  PostToolUse (succes)
                  "Belle action !" -> passe ou avancee
                         |
                  PreToolUse (Edit/Write/Bash)
                  "Action decisive !"
                  -> joueur prepare un tir / tacle
                         |
                         v
                  PostToolUse (succes sur Write/Edit)
                  -> TIR AU BUT ou TACLE REUSSI
                         |
                         v
                  TaskCompleted
                  "BUUUUUT !!!!"
                  -> Score +1, celebration, confettis
                  -> Un joueur Anderlecht tombe de honte
                         |
                         v
                  Task (lance sous-agent)
                  "Passe decisive !"
                  -> Le ballon traverse le terrain vers le remplacant
                         |
                  SubagentStart
                  "Un remplacant entre en jeu !"
                  -> Joueur court depuis le banc
                         |
                  SubagentStop
                  "Sort sous les ovations !"
                  -> Joueur salue et retourne au banc
                         |
                         v
                  Stop
                  "MI-TEMPS" ou "FIN DU MATCH"
                  -> Les joueurs se regroupent
                  -> Standard a gagne (evidemment)
                         |
                         v
                  SessionEnd
                  "COUP DE SIFFLET FINAL"
                  -> Tour d'honneur
                  -> Score final affiche en gros
                  -> Anderlecht pleure
```

### 3.3 - Le score — FAIT

- [x] **BUT Standard (+1)** quand : `TaskCompleted`
- [x] **Anderlecht = 0** : toujours
- [x] Sequence de but :
  1. Ballon rentre dans le filet (animation)
  2. Flash GOOOAL! overlay plein ecran
  3. Score-bump anime sur le scoreboard
  4. Commentary panel avec description du but

### 3.4 - Demo mode choregraphie — FAIT

6 buts spectaculaires pre-scriptes :
1. Emond (contre-attaque via aile gauche)
2. Mpoku (frappe de loin apres tacle sauvage de Witsel sur Wasil)
3. Witsel (combinaison avec Siquet)
4. Defour (lob legendaire depuis le rond central)
5. Emond (slalom zigzag a travers la defense)
6. Van Buyten (tete sur corner)

---

## PHASE 4 : Le bridge serveur — FAIT

**Fichier : `football-server.js`**

- [x] Mapping enrichi utilisant `tool_response` de PostToolUse (succes/echec)
- [x] Extraction intelligente des infos de `tool_input` pour les commentaires sportifs
- [x] Logique de score (compteur de buts)
- [x] Mapping agents -> joueurs Standard (type -> role)
- [x] Tacle Wasil automatique apres ~15-30 tool uses
- [x] TaskCompleted -> GOAL avec mini-play choregraphie
- [x] Page status HTML sur GET /
- [x] Zero npm deps (raw WebSocket handshake)
- [x] Securite : bind 127.0.0.1, CORS localhost, limites connexions

---

## PHASE 5 : Post-processing et polish — EN COURS

### 5.1 - Effets visuels

- [ ] Bloom sur les projecteurs du stade (EffectComposer)
- [ ] Particules de confettis rouges sur les buts
- [x] Ecran "GOAL !" en gros qui flash (CSS overlay)
- [ ] Pluie de petits ballons quand gros score
- [ ] Ralenti cinematique sur le tir

### 5.2 - Audio — A FAIRE

- [ ] Ambiance stade (Web Audio API — foule, chants)
- [ ] Sifflet de l'arbitre
- [ ] "GOAAAAL" du commentateur
- [ ] Les "ooooh" de la foule
- [ ] Musique de celebration

### 5.3 - UI Panel — FAIT

- [x] Score toujours visible
- [x] Liste des joueurs sur le terrain
- [x] Log des actions style commentaire sportif (commentary panel)
- [x] Speech bubbles CSS2D sur les joueurs
- [x] Bouton "Demo" pour simuler un match complet
- [x] Indicateur de connexion WebSocket
- [ ] Stats du match : possession, tirs, passes

---

## PHASE 6 : Hook bridge — FAIT

**Fichier : `.claude/hooks/football-bridge.js`**

- [x] POST vers localhost:3333/event
- [x] Lecture stdin JSON, troncature tool_response (max 1000 chars)
- [x] Echoue silencieusement si serveur pas lance
- [x] `.claude/settings.local.json` configure pour tous les events :
  SessionStart, PreToolUse, PostToolUse, SubagentStart, SubagentStop,
  Stop, UserPromptSubmit, SessionEnd, TaskCompleted, TeammateIdle

---

## ORDRE DE BATAILLE

```
Phase 1 (Stade)         [####################] 100%  FAIT
Phase 2 (Joueurs)       [####################] 100%  FAIT
Phase 3 (Logique)       [####################] 100%  FAIT
Phase 4 (Serveur)       [####################] 100%  FAIT
Phase 5 (Polish)        [######.............. ]  30%  EN COURS
Phase 6 (Hooks)         [####################] 100%  FAIT
```

## PROCHAINES ETAPES

- **Audio** : Web Audio API pour ambiance de stade, sifflet, cris de but
- **Post-processing** : Bloom, confettis, ralenti sur les tirs
- **Stats** : Compteurs de possession, tirs, passes dans l'UI
- **Camera follow** : Suivi automatique du ballon en mode cinematique
- **Terrain** : Bumpmap pour un realisme accru de la pelouse

ALLEZ LES ROUCHES !

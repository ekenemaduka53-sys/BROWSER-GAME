# Slither Garden 🐍🍎

A friendly 3D Snake game for the browser, with a **live leaderboard** shared by everyone playing.

- **Frontend** (`web/`): Next.js (App Router) + React + TypeScript, Tailwind CSS + shadcn/ui, Three.js through React Three Fiber and drei, and Zustand for state. Deploys on **Vercel**.
- **Backend** (`server/`): a Node.js + Socket.IO server that keeps the top 10 scores in memory and pushes updates to every player. Deploys on **Render**.

> Want a different title? Change `GAME_NAME` in `web/src/lib/game/constants.ts`.

---

## How to play

| Action | Laptop | Phone / tablet |
| --- | --- | --- |
| Steer | Arrow keys or W A S D | Swipe in any direction |
| Pause / resume | Space | Pause button (top bar) |
| Settings | ⚙️ button: speed (slow / normal / fast) and board size (small 12×12 / medium 16×16 / large 20×20). Opening it pauses the game. | same |
| Dark / light theme | 🌙 / ☀️ button | same |

Eat the red apple to grow and score **+1**. Every **5 apples** the snake gets a little faster. A speed change applies immediately; a new board size starts with your next game. Settings and theme are saved in your browser. Hitting a wall or your own body ends the game. Your best score is saved in your browser. When a game ends, your score is sent to the live top 10.

---

## Project structure

```
BROWSER GAME/
├── render.yaml                 # Render blueprint for the server
├── server/                     # Socket.IO leaderboard (Node.js)
│   ├── src/index.ts            #   HTTP + Socket.IO server, events, CORS
│   ├── src/leaderboard.ts      #   Top-10 logic + input validation
│   ├── src/types.ts            #   Event/payload types (shared contract)
│   └── tests/                  #   Unit + integration tests
└── web/                        # Next.js frontend
    ├── src/app/                #   layout.tsx, page.tsx, globals.css
    ├── src/components/
    │   ├── Game.tsx            #   Wires everything together
    │   ├── game/               #   3D scene: Board, Snake, Apple, PopEffects, CameraRig, GameLoop, palette
    │   ├── screens/            #   TopBar, StartScreen, GameOverCard, PauseOverlay, SettingsDialog, Leaderboard
    │   └── ui/                 #   shadcn/ui components (button, card, dialog, …)
    ├── src/hooks/              #   Keyboard, swipe and auto-pause controls
    ├── src/lib/game/           #   constants.ts, logic.ts (pure rules), clock.ts
    ├── src/lib/socket.ts       #   Socket.IO client connection
    ├── src/store/              #   Zustand stores: game, leaderboard, theme
    └── tests/logic.test.ts     #   Unit tests for the game rules
```

### How it works

1. **Rules** (`lib/game/logic.ts`) are plain functions with no React or 3D code. `stepSnake()` takes the snake, a direction and the food, and returns the moved snake or a crash.
2. **State** (`store/useGameStore.ts`) is a Zustand store holding the status (`menu | playing | paused | over`), score, high score, speed (`tickMs`), snake cells and food. Its `tick()` action applies one move using the rules.
3. **Game loop** (`components/game/GameLoop.tsx`) runs inside the Three.js frame loop. It adds up elapsed time and calls `tick()` every `tickMs` milliseconds.
4. **Rendering** uses Three.js through React Three Fiber.
   - **Camera:** an orthographic camera looks straight down, so the board looks flat. Its `zoom` is set to canvas pixels ÷ cells, so the board fills the canvas on any screen.
   - **Board:** one flat plane with a checkered texture (one pixel per cell). The border is plain CSS.
   - **Snake:** the body is a single `InstancedMesh` of overlapping spheres laid along the path, which reads as a smooth tube. The head has eyes that face the direction of travel and a mouth that opens when an apple is close in front. Between ticks the snake glides from its previous cells to its current ones using `gameClock.progress` (0 → 1). Positions are updated every frame without React re-renders.
   - **Eating:** the head does a little "boing", a bulge travels down the body, and `PopEffects` plays a ring-and-sparks "pop" where the apple was.
5. **UI** (`components/screens/`): the top bar, start screen, game-over card and settings dialog are shadcn/ui components that read from the same store. The theme toggle switches the `dark` class on `<html>`. A tiny inline script in `layout.tsx` applies the saved theme before the first paint, so there's no flash.
6. **Leaderboard**: when the status becomes `over`, `Game.tsx` emits `score:submit` through Socket.IO. The server validates the score, updates its top 10 and broadcasts `leaderboard:update` to every connected browser. `useLeaderboardStore` receives it, and the leaderboard re-renders live.

### Socket.IO events

| Event | Direction | Payload |
| --- | --- | --- |
| `leaderboard:update` | server → all clients | `LeaderboardEntry[]` (top 10), sent on connect and after every change |
| `score:submit` | client → server | `{ name, score }` and an acknowledgement callback `{ ok, entry, rank }` or `{ ok: false, error }` |

---

## Run it locally

**Requirements:** Node.js 20 or newer, and npm.

Open **two terminals**.

**Terminal 1: leaderboard server**

```bash
cd server
npm install
npm run dev          # http://localhost:4000  (health check: /health)
```

**Terminal 2: game**

```bash
cd web
npm install
cp .env.example .env.local   # Windows (PowerShell): copy .env.example .env.local
npm run dev          # open http://localhost:3000
```

Open the game in two browser windows (or on your phone over your local network). Finish a game in one window and watch the leaderboard update in the other.

### Useful scripts

| Folder | Command | What it does |
| --- | --- | --- |
| `web` | `npm run dev` | Dev server with hot reload |
| `web` | `npm run build` / `npm start` | Production build / serve it |
| `web` | `npm test` | Unit tests for the game rules |
| `web` | `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `server` | `npm run dev` | Server with auto-restart |
| `server` | `npm run build` / `npm start` | Compile TypeScript to `dist/` / run it |
| `server` | `npm test` | Leaderboard unit tests + live Socket.IO integration test |

> **Debugging tip (development only):** in the browser console, `__gameStore.getState()` shows the live game state.

---

## Deploy

First push the whole folder to a GitHub repository. Both Vercel and Render deploy straight from GitHub.

### 1. Server → Render

**Option A (Blueprint):** In Render, choose **New → Blueprint**, pick your repo, and Render reads `render.yaml`.

**Option B (manual):** Choose **New → Web Service** and use these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Environment variables:

| Name | Value |
| --- | --- |
| `CLIENT_ORIGIN` | Your Vercel URL, for example `https://slither-garden.vercel.app` (comma-separate several; no trailing slash) |

Render sets `PORT` for you. After the deploy, copy your service URL, for example `https://slither-garden-leaderboard.onrender.com`.

### 2. Frontend → Vercel

1. In Vercel, choose **Add New → Project** and import the repo.
2. Set **Root Directory** to `web`. The framework is detected as Next.js automatically.
3. Add this environment variable:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SOCKET_URL` | Your Render URL, for example `https://slither-garden-leaderboard.onrender.com` |

4. Click **Deploy**.

> `NEXT_PUBLIC_` variables are baked in at **build time**. If you change the URL later, redeploy the Vercel project.

If you deployed the server before you knew your Vercel URL, go back to Render, set `CLIENT_ORIGIN`, and redeploy the server.

### Notes

- **Free Render instances sleep** after about 15 minutes without traffic. The first visitor may wait up to about a minute while it wakes up. Meanwhile the leaderboard shows "Connecting…", and the game is fully playable. Scores from that time are queued and sent once the connection is up.
- **The leaderboard lives in memory**, so it resets when the server restarts or redeploys. To make it permanent, replace the `Leaderboard` class in `server/src/leaderboard.ts` with one backed by a database.
- **Scores are reported by the browser.** The server checks that they are valid (a whole number from 0 to 1000, a name of 1–16 characters, at most one submission every 2 seconds per connection), but a determined player could still send a fake score. Preventing that would require running the game on the server, which is beyond this project.

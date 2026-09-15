# RoboHorse Gallop

A side-scrolling action game where you control RoboHorse, a six-legged cyber-horse, against the invading Cephalopod Armada!

## Game Features

- Fast-paced side-scrolling action
- Multiple weapons with different firing patterns
- Special abilities that can be activated with tokens collected from defeated enemies
- Obstacles to jump over or smash
- Jump onto enemies to deal 30 damage (60 while powered up) and bounce safely; side contact still hurts
- Multiple enemy types with different behaviors
- Power-ups to enhance your abilities
- Progressive difficulty with multiple levels

## Playtest Environment

The game includes a dedicated playtest environment for testing and balancing:

- Press **P** to enter playtest mode
- Health bars are displayed for all entities
- Debug information shown in top-left corner
- Enemy spawn rates can be adjusted with **[** and **]**
- Press **T** to spawn test enemies
- Invincibility mode available with **I**
- Frame-by-frame analysis with **F** key
- Performance metrics visible in playtest mode

## Cephalopod nest encounters

Each level has one nest encounter near its midpoint. The nest enters with the scenery as scrolling eases to a stop over four seconds. Fight its 240-HP core in the existing level, with enemies, obstacles, pickups, and your position preserved.

- Orange warnings alternate between two hatchlings and a three-shot projectile fan.
- After each attack, the core glows green and opens for 3.5 seconds. Shoot the core with your normal weapons; the closed armor blocks shots.
- Hatchlings can be shot or stomped, and their population is capped at six.
- Destroying the nest awards 750 points and one special token (up to your carrying limit), then eases scrolling back to full speed over four seconds. Surviving enemies and projectiles remain in play.
- Pause freezes the encounter. Restart, changing levels, and the boss shortcut clear it.

## Boss battle: Krakenarachnid

Level three ends in a stationary boss arena. Defeat the Krakenarachnid to finish the mission and earn 2,500 points.

- Active eyes take full damage. Every projectile impact briefly blinks one random active eye. One eye permanently switches off for each 100 HP lost (500, 400, 300, 200, 100, then 0 HP), briefly stunning the boss and exposing its armored body.
- Three health phases increase attack pressure.
- Web volleys can be shot down; a hit slows movement briefly.
- Telegraphs warn before tentacle shockwaves (jump over them) and spiderling spawns (shoot them).
- After each randomly sampled 20–30% of maximum health lost, the boss telegraphs a high jump to the opposite side and turns to face the arena. Its attacks reverse direction too.
- Landing shakes the ground and kicks up dust. A direct landing on the horse deals 40 HP damage and knocks it toward the center; dodge the marked landing zone to avoid it.
- Pause freezes the encounter, jumps and shake, and restart clears all boss hazards.

**Secret testing shortcut: Ctrl+Shift+B** starts a fresh boss fight from the menu, gameplay, pause, or results screen, with full health and three special tokens. It resets the current run. Normal movement, shooting, weapon switching, and special abilities work in the arena.

The older `playtest.html` retains the original isolated boss prototype; the production encounter uses `KrakenBoss.js` and `BossBattle.js`.

## New Feature: Enhanced Vehicle Destruction

The latest update improves vehicle destruction mechanics:

- Cars now take 5 hits to explode (increased from 3)
- Cars show progressive damage visuals as they take hits
- Explosions create a massive fiery blast with improved visual effects
- Explosions now feature debris, smoke, and shockwave effects
- Explosion radius and damage have been increased
- The player remains immune to explosion damage
- Cybertrucks can now be destroyed after 10 shots
- Cybertruck explosions are even larger and deal more damage
- Destroying a Cybertruck awards 250 points

## Controls

- **←→** or **A D**: Move
- **↑** or **W** or **Z**: Jump
- **SPACE**: Shoot
- **ENTER**: Change Weapon
- **C**: Power Weapon (requires tokens)

## How to Play

1. Use your weapons to defeat enemies
2. Collect special ability tokens from defeated enemies
3. Jump over obstacles or land on boxes to smash them
4. Shoot cars 5 times to make them explode and damage nearby enemies
5. Shoot Cybertrucks 10 times to destroy them for bigger explosions and bonus points
6. Progress through levels by surviving and defeating enemies

## Running the Game

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev:api # API, in one terminal
pnpm dev     # Vite, in another terminal
```

3. Open http://localhost:5173/robohorse/ in your web browser to play. For the production build, run `pnpm build && pnpm start` and open http://localhost:4270/robohorse/.

Routes available:
- `/` - Main game
- `/playtest` - Playtest environment
- `/legacy` - Original version of the game

## Production Deployment

To build and deploy the game for production:

1. Build frontend assets:
```bash
pnpm build
```

Vite bundles the game and Alpine.js into hashed production assets in `deploy/robohorse/`. Audio and images are copied into that artifact.

2. Deployment options:
   - Static hosting: Deploy the `deploy/robohorse` directory to any static hosting service
   - Node.js hosting: Deploy the entire project to a Node.js-compatible service (Heroku, Render, etc.)

3. Environment configuration:
   - Set `NODE_ENV=production` in your production environment
   - Configure your database connection through environment variables

4. Production considerations:
   - Enable HTTP compression on your server
   - Configure proper cache headers for static assets
   - Use a CDN for global distribution if needed

## Troubleshooting

### Module System Issues
- Error `require is not defined in ES module scope`: Update file to use ES Module syntax (`import` instead of `require`)
- Missing `__dirname` or `__filename`: Use the following code for ES Module equivalent:
  ```javascript
  import { fileURLToPath } from 'url';
  import { dirname } from 'path';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```

### Server Issues
- `EADDRINUSE` error: Another process is using the port
  - Kill the process: `lsof -i :4270` to find the PID, then `kill -9 [PID]`
  - Or change the port in `server.js`: `const port = process.env.PORT || [new_port];`

## Development

The game is built with vanilla JavaScript using a modular approach, served via Node.js/Express:

- `api/server.js`: Express server configuration
- `frontend/js/Game.js`: Main game logic
- `frontend/js/entities/`: Player, Enemy, and Obstacle classes
- `frontend/js/components/`: UI components like Background
- `frontend/js/levels/`: Level management
- `frontend/js/utils/`: Helper functions

### Tech Stack
- Node.js
- Express.js
- Vanilla JavaScript (Game Engine)
- HTML5 Canvas
- Alpine.js (UI Interactions)

### Alpine.js Integration
- Used for interactive UI components in a modular approach
- Vite bundles Alpine.js with the game
- Integration path: `alpine-init.js` → Vite → hashed production assets
- ES module-based configuration for better tree-shaking

### Module System
- Project uses ES modules (`"type": "module"` in package.json)
- All imports/exports use ES module syntax (`import`/`export`) instead of CommonJS (`require`/`module.exports`)
- `__dirname` and `__filename` are replaced with their ES module equivalents
- If adding new files, ensure they follow ES module pattern or use `.cjs` extension for CommonJS files

### Database

#### Console

https://console.neon.tech/app/projects/silent-resonance-05246388/branches/br-black-mud-a85kor69/tables?database=neondb

## Credits

Developed as a demonstration of HTML5 Canvas and JavaScript game development by Vasily Simon + Cursor + Claude Sonnet.

Enjoy the game!
### Startup and deployment checks

Run `pnpm test` for production startup and local rsync protection tests (rsync must be installed). `pnpm start` starts the shared Express app in either environment. Passenger uses `api/passenger_wrapper.cjs`; update its Nginx startup-file setting when deploying this change (see `api/README.md`).

Frontend deployment protects `/api/`, `/.env`, `/node_modules/`, and `/tmp/` on the destination. It still deletes obsolete frontend files. The health endpoint `/api/health` reports HTTP availability, not database readiness.

### Cloudflare target deployment

Workers Static Assets and D1 support is deployed at `https://games.smoxu.com/robohorse/` with a fresh leaderboard. See [the Cloudflare migration guide](cloudflare/README.md) for local testing, deployment, and operations. Run `pnpm dev:cloudflare` locally or `pnpm test:cloudflare` for the isolated integration suite. Cloudflare proxies only the game routes to the Worker; the hostname root continues to serve the Vercel games portal.

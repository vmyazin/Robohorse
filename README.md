# RoboHorse Gallop

A side-scrolling action game where you control RoboHorse, a six-legged cyber-horse, against the invading Cephalopod Armada!

## Game Features

- Fast-paced side-scrolling action
- Multiple weapons with different firing patterns
- Special abilities that can be activated with tokens collected from defeated enemies
- Obstacles to jump over or smash
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

## New Boss: The Quantum Kraken

The game now features an epic boss battle against the Quantum Kraken:

- Massive cybernetic cephalopod with quantum abilities
- Three distinct battle phases
- Special attacks:
  - Quantum Tentacle Strike: Creates time-delayed attacks
  - Dimensional Rift: Spawns mirror images
  - Temporal Storm: Slows down player movement
- Requires strategic use of all weapons and abilities
- Drops unique power-ups during the battle
- Defeating the Kraken unlocks a special weapon

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
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:4269 in your web browser to play.

Routes available:
- `/` - Main game
- `/playtest` - Playtest environment
- `/legacy` - Original version of the game

## Production Deployment

To build and deploy the game for production:

1. Build frontend assets:
```bash
npm run build
```

This runs webpack to bundle JavaScript modules including Alpine.js, with optimization for production.

2. Deployment options:
   - Static hosting: Deploy the `frontend` directory to any static hosting service
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
  - Kill the process: `lsof -i :4269` to find the PID, then `kill -9 [PID]`
  - Or change the port in `server.js`: `const port = process.env.PORT || [new_port];`

## Development

The game is built with vanilla JavaScript using a modular approach, served via Node.js/Express:

- `src/server.js`: Express server configuration
- `src/public/js/Game.js`: Main game logic
- `src/public/js/entities/`: Player, Enemy, and Obstacle classes
- `src/public/js/components/`: UI components like Background
- `src/public/js/levels/`: Level management
- `src/public/js/utils/`: Helper functions

### Tech Stack
- Node.js
- Express.js
- Vanilla JavaScript (Game Engine)
- HTML5 Canvas
- Alpine.js (UI Interactions)

### Alpine.js Integration
- Used for interactive UI components in a modular approach
- Webpack bundling instead of CDN for better performance and offline functionality
- Integration path: `alpine-init.js` → Webpack → `alpine.bundle.js`
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
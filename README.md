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

Simply open `index.html` in a web browser to play.

## Development

The game is built with vanilla JavaScript using a modular approach:

- `js/Game.js`: Main game logic
- `js/entities/`: Player, Enemy, and Obstacle classes
- `js/components/`: UI components like Background
- `js/levels/`: Level management
- `js/utils/`: Helper functions

## Credits

Developed as a demonstration of HTML5 Canvas and JavaScript game development by Vasily Simon + Cursor + Claude Sonnet.

Enjoy the game! 
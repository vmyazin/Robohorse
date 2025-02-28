# Gallop Protocol

A retro-style arcade game where you control Neigh-O-Tron, a six-legged cyber-horse, against the invading Cephalopod Armada.

## Game Overview

In Gallop Protocol, you navigate a cyber-horse through a futuristic landscape, battling various types of squid enemies. The game features:

- Multiple weapon systems
- Power-ups
- Special abilities
- Increasing difficulty as you progress

## Controls

- Arrow Keys: Move
- Z: Jump
- X: Shoot
- C: Special Ability (Stampede Mode)
- Space: Change Weapon

## Code Structure

The game is built with a modular JavaScript structure:

```
├── css/
│   └── styles.css           # Game styling
├── js/
│   ├── main.js              # Entry point
│   ├── Game.js              # Main game logic
│   ├── components/
│   │   └── Background.js    # Background rendering
│   ├── entities/
│   │   ├── Player.js        # Player character
│   │   └── Enemy.js         # Enemy types
│   └── utils/
│       └── helpers.js       # Utility functions
└── gallop-protocol-game-modular.html  # Main HTML file
```

## How to Play

1. Open `gallop-protocol-game-modular.html` in a modern web browser
2. Click the START MISSION button
3. Use the controls to navigate and battle enemies
4. Collect power-ups to restore health or change weapons
5. Try to achieve the highest score possible!

## Development

This game is built with vanilla JavaScript and HTML5 Canvas, requiring no external libraries or dependencies.

## Credits

Gallop Protocol - A retro-style arcade game featuring cyber-horses and space squids. 
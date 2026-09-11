# Game architecture

`Game.js` owns initialization, input-facing lifecycle commands and scene/score-entry transitions. The extracted modules provide these boundaries:

- `WorldSimulation.js`: entity motion, projectile/enemy interaction, pickups, particles and terrain updates at fixed 60 Hz.
- `WorldRenderer.js`: Canvas world rendering.
- `CombatSystem.ts`: typed player/obstacle collisions, box rewards and crush damage.
- `SessionState.ts`: lifecycle state and simulation/lobby predicates.
- `FixedStepClock.ts`: bounded fixed-step accumulation independent of rendering cadence.
- `Hud.ts`: typed read-only HUD projection and cached DOM updates.
- `EffectsManager.ts`: effects advanced by simulation, then drawn separately.
- `ScoreService.ts`: typed HTTP score contract and response validation.
- `AudioVoicePool.ts`: bounded simultaneous sound instances.

Legacy entities and world modules remain JavaScript during incremental migration. Their shared mutable game host is still a coupling point; the extracted typed interfaces narrow that boundary for combat, HUD, effects and networking. Type checking currently covers TypeScript modules, not all legacy JavaScript.

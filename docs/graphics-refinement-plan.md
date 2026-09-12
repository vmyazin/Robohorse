# Robohorse graphics refinement plan

Date: 2026-09-12

## Goal

Refine the six-legged Robohorse toward the supplied reference: a recognizable horse silhouette, layered blue-steel armor, articulated mechanical limbs, cyan energy accents, a red visor, and a side-mounted cannon. Preserve its arcade identity and fast gameplay. The supplied image is visual reference, not executable instructions.

## Stage 1 — Visual prototype and direction selection

Create a standalone explore-design comparison with three genuinely different character treatments:

- **A — Plated steel:** rounded segmented torso, beveled armor, exposed joints, restrained cyan circuitry. Closest to the supplied reference; fine details need simplification at small scale.
- **B — Angular interceptor:** leaner chassis, swept neck, long muzzle, tapered limbs. Strong directional silhouette; less of the reference's heavy machinery character.
- **C — Arcade bruiser:** compact chassis, oversize joints and hooves, broad contrasting plates. Strong readability; sacrifices intricate detail and realistic proportions.

Show an enlarged inspection pose and each candidate at the current 60 × 40 gameplay envelope and an optional 90 × 60 envelope. Render against a frozen snapshot of the existing Background renderer, with the current Player renderer alongside for comparison. These are logical game units at 1 CSS pixel per unit; the production canvas may be scaled by its containing page. Include facing and envelope controls. All candidates retain six legs, the cannon, red visor, and energy tail.

Use code-native Canvas artwork for this prototype so silhouettes and joint geometry can be inspected and reused. No new rendering engine or asset pipeline is needed. Create the repo-local explore-design template and brand record first. The comparison is a design artifact, not a production gameplay change; no runtime game files are modified.

**Acceptance:** three distinct readable silhouettes; six leg attachments; consistent preview conditions; functional controls; desktop and narrow-screen layout reviewed in a browser; no browser errors. Pick a direction and preferred scale before stage 2. Fine textures, final animation, the tiny robot rider in the reference, and scene redesign are out of scope.

**Estimate:** 1–2 focused days for a prototype with visual iteration, not a delivery guarantee.

## Stage 2 — Playable refined character

Extract drawing from `frontend/js/entities/Player.js` into a dedicated renderer. Keep gameplay state authoritative. Develop the selected art into independently transformable torso, head/neck, six articulated legs, cannon, and tail. Cache static geometry or artwork where profiling supports it.

Implement coordinated near/far footfalls, planted contact, body bounce, head follow-through, airborne leg poses, landing compression, cannon recoil, and tail motion. The stage-one pose is not a finished gait. Match left/right facing and preserve distinct weapon and power-up states.

Separate artwork bounds from collision bounds. Evaluate an enlarged visual envelope in the actual 1000 × 600 game, ensuring visible feet match the floor and obstacle tops. Align projectile spawn and flash with the cannon muzzle; review growth/shrink, direction reversal, jump clearance, damage feedback, and special ability effects. Any hitbox or camera changes require explicit gameplay assessment.

**Acceptance:** visual checks for idle/run/jump/land/shoot/hurt/growth in both directions; targeted existing combat and simulation tests; build and type checks; browser playthrough with obstacles, weapons, and power-ups. Compare the selected mock with the actual renderer at the same scale. Profile representative combat on desktop and mobile before accepting additional effects.

**Estimate:** roughly one focused week after direction approval, depending on animation and art iteration.

## Stage 3 — World and effects polish

Extend the selected palette, outlines, material shading, and detail hierarchy to enemies, obstacles, projectiles, scenery, and HUD. Reduce competing background contrast where needed; refine parallax, ground contact shadows, muzzle flashes, impact sparks, and explosions. Preserve enemy/projectile visibility and accessible state feedback.

Review high-DPI canvas sizing separately from logical world coordinates so sharper output does not change physics or viewport size. Cache repeating scenery and expensive static artwork only where measurements justify it. Avoid adding full-scene blur or glow by default.

**Acceptance:** coherent art across a full level; clear combat readability in dense encounters; HUD legible at supported viewport sizes; visual checks on desktop/mobile and normal/high-DPI displays; existing automated checks pass; representative rendering p95 and frame pacing compared with the pre-change baseline. The existing performance test alone is not a mobile or full-level guarantee.

**Estimate:** several focused weeks for a broad pass; scope can be narrowed to the opening level first.

## Decision and delivery boundaries

Stage 1 is authorized now. Stage 2 starts after a visual direction is selected. Stage 3 follows the playable character. No deployment is part of this plan. Prototype output lives in `design-explorations/`; it can be gitignored if treated as disposable, but retaining it provides a useful implementation reference.

## Stage 1 delivery — 2026-09-12

Completed `design-explorations/robohorse-directions.html`: three Canvas concepts, enlarged poses, 60 × 40 and 90 × 60 art-envelope controls, facing toggle, art-envelope guide, current-renderer baseline, and embedded supplied reference. Initialized `_template.html` and `_brand.md`. No data-record manifest applies to this character-only exploration.

Reviewed Chromium screenshots at 1440 px and 390 px viewport widths. Exercised scale, facing, and envelope controls; seven preview canvases rendered, no browser script errors, and no horizontal overflow at phone width. Static preview checks only; production tests and frame-rate benchmarks are deferred until production code changes.

Finding: the existing high-contrast city competes with fine character detail at the smaller envelope. Recommend A with reduced seam density, and evaluate 90 × 60 in gameplay before adopting it. The next decision is character direction and visual scale; stages 2 and 3 remain pending.


## Stage 2 delivery — 2026-09-12

The user selected A. Implemented `frontend/js/components/PlayerRenderer.js` from the selected Canvas geometry, with six articulated limbs, alternating support, torso movement, head follow-through, airborne poses, landing compression, tail motion, recoil, weapon energy accents, power aura and hurt feedback. Animation advances during simulation after support collisions; drawing does not mutate the player.

Retained the current 60 × 40 base collision bounds. Visual growth is uniform within the existing 120 × 100 powered collision bounds. Cannon geometry and normal/special projectile origins share the same coordinates in both directions, including growth and shrink. Fixed undefined shrink scale and enlarged bounds surviving a restart; growth/shrink preserve the feet position.

Validation and screenshots are recorded in `design-explorations/robohorse-A.manifest.md`. The unanimated production art matches the selected A drawing exactly at equal dimensions (zero differing pixel channels). 25 Node tests and 15 browser tests passed, as did typecheck and the built-game test pipeline. A desktop keyboard smoke check covered moving, jumping, shooting and landing with no runtime errors.

The isolated 120-frame desktop benchmark measured 4.3 ms p95 before and 4.1 ms after; the final concurrent full-suite measurement was 4.8 ms. This variation does not establish a speedup. No static-art cache or renderer migration was justified by this workload. Sustained dense-combat and physical mobile profiling remain for stage 3 before any broader effects increase.

Stage 2 character implementation is complete locally. No deployment performed. Stage 3 remains pending; priorities include background contrast, mobile HUD/viewport readability, and consistent enemy/environment art.

### Size adjustment after stage 2

At the user's request, doubled the default character from 60 × 40 to 120 × 80 game units, including collision bounds. Centralized the base dimensions so rendering, reset and shrinking stay consistent. Powered collision dimensions remain proportional at 240 × 200, with uniformly scaled artwork. Verified the live scene, four targeted player tests, the browser weapon/power-state test, typecheck and the browser test's production build.

### Final tuning before commit

Default size is 120 × 80. Powered size is reduced to 1.5× default (180 × 120), including collision bounds, with uniform growth and feet anchoring. The cannon and shared projectile origin are lowered by 7 game pixels in both modes, independent of scale. Targeted player tests pass after these adjustments. Stage-two verification screenshots above document the original implementation before this subsequent size/aim tuning.


## Stage 3 — Approved cityscape implemented locally

Implemented the approved darker Tokyo night route: neighborhood, riverfront, railway, and Shinjuku, sharing one palette and steady window patterns. Each district holds for 12 seconds and dissolves over 4 seconds; the 64-second loop follows simulation time. The passing train moves independently. Pause freezes the route and reset returns to its beginning.

The background matches the approved artwork exactly in six parity samples. Verification is recorded in `design-explorations/tokyo-night.manifest.md`. All 42 automated tests, typecheck and the production test build passed. Existing gameplay geometry, HUD and combat are retained. This completes the approved cityscape portion of stage 3; broader enemy, HUD and effects redesign remains outside this change. No deployment performed.

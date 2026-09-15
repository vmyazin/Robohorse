# D — Arcade titan implementation

Approved reference: `d-arcade-titan.png` (standalone ImageGen concept).
Production asset: `../../frontend/images/kraken-titan.png`.
Renderer: `../../frontend/js/components/BossRenderer.js`.

## Mapping and intentional adaptations

This is fixed artwork, not a dataset. No missing content fields require decisions.

- The approved shell, six inset eyes, vent, armor shading, heavy legs and feet use the transparent sprite directly. ImageGen removed the background; it introduces minor edge/detail variation from the original concept.
- Original pose and visible limb arrangement are preserved. No extra limbs are invented behind the shell.
- Source crop is (14, 150, 1225, 960), excluding empty margins. Production envelope is 340 × 266.45 logical pixels, with feet at the existing ground line. The previous 210 × 210 bounds were expanded to fit D's wider stance.
- Animation deforms 48 horizontal strips gently for planted-foot breathing, slam anticipation/compression, and hit recoil. This is sprite deformation, not a skeleton with independently rigged legs.
- Six weak points follow the same source-to-world pose mapping as the rendered eyes. Broken eyes receive dark cracked lenses. Stun exposes cyan vent slits; web windup charges the vent. Web projectiles originate at its left side.
- Existing three attack phases, warnings, health, victory reward and testing shortcut remain.
- The navy concept background is removed so the actual Tokyo scenery shows between the legs. A subtle contact shadow is drawn in the game.
- A simple armored fallback with all six target eyes renders if the sprite cannot load.

## Verification

- Compared the original D concept, transparent sprite, and actual game screenshot: silhouette, eye count, vent, palette, plate structure and feet retained. Differences are the crop, gameplay scale, animation and state overlays described above.
- `verification/d-gameplay.png`: intact state in the game.
- `verification/d-damaged.png`: two broken eyes, phase three, cyan stunned vent.
- 42 unit/integration tests pass; typecheck passes.
- Three boss browser tests pass against the production build: combat/pause/victory/death/restart; final-level encounter; sprite transparency, damaged state and deterministic rendering without simulation mutations.
- Secret shortcut Ctrl+Shift+B exercised in the local browser; preview left paused.

## Asset-generation prompt

Built-in image_gen tool, using `d-arcade-titan.png` as the edit target:

Use case: background-extraction. Prepare this EXACT approved game monster as a production sprite. Remove only the navy background and floor shadow, replacing with genuine alpha transparency, including all gaps between legs. Preserve the entire monster's original geometry, pose, silhouette, proportions, colors, armor detailing and six pink eyes in two rows of three, pixel-faithfully wherever possible. Do not redesign, add limbs, crop feet, relight, add outlines, text or effects. Same square canvas and same position/size within it. Output one transparent PNG.

## Shared ground plane follow-up

User requested all feet stand on the same plane. Production now loads `frontend/images/kraken-titan-grounded.png`. ImageGen extended the shorter legs. Since the resulting artwork still had small perspective offsets, the renderer prepares one cached canvas on image load: below source y=850, each opaque column is stretched to the crop's bottom baseline (y=1110). The upper body and eye mapping remain unchanged. All breathing/slam transforms are anchored to that baseline.

Verified six foot contact positions at idle, full slam anticipation, impact, and recovery: each is within one raster pixel of game y=549. All three boss browser tests, build, typecheck and diff checks pass. `verification/d-grounded.png` shows the result.

Built-in ImageGen prompt (input: original transparent titan sprite):

Precise game sprite edit. Keep this EXACT robot monster and transparent background. Change ONLY the legs below their attachment joints to put EVERY foot sole on ONE horizontal baseline at source image y=1105 (image 1254x1254). Currently four back/outer feet end around y=970 and float above the two front feet. Extend/repose those shorter legs downward so ALL SIX visible feet touch exactly the same horizontal line, side-scrolling 2D orthographic footing, no perspective depth offset. Keep all feet separately visible with small horizontal gaps as needed. Keep the same six visible leg count, same heavy armored mechanical limb style. Preserve body, armor, all six pink eyes, vent, head placement, top and size EXACTLY. Do not shift or redraw the upper body. Preserve full square dimensions 1254x1254, true transparent alpha background and gaps; no ground line, no floor or shadows, no text. The crucial requirement is all foot bottoms at exactly the same image y coordinate.


## Health-driven eye feedback

Each projectile impact blinks one random surviving eye for 12 simulation ticks (200 ms). New hits replace the previous blink so only one eye blinks at a time. Eyes switch off at each 100 HP loss, with the shutdown eye selected randomly from the active eyes. Shutdowns trigger the existing stun but never regenerate. Large hits apply all crossed thresholds; the final eye turns off at zero HP. Active-eye weak spots still take full damage.


## Alternating jumps and heavy stomps

Each jump threshold subtracts a fresh uniform 20–30% of maximum health from the previous milestone. The jump has 30 ticks of anticipation, an 80-tick arc rising 220 pixels, and a 60-tick recovery before another queued milestone can trigger. Landing alternates sides, mirrors the artwork and weak-point mapping, and reverses waves/spiderlings; aimed webs use the mirrored vent. The horse turns toward the boss on landing.

The destination is marked. A horse overlapping the boss on landing takes 40 HP once, receives an upward impulse, and is displaced toward the arena interior. Avoiding the destination avoids stomp damage. Landing emits dust and a sound, plus a 36-tick decaying ground/entity shake with a steady HUD. All timing follows simulation ticks.

Verified nine boss unit tests and six built-game browser tests, including repeat jumps, pause during flight, mirrored facing, shake, 40 HP landing damage, lethal stomp/game-over and clean restart. Typecheck and diff checks pass. Screenshots: verification/d-jump.png and verification/d-left-landing.png.

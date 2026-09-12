# Approved Tokyo night implementation

The user approved all four districts, the darker Quiet Shinjuku palette, smooth transitions, and animated train. `tokyo-night.reference.html` isolates the connected route. No database/content records are involved; populated-record counts and sparse records do not apply.

| Element | Source | Implementation decision |
| --- | --- | --- |
| Four district geometries, palette, signs, steady windows | Approved exploration Canvas artwork | Use directly; all fixed scenery is present |
| District timing and fades | Approved 12-second hold + 4-second dissolve | Derive from game.frameCount at 60 simulation ticks/sec; repeat every 64 seconds |
| Parallax and passing train | Approved scene functions | Use the same simulation time; train moves independently of scenery |
| Moon and lighting | Fixed approved geometry and colors | Stable; no random per-frame changes |
| Horse, enemies, projectiles, platforms and HUD | Existing game state and renderWorld | Keep existing rendering/collisions; do not bake sample actors into scenery |
| Restart and pause | Existing resetGame/frameCount and fixed-step loop | Time resets with the run; drawing does not advance time |

All fixed art and animation decisions are authorized by approval; there are no missing fields to resolve. The open riverfront is the least dense state; Shinjuku/railway and transitions are the most populated states for visual verification.

- [x] Extract approved standalone reference
- [x] Map elements to production sources
- [x] Resolve gaps: none
- [x] Implement background
- [x] Compare exact reference art and transition against implementation
- [x] Verify open/quiet state, busy state, pause/reset, train and rendering cost

Intentional differences: the live game retains its platforms, combat and HUD instead of the mock horse/combat sample; these may occlude lower scenery. District timing follows simulation rather than wall time, so pause freezes scenery. No gameplay mechanics are added to scenery.


## Verification

At 1000 × 600, the production background has **zero differing RGBA channels** against the approved background at 0, 16, 32, 48, 14 and 63 seconds (all districts, midpoint dissolve, and wraparound dissolve). `verification/tokyo-night-parity.png` places the reference and implementation side by side. Geometry, palette, typography, window placement and transition opacity match; no unintended differences remain.

Reviewed the actual game in `verification/tokyo-neighborhood-game.png`, `verification/tokyo-riverside-game.png`, `verification/tokyo-railway-game.png` and `verification/tokyo-shinjuku-game.png`. The sparse riverfront retains its bridge, skyline, water, trees and railings. The railway retains its moving train and station. The real platforms/HUD remain visible and separate from decorative scenery, as intended.

26 Node tests and 16 browser tests passed, plus typecheck and the browser suite's production build. New coverage verifies deterministic pixels for repeated timestamps, train motion, distinct districts, fade timing, wraparound, reset and Canvas state restoration. Existing pause tests also pass. No browser script errors in the live scene review.

Desktop Chromium's existing 120-draw workload measured 5.8 ms p95 before and 2.3 ms after. Additional advancing-frame samples measured 2.0–2.2 ms for individual districts and 3.9–4.0 ms for dissolves. These are local CPU-side draw timings, not physical-mobile or dense-combat frame-rate guarantees.

## New-game variation

Per the subsequent user request, each new game now chooses a random starting frame within the 64-second cityscape cycle. The offset remains fixed for that run, so pause and transitions remain stable. Restart no longer always returns to the neighborhood; it chooses a fresh offset. This supersedes the original reset-to-first-district behavior above.

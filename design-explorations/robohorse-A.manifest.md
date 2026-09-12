# A — Plated steel implementation record

Selected by the user on 2026-09-12. Reference: `robohorse-A.reference.html`, default 60 × 40 art envelope. No product/database records are rendered, so populated-record counts and loaded/sparse record sampling do not apply. All fixed artwork is supplied by the selected concept, not missing data.

| Visual element | Source | Availability / decision |
| --- | --- | --- |
| Armor, six legs, neck/head, red visor, cyan tail/circuitry | Selected A Canvas geometry | Fixed art; preserve shapes and palette |
| Position, direction, dimensions | Player x/y/direction/width/height | Initialized for every Player; retain 60 × 40 base collision dimensions |
| Weapon accent and muzzle flash | currentWeapon, lastShot | All 5 configured weapons supply color and dimensions; retain steel cannon and vary its energy accent |
| Ground/run/jump/landing pose | resolved velY/isJumping, movement keys, gameSpeed | Derive from existing simulation; new local animation state has explicit defaults |
| Power aura | specialAbilityActive, currentWeapon.color | Intentional conditional effect; inactive remains complete |
| Growth/shrink | mushroomPowerActive and growth/shrink state | Preserve complete artwork at every scale; uniform visual scaling |
| Hurt highlight | change in health | Derive from initialized health; no missing content |
| Contact shadow | feet position when grounded | Grounded only; avoid a fake shadow attached to an airborne horse |

No Sometimes/Aspirational content gaps require a source decision. Idle/default weapon with no effects is the minimal state; running/powered-up/shooting is the full state. These substitute for loaded/sparse data records in the skill's parity checks.

## Intentional deviations from the still reference

- Production feet are aligned to the collision floor; the reference includes 8 units of empty space below the hooves.
- Motion adds a planted gait, torso bounce, head follow-through, flexible tail, landing compression and cannon recoil. The zero-motion art drawing remains the parity anchor.
- Weapon colors are confined to the cannon energy strip and muzzle flash. Armor retains A's steel palette.
- Growth uses uniform art scaling, centered inside the existing growth collision bounds, to avoid stretching the selected silhouette.
- The standing pose puts all feet on the ground; the reference raises one front hoof. The reference pose is retained for direct art parity verification.

## Checklist

- [x] Extract selected reference
- [x] Map visual elements to real player state
- [x] Resolve gaps: none; fixed character artwork is authorized by selection
- [x] Implement renderer and simulation integration
- [x] Compare zero-motion reference and production artwork; review animated states
- [x] Verify minimal/default state and all weapon/power states


## Parity and validation result

Direct reference-pose comparison: **0 differing RGBA channels out of 408,000**, at identical 340 × 300 canvas dimensions. Geometry, outlines, material colors, circuitry, visor, joints, and tail match the selected reference. Compared both images in `verification/A-parity.png`; no unintended art deltas remain. The intentional animation/feet/weapon changes are listed above.

Reviewed `verification/A-minimal.png` (default weapon, no effects), `verification/A-powered.png` (growth and aura), and `verification/A-states.png` (idle, left-facing run, jump, landing, hurt, all five weapons, growth and shrinking). The minimal state retains all armor and anatomy; no missing-field hiding occurs. Shrinking deliberately retains larger artwork briefly while base collision dimensions restore, then returns smoothly to the base art size.

`verification/A-gameplay.png` and `verification/A-mobile.png` show the actual game at 1200 × 800 and 390 × 844 browser viewports. The mobile viewport exposes the existing crowded HUD and small world scale; stage 3 should address this. No physical-device or sustained full-level mobile performance claim is made.

Checks: 25 Node tests, 15 browser tests, typecheck and production test-mode build passed. The new browser test confirms drawing is read-only and restores Canvas transforms across all weapons and both directions. The existing easter-egg browser test needed an activation wait because its initial x=0 satisfied the position check before the effect started; that timing race is fixed.

## Subsequent user-approved tuning

Default dimensions are now 120 × 80; powered dimensions are 180 × 120 (uniform 1.5× growth). Cannon artwork and projectile origin are lowered by 7 game pixels in both modes. The original reference and verification screenshots remain historical records of the selected design and initial implementation, before these sizing and aim adjustments.

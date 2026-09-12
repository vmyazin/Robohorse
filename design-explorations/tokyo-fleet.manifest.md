# Approved Tokyo fleet implementation

Reference: `tokyo-fleet.reference.html`, preserved from the approved seven-model exploration. This is fixed procedural artwork; record counts, data loading, and empty dataset states do not apply.

## Production mapping

| Model | Production role | Selection weight | Collision size |
| --- | --- | --- | --- |
| Tokyo taxi | Standard car | 2/9 | 180 × 80 |
| Kei hatchback | Standard car | 2/9 | 180 × 80 |
| Street coupe | Standard car | 1/9 | 180 × 60 |
| Delivery van | Standard car | 2/9 | 180 × 80 |
| Patrol sedan | Standard car | 1/9 | 180 × 80 |
| Armored pickup | Standard car | 1/9 | 200 × 100 |
| Tesla Cybertruck | Existing Cybertruck type | Existing level spawning | 200 × 100 |

`frontend/js/components/VehicleRenderer.js` contains the approved drawing paths and signature palettes. `Obstacle.js` selects and delegates rendering to these models. The armored pickup uses standard car mechanics: five hits and 100 points. Tesla retains ten hits, 250 points, and its existing special trigger.

## Deliberate integration adjustments

- Lowered the coupe collision height to 60 pixels to fit its shallow silhouette.
- Aligned the artwork's tire baseline with the collision body's ground edge.
- Mapped visual damage to clean at zero hits, cracked after the first hit, and smoke during the final two hits before destruction.
- Retained the gameplay hits-remaining label above damaged vehicles.
- Used each model's signature paint; comparison-only paint controls stay in the exploration.
- Vehicle lights remain steady.

## Verification

- Pixel parity: all seven production models match the reference at each of three damage stages (21 comparisons, zero differing pixels).
- Reviewed clean and damaged art in `verification/fleet-parity.png`.
- Reviewed real game composition and ground alignment in `verification/fleet-everyday-game.png` and `verification/fleet-special-game.png`; no browser errors.
- Exercised every model through damage and destruction, including repeated rendering without state mutation.
- Typecheck passed. All 33 unit tests and 18 browser tests passed (existing 17-test browser suite plus the new fleet test). Production build passed through browser-test setup.
- Existing Cybertruck special-trigger and stomp browser tests passed.

The production implementation is complete. No deployment or commit is included in this approval step.

## Contoured landing follow-up

Vehicle landing surfaces now follow each model's body outline, transformed using the renderer's artwork scale and tire baseline. The horse uses its central hoof span for support, follows rising and falling contours while standing, and falls when it leaves the body. Swept vertical landing checks handle fast falls; side contact remains blocking. Exploding vehicles provide no solid support. The rectangular bounds remain useful for broad-phase and projectile checks.

Browser coverage checks all seven models with normal and powered horse sizes, hood/roof/trunk landings, movement along slopes, and side blocking.

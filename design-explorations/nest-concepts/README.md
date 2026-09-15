# Cephalopod nest artwork

Selected direction: **B — Cybernetic Hatchery** from `concepts.png`.

The production sheet is `frontend/images/cybernetic-hatchery.png`, generated with ImageGen from the approved concept. Its two transparent frames show the shielded mechanical iris and exposed mint-green core. The original generated alpha is preserved.

`NestRenderer.js` draws the source frames directly, with simulation-timed iris blending, subtle breathing, warning glow, and hit feedback. Encounter movement, rewards, collision bounds, and attack timing remain unchanged.

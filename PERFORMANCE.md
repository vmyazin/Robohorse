# Performance check

The repeatable Chromium workload is `e2e/performance.spec.js`, run by `pnpm test:e2e`. It renders 120 frames of the starting game scene synchronously and requests the same sound 100 times. Audio playback is stubbed to isolate allocation counts.

On this macOS ARM development machine, rendering p95 was 4.3 ms before and 4.7 ms after the audio change. This variation does not establish a rendering improvement; no renderer migration is justified by this measurement. This is not a full-level or mobile benchmark, nor a measurement of GPU presentation latency.

Sound clones dropped from 100 to 8 for the burst. The typed pool caps each effect at eight simultaneous voices, reuses ended voices, releases failed playback, and drops requests above capacity. Muting stops pooled effects. The missing leg-launcher sound now uses an existing blaster asset.

The browser test checks the eight-voice cap and uses a loose 100 ms rendering ceiling to catch gross regressions without treating CI timing as a frame-rate guarantee.


## Plated-steel player (2026-09-12)

The same 120-draw desktop Chromium workload measured 4.3 ms p95 before the player renderer replacement and 4.1 ms after in isolated runs. Running the final full suite concurrently measured 4.8 ms. These are workload observations, not evidence of a speedup or a mobile frame-rate guarantee. No additional full-scene effects or renderer migration were added. New drawing remains read-only; animation advances in simulation ticks. Physical mobile and sustained dense-combat profiling are still needed before the world-effects pass.


## Tokyo night background

The approved deterministic four-district background replaces per-frame randomized windows and broad glow effects. Two reusable 1000 × 600 canvases composite the current and next district; the next district is rendered only during a dissolve. Simulation frame count drives all motion, including the train.

The existing isolated 120-draw Chromium workload measured 5.8 ms p95 before and 2.3 ms after this change. Forty advancing-frame draws at each sampled district/transition start measured 2.0–2.2 ms p95 for individual districts and 3.9–4.0 ms during dissolves. These desktop CPU-side draw measurements do not establish physical-mobile performance or dense-combat frame pacing.

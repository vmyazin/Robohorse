# Tokyo vehicle exploration

This is fixed character/vehicle artwork, not a data-record UI. Dataset completeness counts are not applicable. Source inspected: `frontend/js/entities/Obstacle.js` constructor and car drawing methods; the preview embeds the current TokyoCity and PlayerRenderer code.

| Element | Existing source / observed coverage | Proposal |
| --- | --- | --- |
| Standard dimensions | Car constructor: 180 × 80 | A–E use those bounds |
| Heavy dimensions | Cybertruck constructor: 200 × 100 | F uses those bounds |
| Model identity | carModel chooses 4 values: sedan, SUV, sports car, pickup | 5 standard identities proposed; mapping/expansion must be chosen on implementation |
| Paint | 9 constructor color choices | Signature art palette plus shared comparison swatches; not a new gameplay field |
| Damage state | explosionTriggerCount, explosionTriggerThreshold, damageVisuals on both vehicle types | Three conceptual visual stages; precise hit mapping is deferred |
| Roof signs, patrol bar, delivery lettering | Fixed art proposed here; no asset or backend dependency | Draw procedurally per selected model |
| Armored pickup role | Existing heavy slot is Cybertruck with special trigger behavior | Proposal only; requires explicit replacement/variant decision |
| Horse and background | Current production drawing modules | Reused without edits |

No production files changed. No existing vehicle identity or gameplay feature has been removed. The approved mock should guide model mapping and collision-envelope review before implementing the fleet. The low coupe is deliberately flagged because a shallow silhouette inside the existing 180 × 80 bounds can make collisions feel unfair.


## Tesla addition

Added G — Tesla Cybertruck at the existing 200 × 100 heavy-vehicle dimensions. It preserves the triangular steel silhouette, dark wheel covers and steady front light bar. F remains an optional armored pickup rather than replacing the Tesla. Damage and paint controls apply to G; existing Cybertruck hit thresholds, rewards and special triggers remain untouched.

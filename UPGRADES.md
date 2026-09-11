# Upgrade work

- [x] Consolidate API startup; repair Passenger module entry.
- [x] Protect API/configuration from frontend sync deletion.
- [x] Fixed 60 Hz simulation; single obstacle update owner; prevent duplicate loops/listeners.
- [ ] Strict score API, abuse limits, generic errors, secure database TLS; API integration tests.
- [x] Versioned migrations verified against fresh and legacy PostgreSQL using PGlite.
- [ ] Incremental TypeScript across simulation, entities, API contracts and game state.
- [x] Vite 8 with hashed assets and `/robohorse/` base path.
- [x] Pin Node/pnpm and consolidate dependency ownership in a pnpm workspace.
- [ ] CI checks and atomic deployment with migrations.
- [ ] Browser tests for lifecycle, score failure and restart; gameplay inspection.
- [ ] Split Game into simulation, collision/combat, scene/UI and score-service responsibilities.
- [ ] Measure rendering/audio performance and apply justified improvements.

No live deployment or production database migration has been performed.

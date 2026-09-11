// Simulation runs at 60 Hz regardless of display refresh rate.
export default class FixedStepClock {
    constructor() {
        this.step = 1000 / 60;
        this.reset();
    }

    reset() {
        this.previous = null;
        this.accumulator = 0;
    }

    advance(timestamp, update) {
        if (!Number.isFinite(timestamp)) return 0;
        if (this.previous === null) {
            this.previous = timestamp;
            return 0;
        }
        const elapsed = Math.max(0, Math.min(timestamp - this.previous, 100));
        this.previous = timestamp;
        this.accumulator += elapsed;
        while (this.accumulator + 1e-8 >= this.step) {
            this.accumulator -= this.step;
            update();
        }
        return elapsed;
    }
}

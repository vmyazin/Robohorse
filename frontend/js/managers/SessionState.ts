export default class SessionState {
    started = false;
    over = false;
    paused = false;
    complete = false;

    reset() {
        this.started = false;
        this.over = false;
        this.paused = false;
        this.complete = false;
    }

    finish() {
        this.started = false;
        this.over = false;
        this.paused = false;
        this.complete = true;
    }

    get canSimulate() { return this.started && !this.over && !this.paused && !this.complete; }
    get inLobby() { return !this.started && !this.over && !this.complete; }
}

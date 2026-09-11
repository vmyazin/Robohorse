export default class AudioVoicePool {
    private voices = new Map<string, { audio: HTMLAudioElement; busy: boolean }[]>();
    readonly maxVoices = 8;

    play(key: string, source: HTMLAudioElement, volume: number) {
        const voices = this.voices.get(key) || [];
        this.voices.set(key, voices);
        let voice = voices.find(item => !item.busy);
        if (!voice && voices.length < this.maxVoices) {
            voice = { audio: source.cloneNode() as HTMLAudioElement, busy: false };
            const item = voice;
            item.audio.addEventListener('ended', () => { item.busy = false; });
            item.audio.addEventListener('error', () => { item.busy = false; });
            voices.push(item);
        }
        // Drop excess simultaneous effects instead of allocating without a bound.
        if (!voice) return;
        voice.busy = true;
        voice.audio.volume = Math.max(0, Math.min(1, volume));
        voice.audio.currentTime = 0;
        try {
            const item = voice;
            void item.audio.play().catch(() => { item.busy = false; });
        } catch { voice.busy = false; }
    }

    stop() {
        for (const voices of this.voices.values()) {
            for (const voice of voices) {
                voice.audio.pause();
                voice.busy = false;
            }
        }
    }
}

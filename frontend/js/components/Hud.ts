export interface HudState {
    score: number;
    health: number;
    maxHealth: number;
    weapon: string;
    tokens: number;
    playing: boolean;
}

export default class Hud {
    private elements: Map<string, HTMLElement> = new Map();
    private previous = new Map<string, string>();

    constructor(root: Document = document) {
        for (const id of ['score', 'health-bar', 'health-value', 'weapon', 'special-tokens']) {
            const element = root.getElementById(id);
            if (element) this.elements.set(id, element);
        }
    }

    private text(id: string, value: string) {
        if (this.previous.get(id) === value) return;
        const element = this.elements.get(id);
        if (element) element.textContent = value;
        this.previous.set(id, value);
    }

    render(state: HudState, ctx?: CanvasRenderingContext2D) {
        this.text('score', String(state.score));
        this.text('weapon', state.weapon);
        this.text('special-tokens', String(state.tokens));
        const health = Number.isFinite(state.health) ? Math.max(0, Math.min(state.health, state.maxHealth)) : state.maxHealth;
        this.text('health-value', String(Math.round(health)));
        const percent = state.maxHealth > 0 ? health / state.maxHealth * 100 : 0;
        const bar = this.elements.get('health-bar');
        const width = `${percent}%`;
        if (bar && this.previous.get('health-bar') !== width) {
            bar.style.width = width;
            const color = percent > 60 ? '#0f0' : percent > 30 ? '#ff0' : '#f00';
            bar.style.background = `linear-gradient(to right, ${color}, ${color})`;
            this.previous.set('health-bar', width);
        }
        if (state.playing && ctx) {
            ctx.save();
            ctx.font = '16px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${state.score}`, 20, 30);
            ctx.restore();
        }
    }
}

// js/managers/EffectsManager.js
// Responsible for managing visual effects in the game

interface EffectsHost {
    canvas: HTMLCanvasElement;
    soundManager: { playSound(key: string, volume?: number): void };
}

class EffectsManager {
    game: EffectsHost;
    elonToasty: {
        active: boolean; x: number; y: number; width: number; height: number;
        image: HTMLImageElement; element: HTMLImageElement | null;
        timer: number; duration: number;
        slideInDuration: number; slideOutDuration: number; slideInComplete: boolean;
    };
    damageFlash: { active: boolean; duration: number; timer: number; color: string };
    constructor(game: EffectsHost) {
        this.game = game;
        
        // Elon Toasty easter egg
        const element = typeof document === 'undefined'
            ? null
            : document.querySelector<HTMLImageElement>('#elon-toasty');
        const image = element || new Image();
        if (!element) image.src = new URL('../../images/elon.png', import.meta.url).href;
        this.elonToasty = {
            active: false,
            x: 0,
            y: 0,
            width: 150,
            height: 150,
            image,
            element,
            timer: 0,
            duration: 120, // 2 seconds at 60fps
            slideInDuration: 15,
            slideOutDuration: 15,
            slideInComplete: false
        };

        // Damage flash effect
        this.damageFlash = {
            active: false,
            duration: 10, // frames
            timer: 0,
            color: 'rgba(255, 0, 0, 0.3)'
        };
    }
    
    /**
     * Trigger the Elon Toasty easter egg
     */
    triggerElonToasty() {
        if (!this.elonToasty.active) {
            this.elonToasty.active = true;
            this.elonToasty.x = this.game.canvas.width;
            this.elonToasty.slideInComplete = false;
            this.elonToasty.timer = 0;
            this.syncElonToastyElement();
            
            // Play the toasty sound
            this.game.soundManager.playSound('toasty', 0.7);
        }
    }
    
    /**
     * Draw the Elon Toasty easter egg
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    updateElonToasty() {
        if (!this.elonToasty.active) return;
        
        const canvas = this.game.canvas;
        this.elonToasty.timer++;
        
        // Calculate position based on animation phase
        if (!this.elonToasty.slideInComplete && this.elonToasty.timer <= this.elonToasty.slideInDuration) {
            // Slide in phase
            const progress = this.elonToasty.timer / this.elonToasty.slideInDuration;
            this.elonToasty.x = canvas.width - (this.elonToasty.width * progress);
        } else if (!this.elonToasty.slideInComplete) {
            // Hold phase after slide in
            this.elonToasty.slideInComplete = true;
            this.elonToasty.timer = 0; // Reset timer for hold phase
        } else if (this.elonToasty.timer >= this.elonToasty.duration - this.elonToasty.slideOutDuration) {
            // Slide out phase
            const progress = (this.elonToasty.timer - (this.elonToasty.duration - this.elonToasty.slideOutDuration)) / this.elonToasty.slideOutDuration;
            this.elonToasty.x = canvas.width - this.elonToasty.width + (this.elonToasty.width * progress);
        }
        
        // Reset when animation is complete
        if (this.elonToasty.timer >= this.elonToasty.duration) {
            this.elonToasty.active = false;
        }
        this.syncElonToastyElement();
    }

    syncElonToastyElement() {
        const element = this.elonToasty.element;
        if (!element) return;
        element.hidden = !this.elonToasty.active;
        const visibleX = this.game.canvas.width - this.elonToasty.width;
        element.style.transform = `translateX(${this.elonToasty.x - visibleX}px)`;
    }
    
    drawElonToasty(ctx: CanvasRenderingContext2D) {
        if (this.elonToasty.element || !this.elonToasty.active || !this.elonToasty.image.complete || !this.elonToasty.image.naturalWidth) return;
        const canvas = this.game.canvas;
        // Draw Elon image
        ctx.drawImage(
            this.elonToasty.image,
            this.elonToasty.x,
            canvas.height - this.elonToasty.height,
            this.elonToasty.width,
            this.elonToasty.height
        );
        
    }

    /**
     * Trigger a damage flash effect
     */
    triggerDamageFlash() {
        this.damageFlash.active = true;
        this.damageFlash.timer = 0;
    }
    
    /**
     * Update the damage flash effect
     */
    updateDamageFlash() {
        if (this.damageFlash.active) {
            this.damageFlash.timer++;
            
            if (this.damageFlash.timer >= this.damageFlash.duration) {
                this.damageFlash.active = false;
            }
        }
    }
    
    /**
     * Draw the damage flash effect
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    drawDamageFlash(ctx: CanvasRenderingContext2D) {
        if (!this.damageFlash.active) return;
        
        // Calculate opacity based on remaining time
        const opacity = 1 - (this.damageFlash.timer / this.damageFlash.duration);
        const flashColor = `rgba(255, 0, 0, ${opacity * 0.3})`;
        
        // Draw full-screen red overlay
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    
    /**
     * Update all effects
     */
    update() {
        this.updateDamageFlash();
        this.updateElonToasty();
    }
    
    /**
     * Draw all effects
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    draw(ctx: CanvasRenderingContext2D) {
        this.drawDamageFlash(ctx);
        this.drawElonToasty(ctx);
    }
}

export default EffectsManager;

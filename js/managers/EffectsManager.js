// js/managers/EffectsManager.js
// Responsible for managing visual effects in the game

class EffectsManager {
    constructor(game) {
        this.game = game;
        
        // Elon Toasty easter egg
        this.elonToasty = {
            active: false,
            x: 0,
            y: 0,
            width: 150,
            height: 150,
            image: new Image(),
            timer: 0,
            duration: 120, // 2 seconds at 60fps
            slideInDuration: 15,
            slideOutDuration: 15,
            slideInComplete: false
        };
        this.elonToasty.image.src = 'images/elon.png';
        
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
            
            // Play the toasty sound
            this.game.soundManager.playSound('toasty', 0.7);
        }
    }
    
    /**
     * Draw the Elon Toasty easter egg
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    drawElonToasty(ctx) {
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
        
        // Draw Elon image
        ctx.drawImage(
            this.elonToasty.image,
            this.elonToasty.x,
            canvas.height - this.elonToasty.height,
            this.elonToasty.width,
            this.elonToasty.height
        );
        
        // Reset when animation is complete
        if (this.elonToasty.timer >= this.elonToasty.duration) {
            this.elonToasty.active = false;
        }
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
    drawDamageFlash(ctx) {
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
    }
    
    /**
     * Draw all effects
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    draw(ctx) {
        this.drawDamageFlash(ctx);
        this.drawElonToasty(ctx);
    }
}

export default EffectsManager; 
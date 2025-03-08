// js/entities/Krakenarachnid.js
export default class Krakenarachnid {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = canvas.width - 200;
        this.y = canvas.height / 2;
        this.width = 150;
        this.height = 180;
        this.velX = 0;
        this.velY = 0;
        this.health = 600;
        this.maxHealth = 600;
        this.color = '#4B0082'; // Dark purple
        this.eyes = [
            { x: -30, y: -40, active: true, health: 50 },
            { x: 0, y: -50, active: true, health: 50 },
            { x: 30, y: -40, active: true, health: 50 },
            { x: -20, y: -20, active: true, health: 50 },
            { x: 10, y: -25, active: true, health: 50 },
            { x: 40, y: -15, active: true, health: 50 }
        ];
        this.tentacles = [];
        this.legs = [];
        this.webCooldown = 0;
        this.tentacleCooldown = 0;
        this.spawnCooldown = 0;
        this.stunned = false;
        this.stunTimer = 0;
        this.currentAttack = 'None';
        this.attackTimer = 0;
        this.attackCycle = ['Web Shot', 'Tentacle Slam', 'Spider Spawn'];
        this.attackIndex = 0;
        
        // Initialize tentacles
        for (let i = 0; i < 8; i++) {
            this.tentacles.push({
                angle: (i / 8) * Math.PI * 2,
                length: 60 + Math.random() * 20,
                segments: 5,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        // Initialize spider legs
        for (let i = 0; i < 8; i++) {
            this.legs.push({
                angle: (i / 8) * Math.PI * 2,
                length: 80 + Math.random() * 30,
                segments: 3,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        // Projectiles and spiderlings
        this.webs = [];
        this.spiderlings = [];
        
        console.log("Krakenarachnid boss created at position:", this.x, this.y, "with dimensions:", this.width, this.height);
    }
    
    update(player, frameCount) {
        // Update boss position with slight movement
        if (!this.stunned) {
            this.x += Math.sin(frameCount * 0.02) * 0.5;
            this.y += Math.sin(frameCount * 0.01) * 0.3;
            
            // Keep boss on screen
            this.x = Math.max(this.width / 2, Math.min(this.canvas.width - this.width / 2, this.x));
            this.y = Math.max(this.height / 2, Math.min(this.canvas.height - this.height / 2, this.y));
            
            // Attack pattern
            this.attackTimer++;
            
            if (this.attackTimer >= 180) { // Change attack every 3 seconds
                this.attackTimer = 0;
                this.attackIndex = (this.attackIndex + 1) % this.attackCycle.length;
                this.currentAttack = this.attackCycle[this.attackIndex];
                document.getElementById('current-attack').textContent = this.currentAttack;
            }
            
            // Execute current attack
            switch (this.currentAttack) {
                case 'Web Shot':
                    if (this.webCooldown <= 0) {
                        this.fireWeb(player);
                        this.webCooldown = 60; // 1 second cooldown
                    }
                    break;
                case 'Tentacle Slam':
                    if (this.tentacleCooldown <= 0) {
                        this.slamTentacle();
                        this.tentacleCooldown = 90; // 1.5 second cooldown
                    }
                    break;
                case 'Spider Spawn':
                    if (this.spawnCooldown <= 0) {
                        this.spawnSpiderling();
                        this.spawnCooldown = 120; // 2 second cooldown
                    }
                    break;
            }
        } else {
            // Boss is stunned
            this.stunTimer--;
            if (this.stunTimer <= 0) {
                this.stunned = false;
            }
        }
        
        // Cooldown timers
        if (this.webCooldown > 0) this.webCooldown--;
        if (this.tentacleCooldown > 0) this.tentacleCooldown--;
        if (this.spawnCooldown > 0) this.spawnCooldown--;
        
        // Update webs
        for (let i = this.webs.length - 1; i >= 0; i--) {
            const web = this.webs[i];
            web.x += web.velX;
            web.y += web.velY;
            
            // Check if web hits player
            if (this.isColliding(web, player)) {
                player.immobilized = true;
                setTimeout(() => { player.immobilized = false; }, 2000); // Immobilize for 2 seconds
                this.webs.splice(i, 1);
            }
            
            // Remove webs that go off screen
            if (web.x < 0 || web.x > this.canvas.width || web.y < 0 || web.y > this.canvas.height) {
                this.webs.splice(i, 1);
            }
        }
        
        // Update spiderlings
        for (let i = this.spiderlings.length - 1; i >= 0; i--) {
            const spiderling = this.spiderlings[i];
            
            // Move towards player
            const dx = player.x - spiderling.x;
            const dy = player.y - spiderling.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 0) {
                spiderling.x += (dx / dist) * spiderling.speed;
                spiderling.y += (dy / dist) * spiderling.speed;
            }
            
            // Check if spiderling hits player
            if (this.isColliding(spiderling, player)) {
                player.takeDamage(5);
                this.spiderlings.splice(i, 1);
            }
            
            // Spiderlings die after a while
            spiderling.lifetime--;
            if (spiderling.lifetime <= 0) {
                this.spiderlings.splice(i, 1);
            }
        }
        
        // Update UI
        document.getElementById('boss-health-bar').style.width = (this.health / this.maxHealth * 100) + '%';
        
        // Update eye indicators
        const eyeElements = document.querySelectorAll('.eye');
        for (let i = 0; i < this.eyes.length; i++) {
            if (i < eyeElements.length) {
                if (!this.eyes[i].active) {
                    eyeElements[i].classList.add('destroyed');
                } else {
                    eyeElements[i].classList.remove('destroyed');
                }
            }
        }
    }
    
    draw(ctx) {
        if (this.stunned) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
        }
        
        // Draw legs (behind body)
        for (const leg of this.legs) {
            this.drawLimb(ctx, leg, '#4B0082');
        }
        
        // Draw body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        for (const eye of this.eyes) {
            if (eye.active) {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(this.x + eye.x, this.y + eye.y, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Glowing effect
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x + eye.x, this.y + eye.y, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw tentacles (in front of body)
        for (const tentacle of this.tentacles) {
            this.drawLimb(ctx, tentacle, '#6A0DAD');
        }
        
        // Draw webs
        for (const web of this.webs) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(web.x, web.y, web.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Web pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                ctx.moveTo(web.x, web.y);
                ctx.lineTo(
                    web.x + Math.cos(angle) * web.radius,
                    web.y + Math.sin(angle) * web.radius
                );
            }
            ctx.stroke();
        }
        
        // Draw spiderlings
        for (const spiderling of this.spiderlings) {
            ctx.fillStyle = '#4B0082';
            ctx.beginPath();
            ctx.arc(spiderling.x, spiderling.y, spiderling.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw legs
            ctx.strokeStyle = '#4B0082';
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(spiderling.x, spiderling.y);
                ctx.lineTo(
                    spiderling.x + Math.cos(angle) * spiderling.radius * 2,
                    spiderling.y + Math.sin(angle) * spiderling.radius * 2
                );
                ctx.stroke();
            }
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawLimb(ctx, limb, color) {
        const segments = limb.segments;
        const segmentLength = limb.length / segments;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        
        let startX = this.x;
        let startY = this.y;
        let angle = limb.angle + Math.sin(Date.now() * 0.002 + limb.phase) * 0.2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        for (let i = 0; i < segments; i++) {
            // Add some waviness to the limbs
            angle += Math.sin(Date.now() * 0.003 + i * 0.5 + limb.phase) * 0.1;
            
            const endX = startX + Math.cos(angle) * segmentLength;
            const endY = startY + Math.sin(angle) * segmentLength;
            
            ctx.lineTo(endX, endY);
            
            startX = endX;
            startY = endY;
        }
        
        ctx.stroke();
    }
    
    fireWeb(player) {
        // Calculate direction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Create web projectile
        this.webs.push({
            x: this.x,
            y: this.y - 20,
            velX: (dx / dist) * 5,
            velY: (dy / dist) * 5,
            radius: 15,
            width: 30,
            height: 30
        });
    }
    
    slamTentacle() {
        // Create shockwave effect
        const shockwaves = 3;
        for (let i = 0; i < shockwaves; i++) {
            setTimeout(() => {
                // Add visual effect for shockwave here
                console.log("Shockwave", i);
            }, i * 300);
        }
    }
    
    spawnSpiderling() {
        // Spawn a small spider
        this.spiderlings.push({
            x: this.x + (Math.random() - 0.5) * 50,
            y: this.y + this.height / 2,
            radius: 10,
            width: 20,
            height: 20,
            speed: 2 + Math.random(),
            lifetime: 600 // 10 seconds
        });
    }
    
    takeDamage(amount, projectile) {
        // Check if projectile hit an eye
        let hitEye = false;
        
        for (const eye of this.eyes) {
            if (eye.active && projectile) {
                const dx = (this.x + eye.x) - projectile.x;
                const dy = (this.y + eye.y) - projectile.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 15) { // Eye hit radius
                    eye.health -= amount;
                    if (eye.health <= 0) {
                        eye.active = false;
                        this.stunned = true;
                        this.stunTimer = 180; // 3 seconds stun
                        
                        // Check if all eyes are destroyed
                        const allEyesDestroyed = this.eyes.every(e => !e.active);
                        if (allEyesDestroyed) {
                            // All eyes destroyed, take massive damage
                            this.health -= this.maxHealth * 0.2; // 20% of max health
                            
                            // Regenerate eyes with less health
                            for (const eye of this.eyes) {
                                eye.active = true;
                                eye.health = 30; // Less health on regeneration
                            }
                        }
                    }
                    hitEye = true;
                    break;
                }
            }
        }
        
        // If not hitting an eye, take reduced damage
        if (!hitEye) {
            this.health -= amount * 0.2; // 80% damage reduction
        } else {
            this.health -= amount;
        }
        
        // Check if boss is defeated
        if (this.health <= 0) {
            this.health = 0;
            console.log("Boss defeated!");
        }
    }
    
    // Helper method for collision detection
    isColliding(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        
        // Get the center points of both objects
        const obj1CenterX = obj1.x + (obj1.width / 2);
        const obj1CenterY = obj1.y + (obj1.height / 2);
        const obj2CenterX = obj2.x + (obj2.width / 2);
        const obj2CenterY = obj2.y + (obj2.height / 2);
        
        // Calculate half-widths and half-heights
        const obj1HalfWidth = obj1.width / 2;
        const obj1HalfHeight = obj1.height / 2;
        const obj2HalfWidth = obj2.width / 2;
        const obj2HalfHeight = obj2.height / 2;
        
        // Calculate the distance between centers
        const distX = Math.abs(obj1CenterX - obj2CenterX);
        const distY = Math.abs(obj1CenterY - obj2CenterY);
        
        // Check for collision
        if (distX < (obj1HalfWidth + obj2HalfWidth) && 
            distY < (obj1HalfHeight + obj2HalfHeight)) {
            return true;
        }
        
        return false;
    }
} 
import { roundRect, lightenColor } from '../utils/helpers.js';

class Player {
    constructor(canvas, weapons) {
        this.canvas = canvas;
        this.weapons = weapons;
        this.currentWeaponIndex = 0;
        
        // Initialize player properties
        this.x = 100;
        this.y = canvas.height / 2;
        this.width = 60;
        this.height = 40;
        this.speed = 5;
        this.jumpPower = 12;
        this.velY = 0;
        this.health = 100;
        this.isJumping = false;
        this.isShooting = false;
        this.direction = 1; // 1 = right, -1 = left
        this.lastShot = 0;
        
        // Initialize legs
        this.legs = Array(6).fill().map((_, i) => ({
            angle: i * 60,
            length: 15,
            phase: i * 0.5
        }));
    }
    
    update(keys, frameCount, createParticles) {
        // Player movement
        if (keys['ArrowLeft']) {
            this.x -= this.speed;
            this.direction = -1;
        }
        if (keys['ArrowRight']) {
            this.x += this.speed;
            this.direction = 1;
        }
        
        // Jump
        if (keys['z'] && !this.isJumping) {
            this.velY = -this.jumpPower;
            this.isJumping = true;
            createParticles(this.x + this.width / 2, this.y + this.height, 10, '#777');
        }
        
        // Apply gravity
        this.velY += 0.5;
        this.y += this.velY;
        
        // Floor collision
        if (this.y + this.height > this.canvas.height - 50) {
            this.y = this.canvas.height - 50 - this.height;
            this.velY = 0;
            this.isJumping = false;
        }
        
        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.canvas.width) this.x = this.canvas.width - this.width;
        
        // Animate horse legs
        this.legs.forEach((leg, i) => {
            leg.angle = (i * 60) + Math.sin(frameCount * 0.1 + leg.phase) * 20;
        });
    }
    
    shoot(frameCount, projectiles, createParticles) {
        const weapon = this.weapons[this.currentWeaponIndex];
        if (frameCount - this.lastShot > weapon.fireRate) {
            const projX = this.x + (this.direction > 0 ? this.width : 0);
            const projY = this.y + this.height / 2 - weapon.height / 2;
            
            projectiles.push({
                x: projX,
                y: projY,
                width: weapon.width,
                height: weapon.height,
                speed: weapon.projectileSpeed,
                velX: weapon.projectileSpeed * this.direction,
                velY: 0,
                damage: weapon.damage,
                color: weapon.color,
                isPlayerProjectile: true
            });
            
            // Add muzzle flash effect
            createParticles(projX, projY, 5, weapon.color);
            this.lastShot = frameCount;
            return true;
        }
        return false;
    }
    
    specialAbility(frameCount, projectiles, createParticles) {
        if (frameCount % 10 === 0) {
            const weapon = this.weapons[this.currentWeaponIndex];
            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI/4 + (Math.PI/2 * i/4);
                projectiles.push({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    width: weapon.width,
                    height: weapon.height,
                    speed: weapon.projectileSpeed,
                    velX: Math.cos(angle) * weapon.projectileSpeed * this.direction,
                    velY: Math.sin(angle) * weapon.projectileSpeed,
                    damage: weapon.damage / 2,
                    color: weapon.color,
                    isPlayerProjectile: true
                });
            }
            createParticles(this.x + this.width/2, this.y + this.height/2, 20, this.weapons[this.currentWeaponIndex].color);
            return true;
        }
        return false;
    }
    
    switchWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
        return this.weapons[this.currentWeaponIndex].name;
    }
    
    draw(ctx, frameCount, keys) {
        ctx.save();
        
        const bodyX = this.x + this.width / 2;
        const bodyY = this.y + this.height / 2;
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(bodyX, this.canvas.height - 50, this.width * 0.8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw leg segments with joints
        this.legs.forEach((leg, index) => {
            // Adjust angles to better simulate horse leg positioning
            let angle = (leg.angle * Math.PI / 180) * this.direction;
            
            // Create more horse-like leg positioning
            if (index < 2) {
                // Front legs
                angle = (((index === 0 ? 30 : 60) + Math.sin(frameCount * 0.1 + leg.phase) * 10) * Math.PI / 180) * this.direction;
            } else if (index < 4) {
                // Middle legs
                angle = (((index === 2 ? 330 : 300) + Math.sin(frameCount * 0.1 + leg.phase) * 10) * Math.PI / 180) * this.direction;
            } else {
                // Back legs
                angle = (((index === 4 ? 120 : 210) + Math.sin(frameCount * 0.1 + leg.phase) * 10) * Math.PI / 180) * this.direction;
            }
            
            // Create joints for a more anatomically horse-like leg structure
            const midLength = leg.length * 0.6;
            const jointX = bodyX + Math.cos(angle) * midLength;
            const jointY = bodyY + Math.sin(angle) * midLength;
            
            // Calculate end position with realistic horse-like movement
            const legEndX = jointX + Math.cos(angle) * leg.length;
            const legEndY = jointY + Math.sin(angle) * leg.length + Math.sin(frameCount * 0.1 + leg.phase) * 3;
            
            // Draw upper leg segment with gradient
            const legGradient = ctx.createLinearGradient(bodyX, bodyY, jointX, jointY);
            legGradient.addColorStop(0, '#0066aa');
            legGradient.addColorStop(1, '#00ccff');
            
            ctx.strokeStyle = legGradient;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(bodyX, bodyY);
            ctx.lineTo(jointX, jointY);
            ctx.stroke();
            
            // Draw lower leg segment
            const lowerLegGradient = ctx.createLinearGradient(jointX, jointY, legEndX, legEndY);
            lowerLegGradient.addColorStop(0, '#00ccff');
            lowerLegGradient.addColorStop(1, '#00ffff');
            
            ctx.strokeStyle = lowerLegGradient;
            ctx.beginPath();
            ctx.moveTo(jointX, jointY);
            ctx.lineTo(legEndX, legEndY);
            ctx.stroke();
            
            // Draw joint
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(jointX, jointY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw hoof with glow
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            // Draw hooves instead of circular feet
            if (this.direction > 0) {
                ctx.moveTo(legEndX - 4, legEndY);
                ctx.lineTo(legEndX + 4, legEndY);
                ctx.lineTo(legEndX + 4, legEndY + 6);
                ctx.lineTo(legEndX - 4, legEndY + 6);
            } else {
                ctx.moveTo(legEndX + 4, legEndY);
                ctx.lineTo(legEndX - 4, legEndY);
                ctx.lineTo(legEndX - 4, legEndY + 6);
                ctx.lineTo(legEndX + 4, legEndY + 6);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        // Draw body as a more horse-shaped form (elongated oval)
        const bodyGradient = ctx.createLinearGradient(
            this.x, this.y, 
            this.x + this.width, this.y + this.height
        );
        bodyGradient.addColorStop(0, '#092344');
        bodyGradient.addColorStop(0.5, '#1a5b9c');
        bodyGradient.addColorStop(1, '#092344');
        
        ctx.fillStyle = bodyGradient;
        ctx.strokeStyle = '#0af';
        ctx.lineWidth = 2;
        
        // Horse body shape (elongated ellipse)
        ctx.beginPath();
        ctx.ellipse(
            bodyX, bodyY,
            this.width * 0.5, this.height * 0.7,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        
        // Add tech details to body - circuit pattern
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        
        // Draw spine and ribs (circuit-like pattern)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.2, bodyY);
        ctx.lineTo(this.x + this.width * 0.8, bodyY);
        ctx.stroke();
        
        for (let i = 0; i < 5; i++) {
            const ribX = this.x + this.width * (0.3 + i * 0.1);
            ctx.beginPath();
            ctx.moveTo(ribX, bodyY - this.height * 0.3);
            ctx.lineTo(ribX, bodyY + this.height * 0.3);
            ctx.stroke();
        }
        
        // Draw energy core in center
        const coreGradient = ctx.createRadialGradient(
            bodyX, bodyY, 2,
            bodyX, bodyY, 10
        );
        coreGradient.addColorStop(0, '#fff');
        coreGradient.addColorStop(0.3, '#0ff');
        coreGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(bodyX, bodyY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw horse neck (positioned based on direction)
        const neckEndX = this.x + (this.direction > 0 ? this.width * 0.8 : this.width * 0.2);
        const neckEndY = this.y;
        const neckStartX = this.x + (this.direction > 0 ? this.width * 0.7 : this.width * 0.3);
        const neckStartY = this.y + this.height * 0.3;
        
        const neckGradient = ctx.createLinearGradient(
            neckStartX, neckStartY,
            neckEndX, neckEndY
        );
        neckGradient.addColorStop(0, '#1a5b9c');
        neckGradient.addColorStop(1, '#092344');
        
        ctx.fillStyle = neckGradient;
        ctx.beginPath();
        ctx.moveTo(neckStartX, neckStartY);
        ctx.quadraticCurveTo(
            neckStartX + (neckEndX - neckStartX) * 0.1, 
            neckStartY - this.height * 0.4,
            neckEndX, neckEndY
        );
        ctx.lineTo(neckEndX + (this.direction > 0 ? 5 : -5), neckEndY);
        ctx.quadraticCurveTo(
            neckStartX + (neckEndX - neckStartX) * 0.1 + (this.direction > 0 ? 5 : -5), 
            neckStartY - this.height * 0.4,
            neckStartX + (this.direction > 0 ? 5 : -5), neckStartY
        );
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0af';
        ctx.stroke();
        
        // Add mane with glowing cybernetic details
        const maneColors = ['#00ccff', '#0066ff', '#0033aa'];
        for (let i = 0; i < 7; i++) {
            const maneX = neckStartX + (neckEndX - neckStartX) * (i/7);
            const maneY = neckStartY - this.height * 0.1 - (neckStartY - neckEndY) * (i/7);
            
            // Calculate spine curve position
            const t = i/7;
            const spineX = neckStartX + (neckEndX - neckStartX) * t;
            const controlX = neckStartX + (neckEndX - neckStartX) * 0.1;
            const controlY = neckStartY - this.height * 0.4;
            const spineY = (1-t)*(1-t)*neckStartY + 2*(1-t)*t*controlY + t*t*neckEndY;
            
            const maneLength = 10 + Math.sin(frameCount * 0.1 + i) * 3;
            const maneColor = maneColors[i % maneColors.length];
            
            ctx.strokeStyle = maneColor;
            ctx.lineWidth = 2;
            ctx.shadowColor = maneColor;
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.moveTo(spineX, spineY);
            ctx.lineTo(
                spineX + (this.direction > 0 ? -maneLength : maneLength), 
                spineY - maneLength * 0.7
            );
            ctx.stroke();
            
            // Add glowing tips to mane
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(
                spineX + (this.direction > 0 ? -maneLength : maneLength), 
                spineY - maneLength * 0.7,
                2, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Draw horse tail
        const tailStartX = this.x + (this.direction > 0 ? this.width * 0.2 : this.width * 0.8);
        const tailStartY = this.y + this.height * 0.3;
        
        // Draw tail base
        ctx.fillStyle = '#092344';
        ctx.beginPath();
        ctx.moveTo(tailStartX, tailStartY);
        ctx.quadraticCurveTo(
            tailStartX + (this.direction > 0 ? -20 : 20), 
            tailStartY + 15,
            tailStartX + (this.direction > 0 ? -30 : 30), 
            tailStartY + 40
        );
        ctx.lineTo(tailStartX + (this.direction > 0 ? -35 : 35), tailStartY + 40);
        ctx.quadraticCurveTo(
            tailStartX + (this.direction > 0 ? -25 : 25), 
            tailStartY + 15,
            tailStartX, tailStartY + 5
        );
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0af';
        ctx.stroke();
        
        // Add glowing tail strands
        for (let i = 0; i < 5; i++) {
            const strandPhase = frameCount * 0.05 + i * 0.5;
            const strandX = tailStartX + (this.direction > 0 ? -30 : 30) + Math.sin(strandPhase) * 5;
            const strandY = tailStartY + 40;
            const strandLength = 15 + i * 3;
            
            ctx.strokeStyle = '#00ccff';
            ctx.shadowColor = '#00ccff';
            ctx.shadowBlur = 5;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(strandX, strandY);
            ctx.quadraticCurveTo(
                strandX + (this.direction > 0 ? -10 : 10), 
                strandY + strandLength * 0.6,
                strandX + (this.direction > 0 ? -5 : 5), 
                strandY + strandLength
            );
            ctx.stroke();
            
            // Add glowing tips to tail
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(
                strandX + (this.direction > 0 ? -5 : 5), 
                strandY + strandLength,
                2, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Draw robot head with metallic gradient (more horse-like proportions)
        const headWidth = this.width * 0.4;
        const headHeight = this.height * 0.6;
        const headX = neckEndX + (this.direction > 0 ? 0 : -headWidth);
        const headY = neckEndY - headHeight * 0.7;
        
        // Draw horse-shaped robot head
        const headGradient = ctx.createLinearGradient(
            headX, headY, 
            headX + headWidth, headY + headHeight
        );
        headGradient.addColorStop(0, '#656565');
        headGradient.addColorStop(0.5, '#a9a9a9');
        headGradient.addColorStop(1, '#656565');
        
        ctx.fillStyle = headGradient;
        ctx.strokeStyle = '#0af';
        ctx.lineWidth = 2;
        
        // Create horse head shape
        ctx.beginPath();
        // Curved top of head (forehead)
        ctx.moveTo(headX, headY + headHeight * 0.3);
        ctx.quadraticCurveTo(
            headX + headWidth * 0.5, 
            headY - headHeight * 0.1,
            headX + headWidth, 
            headY + headHeight * 0.3
        );
        
        // Back of head
        if (this.direction > 0) {
            ctx.lineTo(headX + headWidth, headY + headHeight * 0.8);
            // Jaw/chin
            ctx.quadraticCurveTo(
                headX + headWidth * 0.8, 
                headY + headHeight * 0.9,
                headX + headWidth * 0.6, 
                headY + headHeight
            );
            // Muzzle/nose
            ctx.lineTo(headX + headWidth * 0.2, headY + headHeight);
            ctx.quadraticCurveTo(
                headX + headWidth * 0.1, 
                headY + headHeight * 0.7,
                headX, 
                headY + headHeight * 0.5
            );
        } else {
            ctx.lineTo(headX, headY + headHeight * 0.8);
            // Jaw/chin
            ctx.quadraticCurveTo(
                headX + headWidth * 0.2, 
                headY + headHeight * 0.9,
                headX + headWidth * 0.4, 
                headY + headHeight
            );
            // Muzzle/nose
            ctx.lineTo(headX + headWidth * 0.8, headY + headHeight);
            ctx.quadraticCurveTo(
                headX + headWidth * 0.9, 
                headY + headHeight * 0.7,
                headX + headWidth, 
                headY + headHeight * 0.5
            );
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add tech details to head
        ctx.fillStyle = '#222';
        
        // Draw visor/eye display
        const visorY = headY + headHeight * 0.4;
        const visorHeight = headHeight * 0.15;
        
        roundRect(
            ctx, 
            headX + headWidth * 0.2, 
            visorY, 
            headWidth * 0.6, 
            visorHeight, 
            3, true, false
        );
        
        // Draw glowing eye in visor
        const eyeX = headX + headWidth * (this.direction > 0 ? 0.5 : 0.5);
        const eyeY = visorY + visorHeight * 0.5;
        const eyeWidth = headWidth * 0.4;
        const eyeHeight = visorHeight * 0.6;
        
        // Eye glow
        ctx.fillStyle = '#f00';
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 15;
        
        // Draw scanner-like eye
        ctx.beginPath();
        ctx.rect(
            eyeX - eyeWidth * 0.5, 
            eyeY - eyeHeight * 0.5, 
            eyeWidth, 
            eyeHeight
        );
        ctx.fill();
        
        // Scanner animation
        const scannerPos = (frameCount % 60) / 60;
        const scannerX = eyeX - eyeWidth * 0.5 + eyeWidth * scannerPos;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.rect(scannerX - 1, eyeY - eyeHeight * 0.5, 2, eyeHeight);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Add ears
        const earWidth = headWidth * 0.15;
        const earHeight = headHeight * 0.3;
        
        // Left ear
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(headX + headWidth * 0.25, headY + headHeight * 0.1);
        ctx.lineTo(headX + headWidth * 0.2 - earWidth, headY - earHeight);
        ctx.lineTo(headX + headWidth * 0.3 - earWidth, headY - earHeight * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0af';
        ctx.stroke();
        
        // Right ear
        ctx.beginPath();
        ctx.moveTo(headX + headWidth * 0.75, headY + headHeight * 0.1);
        ctx.lineTo(headX + headWidth * 0.8 + earWidth, headY - earHeight);
        ctx.lineTo(headX + headWidth * 0.7 + earWidth, headY - earHeight * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add small blinking ear tip lights
        if (frameCount % 30 < 15) {
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(
                headX + headWidth * 0.2 - earWidth, 
                headY - earHeight, 
                3, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.beginPath();
            ctx.arc(
                headX + headWidth * 0.8 + earWidth, 
                headY - earHeight, 
                3, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Add nostril lights on muzzle
        const nostrilY = headY + headHeight * 0.9;
        const nostrilX1 = headX + headWidth * (this.direction > 0 ? 0.25 : 0.75);
        const nostrilX2 = headX + headWidth * (this.direction > 0 ? 0.35 : 0.65);
        
        ctx.fillStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(nostrilX1, nostrilY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(nostrilX2, nostrilY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw weapon with glow effect
        const weapon = this.weapons[this.currentWeaponIndex];
        
        // Calculate weapon position - mounted on the side
        const weaponY = this.y + this.height * 0.3;
        const weaponLength = 25;
        const weaponHeight = 8;
        
        let weaponX;
        if (this.direction > 0) {
            weaponX = this.x + this.width * 0.8;
        } else {
            weaponX = this.x + this.width * 0.2 - weaponLength;
        }
        
        // Weapon gradient
        const weaponGradient = ctx.createLinearGradient(
            weaponX, weaponY, 
            weaponX + weaponLength, weaponY
        );
        
        weaponGradient.addColorStop(0, weapon.color);
        weaponGradient.addColorStop(1, lightenColor(weapon.color, 30));
        
        ctx.fillStyle = weaponGradient;
        ctx.shadowColor = weapon.color;
        ctx.shadowBlur = 10;
        
        // Draw weapon
        roundRect(ctx, weaponX, weaponY, weaponLength, weaponHeight, 3, true, false);
        
        // Weapon details
        ctx.fillStyle = lightenColor(weapon.color, 50);
        if (this.direction > 0) {
            roundRect(ctx, weaponX + weaponLength - 5, weaponY + 1, 3, weaponHeight - 2, 1, true, false);
        } else {
            roundRect(ctx, weaponX + 2, weaponY + 1, 3, weaponHeight - 2, 1, true, false);
        }
        
        ctx.shadowBlur = 0;
        
        // Add engine exhaust when moving
        if (keys['ArrowLeft'] || keys['ArrowRight']) {
            const exhaustX = this.x + (this.direction > 0 ? this.width * 0.2 : this.width * 0.8);
            const exhaustY = this.y + this.height * 0.7;
            
            // Create random exhaust particles
            for (let i = 0; i < 5; i++) {
                const particleSize = Math.random() * 5 + 3;
                const offsetX = -this.direction * (Math.random() * 20 + 5);
                const offsetY = Math.random() * 8 - 4;
                
                const exhaustGradient = ctx.createRadialGradient(
                    exhaustX, exhaustY, 0,
                    exhaustX, exhaustY, particleSize * 2
                );
                
                exhaustGradient.addColorStop(0, '#fff');
                exhaustGradient.addColorStop(0.2, '#0af');
                exhaustGradient.addColorStop(1, 'rgba(0, 170, 255, 0)');
                
                ctx.fillStyle = exhaustGradient;
                ctx.beginPath();
                ctx.arc(exhaustX + offsetX, exhaustY + offsetY, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

export default Player; 
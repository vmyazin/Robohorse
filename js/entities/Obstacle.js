class Obstacle {
    constructor(x, y, type, canvas) {
        this.x = x;
        this.y = y;
        this.type = type || 'generic';
        this.canvas = canvas;
        
        // Set properties based on obstacle type
        switch(this.type) {
            case 'car':
                this.width = 120;
                this.height = 60;
                // Generate a random car color
                const carColors = ['#3366cc', '#cc3333', '#33cc33', '#9933cc', '#cc9933', '#3399cc'];
                this.color = carColors[Math.floor(Math.random() * carColors.length)];
                this.points = 0;
                this.health = Infinity; // Cars can't be destroyed
                // Random car model (0: sedan, 1: SUV, 2: sports car)
                this.carModel = Math.floor(Math.random() * 3);
                break;
            case 'cybertruck':
                this.width = 140;
                this.height = 70;
                // Chrome/metallic color for the Cybertruck
                this.color = '#c0c0c0';
                this.points = 0;
                this.health = Infinity; // Cybertruck can't be destroyed
                // Add some special properties for the Cybertruck
                this.hasNeonLights = true;
                this.neonColor = '#0ff';
                this.wheelGlow = true;
                break;
            case 'box':
                this.width = 40;
                this.height = 40;
                this.color = '#a67c52';
                this.points = 50;
                this.health = 2; // Exactly 2 jumps to smash
                this.maxHealth = 2; // Store max health for percentage calculations
                this.isBeingSmashed = false;
                this.smashEffectCounter = 0;
                this.smashEffectDuration = 15; // Increased duration for better visual effect
                this.compressionAmount = 0; // How much the box is compressed when smashed
                this.cracks = []; // Array to store crack positions
                this.jumpCount = 0; // Track number of jumps on this box
                this.woodGrainColor = '#8d6a4b'; // Color for wood grain
                break;
            default:
                this.width = 50;
                this.height = 50;
                this.color = '#888';
                this.points = 10;
                this.health = 30;
                this.maxHealth = 30;
        }
        
        // Position at the bottom of the canvas
        this.y = canvas.height - 50 - this.height;
    }
    
    update() {
        // Update smash effect counter
        if (this.isBeingSmashed) {
            this.smashEffectCounter--;
            
            // Update compression amount based on counter
            if (this.type === 'box') {
                // Start with max compression and gradually return to normal
                this.compressionAmount = 12 * (this.smashEffectCounter / this.smashEffectDuration);
            }
            
            if (this.smashEffectCounter <= 0) {
                this.isBeingSmashed = false;
                this.compressionAmount = 0;
            }
        }
    }
    
    takeDamage(damage) {
        if (this.health !== Infinity) {
            // For boxes, we ignore the damage amount and just reduce health by 1
            // This ensures it always takes exactly 2 jumps
            if (this.type === 'box') {
                this.health -= 1;
                this.jumpCount += 1;
                
                // Activate smash effect for boxes
                this.isBeingSmashed = true;
                this.smashEffectCounter = this.smashEffectDuration;
                this.compressionAmount = 12; // Max compression - increased for better effect
                
                // Generate random cracks if first jump
                if (this.jumpCount === 1) {
                    const crackCount = 3 + Math.floor(Math.random() * 2); // 3-4 cracks
                    for (let i = 0; i < crackCount; i++) {
                        this.cracks.push({
                            x1: Math.random() * this.width,
                            y1: Math.random() * this.height,
                            x2: Math.random() * this.width,
                            y2: Math.random() * this.height,
                            width: 1 + Math.random() * 2
                        });
                    }
                    
                    // Darken the wood grain color slightly to show damage
                    this.woodGrainColor = '#7d5a3b';
                } 
                // Add more cracks on second jump
                else if (this.jumpCount === 2) {
                    const crackCount = 4 + Math.floor(Math.random() * 3); // 4-6 more cracks
                    for (let i = 0; i < crackCount; i++) {
                        this.cracks.push({
                            x1: Math.random() * this.width,
                            y1: Math.random() * this.height,
                            x2: Math.random() * this.width,
                            y2: Math.random() * this.height,
                            width: 1 + Math.random() * 2
                        });
                    }
                    
                    // Darken the wood grain color more to show severe damage
                    this.woodGrainColor = '#5d3a1b';
                }
            } else {
                // For non-box obstacles, use normal damage calculation
                this.health -= damage;
            }
            
            return this.health <= 0;
        }
        return false;
    }
    
    draw(ctx, frameCount) {
        if (this.type === 'car') {
            // Draw different car models based on carModel property
            switch(this.carModel) {
                case 0: // Sedan
                    this.drawSedan(ctx, frameCount);
                    break;
                case 1: // SUV
                    this.drawSUV(ctx, frameCount);
                    break;
                case 2: // Sports car
                    this.drawSportsCar(ctx, frameCount);
                    break;
            }
        } else if (this.type === 'cybertruck') {
            this.drawCybertruck(ctx, frameCount);
        } else if (this.type === 'box') {
            // Draw box with smash effect if active
            const boxHeight = this.isBeingSmashed ? this.height - this.compressionAmount : this.height;
            const yOffset = this.isBeingSmashed ? this.compressionAmount : 0;
            
            // Draw the box
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y + yOffset, this.width, boxHeight);
            
            // Draw box outline
            ctx.strokeStyle = '#7d5a3b';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y + yOffset, this.width, boxHeight);
            
            // Draw cracks if the box has been damaged
            if (this.cracks.length > 0) {
                ctx.strokeStyle = '#5d3a1b'; // Darker color for cracks
                ctx.lineWidth = 1;
                
                this.cracks.forEach(crack => {
                    ctx.beginPath();
                    ctx.moveTo(this.x + crack.x1, this.y + yOffset + crack.y1);
                    ctx.lineTo(this.x + crack.x2, this.y + yOffset + crack.y2);
                    ctx.stroke();
                });
            }
            
            // Draw wood grain lines
            ctx.strokeStyle = this.woodGrainColor;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const lineY = this.y + yOffset + (boxHeight / 4) * (i + 1);
                ctx.beginPath();
                ctx.moveTo(this.x, lineY);
                ctx.lineTo(this.x + this.width, lineY);
                ctx.stroke();
            }
            
            // Add a visual indicator of jump count
            if (this.jumpCount === 1) {
                // Draw a "1 more!" indicator
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('1 more!', this.x + this.width/2, this.y - 15);
                
                // Add a subtle glow effect
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 5;
                ctx.fillText('1 more!', this.x + this.width/2, this.y - 15);
                ctx.shadowBlur = 0;
            }
        } else {
            // Draw generic obstacle
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Draw health bar for destructible obstacles
        if (this.health !== Infinity && this.health < this.maxHealth) {
            const healthPercentage = this.health / this.maxHealth;
            const barWidth = this.width * 0.8;
            const barHeight = 5;
            
            // Background
            ctx.fillStyle = '#555';
            ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 10, barWidth, barHeight);
            
            // Health
            ctx.fillStyle = healthPercentage > 0.5 ? '#0f0' : healthPercentage > 0.25 ? '#ff0' : '#f00';
            ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 10, barWidth * healthPercentage, barHeight);
        }
    }
    
    // Draw a sedan car
    drawSedan(ctx, frameCount) {
        // Draw car body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height * 0.7);
        ctx.lineTo(this.x, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.2);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.2);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Draw car details
        this.drawCarDetails(ctx, frameCount);
    }
    
    // Draw an SUV car
    drawSUV(ctx, frameCount) {
        // Draw car body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height * 0.7);
        ctx.lineTo(this.x, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.15);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.15);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Draw car details
        this.drawCarDetails(ctx, frameCount);
        
        // Draw roof rack
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.15);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.15);
        ctx.stroke();
        
        // Draw vertical roof rack supports
        for (let i = 0; i < 3; i++) {
            const x = this.x + this.width * (0.35 + i * 0.15);
            ctx.beginPath();
            ctx.moveTo(x, this.y + this.height * 0.15);
            ctx.lineTo(x, this.y + this.height * 0.2);
            ctx.stroke();
        }
    }
    
    // Draw a sports car
    drawSportsCar(ctx, frameCount) {
        // Draw car body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height * 0.6);
        ctx.lineTo(this.x + this.width * 0.1, this.y + this.height * 0.4);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.95, this.y + this.height * 0.4);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Draw car details
        this.drawCarDetails(ctx, frameCount);
        
        // Draw spoiler
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x + this.width * 0.8, this.y + this.height * 0.25, this.width * 0.15, this.height * 0.05);
        
        // Draw racing stripes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + this.width * 0.3, this.y + this.height * 0.25, this.width * 0.05, this.height * 0.35);
        ctx.fillRect(this.x + this.width * 0.6, this.y + this.height * 0.25, this.width * 0.05, this.height * 0.35);
    }
    
    // Draw the Cybertruck
    drawCybertruck(ctx, frameCount) {
        ctx.save();
        
        // Add metallic effect with gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#a0a0a0');
        gradient.addColorStop(0.5, '#e0e0e0');
        gradient.addColorStop(1, '#b0b0b0');
        
        // Draw the angular body shape
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Bottom line
        ctx.moveTo(this.x, this.y + this.height * 0.7);
        // Front angled edge
        ctx.lineTo(this.x + this.width * 0.15, this.y + this.height * 0.4);
        // Hood line
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.4);
        // Windshield
        ctx.lineTo(this.x + this.width * 0.45, this.y + this.height * 0.25);
        // Roof line
        ctx.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.25);
        // Rear angled edge
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.5);
        // Back to bottom
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Add a subtle stroke to define edges
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw windows with a blue tint
        ctx.fillStyle = 'rgba(120, 200, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.4);
        ctx.lineTo(this.x + this.width * 0.45, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.85, this.y + this.height * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Draw wheels with glow effect
        ctx.fillStyle = '#222';
        
        // Front wheel
        if (this.wheelGlow) {
            ctx.shadowColor = this.neonColor;
            ctx.shadowBlur = 10;
        }
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.25, this.y + this.height * 0.7, this.height * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Rear wheel
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.75, this.y + this.height * 0.7, this.height * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw wheel rims
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.25, this.y + this.height * 0.7, this.height * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.75, this.y + this.height * 0.7, this.height * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw headlights
        if (this.hasNeonLights) {
            ctx.fillStyle = '#fff';
            ctx.shadowColor = this.neonColor;
            ctx.shadowBlur = 15;
        } else {
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
        }
        
        // Front light bar
        ctx.fillRect(this.x + this.width * 0.05, this.y + this.height * 0.35, this.width * 0.2, this.height * 0.05);
        
        // Rear light bar
        ctx.fillRect(this.x + this.width * 0.75, this.y + this.height * 0.35, this.width * 0.2, this.height * 0.05);
        ctx.shadowBlur = 0;
        
        // Draw license plate
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + this.width * 0.4, this.y + this.height * 0.6, this.width * 0.2, this.height * 0.1);
        
        // Add license text
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CYBER', this.x + this.width * 0.5, this.y + this.height * 0.65);
        ctx.fillText('TRUCK', this.x + this.width * 0.5, this.y + this.height * 0.7);
        
        // Add neon underglow if enabled
        if (this.hasNeonLights) {
            ctx.fillStyle = this.neonColor;
            ctx.shadowColor = this.neonColor;
            ctx.shadowBlur = 20;
            ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.1) * 0.1; // Pulsing effect
            ctx.fillRect(this.x + this.width * 0.1, this.y + this.height * 0.9, this.width * 0.8, this.height * 0.05);
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
    
    // Common car details (wheels, windows, lights)
    drawCarDetails(ctx, frameCount) {
        // Derive a darker shade for the cabin
        const cabinColor = this.color.replace('#', '');
        const r = parseInt(cabinColor.substr(0, 2), 16) * 0.7;
        const g = parseInt(cabinColor.substr(2, 2), 16) * 0.7;
        const b = parseInt(cabinColor.substr(4, 2), 16) * 0.7;
        const darkerColor = `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${Math.floor(b).toString(16).padStart(2, '0')}`;
        
        // Draw windows
        ctx.fillStyle = '#aaddff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.25, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.35, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.35);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.35);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.45, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.35);
        ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.35);
        ctx.closePath();
        ctx.fill();
        
        // Draw wheels
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.25, this.y + this.height * 0.7, this.height * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.75, this.y + this.height * 0.7, this.height * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw wheel rims
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.25, this.y + this.height * 0.7, this.height * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.75, this.y + this.height * 0.7, this.height * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw headlights
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x + this.width * 0.05, this.y + this.height * 0.35, this.width * 0.1, this.height * 0.1);
        
        // Draw taillights
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.fillRect(this.x + this.width * 0.85, this.y + this.height * 0.35, this.width * 0.1, this.height * 0.1);
        ctx.shadowBlur = 0;
        
        // Draw license plate
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + this.width * 0.4, this.y + this.height * 0.6, this.width * 0.2, this.height * 0.1);
        
        // Add license text
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CYBER', this.x + this.width * 0.5, this.y + this.height * 0.67);
        
        // Draw door lines
        ctx.strokeStyle = darkerColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.4, this.y + this.height * 0.25);
        ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.6);
        ctx.stroke();
        
        // Draw door handles
        ctx.fillStyle = '#ddd';
        ctx.fillRect(this.x + this.width * 0.35, this.y + this.height * 0.4, this.width * 0.05, this.height * 0.03);
        ctx.fillRect(this.x + this.width * 0.6, this.y + this.height * 0.4, this.width * 0.05, this.height * 0.03);
    }
}

export default Obstacle; 
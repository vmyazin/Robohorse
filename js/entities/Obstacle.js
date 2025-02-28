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
                break;
            case 'box':
                this.width = 40;
                this.height = 40;
                this.color = '#a67c52';
                this.points = 50;
                this.health = 20;
                break;
            default:
                this.width = 50;
                this.height = 50;
                this.color = '#888';
                this.points = 10;
                this.health = 30;
        }
        
        // Position at the bottom of the canvas
        this.y = canvas.height - 50 - this.height;
    }
    
    update() {
        // Currently obstacles don't move on their own
        // This could be extended for moving obstacles
    }
    
    takeDamage(damage) {
        if (this.health !== Infinity) {
            this.health -= damage;
            return this.health <= 0;
        }
        return false;
    }
    
    draw(ctx, frameCount) {
        if (this.type === 'car') {
            // Draw car body
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height * 0.7);
            
            // Draw car top/cabin
            // Derive a darker shade for the cabin
            const cabinColor = this.color.replace('#', '');
            const r = parseInt(cabinColor.substr(0, 2), 16) * 0.7;
            const g = parseInt(cabinColor.substr(2, 2), 16) * 0.7;
            const b = parseInt(cabinColor.substr(4, 2), 16) * 0.7;
            const darkerColor = `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${Math.floor(b).toString(16).padStart(2, '0')}`;
            
            ctx.fillStyle = darkerColor;
            ctx.fillRect(this.x + this.width * 0.3, this.y - this.height * 0.3, this.width * 0.4, this.height * 0.3);
            
            // Draw windows
            ctx.fillStyle = '#aaddff';
            ctx.fillRect(this.x + this.width * 0.32, this.y - this.height * 0.28, this.width * 0.36, this.height * 0.25);
            
            // Draw wheels
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.2, this.y + this.height * 0.7, this.height * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.8, this.y + this.height * 0.7, this.height * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw wheel rims
            ctx.fillStyle = '#999';
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.2, this.y + this.height * 0.7, this.height * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.8, this.y + this.height * 0.7, this.height * 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw headlights
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.fillRect(this.x, this.y + this.height * 0.2, 8, 15);
            ctx.fillRect(this.x + this.width - 8, this.y + this.height * 0.2, 8, 15);
            ctx.shadowBlur = 0;
            
            // Draw license plate
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + this.width * 0.4, this.y + this.height * 0.6, this.width * 0.2, this.height * 0.1);
            
            // Add license text
            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CYBER', this.x + this.width * 0.5, this.y + this.height * 0.67);
            
        } else if (this.type === 'box') {
            // Draw cardboard box
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw box flaps
            ctx.fillStyle = '#8c6239';
            
            // Top flaps
            const flapHeight = 10;
            const flapWidth = this.width / 2 - 2;
            
            // Left flap
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + flapWidth, this.y);
            ctx.lineTo(this.x + flapWidth, this.y - flapHeight);
            ctx.lineTo(this.x, this.y - flapHeight * 0.7);
            ctx.closePath();
            ctx.fill();
            
            // Right flap
            ctx.beginPath();
            ctx.moveTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width - flapWidth, this.y);
            ctx.lineTo(this.x + this.width - flapWidth, this.y - flapHeight);
            ctx.lineTo(this.x + this.width, this.y - flapHeight * 0.7);
            ctx.closePath();
            ctx.fill();
            
            // Draw box seams
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            
            // Vertical seams
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height);
            ctx.stroke();
            
            // Horizontal seams
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width, this.y + this.height / 2);
            ctx.stroke();
            
        } else {
            // Generic obstacle
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Draw health bar for destructible obstacles
        if (this.health !== Infinity && this.health < this.points) {
            const healthPercentage = this.health / this.points;
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
}

export default Obstacle; 
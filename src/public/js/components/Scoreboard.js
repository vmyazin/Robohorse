// src/public/js/components/Scoreboard.js
// Scoreboard component with mock data for UI testing

class Scoreboard {
    constructor(canvas, x, y) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.y = y;
        this.width = 350; // Increased width
        this.height = 240; // Increased height
        this.padding = {
            left: 15,
            right: 30, // Added more padding on the right
            top: 15,
            bottom: 15
        };
        
        // Mock data with 6-character names
        this.scores = [
            { name: "VORTEX", score: 25000 },
            { name: "CYBRX", score: 21500 },
            { name: "NEOX", score: 18750 },
            { name: "GLITCH", score: 15200 },
            { name: "PULSE", score: 12800 }
        ];
    }

    draw() {
        const ctx = this.ctx;
        
        // Border
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Title
        ctx.font = 'bold 24px "Press Start 2P", monospace';
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.fillText('TOP SCORES', this.x + this.padding.left, this.y + 45);
        
        // Scores
        ctx.font = '18px "Press Start 2P", monospace'; // Increased font size
        this.scores.forEach((score, index) => {
            const yPos = this.y + 90 + (index * 30); // Increased spacing
            
            // Rank
            ctx.fillStyle = '#00FF00'; // Neon green
            ctx.fillText(`${index + 1}.`, this.x + this.padding.left, yPos);
            
            // Name
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(score.name, this.x + 50, yPos);
            
            // Score
            ctx.fillStyle = '#00FFFF'; // Cyan
            const scoreText = score.score.toString().padStart(6, '0');
            ctx.fillText(scoreText, this.x + this.width - this.padding.right - 80, yPos);
        });
    }

    update() {
        // In the future, this could update with real-time scores
        // For now, it's static mock data
    }
}

export default Scoreboard; 
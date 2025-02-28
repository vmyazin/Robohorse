class Background {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    
    draw(frameCount) {
        const ctx = this.ctx;
        
        // Create a dark night sky gradient with neon hues
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0c0121'); // Dark purple sky
        gradient.addColorStop(0.5, '#1a0a35'); 
        gradient.addColorStop(1, '#0d1e38'); // Dark blue horizon
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw distant stars/lights - increase number for larger canvas
        for (let i = 0; i < 150; i++) {
            const x = (i * 23 + frameCount * 0.01) % this.canvas.width;
            const y = (i * 17) % (this.canvas.height * 0.5);
            const size = (Math.sin(frameCount * 0.005 + i) + 1) * 1.5;
            
            // Different light colors
            const colors = ['#fff', '#0ff', '#f0f', '#ff0', '#f77'];
            const colorIndex = i % colors.length;
            
            ctx.fillStyle = colors[colorIndex];
            ctx.shadowColor = colors[colorIndex];
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Shinjuku Cityscape - Far background buildings (parallax effect)
        const farBuildingColors = ['#090918', '#0d0d2b', '#09132b'];
        const farBuildingCount = 20;
        const farBuildingWidth = this.canvas.width / farBuildingCount;
        
        for (let i = 0; i < farBuildingCount; i++) {
            const offsetX = (i * farBuildingWidth - (frameCount * 0.1) % farBuildingWidth);
            const buildingHeight = 60 + Math.sin(i) * 30;
            const colorIndex = i % farBuildingColors.length;
            
            ctx.fillStyle = farBuildingColors[colorIndex];
            ctx.beginPath();
            ctx.rect(offsetX, this.canvas.height - 50 - buildingHeight, farBuildingWidth, buildingHeight);
            ctx.fill();
            
            // Add some small windows
            ctx.fillStyle = 'rgba(255, 255, 150, 0.3)';
            for (let w = 0; w < 10; w++) {
                const windowX = offsetX + Math.random() * farBuildingWidth;
                const windowY = this.canvas.height - 50 - Math.random() * buildingHeight;
                const windowSize = 1 + Math.random();
                
                ctx.beginPath();
                ctx.rect(windowX, windowY, windowSize, windowSize);
                ctx.fill();
            }
        }
        
        // Shinjuku Cityscape - Mid buildings (parallax effect)
        const midBuildingColors = ['#131339', '#16083a', '#080a20'];
        const midBuildingCount = 15;
        const midBuildingWidth = this.canvas.width / midBuildingCount * 1.5;
        
        for (let i = 0; i < midBuildingCount; i++) {
            const offsetX = (i * midBuildingWidth - (frameCount * 0.3) % (midBuildingWidth * midBuildingCount));
            const buildingHeight = 100 + Math.sin(i * 0.8) * 40;
            const buildingWidth = midBuildingWidth - 10;
            const colorIndex = i % midBuildingColors.length;
            
            ctx.fillStyle = midBuildingColors[colorIndex];
            ctx.beginPath();
            // Building with slight random shape at top
            ctx.moveTo(offsetX, this.canvas.height - 50);
            ctx.lineTo(offsetX, this.canvas.height - 50 - buildingHeight);
            
            // Create building top with antenna or shape
            if (i % 3 === 0) {
                // Building with antenna
                ctx.lineTo(offsetX + buildingWidth/2 - 10, this.canvas.height - 50 - buildingHeight);
                ctx.lineTo(offsetX + buildingWidth/2, this.canvas.height - 50 - buildingHeight - 20);
                ctx.lineTo(offsetX + buildingWidth/2 + 10, this.canvas.height - 50 - buildingHeight);
            } else {
                // Regular building top
                ctx.lineTo(offsetX + buildingWidth, this.canvas.height - 50 - buildingHeight);
            }
            
            ctx.lineTo(offsetX + buildingWidth, this.canvas.height - 50);
            ctx.closePath();
            ctx.fill();
            
            // Add building details - windows in grid pattern
            const windowRows = 10;
            const windowCols = 5;
            const windowSpacingX = buildingWidth / (windowCols + 1);
            const windowSpacingY = buildingHeight / (windowRows + 1);
            
            for (let row = 1; row <= windowRows; row++) {
                for (let col = 1; col <= windowCols; col++) {
                    // Randomly light up windows
                    if (Math.random() > 0.3) {
                        const windowX = offsetX + col * windowSpacingX;
                        const windowY = this.canvas.height - 50 - row * windowSpacingY;
                        const windowWidth = 4;
                        const windowHeight = 6;
                        
                        // Randomize window colors
                        const windowColors = ['rgba(255, 255, 150, 0.7)', 'rgba(150, 255, 255, 0.7)', 'rgba(255, 150, 255, 0.7)'];
                        const windowColor = windowColors[Math.floor(Math.random() * windowColors.length)];
                        
                        ctx.fillStyle = windowColor;
                        ctx.shadowColor = windowColor;
                        ctx.shadowBlur = 3;
                        ctx.beginPath();
                        ctx.rect(windowX, windowY, windowWidth, windowHeight);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }
        
        // Shinjuku Cityscape - Foreground detailed buildings
        const buildingCount = 8;
        const buildingWidth = this.canvas.width / buildingCount * 1.5;
        
        for (let i = 0; i < buildingCount; i++) {
            const offsetX = (i * buildingWidth - (frameCount * 0.5) % (buildingWidth * buildingCount));
            const buildingHeight = 150 + Math.sin(i * 0.5) * 40;
            const actualWidth = buildingWidth - 20;
            
            // Create building silhouette
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.rect(offsetX, this.canvas.height - 50 - buildingHeight, actualWidth, buildingHeight);
            ctx.fill();
            
            // Add neon sign outlines to buildings
            if (i % 2 === 0) {
                // Draw neon sign
                const signWidth = actualWidth * 0.7;
                const signHeight = 30;
                const signX = offsetX + (actualWidth - signWidth) / 2;
                const signY = this.canvas.height - 50 - buildingHeight * 0.7;
                
                const neonColors = ['#f00', '#0ff', '#f0f', '#ff0', '#0f0'];
                const neonColor = neonColors[i % neonColors.length];
                
                // Neon sign glow effect
                ctx.shadowColor = neonColor;
                ctx.shadowBlur = 15;
                ctx.strokeStyle = neonColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(signX, signY, signWidth, signHeight);
                
                // Add some kanji-like characters (simplified representation)
                ctx.font = '20px Arial';
                ctx.fillStyle = neonColor;
                ctx.textAlign = 'center';
                ctx.fillText('東京', signX + signWidth/2, signY + signHeight * 0.7);
                ctx.shadowBlur = 0;
            }
            
            // Add detailed windows
            const windowRows = 15;
            const windowCols = Math.floor(actualWidth / 10);
            
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    // Randomly light up windows
                    if (Math.random() > 0.4) {
                        const windowX = offsetX + col * 10 + 2;
                        const windowY = this.canvas.height - 50 - buildingHeight + row * 10 + 2;
                        const windowSize = 6;
                        
                        // Randomize window colors
                        const windowColors = ['rgba(255, 255, 150, 0.8)', 'rgba(150, 255, 255, 0.8)', 'rgba(255, 150, 255, 0.8)'];
                        const windowColor = windowColors[Math.floor(Math.random() * windowColors.length)];
                        
                        ctx.fillStyle = windowColor;
                        ctx.beginPath();
                        ctx.rect(windowX, windowY, windowSize, windowSize);
                        ctx.fill();
                    }
                }
            }
            
            // Add rooftop features
            if (i % 3 === 0) {
                // Add antenna/tower on top
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(offsetX + actualWidth/2, this.canvas.height - 50 - buildingHeight);
                ctx.lineTo(offsetX + actualWidth/2, this.canvas.height - 50 - buildingHeight - 30);
                ctx.stroke();
                
                // Add blinking light on top
                if (frameCount % 30 < 15) {
                    ctx.fillStyle = '#f00';
                    ctx.shadowColor = '#f00';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.arc(offsetX + actualWidth/2, this.canvas.height - 50 - buildingHeight - 30, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        }
        
        // Billboard with digital display
        const billboardWidth = 120;
        const billboardHeight = 70;
        const billboardX = 100 + (frameCount * 0.5) % (this.canvas.width * 2);
        const billboardY = this.canvas.height - 50 - 180;
        
        // Billboard frame
        ctx.fillStyle = '#111';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        ctx.fillRect(billboardX, billboardY, billboardWidth, billboardHeight);
        ctx.strokeRect(billboardX, billboardY, billboardWidth, billboardHeight);
        
        // Digital display content - changing with time
        ctx.fillStyle = '#0af';
        ctx.shadowColor = '#0af';
        ctx.shadowBlur = 10;
        
        // Display flashing ad content
        if (frameCount % 120 < 60) {
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CYBER', billboardX + billboardWidth/2, billboardY + 30);
            ctx.fillText('TOKYO', billboardX + billboardWidth/2, billboardY + 55);
        } else {
            // Draw an abstract logo or pattern
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(
                    billboardX + billboardWidth/2, 
                    billboardY + billboardHeight/2,
                    10 + i * 5, 
                    0, Math.PI * 2
                );
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;
        
        // Add flying cars/drones in the distance
        for (let i = 0; i < 5; i++) {
            const carX = (i * 150 + frameCount * 2) % (this.canvas.width + 300) - 100;
            const carY = 100 + i * 30;
            const carSize = 4 + i;
            
            // Car body
            ctx.fillStyle = '#222';
            ctx.fillRect(carX, carY, carSize * 3, carSize);
            
            // Lights
            ctx.fillStyle = '#f00';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(carX + carSize * 3, carY + carSize/2, carSize/3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff0';
            ctx.shadowColor = '#ff0';
            ctx.beginPath();
            ctx.arc(carX, carY + carSize/2, carSize/3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Ground with techno pattern
        const groundGradient = ctx.createLinearGradient(0, this.canvas.height - 50, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#0a0a20');
        groundGradient.addColorStop(1, '#000000');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Add reflective ground effect
        ctx.globalAlpha = 0.2;
        ctx.translate(0, this.canvas.height - 50);
        ctx.scale(1, -0.3);
        // Draw a section of the world flipped and squished
        ctx.drawImage(
            this.canvas, 
            0, this.canvas.height - 150, this.canvas.width, 100,  // source rectangle
            0, -100, this.canvas.width, 100                  // destination rectangle
        );
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.globalAlpha = 1.0;
        
        // Add neon strips on the ground
        ctx.strokeStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        
        for (let x = 0; x < this.canvas.width; x += 150) {
            const offsetX = (x + frameCount) % this.canvas.width;
            
            ctx.beginPath();
            ctx.moveTo(offsetX, this.canvas.height - 48);
            ctx.lineTo(offsetX + 80, this.canvas.height - 48);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        
        // Add occasional vertical light beams
        if (frameCount % 100 < 50 && Math.random() > 0.98) {
            const beamX = Math.random() * this.canvas.width;
            ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
            ctx.beginPath();
            ctx.moveTo(beamX - 20, 0);
            ctx.lineTo(beamX + 20, 0);
            ctx.lineTo(beamX + 5, this.canvas.height - 50);
            ctx.lineTo(beamX - 5, this.canvas.height - 50);
            ctx.closePath();
            ctx.fill();
        }
    }
}

export default Background; 
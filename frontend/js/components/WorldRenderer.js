import { drawPickupNotice } from './PickupNotice.js';

export function renderWorld(game) {
        // Clear canvas
        game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
        
        // Draw background
        game.background.draw(game.ctx, game.frameCount);
        
        game.ctx.save();
        if (game.boss?.shakeTicks > 0) {
            const strength = game.boss.shakeTicks / 36;
            game.ctx.translate(Math.sin(game.boss.tick * 2.4) * 7 * strength,
                Math.cos(game.boss.tick * 1.9) * 10 * strength);
        }
        // Draw platforms - use simple for loop instead of filter for better performance
        for (let i = 0; i < game.platforms.length; i++) {
            const platform = game.platforms[i];
            
            // Skip platforms that are not visible
            if (platform.x + platform.width <= 0 || platform.x >= game.canvas.width) continue;
            
            if (platform.type === 'ground') {
                // Draw ground with texture
                const gradient = game.ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
                gradient.addColorStop(0, '#555');
                gradient.addColorStop(1, '#333');
                game.ctx.fillStyle = gradient;
                game.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Add texture lines to ground - optimize by drawing fewer lines
                game.ctx.strokeStyle = '#444';
                game.ctx.lineWidth = 1;
                for (let i = 0; i < platform.width; i += 40) { // Increased spacing from 20 to 40
                    game.ctx.beginPath();
                    game.ctx.moveTo(platform.x + i, platform.y);
                    game.ctx.lineTo(platform.x + i, platform.y + platform.height);
                    game.ctx.stroke();
                }
            } else if (platform.type === 'shelf') {
                // Draw concrete shelf with a slight 3D effect
                game.ctx.fillStyle = '#777';
                game.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Add highlight on top
                game.ctx.fillStyle = '#999';
                game.ctx.fillRect(platform.x, platform.y, platform.width, 3);
                
                // Add shadow at bottom
                game.ctx.fillStyle = '#555';
                game.ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
            } else if (platform.type === 'pillar') {
                // Draw concrete pillar
                const gradient = game.ctx.createLinearGradient(platform.x, 0, platform.x + platform.width, 0);
                gradient.addColorStop(0, '#666');
                gradient.addColorStop(0.5, '#888');
                gradient.addColorStop(1, '#666');
                game.ctx.fillStyle = gradient;
                game.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Add horizontal lines for texture - optimize by drawing fewer lines
                game.ctx.strokeStyle = '#777';
                game.ctx.lineWidth = 1;
                for (let i = 0; i < platform.height; i += 30) { // Increased spacing from 15 to 30
                    game.ctx.beginPath();
                    game.ctx.moveTo(platform.x, platform.y + i);
                    game.ctx.lineTo(platform.x + platform.width, platform.y + i);
                    game.ctx.stroke();
                }
            }
        }
        
        // Draw obstacles - use simple for loop instead of filter for better performance
        for (let i = 0; i < game.obstacles.length; i++) {
            const obstacle = game.obstacles[i];
            
            // Skip obstacles that are not visible
            if (obstacle.x + obstacle.width <= 0 || obstacle.x >= game.canvas.width) continue;
            
            obstacle.draw(game.ctx, game.frameCount);
        }
        
        // Draw power-ups
        for (let i = 0; i < game.powerUps.length; i++) {
            const powerUp = game.powerUps[i];
            
            // Draw power-up base
            game.ctx.fillStyle = powerUp.color;
                game.ctx.beginPath();
            game.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2, 0, Math.PI * 2);
                game.ctx.fill();
                
            // Draw power-up icon
            game.ctx.fillStyle = '#fff';
            if (powerUp.type === 'health') {
                // Draw plus sign
                game.ctx.fillRect(powerUp.x + powerUp.width/2 - 2, powerUp.y + powerUp.height/4, 4, powerUp.height/2);
                game.ctx.fillRect(powerUp.x + powerUp.width/4, powerUp.y + powerUp.height/2 - 2, powerUp.width/2, 4);
            } else if (powerUp.type === 'weapon') {
                // Draw star
                const centerX = powerUp.x + powerUp.width/2;
                const centerY = powerUp.y + powerUp.height/2;
                const spikes = 5;
                const outerRadius = powerUp.width/2 - 2;
                const innerRadius = powerUp.width/4;
                
                game.ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI/2;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        game.ctx.moveTo(x, y);
                    } else {
                        game.ctx.lineTo(x, y);
                    }
                }
                game.ctx.closePath();
                game.ctx.fill();
            } else if (powerUp.type === 'mushroom') {
                // Draw mushroom cap
                game.ctx.fillStyle = '#ff0000';
                game.ctx.beginPath();
                game.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 - 2, powerUp.width/2 - 2, 0, Math.PI, true);
                game.ctx.fill();
                
                // Draw mushroom stem
                game.ctx.fillStyle = '#ffffff';
                game.ctx.fillRect(powerUp.x + powerUp.width/2 - 3, powerUp.y + powerUp.height/2 - 2, 6, powerUp.height/2);
                
                // Draw spots
                game.ctx.fillStyle = '#ffffff';
                game.ctx.beginPath();
                game.ctx.arc(powerUp.x + powerUp.width/2 - 5, powerUp.y + powerUp.height/2 - 5, 2, 0, Math.PI * 2);
                game.ctx.arc(powerUp.x + powerUp.width/2 + 3, powerUp.y + powerUp.height/2 - 7, 2, 0, Math.PI * 2);
                game.ctx.fill();
            }
            
            // Draw glow effect
            game.ctx.shadowColor = powerUp.color;
            game.ctx.shadowBlur = 10;
                game.ctx.beginPath();
            game.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2 + 2, 0, Math.PI * 2);
            game.ctx.stroke();
            game.ctx.shadowBlur = 0;
        }
        
        // Draw special tokens
        for (let i = 0; i < game.specialTokens.length; i++) {
            const token = game.specialTokens[i];
            
            // Draw token base
            game.ctx.fillStyle = token.color;
            game.ctx.beginPath();
            game.ctx.arc(token.x + token.width/2, token.y + token.height/2, token.width/2, 0, Math.PI * 2);
            game.ctx.fill();
            
            // Draw token icon (galloping horse silhouette)
            game.ctx.fillStyle = '#000';
            game.ctx.beginPath();
            game.ctx.arc(token.x + token.width/2, token.y + token.height/2, token.width/4, 0, Math.PI * 2);
            game.ctx.fill();
            
            // Draw glow effect
            game.ctx.shadowColor = token.color;
            game.ctx.shadowBlur = 10;
            game.ctx.beginPath();
            game.ctx.arc(token.x + token.width/2, token.y + token.height/2, token.width/2 + 2, 0, Math.PI * 2);
            game.ctx.stroke();
            game.ctx.shadowBlur = 0;
        }
        
        if (game.battleEnding?.outcome !== 'victory' || game.battleEnding.tick < 80 && Math.floor(game.battleEnding.tick / 5) % 2 === 0) game.boss?.draw(game.ctx, false);

        // Draw player
        if (game.battleEnding?.outcome !== 'defeat' || game.battleEnding.tick < 60 && Math.floor(game.battleEnding.tick / 5) % 2 === 0) game.player.draw(game.ctx, game.frameCount, game.inputManager.keys);
        
        if (game.player.webSlowTicks > 0) {
            const { x, y, width, height, webSlowTicks } = game.player;
            const ctx = game.ctx;
            const cx = x + width * 0.5, cy = y + height * 0.48;
            const spokes = 10;
            const point = (i, radius) => {
                const angle = i * Math.PI * 2 / spokes;
                return { x: cx + Math.cos(angle) * width * 0.56 * radius,
                    y: cy + Math.sin(angle) * height * 0.57 * radius };
            };
            ctx.save();
            ctx.globalAlpha = Math.min(1, webSlowTicks / 20);
            ctx.strokeStyle = 'rgba(223,249,255,.88)';
            ctx.lineWidth = 1.2;
            // Radial strands and bowed silk rings form a net around the moving horse.
            for (let i = 0; i < spokes; i++) {
                const tip = point(i, 1);
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tip.x, tip.y); ctx.stroke();
            }
            for (const radius of [0.3, 0.55, 0.8, 1]) {
                const start = point(0, radius);
                ctx.beginPath(); ctx.moveTo(start.x, start.y);
                for (let i = 0; i < spokes; i++) {
                    const from = point(i, radius), to = point(i + 1, radius);
                    ctx.quadraticCurveTo(cx + ((from.x + to.x) / 2 - cx) * 0.84,
                        cy + ((from.y + to.y) / 2 - cy) * 0.84, to.x, to.y);
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        // Draw enemies - use simple for loop instead of filter for better performance
        for (let i = 0; i < game.enemies.length; i++) {
            const enemy = game.enemies[i];
            
            // Skip enemies that are not visible
            if (enemy.x + enemy.width <= 0 || enemy.x >= game.canvas.width) continue;
            
            enemy.draw(game.ctx, game.frameCount, game.player);
        }
        
        // Draw projectiles - use simple for loop instead of filter for better performance
        for (let i = 0; i < game.projectiles.length; i++) {
            const proj = game.projectiles[i];
            
            // Skip projectiles that are not visible
            if (proj.x + proj.width <= 0 || proj.x >= game.canvas.width || 
                proj.y + proj.height <= 0 || proj.y >= game.canvas.height) continue;
            
            // Draw projectile
            game.ctx.fillStyle = proj.color;
            
            if (proj.isGlowing) {
                // Add glow effect for glowing projectiles
                game.ctx.shadowColor = proj.color;
                game.ctx.shadowBlur = 10;
            }
            
            game.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
            
            // Reset shadow
            if (proj.isGlowing) {
                game.ctx.shadowBlur = 0;
            }
        }
        
        // Draw particles - use simple for loop instead of filter for better performance
        // Limit the number of particles drawn to improve performance
        const maxParticlesToDraw = 50; // Reduced from 100 to 50
        let particlesDrawn = 0;
        
        for (let i = 0; i < game.particles.length && particlesDrawn < maxParticlesToDraw; i++) {
            const particle = game.particles[i];
            
            // Skip particles that are not visible
            if (particle.x <= 0 || particle.x >= game.canvas.width || 
                particle.y <= 0 || particle.y >= game.canvas.height) continue;
            
            game.ctx.fillStyle = particle.color;
            game.ctx.beginPath();
            game.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            game.ctx.fill();
            
            particlesDrawn++;
        }
        
        game.ctx.restore();
        if (!game.battleEnding) game.boss?.drawHUD(game.ctx);

        // Draw UI elements
        game.drawUI();
        
        // Draw effects
        game.effectsManager.draw(game.ctx);
        drawPickupNotice(game);
    }
    

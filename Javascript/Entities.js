import { ctx, canvas, world, buildings } from './Globals.js';

// Helper for collision
function checkCircleRectCollision(circle, rect) {
    // Find closest point on rect to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Calculate distance
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared < (circle.radius * circle.radius);
}

// Helper to resolve collision (simple push back)
function resolveCollision(entity, rect) {
    // Find closest point on rect to entity center
    const closestX = Math.max(rect.x, Math.min(entity.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(entity.y, rect.y + rect.height));

    const dx = entity.x - closestX;
    const dy = entity.y - closestY;
    
    // If center is inside rect, push out to nearest edge
    if (dx === 0 && dy === 0) {
        // This is rare but possible if spawned inside. Push up.
        entity.y = rect.y - entity.radius;
        return;
    }

    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < entity.radius) {
        // Overlap amount
        const overlap = entity.radius - distance;
        
        // Normalize vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Push entity out
        entity.x += nx * overlap;
        entity.y += ny * overlap;
    }
}

// --- Line Intersection Helpers for AI ---
function checkLineRectCollision(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Check intersection with all 4 sides
    if (getLineIntersection(x1, y1, x2, y2, rx, ry, rx + rw, ry)) return true; // Top
    if (getLineIntersection(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh)) return true; // Bottom
    if (getLineIntersection(x1, y1, x2, y2, rx, ry, rx, ry + rh)) return true; // Left
    if (getLineIntersection(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh)) return true; // Right
    return false;
}

function getLineIntersection(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
    let s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    let s, t;
    let denom = -s2_x * s1_y + s1_x * s2_y;
    
    if (denom === 0) return false; // Collinear

    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / denom;
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / denom;

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        return true; // Collision detected
    }
    return false; // No collision
}

export class ShotEffect {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.life = 3; // Very short life (3 frames)
        this.maxLife = 3;
    }

    update() {
        this.life--;
        this.draw();
    }

    draw() {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        const scale = 2; // Pixel scale
        
        // Pixel Muzzle Flash
        ctx.fillStyle = '#FFFF00'; // Yellow
        
        // Core
        ctx.fillRect(0, -2 * scale, 4 * scale, 4 * scale);
        
        // Spikes (Randomized slightly for flicker effect if we wanted, but static is fine for 3 frames)
        ctx.fillRect(4 * scale, -4 * scale, 4 * scale, 2 * scale); // Top spike
        ctx.fillRect(4 * scale, 2 * scale, 4 * scale, 2 * scale);  // Bottom spike
        ctx.fillRect(4 * scale, -1 * scale, 6 * scale, 2 * scale); // Middle long spike
        
        // Outer particles
        ctx.fillStyle = '#FFFFFF'; // White hot center
        ctx.fillRect(0, -1 * scale, 3 * scale, 2 * scale);

        ctx.restore();
    }
}

export class HitEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 8;
        this.radius = 2;
    }

    update() {
        this.life--;
        this.radius += 2; // Expand
        this.draw();
    }

    draw() {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 2;
        
        // Pixel Explosion / Impact
        // Draw a ring of pixels
        ctx.fillStyle = 'white';
        
        // Calculate pixel positions for a rough circle/square ring
        const r = Math.floor(this.radius);
        
        // Top/Bottom
        ctx.fillRect(-r * scale, -r * scale, (r * 2) * scale, 2 * scale); // Top
        ctx.fillRect(-r * scale, r * scale, (r * 2) * scale, 2 * scale);  // Bottom
        // Left/Right
        ctx.fillRect(-r * scale, -r * scale, 2 * scale, (r * 2) * scale); // Left
        ctx.fillRect(r * scale, -r * scale, 2 * scale, (r * 2 + 2) * scale);  // Right
        
        // Inner debris
        if (this.life > 4) {
            ctx.fillStyle = this.color;
            ctx.fillRect(-2 * scale, -2 * scale, 4 * scale, 4 * scale);
        }
        
        ctx.restore();
    }
}

export class Building {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.details = [];
        this.generateDetails();
    }

    generateDetails() {
        const pixelSize = 4;
        const numDetails = Math.floor(Math.random() * 5) + 1;
        for (let j = 0; j < numDetails; j++) {
            const dw = (Math.floor(Math.random() * 5) + 2) * pixelSize * 2;
            const dh = (Math.floor(Math.random() * 5) + 2) * pixelSize * 2;
            const dx = this.x + Math.random() * (this.width - dw);
            const dy = this.y + Math.random() * (this.height - dh);
            this.details.push({ x: dx, y: dy, w: dw, h: dh });
        }
    }

    draw(ctx) {
        const pixelSize = 4;
        
        // Shadow (Optional, usually drawn on BG, but if we redraw on top, we might skip shadow or draw it)
        // Let's skip shadow here to avoid double shadow on top of fog
        
        // Rooftop Base
        ctx.fillStyle = '#3E2723'; // Dark Brown
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Rooftop Border
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = pixelSize;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Rooftop Details
        this.details.forEach(d => {
            ctx.fillStyle = '#616161'; // Grey
            ctx.fillRect(d.x, d.y, d.w, d.h);
            
            // Fan
            ctx.fillStyle = '#212121';
            ctx.fillRect(d.x + pixelSize, d.y + pixelSize, d.w - pixelSize*2, d.h - pixelSize*2);
        });
    }
}

export class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = { x: 0, y: 0 };
        this.speed = 2;
        this.maxHealth = 150;
        this.health = 150;
        this.lastDamageTime = 0;
        this.invulnerableTime = 500; // ms
        this.shield = {
            unlocked: false,
            active: false,
            cooldown: 60000, // 60 seconds
            lastBreakTime: 0
        };
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotate towards movement direction
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const angle = Math.atan2(this.velocity.y, this.velocity.x);
            ctx.rotate(angle);
        }

        const scale = 0.8; 

        // --- Top-Down Soldier (Facing Right) ---
        
        // Feet (Simple animation)
        const walkCycle = Math.sin(performance.now() / 100) * 5;
        
        ctx.fillStyle = '#111'; // Boots
        ctx.fillRect((-10 + walkCycle) * scale, -15 * scale, 14 * scale, 8 * scale); // Left Foot (Top)
        ctx.fillRect((-10 - walkCycle) * scale, 7 * scale, 14 * scale, 8 * scale); // Right Foot (Bottom)

        // Body (Shoulders/Vest)
        ctx.fillStyle = '#1A237E'; // Blue Vest
        ctx.fillRect(-15 * scale, -15 * scale, 30 * scale, 30 * scale); // Main body
        
        // Backpack
        ctx.fillStyle = '#3E2723'; // Brown
        ctx.fillRect(-20 * scale, -12 * scale, 8 * scale, 24 * scale);

        // Head (Helmet)
        ctx.fillStyle = '#33691E'; // Green Helmet
        ctx.beginPath();
        ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet details (Camo)
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(-2 * scale, -2 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Arms & Gun
        // Hands holding gun
        ctx.fillStyle = '#3E2723'; // Gloves
        ctx.fillRect(10 * scale, 8 * scale, 10 * scale, 8 * scale); // Right hand (Trigger)
        ctx.fillRect(25 * scale, -2 * scale, 8 * scale, 8 * scale); // Left hand (Barrel)

        // Gun (Rifle)
        ctx.fillStyle = '#212121'; // Gun Metal
        ctx.fillRect(15 * scale, 2 * scale, 40 * scale, 6 * scale); // Barrel/Body
        ctx.fillStyle = '#3E2723'; // Wood Stock
        ctx.fillRect(0 * scale, 2 * scale, 15 * scale, 6 * scale); 
        ctx.fillStyle = '#000'; // Mag
        ctx.fillRect(25 * scale, 8 * scale, 6 * scale, 10 * scale);

        ctx.restore();
        
        // Health bar above player
        const barWidth = 40;
        const barHeight = 5;
        const yOffset = 40; 
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barWidth / 2, this.y - yOffset, barWidth, barHeight);
        
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#00ff00'; // Bright green
        ctx.fillRect(this.x - barWidth / 2, this.y - yOffset, barWidth * healthPercent, barHeight);

        // Flash if invulnerable
        if (performance.now() - this.lastDamageTime < this.invulnerableTime) {
             ctx.strokeStyle = 'red';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
             ctx.stroke();
        }

        // Draw Shield (Pixel Art Style)
        if (this.shield.active) {
            ctx.save();
            ctx.translate(this.x, this.y); 
            const shieldRadius = this.radius + 12;
            const pixelSize = 4;
            const numSegments = 12; 
            const angleStep = (Math.PI * 2) / numSegments;
            
            const rotation = performance.now() / 500; 
            
            ctx.fillStyle = '#00E5FF'; 
            
            for(let i=0; i<numSegments; i++) {
                const angle = i * angleStep + rotation;
                const sx = Math.cos(angle) * shieldRadius;
                const sy = Math.sin(angle) * shieldRadius;
                
                ctx.fillRect(sx - pixelSize/2, sy - pixelSize/2, pixelSize, pixelSize);
            }
            
            // Inner Ring (Faint)
            ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
            for(let i=0; i<numSegments; i++) {
                const angle = i * angleStep - rotation; // Counter rotate
                const sx = Math.cos(angle) * (shieldRadius - 6);
                const sy = Math.sin(angle) * (shieldRadius - 6);
                ctx.fillRect(sx - 2, sy - 2, 4, 4);
            }

            ctx.restore();
        }
    }

    update(timestamp) {
        this.draw();
        
        // Store previous position
        const prevX = this.x;
        const prevY = this.y;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Building Collision
        buildings.forEach(building => {
            if (checkCircleRectCollision(this, building)) {
                resolveCollision(this, building);
            }
        });

        // Boundary checks
        if (this.x - this.radius < 0) this.x = this.radius;
        if (this.x + this.radius > world.width) this.x = world.width - this.radius;
        if (this.y - this.radius < 0) this.y = this.radius;
        if (this.y + this.radius > world.height) this.y = world.height - this.radius;

        // Shield Regeneration
        if (this.shield.unlocked && !this.shield.active) {
            if (timestamp - this.shield.lastBreakTime > this.shield.cooldown) {
                this.shield.active = true;
            }
        }
    }
}

export class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.tail = [];
    }

    draw() {
        // Draw tail
        this.tail.forEach((pos, index) => {
            const alpha = (index / this.tail.length) * 0.5;
            const size = this.radius * (index / this.tail.length);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        });

        // Draw head with glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        // Add current position to tail
        this.tail.push({x: this.x, y: this.y});
        if (this.tail.length > 8) {
            this.tail.shift();
        }

        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

export class Enemy {
    constructor(x, y, radius, color, velocity, health, type = 'small', scoreValue = 1) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.health = health;
        this.maxHealth = health;
        this.type = type;
        this.scoreValue = scoreValue;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotate towards movement direction
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const angle = Math.atan2(this.velocity.y, this.velocity.x);
            ctx.rotate(angle);
        }

        if (this.type === 'boss') {
            // Giant Skull Top Down
            const scale = 5; 
            ctx.fillStyle = '#FFFFFF'; 
            // Skull Main
            ctx.beginPath();
            ctx.arc(-2 * scale, 0, 8 * scale, 0, Math.PI * 2);
            ctx.fill();
            // Jaw
            ctx.fillRect(2 * scale, -6 * scale, 8 * scale, 12 * scale);
            // Eyes
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(2 * scale, -3 * scale, 2 * scale, 0, Math.PI * 2);
            ctx.arc(2 * scale, 3 * scale, 2 * scale, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'boss_spider') {
            // Giant Spider Top Down
            const scale = 4;
            ctx.fillStyle = '#212121'; // Black Body
            
            // Legs (8)
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 2 * scale;
            for(let i=0; i<8; i++) {
                const legAngle = (i / 8) * Math.PI * 2;
                const lx = Math.cos(legAngle) * 12 * scale;
                const ly = Math.sin(legAngle) * 12 * scale;
                
                // Jointed leg look
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(lx, ly);
                ctx.lineTo(lx + Math.cos(legAngle + 0.5) * 8 * scale, ly + Math.sin(legAngle + 0.5) * 8 * scale);
                ctx.stroke();
            }

            // Abdomen (Rear)
            ctx.beginPath();
            ctx.ellipse(-5 * scale, 0, 8 * scale, 6 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            // Red hourglass/mark
            ctx.fillStyle = '#D50000';
            ctx.beginPath();
            ctx.moveTo(-6 * scale, -2 * scale);
            ctx.lineTo(-4 * scale, 0);
            ctx.lineTo(-6 * scale, 2 * scale);
            ctx.lineTo(-8 * scale, 0);
            ctx.fill();

            // Cephalothorax (Head/Thorax)
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.arc(4 * scale, 0, 5 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Eyes (Many)
            ctx.fillStyle = 'red';
            ctx.beginPath(); ctx.arc(6 * scale, -2 * scale, 1 * scale, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(6 * scale, 2 * scale, 1 * scale, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(7 * scale, -1 * scale, 1 * scale, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(7 * scale, 1 * scale, 1 * scale, 0, Math.PI*2); ctx.fill();

        } else if (this.type === 'boss_mutant') {
            // Mutant Zombie Top Down
            const scale = 4;
            
            // Left Arm (Normal)
            ctx.fillStyle = '#689F38'; // Green
            ctx.fillRect(4 * scale, -8 * scale, 4 * scale, 12 * scale);
            
            // Right Arm (Mutated Giant)
            ctx.fillStyle = '#33691E'; // Dark Green
            ctx.beginPath();
            ctx.ellipse(4 * scale, 8 * scale, 8 * scale, 5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            // Claws/Fist
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(10 * scale, 8 * scale, 4 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = '#424242'; // Tattered Grey Shirt
            ctx.fillRect(-8 * scale, -8 * scale, 16 * scale, 16 * scale);
            
            // Head
            ctx.fillStyle = '#689F38';
            ctx.beginPath();
            ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
            ctx.fill();
            
            // Pustules/Veins
            ctx.fillStyle = '#76FF03'; // Toxic Green
            ctx.beginPath(); ctx.arc(-2 * scale, -2 * scale, 1.5 * scale, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(2 * scale, 3 * scale, 1 * scale, 0, Math.PI*2); ctx.fill();

        } else if (this.type === 'small') {
            // Baby Zombie Top Down
            const scale = 0.8; 
            
            // Arms (Reaching forward)
            ctx.fillStyle = '#8BC34A'; // Green Skin
            ctx.fillRect(5 * scale, -12 * scale, 15 * scale, 6 * scale); // Left Arm
            ctx.fillRect(5 * scale, 6 * scale, 15 * scale, 6 * scale); // Right Arm

            // Shoulders/Body
            ctx.fillStyle = '#0288D1'; // Blue Shirt
            ctx.fillRect(-10 * scale, -10 * scale, 20 * scale, 20 * scale);

            // Head
            ctx.fillStyle = '#8BC34A'; // Green
            ctx.beginPath();
            ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'elite') {
            // Zombie Top Down
            const scale = 1.0;
            
            // Arms
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(5 * scale, -14 * scale, 18 * scale, 7 * scale);
            ctx.fillRect(5 * scale, 7 * scale, 18 * scale, 7 * scale);

            // Body
            ctx.fillStyle = '#5D4037'; // Brown Shirt
            ctx.fillRect(-12 * scale, -12 * scale, 24 * scale, 24 * scale);

            // Head
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(0, 0, 10 * scale, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'big') {
            // Armored Zombie Top Down
            const scale = 1.2;
            
            // Arms (Armored)
            ctx.fillStyle = '#2E7D32'; // Green Skin
            ctx.fillRect(5 * scale, -16 * scale, 20 * scale, 8 * scale);
            ctx.fillRect(5 * scale, 8 * scale, 20 * scale, 8 * scale);
            // Pauldrons
            ctx.fillStyle = '#757575'; // Grey Armor
            ctx.fillRect(-5 * scale, -18 * scale, 12 * scale, 10 * scale);
            ctx.fillRect(-5 * scale, 8 * scale, 12 * scale, 10 * scale);

            // Body (Chestplate)
            ctx.fillStyle = '#9E9E9E';
            ctx.fillRect(-15 * scale, -15 * scale, 30 * scale, 30 * scale);

            // Head (Helmet)
            ctx.fillStyle = '#616161';
            ctx.beginPath();
            ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
            ctx.fill();
            // Red Eyes glow
            ctx.fillStyle = '#D32F2F';
            ctx.fillRect(8 * scale, -4 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(8 * scale, 2 * scale, 2 * scale, 2 * scale);

        } else {
            // Fallback
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
        ctx.restore();
        
        // Health bar above enemy
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 15, this.y - this.radius - 10, 30, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 15, this.y - this.radius - 10, 30 * (this.health / this.maxHealth), 5);
    }

    update(player) {
        this.draw();
        
        // --- Context Steering (Obstacle Avoidance) ---
        const numRays = 8;
        const lookAhead = 80; // Distance to check for obstacles
        let bestDir = { x: 0, y: 0 };
        let maxScore = -Infinity;
        
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        
        // Check 8 directions
        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);
            
            // 1. Interest: Alignment with player direction
            // Dot product logic: cos(angle - angleToPlayer) gives 1.0 if aligned, -1.0 if opposite
            let score = Math.cos(angle - angleToPlayer);
            
            // 2. Danger: Check collision with buildings
            const endX = this.x + dirX * lookAhead;
            const endY = this.y + dirY * lookAhead;
            
            let hit = false;
            // Optimization: Only check nearby buildings
            for (const building of buildings) {
                // Simple bounding box check first
                if (Math.abs(building.x + building.width/2 - this.x) > 200 || 
                    Math.abs(building.y + building.height/2 - this.y) > 200) continue;
                
                if (checkLineRectCollision(this.x, this.y, endX, endY, building.x, building.y, building.width, building.height)) {
                    hit = true;
                    break;
                }
            }
            
            if (hit) {
                score -= 5.0; // Heavy penalty for blocked directions
            }
            
            if (score > maxScore) {
                maxScore = score;
                bestDir = { x: dirX, y: dirY };
            }
        }
        
        // Apply velocity based on best direction
        // Base speed
        let speed = 0.8; // Default speed
        if (this.type === 'boss') speed = 0.6;
        if (this.type === 'small') speed = 1.0;
        if (this.type === 'big') speed = 0.5;

        this.velocity.x = bestDir.x * speed;
        this.velocity.y = bestDir.y * speed;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Building Collision (Hard resolve)
        buildings.forEach(building => {
            if (checkCircleRectCollision(this, building)) {
                resolveCollision(this, building);
            }
        });
    }
}

export class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= 0.99; // Friction
        this.velocity.y *= 0.99;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

export class Sawblade {
    constructor(player, angleOffset, radius = 100) {
        this.player = player;
        this.angle = angleOffset;
        this.orbitRadius = radius;
        this.radius = 20; // Size of the saw
        this.speed = 0.02; // Rotation speed
    }

    update() {
        this.angle += this.speed;
        this.x = this.player.x + Math.cos(this.angle) * this.orbitRadius;
        this.y = this.player.y + Math.sin(this.angle) * this.orbitRadius;
        this.draw();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * 5); // Spin the blade itself faster
        
        // Draw Sawblade (Pixel art style procedural)
        ctx.fillStyle = '#C0C0C0'; // Silver
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Center hole
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#808080';
        for(let i=0; i<8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(this.radius, 0);
            ctx.lineTo(this.radius + 8, 4);
            ctx.lineTo(this.radius, 8);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

export class Spear {
    constructor(player, angleOffset) {
        this.player = player;
        this.angle = angleOffset;
        this.orbitRadius = 80; // Distance from player
        this.length = 60;
        this.speed = 0.02; // Rotation speed
        this.active = true;
    }

    update() {
        this.angle += this.speed;
        
        // Calculate position: Orbiting player
        this.x = this.player.x + Math.cos(this.angle) * this.orbitRadius;
        this.y = this.player.y + Math.sin(this.angle) * this.orbitRadius;

        this.draw();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); // Point outwards
        
        const scale = 2;

        // Pixel Spear
        // Shaft
        ctx.fillStyle = '#8D6E63'; // Wood Brown
        ctx.fillRect(0, -1 * scale, this.length, 2 * scale);
        
        // Grip/Handle details
        ctx.fillStyle = '#5D4037'; // Darker Brown
        ctx.fillRect(5 * scale, -1.5 * scale, 10 * scale, 3 * scale);

        // Spear Head (Pixelated)
        ctx.fillStyle = '#CFD8DC'; // Silver
        // Base
        ctx.fillRect(this.length, -2 * scale, 2 * scale, 4 * scale);
        ctx.fillRect(this.length + 2 * scale, -2 * scale, 2 * scale, 4 * scale);
        // Mid
        ctx.fillRect(this.length + 4 * scale, -1.5 * scale, 2 * scale, 3 * scale);
        ctx.fillRect(this.length + 6 * scale, -1 * scale, 2 * scale, 2 * scale);
        // Tip
        ctx.fillRect(this.length + 8 * scale, -0.5 * scale, 2 * scale, 1 * scale);
        
        // Shine
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.length + 2 * scale, -1 * scale, 4 * scale, 1 * scale);

        ctx.restore();
    }
}

export class Pet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.lastBombTime = 0;
        this.level = 1;
        this.setNextDropTime();
        this.followSpeed = 0.05; // Lerp factor
    }

    setNextDropTime() {
        // Random interval between 5000ms (5s) and 8000ms (8s)
        this.currentInterval = 5000 + Math.random() * 3000;
    }

    levelUp() {
        this.level++;
    }

    update(player, timestamp, bombs, enemies) {
        // Find nearest enemy
        let target = null;
        let minDist = Infinity;

        if (enemies) {
            enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < minDist && dist <= 300) { // Range limit 300px
                    minDist = dist;
                    target = enemy;
                }
            });
        }

        let targetX, targetY;
        // Chase nearest enemy if exists, otherwise follow player
        if (target) {
             targetX = target.x;
             targetY = target.y;
        } else {
             targetX = player.x - 30;
             targetY = player.y - 30;
        }

        // Smooth move
        this.x += (targetX - this.x) * this.followSpeed;
        this.y += (targetY - this.y) * this.followSpeed;

        this.draw();

        // Drop Bomb
        // Calculate effective interval based on level (10% faster per level)
        const effectiveInterval = this.currentInterval / (1 + (this.level - 1) * 0.1);

        if (timestamp - this.lastBombTime > effectiveInterval) {
            bombs.push(new Bomb(this.x, this.y));
            this.lastBombTime = timestamp;
            this.setNextDropTime();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 2;

        // Pixel Pet (Floating Robot)
        // Body
        ctx.fillStyle = '#00BCD4'; // Cyan
        ctx.fillRect(-3 * scale, -3 * scale, 6 * scale, 6 * scale);
        // Eye
        ctx.fillStyle = 'white';
        ctx.fillRect(-1 * scale, -1 * scale, 2 * scale, 2 * scale);
        // Antenna
        ctx.fillStyle = '#B0BEC5';
        ctx.fillRect(-0.5 * scale, -5 * scale, 1 * scale, 2 * scale);
        // Thruster
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(-2 * scale, 3 * scale, 4 * scale, 1 * scale);

        ctx.restore();
    }
}

export class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.timer = 60; // Frames until explosion (~1 sec)
        this.exploded = false;
        this.damage = 50;
        this.range = 100;
    }

    update() {
        this.timer--;
        if (this.timer <= 0) {
            this.exploded = true;
        }
        this.draw();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 2;

        // Pixel Bomb
        // Body
        ctx.fillStyle = '#212121'; // Black
        ctx.beginPath();
        ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuse
        ctx.fillStyle = '#F57F17'; // Orange
        ctx.fillRect(-1 * scale, -7 * scale, 2 * scale, 3 * scale);
        
        // Spark (Blinking)
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#FFEB3B'; // Yellow
            ctx.fillRect(-1 * scale, -9 * scale, 2 * scale, 2 * scale);
        }

        // Pulse effect before explosion
        if (this.timer < 20 && Math.floor(Date.now() / 50) % 2 === 0) {
             ctx.fillStyle = 'red';
             ctx.globalAlpha = 0.5;
             ctx.beginPath();
             ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
             ctx.fill();
        }

        ctx.restore();
    }
}

export class DamageNumber {
    constructor(x, y, damage, isCrit) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.isCrit = isCrit;
        this.alpha = 1;
        this.velocity = { x: (Math.random() - 0.5) * 2, y: -2 };
        this.life = 60; // Frames
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.015;
        this.life--;
        this.draw();
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.font = this.isCrit ? 'bold 24px Arial' : '16px Arial';
        ctx.fillStyle = this.isCrit ? '#FFD700' : '#FFFFFF'; // Gold for crit, White for normal
        ctx.strokeStyle = 'black';
        ctx.lineWidth = this.isCrit ? 3 : 2;
        ctx.textAlign = 'center';
        
        const text = typeof this.damage === 'number' ? Math.floor(this.damage) : this.damage;
        ctx.strokeText(text, this.x, this.y);
        ctx.fillText(text, this.x, this.y);
        
        ctx.restore();
    }
}

export class FirePatch {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 50; // Area of effect
        this.duration = 3000; // 3 seconds
        this.creationTime = performance.now();
        this.tickInterval = 500; // Damage every 0.5s
        this.lastTick = 0;
        this.damageMin = 2;
        this.damageMax = 6;
    }

    update(timestamp, enemies, damageNumbers) {
        // Check duration
        if (timestamp - this.creationTime > this.duration) {
            return false; // Expired
        }

        // Deal damage on tick
        if (timestamp - this.lastTick > this.tickInterval) {
            this.lastTick = timestamp;
            
            enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < this.radius + enemy.radius) {
                    const damage = Math.floor(Math.random() * (this.damageMax - this.damageMin + 1)) + this.damageMin;
                    enemy.health -= damage;
                    damageNumbers.push(new DamageNumber(enemy.x, enemy.y, damage, false));
                }
            });
        }

        this.draw();
        return true; // Active
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const pixelSize = 5;
        const gridRadius = Math.floor(this.radius / pixelSize);

        for (let py = -gridRadius; py <= gridRadius; py++) {
            for (let px = -gridRadius; px <= gridRadius; px++) {
                // Circular mask
                if (px*px + py*py <= gridRadius*gridRadius) {
                    // Animate: Only draw some pixels each frame to flicker
                    if (Math.random() > 0.3) {
                        const dist = Math.sqrt(px*px + py*py);
                        const normDist = dist / gridRadius;
                        
                        // Colors: White/Yellow (Center) -> Orange -> Red (Edge)
                        if (normDist < 0.3) ctx.fillStyle = '#FFF176'; // Light Yellow
                        else if (normDist < 0.6) ctx.fillStyle = '#FF9800'; // Orange
                        else ctx.fillStyle = '#D84315'; // Burnt Orange/Red
                        
                        // Draw pixel
                        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
                        ctx.fillRect(px * pixelSize, py * pixelSize, pixelSize, pixelSize);
                    }
                    
                    // Occasional rising smoke/ember
                    if (Math.random() < 0.02) {
                        ctx.fillStyle = '#212121'; // Dark Grey Smoke
                        ctx.globalAlpha = 0.6;
                        ctx.fillRect(px * pixelSize, py * pixelSize - 10 - Math.random() * 15, pixelSize, pixelSize);
                    }
                }
            }
        }

        ctx.restore();
    }
}

export class Chest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.radius = 20; // For collision
        this.opened = false;
    }

    draw() {
        if (this.opened) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 2;

        // Pixel Chest
        // Body (Brown)
        ctx.fillStyle = '#795548';
        ctx.fillRect(-8 * scale, -6 * scale, 16 * scale, 12 * scale);
        
        // Lid/Trim (Dark Brown)
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(-8 * scale, -6 * scale, 16 * scale, 2 * scale); // Top rim
        ctx.fillRect(-8 * scale, 4 * scale, 16 * scale, 2 * scale); // Bottom rim
        ctx.fillRect(-8 * scale, -6 * scale, 2 * scale, 12 * scale); // Left rim
        ctx.fillRect(6 * scale, -6 * scale, 2 * scale, 12 * scale); // Right rim

        // Lock (Gold)
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-2 * scale, -1 * scale, 4 * scale, 4 * scale);

        ctx.restore();
    }
}

export class Drone {
    constructor(player) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        this.level = 1;
        this.baseDamage = 1.5;
        this.damagePerLevel = 0.3;
        this.baseCooldown = 8000; // 8 seconds
        this.cooldownReductionPerLevel = 1000; // 1 second
        this.duration = 2000; // 2 seconds active
        
        this.state = 'COOLDOWN'; 
        this.timer = performance.now(); 
        this.lastFired = 0;
        this.fireRate = 100; // Shoot every 100ms when active
        
        this.orbitAngle = 0;
        this.orbitRadius = 50;
    }

    get damage() {
        return this.baseDamage + (this.level - 1) * this.damagePerLevel;
    }

    get cooldown() {
        return Math.max(1000, this.baseCooldown - (this.level - 1) * this.cooldownReductionPerLevel);
    }

    update(timestamp, enemies, projectiles) {
        // Orbit player
        this.orbitAngle += 0.05;
        this.x = this.player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.player.y + Math.sin(this.orbitAngle) * this.orbitRadius;

        // State Machine
        if (this.state === 'ACTIVE') {
            if (timestamp - this.timer > this.duration) {
                this.state = 'COOLDOWN';
                this.timer = timestamp;
            } else {
                // Shooting Logic
                if (timestamp - this.lastFired > this.fireRate) {
                    this.shoot(enemies, projectiles);
                    this.lastFired = timestamp;
                }
            }
        } else if (this.state === 'COOLDOWN') {
            if (timestamp - this.timer > this.cooldown) {
                this.state = 'ACTIVE';
                this.timer = timestamp;
            }
        }

        this.draw();
    }

    shoot(enemies, projectiles) {
        // Find nearest enemy
        let target = null;
        let minDist = 400; // Range

        enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        });

        if (target) {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            const velocity = {
                x: Math.cos(angle) * 10, // Fast projectile
                y: Math.sin(angle) * 10
            };
            
            const proj = new Projectile(this.x, this.y, 3, '#00E5FF', velocity);
            proj.damage = this.damage; // Attach specific damage
            proj.isDrone = true; // Flag
            projectiles.push(proj);
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Bobbing effect
        const bob = Math.sin(performance.now() / 200) * 5;
        ctx.translate(0, bob);

        const scale = 1.5;

        // Drone Body
        ctx.fillStyle = this.state === 'ACTIVE' ? '#00E5FF' : '#607D8B'; // Bright Cyan if active, Grey if cooldown
        
        // Quadcopter shape
        ctx.fillRect(-6 * scale, -2 * scale, 12 * scale, 4 * scale); // Main body
        ctx.fillRect(-2 * scale, -6 * scale, 4 * scale, 12 * scale); // Cross
        
        // Rotors
        ctx.fillStyle = '#212121';
        if (this.state === 'ACTIVE') {
            // Spin blur
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.arc(-6 * scale, -6 * scale, 4 * scale, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(6 * scale, -6 * scale, 4 * scale, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(-6 * scale, 6 * scale, 4 * scale, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(6 * scale, 6 * scale, 4 * scale, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1.0;
        } else {
            // Static rotors
            ctx.fillRect(-8 * scale, -7 * scale, 4 * scale, 2 * scale);
            ctx.fillRect(4 * scale, -7 * scale, 4 * scale, 2 * scale);
            ctx.fillRect(-8 * scale, 5 * scale, 4 * scale, 2 * scale);
            ctx.fillRect(4 * scale, 5 * scale, 4 * scale, 2 * scale);
        }

        // LED Status
        ctx.fillStyle = this.state === 'ACTIVE' ? '#00FF00' : '#F44336';
        ctx.fillRect(-1 * scale, -1 * scale, 2 * scale, 2 * scale);

        ctx.restore();
    }
}

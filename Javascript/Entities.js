import { ctx, canvas, world, buildings, vehicles } from './Globals.js';

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
        this.life = 4; // Slightly longer
        this.maxLife = 4;
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
        
        const scale = 3; // Larger scale
        const opacity = this.life / this.maxLife;
        
        // Outer glow (orange)
        ctx.globalAlpha = opacity * 0.6;
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(-2 * scale, -6 * scale, 14 * scale, 12 * scale);
        
        // Pixel Muzzle Flash - Yellow bright
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#FFFF00';
        
        // Core (larger)
        ctx.fillRect(0, -3 * scale, 6 * scale, 6 * scale);
        
        // Spikes - more prominent
        ctx.fillRect(6 * scale, -5 * scale, 6 * scale, 3 * scale); // Top spike
        ctx.fillRect(6 * scale, 2 * scale, 6 * scale, 3 * scale);  // Bottom spike
        ctx.fillRect(6 * scale, -2 * scale, 8 * scale, 4 * scale); // Middle long spike
        
        // Additional side spikes
        ctx.fillRect(4 * scale, -6 * scale, 3 * scale, 2 * scale); // Top-top
        ctx.fillRect(4 * scale, 4 * scale, 3 * scale, 2 * scale); // Bottom-bottom
        
        // White hot center (brighter)
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, -2 * scale, 5 * scale, 4 * scale);
        ctx.fillRect(2 * scale, -3 * scale, 3 * scale, 6 * scale);

        ctx.restore();
    }
}

export class HitEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 15;
        this.bloodSplatters = [];
        
        // Create blood splatter particles - more particles
        const numSplatters = Math.floor(Math.random() * 8) + 12; // 12-19 blood drops
        for (let i = 0; i < numSplatters; i++) {
            const angle = (Math.PI * 2 * i) / numSplatters + (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * 5 + 3; // Faster
            this.bloodSplatters.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.floor(Math.random() * 4) + 3, // Larger
                alpha: 1,
                colorIndex: Math.floor(Math.random() * 3)
            });
        }
    }

    update() {
        this.life--;
        
        // Update blood particles
        this.bloodSplatters.forEach(splatter => {
            splatter.x += splatter.vx;
            splatter.y += splatter.vy;
            splatter.vy += 0.2; // More gravity
            splatter.vx *= 0.97; // More air resistance
            splatter.alpha -= 0.015; // Slower fade
        });
        
        this.draw();
    }

    draw() {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw blood splatters
        this.bloodSplatters.forEach(splatter => {
            if (splatter.alpha > 0) {
                // Blood colors - darker, more intense reds
                const bloodColors = ['#660000', '#8B0000', '#990000'];
                ctx.fillStyle = bloodColors[splatter.colorIndex];
                
                const pixelSize = splatter.size;
                
                // Outer glow/splatter
                ctx.globalAlpha = splatter.alpha * 0.4;
                ctx.fillRect(splatter.x - pixelSize, splatter.y - pixelSize, pixelSize * 2, pixelSize * 2);
                
                // Main blood drop (pixel) - darker and more opaque
                ctx.globalAlpha = Math.min(1, splatter.alpha * 1.2);
                ctx.fillRect(splatter.x - pixelSize/2, splatter.y - pixelSize/2, pixelSize, pixelSize);
                
                // Core darker center
                ctx.fillStyle = '#330000';
                ctx.globalAlpha = splatter.alpha;
                ctx.fillRect(splatter.x - pixelSize/4, splatter.y - pixelSize/4, Math.max(1, pixelSize/2), Math.max(1, pixelSize/2));
                
                // Trail effect (longer and more visible)
                ctx.fillStyle = bloodColors[splatter.colorIndex];
                ctx.globalAlpha = splatter.alpha * 0.6;
                const trailLength = 2;
                for (let t = 1; t <= trailLength; t++) {
                    const trailSize = pixelSize * (1 - t / (trailLength + 1));
                    ctx.fillRect(
                        splatter.x - splatter.vx * t * 0.3 - trailSize/2,
                        splatter.y - splatter.vy * t * 0.3 - trailSize/2,
                        Math.max(2, trailSize),
                        Math.max(2, trailSize)
                    );
                }
            }
        });
        
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
        this.type = Math.floor(Math.random() * 7); // 7 military building types
        this.generateDetails();
    }

    generateDetails() {
        const pixelSize = 4;
        
        if (this.type === 0) {
            // Type 0: Barracks - Bunks and equipment
            const numBunks = Math.floor(Math.random() * 4) + 2;
            for (let j = 0; j < numBunks; j++) {
                const dw = pixelSize * 6;
                const dh = pixelSize * 4;
                const dx = this.x + Math.random() * (this.width - dw);
                const dy = this.y + Math.random() * (this.height - dh);
                this.details.push({ type: 'bunk', x: dx, y: dy, w: dw, h: dh });
            }
        } else if (this.type === 1) {
            // Type 1: Armory - Weapon crates
            const numCrates = Math.floor(Math.random() * 5) + 3;
            for (let j = 0; j < numCrates; j++) {
                const size = (Math.floor(Math.random() * 3) + 3) * pixelSize;
                const dx = this.x + Math.random() * (this.width - size);
                const dy = this.y + Math.random() * (this.height - size);
                this.details.push({ type: 'crate', x: dx, y: dy, size: size });
            }
        } else if (this.type === 2) {
            // Type 2: Command Center - Radar dish
            const dx = this.x + this.width / 2;
            const dy = this.y + this.height / 2;
            this.details.push({ type: 'radar', x: dx, y: dy });
        } else if (this.type === 3) {
            // Type 3: Vehicle Depot - Tires/Tank treads
            const numItems = Math.floor(Math.random() * 4) + 2;
            for (let j = 0; j < numItems; j++) {
                const dx = this.x + Math.random() * (this.width - pixelSize * 8);
                const dy = this.y + Math.random() * (this.height - pixelSize * 8);
                this.details.push({ type: 'vehicle', x: dx, y: dy });
            }
        } else if (this.type === 4) {
            // Type 4: Watchtower - Guard post with spotlight
            const dx = this.x + this.width / 2;
            const dy = this.y + this.height / 2;
            this.details.push({ type: 'watchtower', x: dx, y: dy });
        } else if (this.type === 5) {
            // Type 5: Medical Bay - Red cross and beds
            const numBeds = Math.floor(Math.random() * 3) + 2;
            for (let j = 0; j < numBeds; j++) {
                const dx = this.x + Math.random() * (this.width - pixelSize * 8);
                const dy = this.y + Math.random() * (this.height - pixelSize * 6);
                this.details.push({ type: 'medbed', x: dx, y: dy });
            }
        } else if (this.type === 6) {
            // Type 6: Helipad - Landing circle
            const dx = this.x + this.width / 2;
            const dy = this.y + this.height / 2;
            this.details.push({ type: 'helipad', x: dx, y: dy });
        }
    }

    draw(ctx) {
        const pixelSize = 4;
        
        // Base color - Military colors
        let baseColor = '#4A5C48'; // Olive drab
        let borderColor = '#3A4838';
        
        if (this.type === 2) {
            baseColor = '#2C3E50'; // Dark blue-grey for command
            borderColor = '#1C2E40';
        } else if (this.type === 3) {
            baseColor = '#3E4A3C'; // Dark green for depot
            borderColor = '#2C3528';
        } else if (this.type === 4) {
            baseColor = '#424242'; // Grey for watchtower
            borderColor = '#212121';
        } else if (this.type === 5) {
            baseColor = '#E8F5E9'; // Light green for medical
            borderColor = '#C8E6C9';
        } else if (this.type === 6) {
            baseColor = '#37474F'; // Dark grey for helipad
            borderColor = '#263238';
        }
        
        // Building Base with gradient effect
        ctx.fillStyle = baseColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Darker panels for depth
        ctx.fillStyle = borderColor;
        ctx.fillRect(this.x + pixelSize, this.y + pixelSize, this.width - pixelSize * 2, pixelSize * 2);
        ctx.fillRect(this.x + pixelSize, this.y + this.height - pixelSize * 3, this.width - pixelSize * 2, pixelSize * 2);

        // Border/Walls
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = pixelSize;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Military markings - Stripes (only for non-medical)
        if (this.type !== 5) {
            ctx.fillStyle = '#FFD600';
            ctx.fillRect(this.x + pixelSize, this.y + pixelSize, this.width - pixelSize * 2, pixelSize);
            ctx.fillRect(this.x + pixelSize, this.y + this.height - pixelSize * 2, this.width - pixelSize * 2, pixelSize);
        }
        
        // Vent grates on corners
        ctx.fillStyle = '#1A1F18';
        ctx.fillRect(this.x + pixelSize * 2, this.y + pixelSize * 2, pixelSize * 3, pixelSize * 3);
        ctx.fillRect(this.x + this.width - pixelSize * 5, this.y + pixelSize * 2, pixelSize * 3, pixelSize * 3);

        // Draw Details
        this.details.forEach(d => {
            if (d.type === 'bunk') {
                // Bunk bed (top view)
                ctx.fillStyle = '#5D4E37'; // Brown
                ctx.fillRect(d.x, d.y, d.w, d.h);
                
                // Mattress
                ctx.fillStyle = '#3E3528';
                ctx.fillRect(d.x + pixelSize, d.y + pixelSize, d.w - pixelSize * 2, d.h - pixelSize * 2);
                
                // Pillow
                ctx.fillStyle = '#CCCCCC';
                ctx.fillRect(d.x + pixelSize, d.y + pixelSize, pixelSize * 2, pixelSize * 2);
            } else if (d.type === 'crate') {
                // Weapon crate
                ctx.fillStyle = '#5C4033'; // Dark brown
                ctx.fillRect(d.x, d.y, d.size, d.size);
                
                // Metal straps
                ctx.fillStyle = '#808080';
                ctx.fillRect(d.x, d.y + d.size/3, d.size, pixelSize);
                ctx.fillRect(d.x, d.y + (d.size * 2/3), d.size, pixelSize);
                ctx.fillRect(d.x + d.size/3, d.y, pixelSize, d.size);
                ctx.fillRect(d.x + (d.size * 2/3), d.y, pixelSize, d.size);
                
                // Danger symbol
                ctx.fillStyle = '#FFD600';
                ctx.fillRect(d.x + d.size/2 - pixelSize, d.y + d.size/2 - pixelSize, pixelSize * 2, pixelSize * 2);
            } else if (d.type === 'radar') {
                // Radar dish
                ctx.fillStyle = '#607D8B'; // Blue-grey
                
                // Base
                const baseSize = pixelSize * 8;
                ctx.fillRect(d.x - baseSize/2, d.y - baseSize/2, baseSize, baseSize);
                
                // Dish (octagonal)
                const dishSize = pixelSize * 12;
                ctx.fillRect(d.x - dishSize/2, d.y - dishSize/2 - pixelSize * 4, dishSize, pixelSize * 2);
                ctx.fillRect(d.x - pixelSize, d.y - dishSize/2 - pixelSize * 6, pixelSize * 2, dishSize + pixelSize * 4);
                ctx.fillRect(d.x - dishSize * 0.35, d.y - dishSize * 0.35 - pixelSize * 4, dishSize * 0.7, pixelSize);
                ctx.fillRect(d.x - dishSize * 0.35, d.y + dishSize * 0.35 - pixelSize * 4, dishSize * 0.7, pixelSize);
                
                // Center
                ctx.fillStyle = '#37474F';
                ctx.fillRect(d.x - pixelSize * 2, d.y - pixelSize * 6, pixelSize * 4, pixelSize * 4);
                
                // Scanning beam (animated)
                if (Math.floor(Date.now() / 100) % 4 === 0) {
                    ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
                    ctx.fillRect(d.x - pixelSize, d.y - dishSize/2 - pixelSize * 4, pixelSize * 2, dishSize);
                }
            } else if (d.type === 'vehicle') {
                // Vehicle parts/tires
                ctx.fillStyle = '#212121'; // Black rubber
                
                // Tire stack (top view = circles)
                for (let t = 0; t < 3; t++) {
                    const tx = d.x + t * pixelSize * 3;
                    const ty = d.y;
                    ctx.fillRect(tx, ty, pixelSize * 6, pixelSize * 2);
                    ctx.fillRect(tx + pixelSize, ty - pixelSize, pixelSize * 4, pixelSize * 4);
                    
                    // Rim
                    ctx.fillStyle = '#757575';
                    ctx.fillRect(tx + pixelSize * 2, ty, pixelSize * 2, pixelSize * 2);
                    ctx.fillStyle = '#212121';
                }
            } else if (d.type === 'watchtower') {
                // Guard tower
                ctx.fillStyle = '#5D4E37'; // Brown wood
                
                // Tower base
                const baseSize = pixelSize * 8;
                ctx.fillRect(d.x - baseSize/2, d.y - baseSize/2, baseSize, baseSize);
                
                // Tower structure
                ctx.fillRect(d.x - pixelSize * 2, d.y - baseSize/2 - pixelSize * 16, pixelSize * 4, pixelSize * 16);
                
                // Platform
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(d.x - pixelSize * 6, d.y - baseSize/2 - pixelSize * 18, pixelSize * 12, pixelSize * 2);
                
                // Roof
                ctx.fillStyle = '#3E2723';
                ctx.fillRect(d.x - pixelSize * 6, d.y - baseSize/2 - pixelSize * 22, pixelSize * 12, pixelSize * 4);
                
                // Spotlight (animated)
                const blink = Math.floor(Date.now() / 500) % 2 === 0;
                ctx.fillStyle = blink ? '#FFEB3B' : '#FDD835';
                ctx.fillRect(d.x - pixelSize, d.y - baseSize/2 - pixelSize * 20, pixelSize * 2, pixelSize * 2);
                
                // Searchlight beam
                if (blink) {
                    ctx.fillStyle = 'rgba(255, 235, 59, 0.2)';
                    ctx.fillRect(d.x - pixelSize * 4, d.y - baseSize/2 - pixelSize * 20, pixelSize * 8, pixelSize * 30);
                }
            } else if (d.type === 'medbed') {
                // Medical bed
                ctx.fillStyle = '#FFFFFF'; // White bed
                ctx.fillRect(d.x, d.y, pixelSize * 8, pixelSize * 6);
                
                // Mattress
                ctx.fillStyle = '#E3F2FD';
                ctx.fillRect(d.x + pixelSize, d.y + pixelSize, pixelSize * 6, pixelSize * 4);
                
                // Pillow
                ctx.fillStyle = '#BBDEFB';
                ctx.fillRect(d.x + pixelSize, d.y + pixelSize, pixelSize * 2, pixelSize * 2);
                
                // IV stand
                ctx.fillStyle = '#9E9E9E';
                ctx.fillRect(d.x + pixelSize * 7, d.y, pixelSize, pixelSize * 8);
                ctx.fillRect(d.x + pixelSize * 6, d.y, pixelSize * 3, pixelSize);
                
                // Red cross nearby
                ctx.fillStyle = '#F44336';
                ctx.fillRect(d.x - pixelSize * 2, d.y + pixelSize, pixelSize, pixelSize * 4);
                ctx.fillRect(d.x - pixelSize * 4, d.y + pixelSize * 2, pixelSize * 5, pixelSize);
            } else if (d.type === 'helipad') {
                // Helipad circle
                ctx.fillStyle = '#FFD600'; // Yellow
                
                // Landing circle (octagonal pixel circle)
                const r = pixelSize * 12;
                ctx.fillRect(d.x - r, d.y - pixelSize * 2, r * 2, pixelSize * 4);
                ctx.fillRect(d.x - pixelSize * 2, d.y - r, pixelSize * 4, r * 2);
                ctx.fillRect(d.x - r * 0.7, d.y - r * 0.7, r * 1.4, pixelSize * 2);
                ctx.fillRect(d.x - r * 0.7, d.y + r * 0.7 - pixelSize * 2, r * 1.4, pixelSize * 2);
                
                // H letter
                ctx.fillRect(d.x - pixelSize * 4, d.y - pixelSize * 6, pixelSize * 2, pixelSize * 12);
                ctx.fillRect(d.x + pixelSize * 2, d.y - pixelSize * 6, pixelSize * 2, pixelSize * 12);
                ctx.fillRect(d.x - pixelSize * 4, d.y - pixelSize, pixelSize * 8, pixelSize * 2);
                
                // Corner lights (blinking)
                const lightBlink = Math.floor(Date.now() / 800) % 2 === 0;
                if (lightBlink) {
                    ctx.fillStyle = '#FF5722';
                    ctx.fillRect(d.x - r + pixelSize, d.y - r + pixelSize, pixelSize * 2, pixelSize * 2);
                    ctx.fillRect(d.x + r - pixelSize * 3, d.y - r + pixelSize, pixelSize * 2, pixelSize * 2);
                    ctx.fillRect(d.x - r + pixelSize, d.y + r - pixelSize * 3, pixelSize * 2, pixelSize * 2);
                    ctx.fillRect(d.x + r - pixelSize * 3, d.y + r - pixelSize * 3, pixelSize * 2, pixelSize * 2);
                }
            }
        });
    }
}

export class Player {
    constructor(x, y, radius, color, username = "Soldier") {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.username = username;
        this.velocity = { x: 0, y: 0 };
        this.speed = 1.5;
        this.maxHealth = 150;
        this.health = 150;
        this.lastDamageTime = 0;
        this.invulnerableTime = 500; // ms
        this.facingAngle = 0; // Hướng nhìn của nhân vật
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
        
        // Rotate towards facing direction (smoothly)
        ctx.rotate(this.facingAngle);

        const scale = 0.8; 

        // --- Top-Down Soldier (Vẽ hướng lên trên = 0 độ, súng chỉ lên) ---
        
        // Feet (Simple animation) - Bên trái và phải
        const walkCycle = Math.sin(performance.now() / 100) * 5;
        
        ctx.fillStyle = '#111'; // Boots
        ctx.fillRect(-15 * scale, (-10 + walkCycle) * scale, 8 * scale, 14 * scale); // Left Foot
        ctx.fillRect(7 * scale, (-10 - walkCycle) * scale, 8 * scale, 14 * scale); // Right Foot

        // Body (Shoulders/Vest)
        ctx.fillStyle = '#1A237E'; // Blue Vest
        ctx.fillRect(-15 * scale, -15 * scale, 30 * scale, 30 * scale); // Main body
        
        // Backpack (phía sau/dưới)
        ctx.fillStyle = '#3E2723'; // Brown
        ctx.fillRect(-12 * scale, 12 * scale, 24 * scale, 8 * scale);

        // Head (Helmet) - Pixel Style
        ctx.fillStyle = '#33691E'; // Green Helmet
        ctx.fillRect(-10 * scale, -10 * scale, 20 * scale, 20 * scale); // Main head
        
        // Helmet details (Camo) - Pixel patches
        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(-6 * scale, -6 * scale, 8 * scale, 8 * scale);
        ctx.fillRect(2 * scale, 2 * scale, 4 * scale, 4 * scale);
        
        // Visor/Face (hướng lên)
        ctx.fillStyle = '#212121';
        ctx.fillRect(-4 * scale, -4 * scale, 8 * scale, 4 * scale);

        // Arms & Gun (súng chỉ lên phía trước)
        // Hands holding gun
        ctx.fillStyle = '#3E2723'; // Gloves
        ctx.fillRect(8 * scale, -20 * scale, 8 * scale, 10 * scale); // Right hand (on barrel)
        ctx.fillRect(-2 * scale, -10 * scale, 8 * scale, 8 * scale); // Left hand (trigger)

        // Gun (Rifle) - chỉ lên
        ctx.fillStyle = '#212121'; // Gun Metal
        ctx.fillRect(2 * scale, -40 * scale, 6 * scale, 40 * scale); // Barrel (vertical)
        ctx.fillStyle = '#3E2723'; // Wood Stock
        ctx.fillRect(2 * scale, -10 * scale, 6 * scale, 15 * scale); 
        ctx.fillStyle = '#000'; // Mag
        ctx.fillRect(-4 * scale, -20 * scale, 6 * scale, 6 * scale);

        ctx.restore();
        
        // Health bar above player
        const barWidth = 40;
        const barHeight = 5;
        const yOffset = 40; 
        
        // Draw Username
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px "Press Start 2P"'; // Pixel font
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.fillText(this.username, this.x, this.y - yOffset - 10);
        ctx.restore();

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

        // Draw facing direction indicator (for debugging/visual feedback)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.facingAngle);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Semi-transparent yellow
        // Draw a cone to show facing direction
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 40, -Math.PI * 0.35, Math.PI * 0.35); // 126-degree cone
        ctx.closePath();
        ctx.fill();
        // Draw center line
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(40, 0);
        ctx.stroke();
        ctx.restore();

        // Draw Shield (Pixel Art Style)
        if (this.shield.active) {
            ctx.save();
            ctx.translate(this.x, this.y); 
            const pixelSize = 4;
            const shieldSize = 32;
            const rotation = Math.floor(performance.now() / 100) % 4; // Discrete rotation
            
            ctx.fillStyle = '#00E5FF'; 
            
            // Outer pixel ring (Hexagonal shape)
            const pixels = [
                [-shieldSize, 0], [shieldSize, 0], // Left, Right
                [0, -shieldSize], [0, shieldSize], // Top, Bottom
                [-shieldSize*0.7, -shieldSize*0.7], [shieldSize*0.7, -shieldSize*0.7], // Diagonals
                [-shieldSize*0.7, shieldSize*0.7], [shieldSize*0.7, shieldSize*0.7]
            ];
            
            pixels.forEach((pos, i) => {
                if ((i + rotation) % 2 === 0) {
                    ctx.fillRect(pos[0] - pixelSize/2, pos[1] - pixelSize/2, pixelSize, pixelSize);
                }
            });
            
            // Inner Ring (Static)
            ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
            ctx.fillRect(-shieldSize*0.5, -pixelSize/2, shieldSize, pixelSize); // Horizontal
            ctx.fillRect(-pixelSize/2, -shieldSize*0.5, pixelSize, shieldSize); // Vertical

            ctx.restore();
        }
    }

    update(timestamp) {
        // Update facing angle based on movement
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const targetAngle = Math.atan2(this.velocity.y, this.velocity.x);
            // Smooth rotation
            const angleDiff = targetAngle - this.facingAngle;
            // Normalize angle difference to [-PI, PI]
            const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            this.facingAngle += normalizedDiff * 0.2; // Smooth factor
        }
        
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
        
        // Vehicle Collision
        vehicles.forEach(vehicle => {
            if (checkCircleRectCollision(this, vehicle)) {
                resolveCollision(this, vehicle);
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
        // Draw tail - Pixel style
        this.tail.forEach((pos, index) => {
            const alpha = (index / this.tail.length) * 0.5;
            const pixelSize = Math.max(2, Math.floor(this.radius * (index / this.tail.length)));
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(pos.x - pixelSize/2, pos.y - pixelSize/2, pixelSize, pixelSize);
            ctx.restore();
        });

        // Draw head - Pixel bullet
        ctx.save();
        ctx.fillStyle = this.color;
        const pixelSize = this.radius;
        // Core
        ctx.fillRect(this.x - pixelSize, this.y - pixelSize, pixelSize * 2, pixelSize * 2);
        // Glow effect (outer pixels)
        ctx.globalAlpha = 0.6;
        ctx.fillRect(this.x - pixelSize - 2, this.y - pixelSize/2, 2, pixelSize);
        ctx.fillRect(this.x + pixelSize, this.y - pixelSize/2, 2, pixelSize);
        ctx.fillRect(this.x - pixelSize/2, this.y - pixelSize - 2, pixelSize, 2);
        ctx.fillRect(this.x - pixelSize/2, this.y + pixelSize, pixelSize, 2);
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
        this.isStunned = false;
        this.stunTimer = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotate towards movement direction
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const angle = Math.atan2(this.velocity.y, this.velocity.x);
            ctx.rotate(angle);
        }

        // Stun Effect (Visual)
        if (this.isStunned) {
            ctx.save();
            ctx.rotate(performance.now() / 100); // Spin effect
            ctx.strokeStyle = '#00E5FF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, -this.radius - 10, 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.type === 'boss') {
            // Giant Skull Top Down - Pixel Art
            const scale = 5; 
            ctx.fillStyle = '#FFFFFF'; 
            // Skull Main (Rounded square)
            ctx.fillRect(-10 * scale, -8 * scale, 20 * scale, 16 * scale); // Main cranium
            ctx.fillRect(-8 * scale, -10 * scale, 16 * scale, 4 * scale); // Top
            ctx.fillRect(-8 * scale, 6 * scale, 16 * scale, 4 * scale); // Bottom
            
            // Jaw
            ctx.fillRect(2 * scale, -6 * scale, 8 * scale, 12 * scale);
            
            // Eyes - Pixel hollows
            ctx.fillStyle = 'black';
            ctx.fillRect(2 * scale, -5 * scale, 4 * scale, 4 * scale); // Left eye
            ctx.fillRect(2 * scale, 1 * scale, 4 * scale, 4 * scale); // Right eye
            
            // Nose hole
            ctx.fillRect(0, -1 * scale, 2 * scale, 2 * scale);

        } else if (this.type === 'boss_spider') {
            // Giant Spider Top Down - Pixel Art
            const scale = 4;
            ctx.fillStyle = '#212121'; // Black Body
            
            // Legs (8) - Pixel art style
            const legData = [
                {x: -12*scale, y: -8*scale}, {x: 12*scale, y: -8*scale}, // Front
                {x: -14*scale, y: -2*scale}, {x: 14*scale, y: -2*scale}, // Mid-front
                {x: -14*scale, y: 2*scale}, {x: 14*scale, y: 2*scale}, // Mid-back
                {x: -12*scale, y: 8*scale}, {x: 12*scale, y: 8*scale}  // Back
            ];
            
            legData.forEach(leg => {
                ctx.fillRect(leg.x > 0 ? 8*scale : leg.x, leg.y - scale, Math.abs(leg.x) - 6*scale, 2*scale);
                // Knee joint
                ctx.fillRect(leg.x - 2*scale, leg.y - 2*scale, 4*scale, 4*scale);
            });

            // Abdomen (Rear) - Pixel oval
            ctx.fillRect(-12 * scale, -6 * scale, 16 * scale, 12 * scale); // Main
            ctx.fillRect(-10 * scale, -8 * scale, 12 * scale, 4 * scale); // Top
            ctx.fillRect(-10 * scale, 4 * scale, 12 * scale, 4 * scale); // Bottom
            
            // Red hourglass/mark
            ctx.fillStyle = '#D50000';
            ctx.fillRect(-6 * scale, -2 * scale, 4 * scale, 4 * scale);
            ctx.fillRect(-8 * scale, -1 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(-4 * scale, -1 * scale, 2 * scale, 2 * scale);

            // Cephalothorax (Head/Thorax) - Pixel circle
            ctx.fillStyle = '#212121';
            ctx.fillRect(2 * scale, -5 * scale, 10 * scale, 10 * scale); // Main
            ctx.fillRect(4 * scale, -6 * scale, 6 * scale, 2 * scale); // Top edge
            ctx.fillRect(4 * scale, 4 * scale, 6 * scale, 2 * scale); // Bottom edge

            // Eyes (Many) - Pixel dots
            ctx.fillStyle = 'red';
            ctx.fillRect(8 * scale, -3 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(8 * scale, 1 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(10 * scale, -2 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(10 * scale, 0, 2 * scale, 2 * scale);

        } else if (this.type === 'boss_mutant') {
            // Mutant Zombie Top Down - Pixel Art
            const scale = 4;
            
            // Left Arm (Normal)
            ctx.fillStyle = '#689F38'; // Green
            ctx.fillRect(4 * scale, -10 * scale, 4 * scale, 14 * scale);
            ctx.fillRect(6 * scale, -12 * scale, 3 * scale, 3 * scale); // Hand
            
            // Right Arm (Mutated Giant) - Pixel blob
            ctx.fillStyle = '#33691E'; // Dark Green
            ctx.fillRect(2 * scale, 6 * scale, 16 * scale, 10 * scale); // Main mass
            ctx.fillRect(4 * scale, 4 * scale, 12 * scale, 4 * scale); // Top
            ctx.fillRect(4 * scale, 14 * scale, 12 * scale, 4 * scale); // Bottom
            
            // Claws/Fist - Pixel spikes
            ctx.fillStyle = '#1B5E20';
            ctx.fillRect(16 * scale, 8 * scale, 4 * scale, 6 * scale); // Main fist
            ctx.fillRect(18 * scale, 6 * scale, 2 * scale, 2 * scale); // Claw 1
            ctx.fillRect(18 * scale, 10 * scale, 2 * scale, 2 * scale); // Claw 2
            ctx.fillRect(18 * scale, 12 * scale, 2 * scale, 2 * scale); // Claw 3

            // Body
            ctx.fillStyle = '#424242'; // Tattered Grey Shirt
            ctx.fillRect(-8 * scale, -8 * scale, 16 * scale, 16 * scale);
            // Torn edges
            ctx.fillStyle = '#212121';
            ctx.fillRect(-8 * scale, -2 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(6 * scale, 4 * scale, 2 * scale, 2 * scale);
            
            // Head - Pixel square
            ctx.fillStyle = '#689F38';
            ctx.fillRect(-6 * scale, -6 * scale, 12 * scale, 12 * scale); // Main head
            ctx.fillRect(-4 * scale, -8 * scale, 8 * scale, 2 * scale); // Top
            
            // Pustules/Veins - Pixel blobs
            ctx.fillStyle = '#76FF03'; // Toxic Green
            ctx.fillRect(-3 * scale, -3 * scale, 3 * scale, 3 * scale);
            ctx.fillRect(2 * scale, 2 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(0, -5 * scale, 2 * scale, 2 * scale);

        } else if (this.type === 'small') {
            // Baby Zombie Top Down - Pixel Art
            const scale = 0.8; 
            
            // Arms (Reaching forward)
            ctx.fillStyle = '#8BC34A'; // Green Skin
            ctx.fillRect(6 * scale, -12 * scale, 14 * scale, 6 * scale); // Left Arm
            ctx.fillRect(6 * scale, 6 * scale, 14 * scale, 6 * scale); // Right Arm
            // Hands
            ctx.fillRect(18 * scale, -11 * scale, 4 * scale, 4 * scale);
            ctx.fillRect(18 * scale, 7 * scale, 4 * scale, 4 * scale);

            // Shoulders/Body
            ctx.fillStyle = '#0288D1'; // Blue Shirt
            ctx.fillRect(-10 * scale, -10 * scale, 20 * scale, 20 * scale);

            // Head - Pixel square
            ctx.fillStyle = '#8BC34A'; // Green
            ctx.fillRect(-8 * scale, -8 * scale, 16 * scale, 16 * scale); // Main
            ctx.fillRect(-6 * scale, -10 * scale, 12 * scale, 2 * scale); // Top edge
            
            // Eyes - Pixel dots
            ctx.fillStyle = '#212121';
            ctx.fillRect(-4 * scale, -2 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(2 * scale, -2 * scale, 2 * scale, 2 * scale);

        } else if (this.type === 'elite') {
            // Zombie Top Down - Pixel Art
            const scale = 1.0;
            
            // Arms
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(6 * scale, -14 * scale, 18 * scale, 7 * scale);
            ctx.fillRect(6 * scale, 7 * scale, 18 * scale, 7 * scale);
            // Hands
            ctx.fillRect(22 * scale, -13 * scale, 4 * scale, 5 * scale);
            ctx.fillRect(22 * scale, 8 * scale, 4 * scale, 5 * scale);

            // Body
            ctx.fillStyle = '#5D4037'; // Brown Shirt
            ctx.fillRect(-12 * scale, -12 * scale, 24 * scale, 24 * scale);
            // Belt
            ctx.fillStyle = '#212121';
            ctx.fillRect(-12 * scale, -2 * scale, 24 * scale, 4 * scale);

            // Head - Pixel square
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(-10 * scale, -10 * scale, 20 * scale, 20 * scale); // Main
            ctx.fillRect(-8 * scale, -12 * scale, 16 * scale, 2 * scale); // Top
            
            // Eyes - Glowing red
            ctx.fillStyle = '#D32F2F';
            ctx.fillRect(-6 * scale, -4 * scale, 3 * scale, 3 * scale);
            ctx.fillRect(3 * scale, -4 * scale, 3 * scale, 3 * scale);

        } else if (this.type === 'big') {
            // Armored Zombie Top Down - Pixel Art
            const scale = 1.2;
            
            // Arms (Armored)
            ctx.fillStyle = '#2E7D32'; // Green Skin
            ctx.fillRect(6 * scale, -16 * scale, 20 * scale, 8 * scale);
            ctx.fillRect(6 * scale, 8 * scale, 20 * scale, 8 * scale);
            // Pauldrons - Pixel armor
            ctx.fillStyle = '#757575'; // Grey Armor
            ctx.fillRect(-6 * scale, -20 * scale, 14 * scale, 12 * scale);
            ctx.fillRect(-6 * scale, 8 * scale, 14 * scale, 12 * scale);
            // Armor rivets
            ctx.fillStyle = '#424242';
            ctx.fillRect(-4 * scale, -18 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(4 * scale, -18 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(-4 * scale, 10 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(4 * scale, 10 * scale, 2 * scale, 2 * scale);

            // Body (Chestplate)
            ctx.fillStyle = '#9E9E9E';
            ctx.fillRect(-15 * scale, -15 * scale, 30 * scale, 30 * scale);
            // Plate details
            ctx.fillStyle = '#757575';
            ctx.fillRect(-12 * scale, -12 * scale, 24 * scale, 4 * scale);
            ctx.fillRect(-12 * scale, 8 * scale, 24 * scale, 4 * scale);

            // Head (Helmet) - Pixel square
            ctx.fillStyle = '#616161';
            ctx.fillRect(-12 * scale, -12 * scale, 24 * scale, 24 * scale); // Main
            ctx.fillRect(-10 * scale, -14 * scale, 20 * scale, 2 * scale); // Top edge
            // Visor slit
            ctx.fillStyle = '#212121';
            ctx.fillRect(-8 * scale, -4 * scale, 16 * scale, 4 * scale);
            // Red Eyes glow
            ctx.fillStyle = '#D32F2F';
            ctx.fillRect(-4 * scale, -2 * scale, 2 * scale, 2 * scale);
            ctx.fillRect(2 * scale, -2 * scale, 2 * scale, 2 * scale);

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
        
        // Handle Stun
        if (this.isStunned) {
            this.stunTimer--;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
            }
            return; // Skip movement if stunned
        }

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
        // Base speed (giảm xuống)
        let speed = 0.5; // Default speed (giảm từ 0.8)
        if (this.type === 'boss') speed = 0.4; // Giảm từ 0.6
        if (this.type === 'boss_spider') speed = 0.45; // Spider nhanh hơn boss thường
        if (this.type === 'boss_mutant') speed = 0.35; // Mutant chậm nhất
        if (this.type === 'small') speed = 0.6; // Giảm từ 1.0
        if (this.type === 'elite') speed = 0.5; // Elite speed
        if (this.type === 'big') speed = 0.35; // Giảm từ 0.5

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
        
        // Vehicle Collision
        vehicles.forEach(vehicle => {
            if (checkCircleRectCollision(this, vehicle)) {
                resolveCollision(this, vehicle);
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
        ctx.fillStyle = this.color;
        const pixelSize = Math.max(2, Math.floor(this.radius * 2));
        ctx.fillRect(this.x - pixelSize/2, this.y - pixelSize/2, pixelSize, pixelSize);
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
        this.speed = 0.04; // Rotation speed (Increased)
        this.spinAngle = 0; // Góc xoay riêng của lưỡi cưa
    }

    update() {
        this.angle += this.speed;
        this.spinAngle += 0.05; // Tốc độ xoay của lưỡi cưa
        this.x = this.player.x + Math.cos(this.angle) * this.orbitRadius;
        this.y = this.player.y + Math.sin(this.angle) * this.orbitRadius;
        this.draw();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const rotation = Math.floor(this.spinAngle * 2) % 8; // Discrete rotation sử dụng spinAngle
        
        // Draw Sawblade - Pixel gear
        const pixelSize = 4;
        ctx.fillStyle = '#C0C0C0'; // Silver
        
        // Main disc (octagonal)
        ctx.fillRect(-this.radius, -pixelSize, this.radius * 2, pixelSize * 2); // Horizontal
        ctx.fillRect(-pixelSize, -this.radius, pixelSize * 2, this.radius * 2); // Vertical
        ctx.fillRect(-this.radius * 0.7, -this.radius * 0.7, this.radius * 1.4, pixelSize); // Diagonal 1
        ctx.fillRect(-this.radius * 0.7, this.radius * 0.7 - pixelSize, this.radius * 1.4, pixelSize); // Diagonal 2
        
        // Center hole
        ctx.fillStyle = '#333';
        ctx.fillRect(-5, -5, 10, 10);

        // Teeth - Pixel spikes
        ctx.fillStyle = '#808080';
        const teeth = [
            {x: this.radius, y: -2}, {x: -this.radius - 4, y: -2}, // Horizontal
            {x: -2, y: this.radius}, {x: -2, y: -this.radius - 4}, // Vertical
            {x: this.radius * 0.7, y: this.radius * 0.7}, // Diagonals
            {x: -this.radius * 0.7 - 4, y: -this.radius * 0.7 - 4},
            {x: this.radius * 0.7, y: -this.radius * 0.7 - 4},
            {x: -this.radius * 0.7 - 4, y: this.radius * 0.7}
        ];
        
        teeth.forEach((tooth, i) => {
            if ((i + rotation) % 2 === 0) {
                ctx.fillRect(tooth.x, tooth.y, 4, 4);
            }
        });
        
        ctx.restore();
    }
}

export class Spear {
    constructor(player, angleOffset) {
        this.player = player;
        this.angle = angleOffset;
        this.orbitRadius = 80; // Distance from player
        this.length = 60;
        this.speed = 0.03; // Rotation speed (Increased)
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
        const bob = Math.floor(Math.sin(performance.now() / 200) * 2); // Pixel bobbing

        // Pixel Pet (Floating Robot)
        // Body
        ctx.fillStyle = '#00BCD4'; // Cyan
        ctx.fillRect(-3 * scale, -3 * scale + bob, 6 * scale, 6 * scale);
        // Side panels
        ctx.fillStyle = '#0097A7';
        ctx.fillRect(-4 * scale, -2 * scale + bob, 1 * scale, 4 * scale);
        ctx.fillRect(3 * scale, -2 * scale + bob, 1 * scale, 4 * scale);
        
        // Eye
        ctx.fillStyle = '#212121';
        ctx.fillRect(-1 * scale, -1 * scale + bob, 3 * scale, 3 * scale);
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(0, 0 + bob, 1 * scale, 1 * scale); // Glowing pixel
        
        // Antenna
        ctx.fillStyle = '#B0BEC5';
        ctx.fillRect(-0.5 * scale, -6 * scale + bob, 1 * scale, 3 * scale);
        ctx.fillStyle = '#F44336'; // Red tip
        ctx.fillRect(-1 * scale, -7 * scale + bob, 2 * scale, 1 * scale);
        
        // Thruster - Animated
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(-2 * scale, 3 * scale + bob, 4 * scale, 1 * scale);
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#FFEB3B';
            ctx.fillRect(-1.5 * scale, 4 * scale + bob, 3 * scale, 2 * scale);
        }

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

        // Pixel Bomb - Classic round bomb
        // Body (Octagonal pixel circle)
        ctx.fillStyle = '#212121'; // Black
        ctx.fillRect(-5 * scale, -3 * scale, 10 * scale, 6 * scale); // Horizontal
        ctx.fillRect(-3 * scale, -5 * scale, 6 * scale, 10 * scale); // Vertical
        ctx.fillRect(-4 * scale, -4 * scale, 8 * scale, 8 * scale); // Center square
        
        // Shine
        ctx.fillStyle = '#424242';
        ctx.fillRect(-2 * scale, -3 * scale, 3 * scale, 3 * scale);
        
        // Fuse
        ctx.fillStyle = '#F57F17'; // Orange
        ctx.fillRect(-1 * scale, -7 * scale, 2 * scale, 4 * scale);
        
        // Spark (Blinking)
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#FFEB3B'; // Yellow
            ctx.fillRect(-2 * scale, -10 * scale, 4 * scale, 3 * scale);
            ctx.fillRect(-1 * scale, -11 * scale, 2 * scale, 2 * scale);
        }

        // Pulse effect before explosion
        if (this.timer < 20 && Math.floor(Date.now() / 50) % 2 === 0) {
             ctx.fillStyle = 'red';
             ctx.globalAlpha = 0.5;
             ctx.fillRect(-8 * scale, -8 * scale, 16 * scale, 16 * scale);
        }

        ctx.restore();
    }
}

export class StunBomb {
    constructor(x, y, targetX, targetY, level) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.radius = 8;
        this.speed = 8;
        this.exploded = false;
        this.level = level;
        // Range: 160px base + 10px per level
        this.range = 160 + (level * 10);
        this.stunDuration = 120; // 2 seconds (60fps)
        
        const angle = Math.atan2(targetY - y, targetX - x);
        this.velocity = {
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };
    }

    update() {
        // Move towards target
        const dist = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        
        if (dist < this.speed) {
            this.exploded = true;
        } else {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }
        
        this.draw();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotate (spin)
        ctx.rotate(performance.now() / 100);
        
        const scale = 1.5;
        
        // Bomb Body
        ctx.fillStyle = '#29B6F6'; // Light Blue
        ctx.beginPath();
        ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Electric details
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4 * scale, 0);
        ctx.lineTo(4 * scale, 0);
        ctx.moveTo(0, -4 * scale);
        ctx.lineTo(0, 4 * scale);
        ctx.stroke();

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
        this.baseDamage = 2; // Damage gốc = 2 ATK
        this.damagePerLevel = 1; // Mỗi level +1 ATK
        this.baseCooldown = 8000; // 8 seconds
        this.cooldownReductionPerLevel = 1000; // 1 second
        this.duration = 2000; // ActiActi
        this.state = 'COOLDOWN'; 
        this.timer = performance.now(); 
        this.lastFired = 0;
        this.fireRate = 200; // Bắn mỗi 0.2s (200ms)
        
        this.orbitAngle = 0;
        this.orbitRadius = 50;
    }

    get damage() {
        if (this.level === 1) return 2;
        if (this.level === 2) return 4;
        if (this.level === 3) return 5;
        if (this.level >= 4) return 10;
        return 2;
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
        
        // Discrete bobbing effect (pixel perfect)
        const bob = Math.floor(Math.sin(performance.now() / 200) * 3) * 2;
        ctx.translate(0, bob);

        const scale = 1.5;

        // Drone Body
        ctx.fillStyle = this.state === 'ACTIVE' ? '#00E5FF' : '#607D8B'; // Bright Cyan if active, Grey if cooldown
        
        // Quadcopter shape
        ctx.fillRect(-6 * scale, -2 * scale, 12 * scale, 4 * scale); // Main body horizontal
        ctx.fillRect(-2 * scale, -6 * scale, 4 * scale, 12 * scale); // Main body vertical
        ctx.fillRect(-3 * scale, -3 * scale, 6 * scale, 6 * scale); // Center hub
        
        // Body details
        ctx.fillStyle = this.state === 'ACTIVE' ? '#0097A7' : '#455A64';
        ctx.fillRect(-1 * scale, -4 * scale, 2 * scale, 8 * scale);
        ctx.fillRect(-4 * scale, -1 * scale, 8 * scale, 2 * scale);
        
        // Rotors
        ctx.fillStyle = '#212121';
        if (this.state === 'ACTIVE') {
            // Spin blur - pixel style (overlapping squares)
            ctx.globalAlpha = 0.3;
            ctx.fillRect(-10 * scale, -10 * scale, 8 * scale, 8 * scale);
            ctx.fillRect(2 * scale, -10 * scale, 8 * scale, 8 * scale);
            ctx.fillRect(-10 * scale, 2 * scale, 8 * scale, 8 * scale);
            ctx.fillRect(2 * scale, 2 * scale, 8 * scale, 8 * scale);
            ctx.globalAlpha = 1.0;
        } else {
            // Static rotors - propeller blades
            ctx.fillRect(-10 * scale, -7 * scale, 8 * scale, 2 * scale);
            ctx.fillRect(-7 * scale, -8 * scale, 2 * scale, 4 * scale);
            
            ctx.fillRect(2 * scale, -7 * scale, 8 * scale, 2 * scale);
            ctx.fillRect(7 * scale, -8 * scale, 2 * scale, 4 * scale);
            
            ctx.fillRect(-10 * scale, 5 * scale, 8 * scale, 2 * scale);
            ctx.fillRect(-7 * scale, 4 * scale, 2 * scale, 4 * scale);
            
            ctx.fillRect(2 * scale, 5 * scale, 8 * scale, 2 * scale);
            ctx.fillRect(7 * scale, 4 * scale, 2 * scale, 4 * scale);
        }

        // LED Status (Blinking when active)
        const blink = this.state === 'ACTIVE' && Math.floor(Date.now() / 200) % 2 === 0;
        ctx.fillStyle = this.state === 'ACTIVE' ? (blink ? '#76FF03' : '#00FF00') : '#F44336';
        ctx.fillRect(-1.5 * scale, -1.5 * scale, 3 * scale, 3 * scale);

        ctx.restore();
    }
}

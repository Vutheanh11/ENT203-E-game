import { ctx, canvas, world } from './Globals.js';

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
        
        // Flip sprite based on movement direction
        if (this.velocity.x < 0) {
            ctx.scale(-1, 1);
        }

        const scale = 0.4; // Even smaller scale for maximum detail

        // --- Hyper Detailed Pixel Soldier ---
        
        // Helper for drawing rects
        const drawRect = (color, x, y, w, h) => {
            ctx.fillStyle = color;
            ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
        };

        // 1. Legs & Boots
        // Back Leg
        drawRect('#1a1a1a', -10, 40, 14, 40); // Base
        drawRect('#0d0d0d', -10, 40, 4, 40); // Shadow
        // Front Leg
        drawRect('#2F2F2F', 10, 40, 14, 30); // Base
        drawRect('#1c1c1c', 10, 40, 4, 30); // Shadow
        // Camo spots on legs
        drawRect('#3E3E3E', 14, 50, 4, 4);
        drawRect('#3E3E3E', 18, 60, 3, 3);

        // Boots
        drawRect('#000000', -12, 75, 18, 10); // Back boot
        drawRect('#111111', -12, 75, 18, 3); // Highlight
        drawRect('#000000', 8, 65, 18, 10); // Front boot
        drawRect('#111111', 8, 65, 18, 3); // Highlight

        // 2. Torso & Vest
        // Undersuit
        drawRect('#263238', -20, 0, 40, 45);
        // Shading under arms
        drawRect('#101518', -18, 10, 4, 20);
        
        // Tactical Vest (Plate Carrier)
        drawRect('#1A237E', -22, 5, 44, 35); // Main body
        drawRect('#0D1245', -22, 35, 44, 5); // Bottom shadow
        drawRect('#283593', -20, 5, 40, 5); // Top highlight
        
        // Pouches (Ammo/Utility)
        // Pouch 1
        drawRect('#5D4037', -18, 25, 10, 12);
        drawRect('#3E2723', -18, 35, 10, 2); // Shadow
        drawRect('#8D6E63', -16, 27, 6, 6); // Flap
        // Pouch 2
        drawRect('#5D4037', -4, 25, 10, 12);
        drawRect('#3E2723', -4, 35, 10, 2);
        drawRect('#8D6E63', -2, 27, 6, 6);
        // Pouch 3
        drawRect('#5D4037', 10, 25, 10, 12);
        drawRect('#3E2723', 10, 35, 10, 2);
        drawRect('#8D6E63', 12, 27, 6, 6);

        // Chest Rig / Radio
        drawRect('#000000', 8, 8, 8, 10);
        drawRect('#333333', 10, 10, 4, 4); // Screen/Button

        // 3. Head
        // Balaclava
        drawRect('#111', -15, -10, 30, 15);
        drawRect('#222', -12, -8, 5, 10); // Ear protection highlight
        
        // Helmet
        drawRect('#33691E', -22, -35, 44, 25); // Dome
        drawRect('#558B2F', -18, -33, 10, 5); // Highlight
        drawRect('#1B5E20', -22, -15, 44, 5); // Rim shadow
        drawRect('#2E5215', -24, -15, 48, 8); // Brim/Accessories rail
        
        // Goggles
        drawRect('#FF6D00', -2, -22, 22, 10); // Lens
        drawRect('#FF9E80', 2, -20, 8, 4); // Reflection
        drawRect('#E65100', -2, -22, 22, 2); // Frame top
        drawRect('#E65100', -2, -14, 22, 2); // Frame bottom

        // 4. Arms & Weapon
        // Back Arm
        drawRect('#263238', -30, 10, 15, 25);
        drawRect('#101518', -30, 30, 15, 5); // Shadow
        
        // Weapon: Modern Assault Rifle
        // Stock
        drawRect('#3E2723', -15, 15, 20, 15);
        drawRect('#5D4037', -12, 18, 10, 8); // Detail
        // Receiver
        drawRect('#424242', 5, 15, 40, 15);
        drawRect('#616161', 10, 18, 25, 5); // Detail line
        // Pistol Grip
        drawRect('#3E2723', 5, 30, 10, 12);
        // Magazine
        drawRect('#212121', 20, 30, 12, 20);
        drawRect('#424242', 22, 32, 2, 16); // Ribbing
        // Handguard
        drawRect('#212121', 45, 20, 25, 8);
        drawRect('#424242', 48, 22, 20, 2); // Rails
        // Barrel
        drawRect('#111', 70, 22, 15, 4);
        // Muzzle Brake
        drawRect('#000', 85, 20, 6, 8);
        // Optic/Scope
        drawRect('#000', 15, 8, 20, 7);
        drawRect('#333', 15, 10, 5, 3); // Lens cap
        drawRect('#F44336', 34, 10, 1, 3); // Red dot lens

        // Front Arm
        drawRect('#263238', 10, 25, 30, 12); // Sleeve
        drawRect('#101518', 10, 35, 30, 2); // Shadow
        // Glove
        drawRect('#3E2723', 35, 25, 12, 12);
        drawRect('#5D4037', 38, 25, 8, 4); // Knuckle guard

        ctx.restore();
        
        // Health bar above player
        const barWidth = 40;
        const barHeight = 5;
        const yOffset = 40; // Adjusted for taller soldier
        
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
            ctx.translate(this.x, this.y); // Translate to player position
            const shieldRadius = this.radius + 12;
            const pixelSize = 4;
            const numSegments = 12; // Number of pixel blocks
            const angleStep = (Math.PI * 2) / numSegments;
            
            // Rotate the whole shield slowly
            const rotation = performance.now() / 500; 
            
            ctx.fillStyle = '#00E5FF'; // Cyan Neon
            
            // Outer Ring
            for(let i=0; i<numSegments; i++) {
                const angle = i * angleStep + rotation;
                const sx = Math.cos(angle) * shieldRadius;
                const sy = Math.sin(angle) * shieldRadius;
                
                // Draw pixel block
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
        this.x += this.velocity.x;
        this.y += this.velocity.y;

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
        
        // Flip sprite based on movement direction
        if (this.velocity.x < 0) {
            ctx.scale(-1, 1);
        }

        if (this.type === 'boss') {
            // Draw Pixel Art Skull for Boss
            const scale = 4; 
            ctx.fillStyle = '#FFFFFF'; 
            ctx.fillRect(-6 * scale, -8 * scale, 12 * scale, 10 * scale);
            ctx.fillRect(-4 * scale, 2 * scale, 8 * scale, 4 * scale);
            ctx.fillStyle = '#000000';
            ctx.fillRect(-4 * scale, -4 * scale, 3 * scale, 3 * scale);
            ctx.fillRect(1 * scale, -4 * scale, 3 * scale, 3 * scale);
            ctx.fillRect(-1 * scale, 0, 2 * scale, 2 * scale);
            ctx.fillRect(-3 * scale, 4 * scale, 1 * scale, 2 * scale);
            ctx.fillRect(-1 * scale, 4 * scale, 1 * scale, 2 * scale);
            ctx.fillRect(1 * scale, 4 * scale, 1 * scale, 2 * scale);

        } else if (this.type === 'small') {
            // Baby Zombie Pixel
            const scale = 2;
            // Head (Disproportionately large)
            ctx.fillStyle = '#8BC34A'; // Light Green
            ctx.fillRect(-3 * scale, -5 * scale, 6 * scale, 5 * scale);
            // Eyes
            ctx.fillStyle = 'black';
            ctx.fillRect(-2 * scale, -3 * scale, 1 * scale, 1 * scale);
            ctx.fillRect(1 * scale, -3 * scale, 1 * scale, 1 * scale);
            // Body
            ctx.fillStyle = '#0288D1'; // Blue Shirt
            ctx.fillRect(-2 * scale, 0, 4 * scale, 3 * scale);
            // Arms (Outstretched)
            ctx.fillStyle = '#8BC34A';
            ctx.fillRect(2 * scale, 0, 3 * scale, 1 * scale); 
            // Legs
            ctx.fillStyle = '#303F9F'; // Dark Blue Pants
            ctx.fillRect(-2 * scale, 3 * scale, 1.5 * scale, 2 * scale);
            ctx.fillRect(0.5 * scale, 3 * scale, 1.5 * scale, 2 * scale);

        } else if (this.type === 'elite') {
            // Zombie Pixel
            const scale = 2.5;
            // Head
            ctx.fillStyle = '#4CAF50'; // Green
            ctx.fillRect(-2.5 * scale, -4 * scale, 5 * scale, 4 * scale);
            // Eyes
            ctx.fillStyle = 'black';
            ctx.fillRect(-1.5 * scale, -2.5 * scale, 1 * scale, 1 * scale);
            ctx.fillRect(1.5 * scale, -2.5 * scale, 1 * scale, 1 * scale);
            // Body
            ctx.fillStyle = '#5D4037'; // Brown Shirt
            ctx.fillRect(-3 * scale, 0, 6 * scale, 5 * scale);
            // Arms (Outstretched)
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(3 * scale, 0, 4 * scale, 1.5 * scale); 
            // Legs
            ctx.fillStyle = '#1A237E'; // Blue Pants
            ctx.fillRect(-2.5 * scale, 5 * scale, 2 * scale, 4 * scale);
            ctx.fillRect(0.5 * scale, 5 * scale, 2 * scale, 4 * scale);

        } else if (this.type === 'big') {
            // Armored Zombie Pixel
            const scale = 3;
            // Helmet
            ctx.fillStyle = '#616161'; // Dark Grey Helmet
            ctx.fillRect(-3 * scale, -5 * scale, 6 * scale, 3 * scale);
            // Face (Visible part)
            ctx.fillStyle = '#2E7D32'; // Dark Green
            ctx.fillRect(-2.5 * scale, -2 * scale, 5 * scale, 2 * scale);
            // Eyes (Red glowing)
            ctx.fillStyle = '#D32F2F';
            ctx.fillRect(-1.5 * scale, -1.5 * scale, 1 * scale, 1 * scale);
            ctx.fillRect(1.5 * scale, -1.5 * scale, 1 * scale, 1 * scale);
            // Chestplate
            ctx.fillStyle = '#9E9E9E'; // Grey Armor
            ctx.fillRect(-4 * scale, 0, 8 * scale, 6 * scale);
            // Shoulders
            ctx.fillStyle = '#757575';
            ctx.fillRect(-5 * scale, -1 * scale, 2 * scale, 3 * scale); // Left
            ctx.fillRect(3 * scale, -1 * scale, 2 * scale, 3 * scale); // Right
            // Arms
            ctx.fillStyle = '#2E7D32';
            ctx.fillRect(4 * scale, 1 * scale, 4 * scale, 2 * scale);
            // Legs (Greaves)
            ctx.fillStyle = '#616161';
            ctx.fillRect(-3 * scale, 6 * scale, 2.5 * scale, 5 * scale);
            ctx.fillRect(0.5 * scale, 6 * scale, 2.5 * scale, 5 * scale);

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
        // Move towards player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.velocity = {
            x: Math.cos(angle) * 0.2,
            y: Math.sin(angle) * 0.2
        };
        this.x += this.velocity.x;
        this.y += this.velocity.y;
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
        
        const text = Math.floor(this.damage);
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
        
        // Flickering fire effect
        const flicker = Math.random() * 0.2 + 0.8;
        const scale = flicker;

        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#FF5722'; // Deep Orange
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFEB3B'; // Yellow center
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}


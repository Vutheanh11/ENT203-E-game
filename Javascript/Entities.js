import { ctx, canvas } from './Globals.js';

export class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = { x: 0, y: 0 };
        this.speed = 1;
        this.maxHealth = 150;
        this.health = 150;
        this.lastDamageTime = 0;
        this.invulnerableTime = 500; // ms
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
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Boundary checks
        if (this.x - this.radius < 0) this.x = this.radius;
        if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;
        if (this.y - this.radius < 0) this.y = this.radius;
        if (this.y + this.radius > canvas.height) this.y = canvas.height - this.radius;
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
        if (this.type === 'boss') {
            // Draw Pixel Art Skull for Boss
            ctx.save();
            ctx.translate(this.x, this.y);
            const scale = 4; // Scale up the pixel art
            
            ctx.fillStyle = '#FFFFFF'; // White skull
            
            // Skull Shape (Simplified Pixel Art)
            // Main cranium
            ctx.fillRect(-6 * scale, -8 * scale, 12 * scale, 10 * scale);
            // Jaw
            ctx.fillRect(-4 * scale, 2 * scale, 8 * scale, 4 * scale);
            
            // Eyes (Black)
            ctx.fillStyle = '#000000';
            ctx.fillRect(-4 * scale, -4 * scale, 3 * scale, 3 * scale);
            ctx.fillRect(1 * scale, -4 * scale, 3 * scale, 3 * scale);
            
            // Nose
            ctx.fillRect(-1 * scale, 0, 2 * scale, 2 * scale);
            
            // Teeth
            ctx.fillRect(-3 * scale, 4 * scale, 1 * scale, 2 * scale);
            ctx.fillRect(-1 * scale, 4 * scale, 1 * scale, 2 * scale);
            ctx.fillRect(1 * scale, 4 * scale, 1 * scale, 2 * scale);
            
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
        
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
        
        // Draw Spear shaft
        ctx.fillStyle = '#8B4513'; // Brown
        ctx.fillRect(0, -2, this.length, 4);
        
        // Draw Spear head
        ctx.fillStyle = '#C0C0C0'; // Silver
        ctx.beginPath();
        ctx.moveTo(this.length + 15, 0);
        ctx.lineTo(this.length, -6);
        ctx.lineTo(this.length, 6);
        ctx.fill();

        ctx.restore();
    }
}

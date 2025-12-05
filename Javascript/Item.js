import { ctx } from './Globals.js';

export class ExpGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 5;
        this.color = '#00ffff'; // Cyan
        this.magnetized = false;
        this.speed = 8;
    }

    draw() {
        // Pixel Gem (Diamond shape)
        ctx.save();
        ctx.translate(this.x, this.y);
        const pixelSize = 2;
        
        ctx.fillStyle = this.color;
        // Diamond shape using pixels
        ctx.fillRect(0, -this.radius, pixelSize, pixelSize); // Top
        ctx.fillRect(-this.radius, 0, pixelSize, pixelSize); // Left
        ctx.fillRect(this.radius - pixelSize, 0, pixelSize, pixelSize); // Right
        ctx.fillRect(0, this.radius - pixelSize, pixelSize, pixelSize); // Bottom
        
        // Fill center
        ctx.fillRect(-pixelSize, -pixelSize, pixelSize * 2, pixelSize * 2);
        ctx.fillRect(-this.radius/2, -pixelSize, this.radius, pixelSize * 2);
        ctx.fillRect(-pixelSize, -this.radius/2, pixelSize * 2, this.radius);
        
        // Shine effect - white pixel
        ctx.fillStyle = 'white';
        ctx.fillRect(-pixelSize/2, -this.radius/2, pixelSize, pixelSize);
        ctx.restore();
    }

    update(player) {
        this.draw();
        
        // Magnet effect when close to player
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (dist < 100) { // Magnet range
            this.magnetized = true;
        }

        if (this.magnetized) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
    }
}

export class Magnet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.type = 'magnet';
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 1.5;
        // Draw Magnet U-shape
        ctx.fillStyle = '#F44336'; // Red (N)
        ctx.fillRect(-6 * scale, -6 * scale, 4 * scale, 10 * scale);
        ctx.fillStyle = '#2196F3'; // Blue (S)
        ctx.fillRect(2 * scale, -6 * scale, 4 * scale, 10 * scale);
        ctx.fillStyle = '#9E9E9E'; // Connector
        ctx.fillRect(-6 * scale, 0 * scale, 12 * scale, 4 * scale);
        ctx.restore();
    }

    update() {
        this.draw();
    }
}

export class Meat {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.type = 'meat';
        this.healAmount = 50;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 1.5;
        
        // Bone - Pixel style
        ctx.fillStyle = '#EEEEEE';
        ctx.fillRect(-7 * scale, -3 * scale, 4 * scale, 6 * scale); // Left knob
        ctx.fillRect(-3 * scale, -1 * scale, 6 * scale, 2 * scale); // Middle
        ctx.fillRect(3 * scale, -3 * scale, 4 * scale, 6 * scale); // Right knob

        // Meat - Pixel blob
        ctx.fillStyle = '#D84315'; // Cooked meat color
        ctx.fillRect(0, -6 * scale, 10 * scale, 12 * scale); // Main body
        ctx.fillRect(-2 * scale, -4 * scale, 2 * scale, 8 * scale); // Left extension
        ctx.fillRect(10 * scale, -4 * scale, 2 * scale, 8 * scale); // Right extension
        
        // Grill marks - Pixel lines
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(2 * scale, -4 * scale, 6 * scale, 1 * scale);
        ctx.fillRect(2 * scale, 0, 6 * scale, 1 * scale);
        ctx.fillRect(2 * scale, 3 * scale, 6 * scale, 1 * scale);
        
        // Highlight
        ctx.fillStyle = '#FF6F00';
        ctx.fillRect(2 * scale, -5 * scale, 3 * scale, 2 * scale);

        ctx.restore();
    }

    update() {
        this.draw();
    }
}

export class NightVision {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.type = 'nightVision';
        this.duration = 10000; // 10 seconds
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 1.5;
        
        // Goggles Frame
        ctx.fillStyle = '#212121';
        ctx.fillRect(-10 * scale, -4 * scale, 20 * scale, 8 * scale);
        
        // Lenses (Green) - Pixel circles
        ctx.fillStyle = '#00E676'; // Bright Green
        // Left lens
        ctx.fillRect(-6 * scale, -2 * scale, 4 * scale, 4 * scale); // Center
        ctx.fillRect(-7 * scale, -1 * scale, 6 * scale, 2 * scale); // Horizontal
        ctx.fillRect(-5 * scale, -3 * scale, 2 * scale, 6 * scale); // Vertical
        // Right lens
        ctx.fillRect(2 * scale, -2 * scale, 4 * scale, 4 * scale); // Center
        ctx.fillRect(1 * scale, -1 * scale, 6 * scale, 2 * scale); // Horizontal
        ctx.fillRect(3 * scale, -3 * scale, 2 * scale, 6 * scale); // Vertical
        
        // Glare/Shine
        ctx.fillStyle = '#76FF03';
        ctx.fillRect(-5 * scale, -2 * scale, 2 * scale, 2 * scale);
        ctx.fillRect(3 * scale, -2 * scale, 2 * scale, 2 * scale);
        
        // Strap - Pixel lines
        ctx.fillStyle = '#424242';
        ctx.fillRect(-12 * scale, -1 * scale, 2 * scale, 2 * scale);
        ctx.fillRect(-14 * scale, -2 * scale, 2 * scale, 2 * scale);
        ctx.fillRect(10 * scale, -1 * scale, 2 * scale, 2 * scale);
        ctx.fillRect(12 * scale, -2 * scale, 2 * scale, 2 * scale);

        ctx.restore();
    }

    update() {
        this.draw();
    }
}

export function drawIcon(ctx, type, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    const scale = 2;

    if (type === 'damage') {
        // Bullet Icon - Pixel style
        ctx.fillStyle = '#FFD700';
        // Bullet tip
        ctx.fillRect(-2, -8, 4, 2);
        ctx.fillRect(-3, -6, 6, 2);
        // Bullet body
        ctx.fillRect(-4, -4, 8, 12);
        // Case
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(-3, 8, 6, 4);
    } else if (type === 'speed') {
        // Boot Icon - Pixel style
        ctx.fillStyle = '#8D6E63';
        // Boot shaft
        ctx.fillRect(-4, -10, 8, 10);
        // Boot sole
        ctx.fillRect(-4, 0, 12, 4);
        ctx.fillRect(-4, 4, 14, 4);
        // Speed lines
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-8, -6, 3, 1);
        ctx.fillRect(-9, -2, 4, 1);
        ctx.fillRect(-7, 2, 2, 1);
    } else if (type === 'fireRate') {
        // Rapid Fire Icon (3 bullets) - Pixel style
        ctx.fillStyle = '#FFD700';
        for(let i=-1; i<=1; i++) {
            // Bullet tip
            ctx.fillRect(i * 8 - 1, -8, 2, 2);
            ctx.fillRect(i * 8 - 2, -6, 4, 2);
            // Bullet body
            ctx.fillRect(i * 8 - 2, -4, 4, 8);
        }
    } else if (type === 'multishot') {
        // Spread Icon - Pixel bullets
        ctx.fillStyle = 'white';
        // Center bullet
        ctx.fillRect(-2, 3, 4, 6);
        ctx.fillRect(-1, 1, 2, 2);
        // Left bullet
        ctx.fillRect(-12, -7, 4, 6);
        ctx.fillRect(-11, -9, 2, 2);
        // Right bullet
        ctx.fillRect(8, -7, 4, 6);
        ctx.fillRect(9, -9, 2, 2);
        // Spread lines
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-6, 0, 2, 1);
        ctx.fillRect(4, 0, 2, 1);
    } else if (type === 'sawblade') {
        // Sawblade Icon - Pure pixel gear
        ctx.fillStyle = '#C0C0C0';
        // Octagonal disc
        ctx.fillRect(-8, -3, 16, 6); // Horizontal
        ctx.fillRect(-3, -8, 6, 16); // Vertical
        ctx.fillRect(-6, -6, 12, 12); // Center
        // Teeth
        ctx.fillStyle = '#808080';
        ctx.fillRect(8, -2, 3, 4); // Right
        ctx.fillRect(-11, -2, 3, 4); // Left
        ctx.fillRect(-2, 8, 4, 3); // Bottom
        ctx.fillRect(-2, -11, 4, 3); // Top
        ctx.fillRect(6, 6, 3, 3); // Diagonal
        ctx.fillRect(-9, -9, 3, 3);
        ctx.fillRect(6, -9, 3, 3);
        ctx.fillRect(-9, 6, 3, 3);
        // Center hole
        ctx.fillStyle = '#333';
        ctx.fillRect(-3, -3, 6, 6);
    } else if (type === 'spear') {
        // Spear Icon (Pixelated)
        ctx.rotate(-Math.PI / 4);
        const scale = 2;
        // Shaft
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(-1 * scale, -8 * scale, 2 * scale, 16 * scale);
        // Grip
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-1.5 * scale, 2 * scale, 3 * scale, 4 * scale);
        // Head
        ctx.fillStyle = '#CFD8DC';
        ctx.fillRect(-2 * scale, -10 * scale, 4 * scale, 2 * scale); // Base
        ctx.fillRect(-1.5 * scale, -12 * scale, 3 * scale, 2 * scale); // Mid
        ctx.fillRect(-0.5 * scale, -14 * scale, 1 * scale, 2 * scale); // Tip
    } else if (type === 'pet') {
        // Pet Icon
        ctx.fillStyle = '#00BCD4';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = 'white';
        ctx.fillRect(-2, -2, 4, 4);
    } else if (type === 'shield') {
        // Shield Icon (Pixelated)
        ctx.fillStyle = '#00E5FF';
        const scale = 2;
        // Draw pixel circle
        const pixels = [
            [-2, -4], [-1, -4], [0, -4], [1, -4], [2, -4],
            [-3, -3], [3, -3],
            [-4, -2], [4, -2],
            [-4, -1], [4, -1],
            [-4, 0], [4, 0],
            [-4, 1], [4, 1],
            [-4, 2], [4, 2],
            [-3, 3], [3, 3],
            [-2, 4], [-1, 4], [0, 4], [1, 4], [2, 4]
        ];
        pixels.forEach(p => {
            ctx.fillRect(p[0] * scale, p[1] * scale, scale, scale);
        });
        // Inner fill
        ctx.globalAlpha = 0.3;
        ctx.fillRect(-3 * scale, -3 * scale, 6 * scale, 6 * scale);
    } else if (type === 'magnet') {
        // Magnet Icon
        ctx.fillStyle = '#F44336';
        ctx.fillRect(-6, -6, 4, 10);
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(2, -6, 4, 10);
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(-6, 0, 12, 4);
    } else if (type === 'meat') {
        // Meat Icon
        ctx.fillStyle = '#EEEEEE';
        ctx.beginPath();
        ctx.arc(-5, -2, 2, 0, Math.PI * 2);
        ctx.arc(-5, 2, 2, 0, Math.PI * 2);
        ctx.fillRect(-5, -1, 6, 2);
        ctx.fill();
        ctx.fillStyle = '#D84315';
        ctx.beginPath();
        ctx.ellipse(2, 0, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'nightVision') {
        // Night Vision Icon
        ctx.fillStyle = '#212121';
        ctx.fillRect(-8, -3, 16, 6);
        ctx.fillStyle = '#00E676';
        ctx.beginPath();
        ctx.arc(-4, 0, 3, 0, Math.PI * 2);
        ctx.arc(4, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'boss') {
        // Boss Skull Icon
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(-6, -8, 12, 10);
        ctx.fillRect(-4, 2, 8, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, -4, 3, 3);
        ctx.fillRect(1, -4, 3, 3);
    } else if (type === 'fireRain') {
        // Fire Rain Icon - Pixel cloud and fire
        ctx.fillStyle = '#424242'; // Dark cloud
        // Cloud shape (pixel blob)
        ctx.fillRect(-8, -8, 16, 6);
        ctx.fillRect(-10, -6, 4, 4);
        ctx.fillRect(6, -6, 4, 4);
        ctx.fillRect(-6, -10, 12, 4);
        // Fire drops
        ctx.fillStyle = '#FF5722'; // Orange
        ctx.fillRect(-6, 2, 3, 4);
        ctx.fillRect(-5, 0, 1, 2);
        ctx.fillStyle = '#FFEB3B'; // Yellow
        ctx.fillRect(0, 4, 3, 4);
        ctx.fillRect(1, 2, 1, 2);
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(5, 6, 3, 4);
        ctx.fillRect(6, 4, 1, 2);
    } else if (type === 'crit') {
        // Crit Icon - Pixel lightning bolt
        ctx.fillStyle = '#FFEB3B'; // Yellow
        // Zigzag lightning
        ctx.fillRect(0, -10, 3, 4); // Top
        ctx.fillRect(-3, -6, 6, 3); // Upper middle
        ctx.fillRect(0, -3, 4, 4); // Middle
        ctx.fillRect(-2, 1, 4, 3); // Lower middle  
        ctx.fillRect(0, 4, 3, 4); // Bottom
        // Red core
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(1, -5, 1, 8);
    } else if (type === 'drone') {
        // Drone Icon - Pixel quadcopter
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(-6, -2, 12, 4); // Horizontal
        ctx.fillRect(-2, -6, 4, 12); // Vertical
        ctx.fillRect(-3, -3, 6, 6); // Center
        // Rotors - pixel propellers
        ctx.fillStyle = '#212121';
        ctx.fillRect(-9, -7, 6, 2);
        ctx.fillRect(-7, -9, 2, 6);
        ctx.fillRect(3, -7, 6, 2);
        ctx.fillRect(5, -9, 2, 6);
        ctx.fillRect(-9, 5, 6, 2);
        ctx.fillRect(-7, 3, 2, 6);
        ctx.fillRect(3, 5, 6, 2);
        ctx.fillRect(5, 3, 2, 6);
    } else if (type === 'boss_spider') {
        // Spider Icon - Pixel spider
        ctx.fillStyle = '#212121';
        // Body (octagonal)
        ctx.fillRect(-5, -2, 10, 4); // Center
        ctx.fillRect(-3, -5, 6, 10); // Center vertical
        // Legs - pixel style
        ctx.fillRect(-10, -4, 5, 1); ctx.fillRect(5, -4, 5, 1); // Top
        ctx.fillRect(-10, -1, 5, 1); ctx.fillRect(5, -1, 5, 1); // Mid-top
        ctx.fillRect(-10, 2, 5, 1); ctx.fillRect(5, 2, 5, 1); // Mid-bottom
        ctx.fillRect(-10, 5, 5, 1); ctx.fillRect(5, 5, 5, 1); // Bottom
        // Red Mark
        ctx.fillStyle = 'red';
        ctx.fillRect(-2, -2, 4, 4);
    } else if (type === 'boss_mutant') {
        // Mutant Icon - Pixel mutant
        ctx.fillStyle = '#689F38'; // Green Head
        ctx.fillRect(-5, -5, 10, 10); // Square head
        ctx.fillRect(-3, -7, 6, 2); // Top
        // Pustule
        ctx.fillStyle = '#76FF03';
        ctx.fillRect(-2, -2, 3, 3);
        // Big Arm - Pixel blob
        ctx.fillStyle = '#33691E';
        ctx.fillRect(5, -4, 8, 8);
        ctx.fillRect(7, -5, 4, 2);
        ctx.fillRect(7, 3, 4, 2);
        // Fist
        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(12, -2, 3, 4);
    } else if (type === 'stunBomb') {
        // Stun Bomb Icon - Blue/White Bomb
        ctx.fillStyle = '#29B6F6'; // Light Blue
        ctx.beginPath();
        ctx.arc(0, 2, 6, 0, Math.PI * 2);
        ctx.fill();
        // Fuse
        ctx.fillStyle = '#424242';
        ctx.fillRect(-1, -6, 2, 4);
        // Spark
        ctx.fillStyle = '#FFF176';
        ctx.fillRect(-1, -8, 2, 2);
        // Lightning symbol
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(1, 0);
        ctx.lineTo(-2, 2);
        ctx.lineTo(0, 4);
        ctx.lineTo(-1, 6);
        ctx.lineTo(2, 3);
        ctx.lineTo(0, 1);
        ctx.fill();
    }

    ctx.restore();
}

const allUpgrades = [
    { type: 'damage', title: 'Increase Damage', desc: 'Deals +2 damage per shot' },
    { type: 'speed', title: 'Increase Speed', desc: 'Move 20% faster' },
    { type: 'fireRate', title: 'Increase Fire Rate', desc: 'Shoot 10% faster' },
    { type: 'multishot', title: 'Multishot', desc: 'Fire more projectiles' },
    { type: 'sawblade', title: 'Add Sawblade', desc: 'Orbiting blade (ATK: 20)' },
    { type: 'spear', title: 'Add Spear', desc: 'Orbiting spear (ATK: 10)' },
    { type: 'pet', title: 'Get Pet', desc: 'Drops bombs every 5-8s' },
    { type: 'shield', title: 'Energy Shield', desc: 'Blocks 1 hit. Cooldown: 60s' },
    { type: 'fireRain', title: 'Fire Rain', desc: 'Random fire bombs (2-6 DMG)' },
    { type: 'crit', title: 'Critical Strike', desc: 'Increase Crit Chance (Base 8%, +3%/Lvl)' },
    { type: 'drone', title: 'Combat Drone', desc: 'Shoots 10 bullets in 2s (2/4/5/10 DMG)' },
    { type: 'stunBomb', title: 'Stun Bomb', desc: 'Stuns enemies in 160px range (8s CD)' }
];

function applyUpgrade(type, player, updateStatsCallback) {
    let value = 0;
    if (type === 'speed') {
        player.speed *= 1.2;
    } else if (type === 'fireRate') {
        value = 0.9;
    }
    updateStatsCallback(type, value);
}

export function showUpgradeOptions(player, resumeCallback, updateStatsCallback, currentLevels, maxLevel) {
    const modal = document.getElementById('level-up-modal');
    const optionsContainer = document.getElementById('upgrade-options');
    optionsContainer.innerHTML = '';
    modal.classList.remove('hidden');

    // Filter out maxed upgrades
    const availableUpgrades = allUpgrades.filter(u => currentLevels[u.type] < maxLevel);

    // If no upgrades available (all maxed), maybe heal or give score?
    if (availableUpgrades.length === 0) {
        availableUpgrades.push({ type: 'heal', title: 'Full Heal', desc: 'Restore full health (Not impl yet)' });
        // For now just give score or something, but let's assume user won't max everything instantly
    }

    // Pick 3 random
    const randomUpgrades = [];
    const tempUpgrades = [...availableUpgrades];
    for(let i=0; i<3; i++) {
        if(tempUpgrades.length === 0) break;
        const randomIndex = Math.floor(Math.random() * tempUpgrades.length);
        randomUpgrades.push(tempUpgrades[randomIndex]);
        tempUpgrades.splice(randomIndex, 1);
    }

    randomUpgrades.forEach(upgrade => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        
        // Show level if applicable
        let levelText = "";
        if (currentLevels[upgrade.type] !== undefined) {
            levelText = ` (Lvl ${currentLevels[upgrade.type] + 1})`;
        }

        // Create Canvas for Icon
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = 50;
        iconCanvas.height = 50;
        iconCanvas.className = 'upgrade-icon';
        const iconCtx = iconCanvas.getContext('2d');
        drawIcon(iconCtx, upgrade.type, 50, 50);

        const textDiv = document.createElement('div');
        textDiv.innerHTML = `<h3>${upgrade.title}${levelText}</h3><p>${upgrade.desc}</p>`;

        card.appendChild(iconCanvas);
        card.appendChild(textDiv);

        card.onclick = () => {
            applyUpgrade(upgrade.type, player, updateStatsCallback);
            modal.classList.add('hidden');
            resumeCallback();
        };
        optionsContainer.appendChild(card);
    });
}

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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        // Shine effect
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
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
        
        // Bone
        ctx.fillStyle = '#EEEEEE';
        ctx.beginPath();
        ctx.arc(-5 * scale, -2 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.arc(-5 * scale, 2 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fillRect(-5 * scale, -1 * scale, 6 * scale, 2 * scale);
        ctx.fill();

        // Meat
        ctx.fillStyle = '#D84315'; // Cooked meat color
        ctx.beginPath();
        ctx.ellipse(2 * scale, 0, 6 * scale, 4 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Grill marks
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -2 * scale);
        ctx.lineTo(4 * scale, -2 * scale);
        ctx.moveTo(0, 0);
        ctx.lineTo(4 * scale, 0);
        ctx.moveTo(0, 2 * scale);
        ctx.lineTo(4 * scale, 2 * scale);
        ctx.stroke();

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
        // Bullet Icon
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -5, 5, Math.PI, 0);
        ctx.lineTo(5, 10);
        ctx.lineTo(-5, 10);
        ctx.fill();
    } else if (type === 'speed') {
        // Boot Icon
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.moveTo(-5, -10);
        ctx.lineTo(5, -10);
        ctx.lineTo(5, 5);
        ctx.lineTo(10, 5);
        ctx.lineTo(10, 10);
        ctx.lineTo(-5, 10);
        ctx.fill();
    } else if (type === 'fireRate') {
        // Rapid Fire Icon (3 bullets)
        ctx.fillStyle = '#FFD700';
        for(let i=-1; i<=1; i++) {
            ctx.beginPath();
            ctx.arc(i * 8, -5, 3, Math.PI, 0);
            ctx.lineTo(i * 8 + 3, 5);
            ctx.lineTo(i * 8 - 3, 5);
            ctx.fill();
        }
    } else if (type === 'multishot') {
        // Spread Icon
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-10, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -5, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'sawblade') {
        // Sawblade Icon
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#808080';
        for(let i=0; i<8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(15, 2);
            ctx.lineTo(10, 4);
            ctx.fill();
        }
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
    } else if (type === 'boss') {
        // Boss Skull Icon
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillRect(-6, -8, 12, 10);
        ctx.fillRect(-4, 2, 8, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, -4, 3, 3);
        ctx.fillRect(1, -4, 3, 3);
    } else if (type === 'fireRain') {
        // Fire Rain Icon
        ctx.fillStyle = '#FF5722'; // Orange
        // Cloud
        ctx.beginPath();
        ctx.arc(-5, -5, 6, 0, Math.PI * 2);
        ctx.arc(5, -5, 6, 0, Math.PI * 2);
        ctx.arc(0, -8, 6, 0, Math.PI * 2);
        ctx.fill();
        // Drops
        ctx.fillStyle = '#FFEB3B'; // Yellow
        ctx.beginPath();
        ctx.arc(-3, 5, 2, 0, Math.PI * 2);
        ctx.arc(3, 8, 2, 0, Math.PI * 2);
        ctx.arc(0, 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

export function showUpgradeOptions(player, resumeCallback, updateStatsCallback, currentLevels, maxLevel) {
    const modal = document.getElementById('level-up-modal');
    const optionsContainer = document.getElementById('upgrade-options');
    optionsContainer.innerHTML = '';
    modal.classList.remove('hidden');

    const allUpgrades = [
        { type: 'damage', title: 'Increase Damage', desc: 'Deals +2 damage per shot' },
        { type: 'speed', title: 'Increase Speed', desc: 'Move 20% faster' },
        { type: 'fireRate', title: 'Increase Fire Rate', desc: 'Shoot 10% faster' },
        { type: 'multishot', title: 'Multishot', desc: 'Fire more projectiles' },
        { type: 'sawblade', title: 'Add Sawblade', desc: 'Orbiting blade (ATK: 20)' },
        { type: 'spear', title: 'Add Spear', desc: 'Orbiting spear (ATK: 10)' },
        { type: 'pet', title: 'Get Pet', desc: 'Drops bombs every 5-8s' },
        { type: 'shield', title: 'Energy Shield', desc: 'Blocks 1 hit. Cooldown: 60s' },
        { type: 'fireRain', title: 'Fire Rain', desc: 'Random fire bombs (2-6 DMG)' }
    ];

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

function applyUpgrade(type, player, updateStatsCallback) {
    switch(type) {
        case 'damage':
            updateStatsCallback('damage', 1);
            break;
        case 'speed':
            player.speed *= 1.2;
            console.log("Speed Upgraded:", player.speed);
            break;
        case 'fireRate':
            updateStatsCallback('fireRate', 0.9); // Multiplier
            break;
        case 'multishot':
            updateStatsCallback('multishot', 1);
            break;
        case 'sawblade':
            updateStatsCallback('sawblade', 1);
            break;
        case 'spear':
            updateStatsCallback('spear', 1);
            break;
        case 'pet':
            updateStatsCallback('pet', 1);
            break;
        case 'shield':
            updateStatsCallback('shield', 1);
            break;
        case 'fireRain':
            updateStatsCallback('fireRain', 1);
            break;
    }
}

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
        { type: 'spear', title: 'Add Spear', desc: 'Orbiting spear (ATK: 10)' }
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

        card.innerHTML = `<h3>${upgrade.title}${levelText}</h3><p>${upgrade.desc}</p>`;
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
    }
}

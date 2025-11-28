import { canvas, ctx, scoreEl, levelEl, expBarEl, world } from './Globals.js';
import { Player, Projectile, Enemy, Particle, Sawblade, Spear, Pet, Bomb, DamageNumber, FirePatch } from './Entities.js';
import { ExpGem, showUpgradeOptions, Magnet, Meat, drawIcon } from './Item.js';
import { startMathQuiz } from './Quiz.js';

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 15, 'white');
let projectiles = [];
let enemies = [];
let particles = [];
let expGems = [];
let items = [];
let sawblades = [];
let spears = [];
let bombs = [];
let damageNumbers = [];
let firePatches = [];
let pet = null;

let animationId;
let score = 0;
let level = 1;
let exp = 0;
let expToNextLevel = 100;
let difficultyMultiplier = 1;
let isPaused = false;
let playerDamage = 10;
let fireRate = 1000; // ms
let lastFired = 0;
let projectileCount = 1;

// Upgrade Tracking
let upgradeLevels = {
    damage: 0,
    speed: 0,
    fireRate: 0,
    multishot: 0,
    sawblade: 0,
    spear: 0,
    pet: 0,
    shield: 0,
    fireRain: 0
};
const MAX_LEVEL = 4;

let bossSpawnCount = 0;

// Background Canvas
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');

function generateRuinedStreetBackground() {
    bgCanvas.width = world.width;
    bgCanvas.height = world.height;

    // 1. Base Asphalt
    bgCtx.fillStyle = '#2c2c2c';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    // 2. Noise/Texture
    for (let i = 0; i < 7000; i++) { // Adjusted for 2000x2000 map
        const x = Math.random() * bgCanvas.width;
        const y = Math.random() * bgCanvas.height;
        const size = Math.random() * 3;
        bgCtx.fillStyle = Math.random() > 0.5 ? '#333' : '#222';
        bgCtx.fillRect(x, y, size, size);
    }

    // 3. Road Markings (Faded)
    bgCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const laneWidth = 100;
    const dashHeight = 40;
    const gapHeight = 60;
    
    // Vertical Road
    const centerX = bgCanvas.width / 2;
    for (let y = 0; y < bgCanvas.height; y += dashHeight + gapHeight) {
        bgCtx.fillRect(centerX - 5, y, 10, dashHeight);
    }
    
    // Horizontal Road
    const centerY = bgCanvas.height / 2;
    for (let x = 0; x < bgCanvas.width; x += dashHeight + gapHeight) {
        bgCtx.fillRect(x, centerY - 5, dashHeight, 10);
    }

    // 4. Cracks
    bgCtx.strokeStyle = '#111';
    bgCtx.lineWidth = 2;
    for (let i = 0; i < 100; i++) { // More cracks
        bgCtx.beginPath();
        let cx = Math.random() * bgCanvas.width;
        let cy = Math.random() * bgCanvas.height;
        bgCtx.moveTo(cx, cy);
        for (let j = 0; j < 5; j++) {
            cx += (Math.random() - 0.5) * 50;
            cy += (Math.random() - 0.5) * 50;
            bgCtx.lineTo(cx, cy);
        }
        bgCtx.stroke();
    }

    // 5. Rubble/Debris
    for (let i = 0; i < 200; i++) { // More rubble
        const rx = Math.random() * bgCanvas.width;
        const ry = Math.random() * bgCanvas.height;
        const rSize = Math.random() * 20 + 5;
        
        bgCtx.fillStyle = '#444';
        bgCtx.beginPath();
        bgCtx.arc(rx, ry, rSize, 0, Math.PI * 2);
        bgCtx.fill();
        
        // Highlight
        bgCtx.fillStyle = '#555';
        bgCtx.beginPath();
        bgCtx.arc(rx - 2, ry - 2, rSize * 0.5, 0, Math.PI * 2);
        bgCtx.fill();
    }
}

// Call immediately to ensure background exists before animation starts
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
generateRuinedStreetBackground();

// Spear Logic
// Removed cooldown logic as spears are now permanent orbiting objects

function init() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    player = new Player(world.width / 2, world.height / 2, 15, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    expGems = [];
    items = [];
    sawblades = [];
    spears = [];
    bombs = [];
    damageNumbers = [];
    firePatches = [];
    pet = null;
    score = 0;
    level = 1;
    exp = 0;
    expToNextLevel = 100;
    difficultyMultiplier = 1;
    isPaused = false;
    playerDamage = 10;
    fireRate = 1000;
    projectileCount = 1;
    bossSpawnCount = 0;
    
    generateRuinedStreetBackground(); // Generate BG on init

    // Reset Upgrades
    upgradeLevels = {
        damage: 0,
        speed: 0,
        fireRate: 0,
        multishot: 0,
        sawblade: 0,
        spear: 0,
        pet: 0,
        shield: 0,
        fireRain: 0
    };

    scoreEl.innerHTML = score;
    levelEl.innerHTML = level;
    updateExpBar();
    document.getElementById('level-up-modal').classList.add('hidden');
    document.getElementById('math-modal').classList.add('hidden');
    animate(0);
}

function spawnEnemies() {
    setInterval(() => {
        if (isPaused) return; // Don't spawn if paused
        if (level % 10 === 0 && enemies.some(e => e.isBoss)) return; // Don't spawn if Boss is alive

        const radius = Math.random() * (30 - 10) + 10;
        let x;
        let y;

        // Spawn outside the camera view but within world bounds if possible, 
        // or just spawn at edges of world?
        // Let's spawn around the player but outside view
        
        const spawnRadius = Math.max(canvas.width, canvas.height) / 2 + 100;
        const angle = Math.random() * Math.PI * 2;
        
        x = player.x + Math.cos(angle) * spawnRadius;
        y = player.y + Math.sin(angle) * spawnRadius;

        // Clamp to world bounds
        x = Math.max(radius, Math.min(x, world.width - radius));
        y = Math.max(radius, Math.min(y, world.height - radius));

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const velocityAngle = Math.atan2(player.y - y, player.x - x);
        const velocity = {
            x: Math.cos(velocityAngle),
            y: Math.sin(velocityAngle)
        };

        // Enemy Types & Spawn Rates
        let health = 20;
        let type = 'small';
        let r = 15;
        let scoreValue = 1;
        
        const rand = Math.random();
        
        if (level <= 10) {
            // Level 1-10: 100% Small
            type = 'small';
            health = 20;
            r = 15;
            scoreValue = 1;
        } else if (level <= 30) {
            // Level 11-30: 80% Small, 19% Elite, 1% Big
            if (rand < 0.80) {
                type = 'small';
                health = 20;
                r = 15;
                scoreValue = 1;
            } else if (rand < 0.99) {
                type = 'elite';
                health = 50;
                r = 25;
                scoreValue = 3;
            } else {
                type = 'big';
                health = 75;
                r = 40;
                scoreValue = 10;
            }
        } else {
            // Level > 30: 50% Small, 35% Elite, 15% Big
            if (rand < 0.50) {
                type = 'small';
                health = 20;
                r = 15;
                scoreValue = 1;
            } else if (rand < 0.85) {
                type = 'elite';
                health = 50;
                r = 25;
                scoreValue = 3;
            } else {
                type = 'big';
                health = 75;
                r = 40;
                scoreValue = 10;
            }
        }
        
        enemies.push(new Enemy(x, y, r, color, velocity, health, type, scoreValue));
    }, 1000);
}

function spawnBoss() {
    bossSpawnCount++;
    const x = world.width / 2;
    const y = -100; // Spawn top (outside world?) or just top of world
    // Let's spawn boss near player but far enough
    const spawnX = player.x;
    const spawnY = Math.max(100, player.y - 500);

    const radius = 80;
    const color = '#FF0000';
    const velocity = { x: 0, y: 0.5 }; // Slow move
    
    // Boss HP Logic: Base 1000, +30% of base per spawn
    // Spawn 1: 1000
    // Spawn 2: 1300
    // Spawn 3: 1600
    const baseHp = 1000;
    const health = baseHp + (baseHp * 0.3 * (bossSpawnCount - 1));
    
    const boss = new Enemy(spawnX, spawnY, radius, color, velocity, health, 'boss', 20);
    boss.isBoss = true;
    enemies.push(boss);
    alert(`BOSS FIGHT STARTED! (HP: ${health})`);
}

// Increase difficulty over time
setInterval(() => {
    if (isPaused) return;
    difficultyMultiplier += 0.1;
    console.log("Difficulty increased:", difficultyMultiplier);
}, 10000); // Every 10 seconds

function updateExp(amount, scoreVal) {
    exp += amount;
    score += scoreVal; // Use specific score value
    scoreEl.innerHTML = score;

    if (exp >= expToNextLevel) {
        levelUp();
    }
    updateExpBar();
}

function levelUp() {
    level++;
    exp -= expToNextLevel;
    expToNextLevel = Math.floor(expToNextLevel * 1.2);
    levelEl.innerHTML = level;
    
    if (level % 10 === 0) {
        spawnBoss();
    }

    // Pause game and start math quiz
    isPaused = true;
    cancelAnimationFrame(animationId);
    
    startMathQuiz(
        // Success Callback
        () => {
            showUpgradeOptions(player, resumeGame, updateStats, upgradeLevels, MAX_LEVEL);
        },
        // Failure Callback
        () => {
            resumeGame();
        }
    );
}

function resumeGame() {
    isPaused = false;
    animate(performance.now());
}

function updateStats(type, value) {
    if (upgradeLevels[type] >= MAX_LEVEL) return;
    
    upgradeLevels[type]++;
    console.log(`Upgraded ${type} to level ${upgradeLevels[type]}`);

    if (type === 'damage') {
        playerDamage += 2; // Fixed +2 per level
    } else if (type === 'fireRate') {
        fireRate *= value;
    } else if (type === 'multishot') {
        // Level 1: 2 projectiles
        // Level 2: 4 projectiles
        // Level 3: 6 projectiles
        // Level 4: 8 projectiles
        projectileCount = upgradeLevels.multishot * 2;
    } else if (type === 'sawblade') {
        // Add a new sawblade and redistribute angles
        const count = sawblades.length + 1;
        sawblades = [];
        for(let i=0; i<count; i++) {
            sawblades.push(new Sawblade(player, (Math.PI * 2 * i) / count));
        }
    } else if (type === 'spear') {
        // Add a new spear and redistribute angles
        const count = spears.length + 1;
        spears = [];
        for(let i=0; i<count; i++) {
            spears.push(new Spear(player, (Math.PI * 2 * i) / count));
        }
    } else if (type === 'pet') {
        if (!pet) {
            pet = new Pet(player.x, player.y);
        } else {
            pet.levelUp();
        }
    } else if (type === 'shield') {
        if (!player.shield.unlocked) {
            player.shield.unlocked = true;
            player.shield.active = true;
        } else {
            // Reduce cooldown by 5%
            player.shield.cooldown *= 0.95;
        }
    } else if (type === 'fireRain') {
        // Just increment level, logic is in animate
    }
}

function updateExpBar() {
    const percentage = (exp / expToNextLevel) * 100;
    expBarEl.style.width = `${percentage}%`;
}

function animate(timestamp) {
    if (isPaused) return;
    animationId = requestAnimationFrame(animate);
    
    // Camera Logic
    // Center camera on player
    let cameraX = player.x - canvas.width / 2;
    let cameraY = player.y - canvas.height / 2;

    // Clamp camera to world bounds
    cameraX = Math.max(0, Math.min(cameraX, world.width - canvas.width));
    cameraY = Math.max(0, Math.min(cameraY, world.height - canvas.height));

    // Clear screen (not strictly necessary if we draw full bg, but good practice)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw Background
    ctx.drawImage(bgCanvas, 0, 0);
    
    player.update(timestamp);
    
    // Pet Logic
    if (pet) {
        pet.update(player, timestamp, bombs, enemies);
    }

    // Fire Rain Logic
    if (upgradeLevels.fireRain > 0) {
        // Cooldown 2s (can be adjusted or scaled with level)
        const fireRainCooldown = 2000; 
        // Use a global or persistent variable for lastFireRainTime. 
        // Since I can't easily add a global var without reading whole file again or being messy,
        // I'll attach it to the player or upgradeLevels object for now, or just use a static-like property on the function if JS supported it easily.
        // Better: check if it exists on window/global scope or just add it to upgradeLevels as a property? No.
        // I'll add it to the `player` object as a temporary hack or just assume I can add a variable at top level.
        // Wait, I can't add a top level variable easily now.
        // I'll add `lastFireRainTime` to `player` object.
        if (!player.lastFireRainTime) player.lastFireRainTime = 0;

        if (timestamp - player.lastFireRainTime > fireRainCooldown) {
            // Spawn Fire Patch
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 200;
            const fx = player.x + Math.cos(angle) * dist;
            const fy = player.y + Math.sin(angle) * dist;
            
            firePatches.push(new FirePatch(fx, fy));
            player.lastFireRainTime = timestamp;
        }
    }

    // Update Fire Patches
    firePatches.forEach((fp, index) => {
        const active = fp.update(timestamp, enemies, damageNumbers);
        if (!active) {
            firePatches.splice(index, 1);
        }
    });

    // Bomb Logic
    bombs.forEach((bomb, bIndex) => {
        bomb.update();
        
        if (bomb.exploded) {
            // Check collision with enemies
            enemies.forEach((enemy, eIndex) => {
                const dist = Math.hypot(bomb.x - enemy.x, bomb.y - enemy.y);
                if (dist < bomb.range + enemy.radius) {
                    enemy.health -= 50; // Bomb damage
                    if (enemy.health <= 0) {
                        killEnemy(enemy, eIndex);
                    }
                }
            });
            
            // Remove bomb after explosion frame
            setTimeout(() => {
                // Check if it still exists to avoid double splice
                const idx = bombs.indexOf(bomb);
                if (idx > -1) bombs.splice(idx, 1);
            }, 100); 
            bombs.splice(bIndex, 1);
            
            // Create explosion particles
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(
                    bomb.x, 
                    bomb.y, 
                    Math.random() * 3, 
                    'orange', 
                    {
                        x: (Math.random() - 0.5) * 10,
                        y: (Math.random() - 0.5) * 10
                    }
                ));
            }
        }
    });

    autoAttack(timestamp);
    // handleSpears(timestamp); // Removed, spears are now permanent

    sawblades.forEach(saw => {
        saw.update();
        // Collision with enemies
        enemies.forEach((enemy, index) => {
             const dist = Math.hypot(saw.x - enemy.x, saw.y - enemy.y);
             if (dist - saw.radius - enemy.radius < 0) {
                 // Check cooldown for Sawblade (ATK 20)
                 if (!enemy.lastSawDamage || timestamp - enemy.lastSawDamage > 500) {
                     enemy.health -= 20; 
                     enemy.lastSawDamage = timestamp;
                     
                     if (enemy.health <= 0) {
                        killEnemy(enemy, index);
                     }
                 }
             }
        });
    });

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    damageNumbers.forEach((dn, index) => {
        if (dn.life <= 0) {
            damageNumbers.splice(index, 1);
        } else {
            dn.update();
        }
    });

    // Update Spears
    spears.forEach((spear, index) => {
        spear.update();
        // Spear Collision
        enemies.forEach((enemy, eIndex) => {
            // Check collision at base (handle)
            const distBase = Math.hypot(spear.x - enemy.x, spear.y - enemy.y);
            
            // Check collision at tip
            const tipX = spear.x + Math.cos(spear.angle) * (spear.length + 15);
            const tipY = spear.y + Math.sin(spear.angle) * (spear.length + 15);
            const distTip = Math.hypot(tipX - enemy.x, tipY - enemy.y);

            if (distBase < enemy.radius + 10 || distTip < enemy.radius + 10) {
                 // Check cooldown for Spear (ATK 10)
                 if (!enemy.lastSpearDamage || timestamp - enemy.lastSpearDamage > 500) {
                    enemy.health -= 10; 
                    enemy.lastSpearDamage = timestamp;
                    
                    if (enemy.health <= 0) {
                        killEnemy(enemy, eIndex);
                    }
                 }
            }
        });
    });

    expGems.forEach((gem, index) => {
        gem.update(player);
        
        // Collection check
        const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
        if (dist - player.radius - gem.radius < 1) {
            updateExp(gem.value, 0); // Score already added on kill
            expGems.splice(index, 1);
        }
    });

    items.forEach((item, index) => {
        item.update();
        
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist - player.radius - item.radius < 1) {
            if (item.type === 'magnet') {
                // Magnetize all gems
                expGems.forEach(gem => {
                    gem.magnetized = true;
                    gem.speed = 12; // Pull fast
                });
            } else if (item.type === 'meat') {
                // Heal player
                player.health = Math.min(player.maxHealth, player.health + item.healAmount);
                // Visual feedback for heal
                damageNumbers.push(new DamageNumber(player.x, player.y - 20, item.healAmount, false)); // Reuse damage number for heal?
                // Maybe add a green particle effect later
            }
            items.splice(index, 1);
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();

        // Remove from edges (World bounds)
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > world.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > world.height
        ) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    enemies.forEach((enemy, index) => {
        enemy.update(player);

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // Player Collision (Damage)
        if (dist - enemy.radius - player.radius < 1) {
            if (player.shield.active) {
                player.shield.active = false;
                player.shield.lastBreakTime = performance.now();
                // Visual effect for shield break
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(
                        player.x, 
                        player.y, 
                        Math.random() * 3, 
                        '#00BFFF', 
                        {
                            x: (Math.random() - 0.5) * 5,
                            y: (Math.random() - 0.5) * 5
                        }
                    ));
                }
            } else if (performance.now() - player.lastDamageTime > player.invulnerableTime) {
                player.health -= 10; // Take 10 damage
                player.lastDamageTime = performance.now();
                
                if (player.health <= 0) {
                    cancelAnimationFrame(animationId);
                    alert('Game Over! Score: ' + score);
                    init();
                }
            }
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // When projectiles touch enemy
            if (dist - enemy.radius - projectile.radius < 1) {
                // Create explosions
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(
                        projectile.x, 
                        projectile.y, 
                        Math.random() * 2, 
                        enemy.color, 
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 6),
                            y: (Math.random() - 0.5) * (Math.random() * 6)
                        }
                    ));
                }

                // Reduce health
                let damage = playerDamage;
                let isCrit = Math.random() < 0.2; // 20% chance
                if (isCrit) {
                    damage *= 1.5; // 150% damage
                }

                enemy.health -= damage;
                damageNumbers.push(new DamageNumber(enemy.x, enemy.y - 20, damage, isCrit));

                if (enemy.health <= 0) {
                    killEnemy(enemy, index);
                    // Remove projectile
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }
            }
        });
    });

    ctx.restore();
}

function handleSpears(timestamp) {
    if (upgradeLevels.spear > 0 && timestamp - lastSpearAttack > spearCooldown) {
        // Spawn spears based on level
        // Level 1: 1 spear (front)
        // Level 2: 2 spears (front, back)
        // Level 3: 4 spears (cardinal)
        // Level 4: 8 spears (cardinal + diagonal)
        
        let angles = [];
        if (upgradeLevels.spear === 1) angles = [0]; // Right (or should be movement dir? let's do random for chaos or nearest enemy)
        else if (upgradeLevels.spear === 2) angles = [0, Math.PI];
        else if (upgradeLevels.spear === 3) angles = [0, Math.PI/2, Math.PI, -Math.PI/2];
        else angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, -3*Math.PI/4, -Math.PI/2, -Math.PI/4];

        // If we want them to aim at enemies, we need more logic. 
        // For now, let's make them spin or just shoot out in fixed directions relative to world.
        // Or better: Aim at nearest enemy for the first one, others relative to it.
        
        // Let's just do fixed pattern around player for "Orbiting/Thrusting" feel
        angles.forEach(angle => {
            spears.push(new Spear(player, angle + Math.random())); // Add random rotation for variety
        });
        
        lastSpearAttack = timestamp;
    }
}

function killEnemy(enemy, index) {
    // Drop EXP Gem
    const expValue = Math.floor(enemy.radius + (difficultyMultiplier * 10));
    expGems.push(new ExpGem(enemy.x, enemy.y, expValue));
    
    // Drop Special Items (Magnet / Meat)
    const rand = Math.random();
    if (rand < 0.01) { // 1% Chance for Magnet
        items.push(new Magnet(enemy.x, enemy.y));
    } else if (rand < 0.03) { // 2% Chance for Meat (checked after magnet, so effectively 2% of remaining 99%)
        items.push(new Meat(enemy.x, enemy.y));
    }

    // Add score based on enemy type
    // We need to pass the score value to updateExp or update score directly here
    // Let's update updateExp to take score value separately or just add score here
    // But updateExp handles level up... let's modify updateExp signature or call it differently
    // Actually, expGems are collected later. The score should be added when gem is collected? 
    // Usually score is added on kill, exp on collection.
    // Let's add score here directly.
    score += enemy.scoreValue;
    scoreEl.innerHTML = score;

    // Create explosion
    for (let i = 0; i < 8; i++) {
        particles.push(new Particle(
            enemy.x, 
            enemy.y, 
            Math.random() * 2, 
            enemy.color, 
            {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6)
            }
        ));
    }

    enemies.splice(index, 1);
}

function autoAttack(timestamp) {
    if (timestamp - lastFired < fireRate) return;

    // Find nearest enemy within range
    let nearestEnemy = null;
    let minDist = Infinity;
    const attackRange = 300; // Increased range

    enemies.forEach(enemy => {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < minDist && dist <= attackRange) {
            minDist = dist;
            nearestEnemy = enemy;
        }
    });

    if (nearestEnemy) {
        const baseAngle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
        
        // Calculate spread
        // If count is 1, angle is baseAngle
        // If count > 1, spread them out
        
        const spreadAngle = Math.PI / 18; // 10 degrees - Tighter spread to ensure hits
        
        for(let i=0; i<projectileCount; i++) {
            let angle = baseAngle;
            if (projectileCount > 1) {
                // Map i from 0..count-1 to -spread/2 .. +spread/2
                const offset = (i / (projectileCount - 1) - 0.5) * spreadAngle;
                angle += offset;
            }

            const velocity = {
                x: Math.cos(angle) * 8,
                y: Math.sin(angle) * 8
            };
            projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity));
        }
        
        lastFired = timestamp;
    }
}

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
    }
    updatePlayerVelocity();
});

window.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
        case 'd': keys.d = false; break;
    }
    updatePlayerVelocity();
});

function updatePlayerVelocity() {
    let dx = 0;
    let dy = 0;

    // Keyboard
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;

    // Joystick
    if (isMobileMode) {
        dx += joystickVector.x;
        dy += joystickVector.y;
    }

    // Normalize direction
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > 0) {
        // Cap magnitude at 1 so we don't go faster than max speed
        // If using keyboard diagonal (1.414), normalize to 1
        const finalScale = magnitude > 1 ? 1 / magnitude : 1;
        
        player.velocity.x = dx * finalScale * player.speed;
        player.velocity.y = dy * finalScale * player.speed;
    } else {
        player.velocity.x = 0;
        player.velocity.y = 0;
    }
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateRuinedStreetBackground(); // Regenerate BG on resize
    init(); 
});

// Guide Logic
const guideBtn = document.getElementById('guide-btn');
const guideModal = document.getElementById('guide-modal');
const closeGuideBtn = document.getElementById('close-guide');
const guideBody = document.getElementById('guide-body');
const tabBtns = document.querySelectorAll('.tab-btn');

const guideContent = {
    items: `
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="magnet"></div>
            <div class="guide-info">
                <h3>Magnet</h3>
                <p>Drops from enemies (1% chance).</p>
                <p>Effect: Pulls all EXP gems to you instantly.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="meat"></div>
            <div class="guide-info">
                <h3>Meat</h3>
                <p>Drops from enemies (2% chance).</p>
                <p>Effect: Heals 50 HP.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="sawblade"></div>
            <div class="guide-info">
                <h3>Sawblade</h3>
                <p>Upgrade Item.</p>
                <p>Effect: Orbiting blade that deals 20 damage.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="spear"></div>
            <div class="guide-info">
                <h3>Spear</h3>
                <p>Upgrade Item.</p>
                <p>Effect: Long range thrusting weapon. Deals 10 damage.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="pet"></div>
            <div class="guide-info">
                <h3>Pet</h3>
                <p>Upgrade Item.</p>
                <p>Effect: Follows you and drops bombs (50 DMG) every 2s.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="shield"></div>
            <div class="guide-info">
                <h3>Energy Shield</h3>
                <p>Upgrade Item.</p>
                <p>Effect: Blocks 1 hit completely. Recharges over time.</p>
            </div>
        </div>
    `,
    bosses: `
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="boss"></div>
            <div class="guide-info">
                <h3>Giant Skull</h3>
                <p>Spawns every 10 levels.</p>
                <p>HP: Scales with spawn count (1000 + 30%).</p>
                <p>Behavior: Slow moving, massive damage.</p>
            </div>
        </div>
    `,
    mechanics: `
        <div class="guide-item">
            <div class="guide-info">
                <h3>Level Up</h3>
                <p>Collect EXP gems to level up. Every level grants a new upgrade.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-info">
                <h3>Math Quiz</h3>
                <p>Every level up triggers a math quiz. Solve it to get your upgrade!</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-info">
                <h3>Critical Hits</h3>
                <p>20% chance to deal 150% damage.</p>
            </div>
        </div>
    `
};

function openGuide() {
    isPaused = true;
    cancelAnimationFrame(animationId);
    guideModal.classList.remove('hidden');
    loadGuideTab('items'); // Default tab
}

function closeGuide() {
    guideModal.classList.add('hidden');
    isPaused = false;
    animate(performance.now());
}

function loadGuideTab(tabName) {
    guideBody.innerHTML = guideContent[tabName];
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Render Icons
    const iconContainers = guideBody.querySelectorAll('.guide-icon-container');
    iconContainers.forEach(container => {
        const type = container.dataset.icon;
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        drawIcon(ctx, type, 64, 64);
        container.appendChild(canvas);
    });
}

guideBtn.addEventListener('click', openGuide);
closeGuideBtn.addEventListener('click', closeGuide);

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loadGuideTab(btn.dataset.tab);
    });
});

// Joystick Logic
const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
const joystickContainer = document.getElementById('joystick-container');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');

let isMobileMode = false;
let joystickActive = false;
let joystickVector = { x: 0, y: 0 };
const maxJoystickRadius = 50;

mobileToggleBtn.addEventListener('click', () => {
    isMobileMode = !isMobileMode;
    if (isMobileMode) {
        joystickContainer.classList.remove('hidden');
        mobileToggleBtn.classList.add('active');
    } else {
        joystickContainer.classList.add('hidden');
        mobileToggleBtn.classList.remove('active');
        joystickVector = { x: 0, y: 0 };
        updatePlayerVelocity();
    }
});

// Touch Events for Joystick
joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    handleJoystickMove(e.touches[0]);
}, { passive: false });

joystickContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (joystickActive) {
        handleJoystickMove(e.touches[0]);
    }
}, { passive: false });

joystickContainer.addEventListener('touchend', (e) => {
    e.preventDefault();
    resetJoystick();
});

// Mouse Events for Joystick (for PC testing)
joystickContainer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    joystickActive = true;
    handleJoystickMove(e);
    
    // Bind window events to handle dragging outside
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
});

function handleWindowMouseMove(e) {
    if (joystickActive) {
        handleJoystickMove(e);
    }
}

function handleWindowMouseUp(e) {
    joystickActive = false;
    resetJoystick();
    window.removeEventListener('mousemove', handleWindowMouseMove);
    window.removeEventListener('mouseup', handleWindowMouseUp);
}

function resetJoystick() {
    joystickActive = false;
    joystickVector = { x: 0, y: 0 };
    joystickStick.style.transform = `translate(0px, 0px)`;
    updatePlayerVelocity();
}

function handleJoystickMove(input) {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = input.clientX - centerX;
    const deltaY = input.clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    const angle = Math.atan2(deltaY, deltaX);
    const clampedDistance = Math.min(distance, maxJoystickRadius);

    const stickX = Math.cos(angle) * clampedDistance;
    const stickY = Math.sin(angle) * clampedDistance;

    joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

    // Normalize vector for velocity (0 to 1)
    joystickVector = {
        x: stickX / maxJoystickRadius,
        y: stickY / maxJoystickRadius
    };
    
    updatePlayerVelocity();
}

spawnEnemies();
animate();

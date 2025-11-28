import { canvas, ctx, scoreEl, levelEl, expBarEl } from './Globals.js';
import { Player, Projectile, Enemy, Particle, Sawblade, Spear } from './Entities.js';
import { ExpGem, showUpgradeOptions } from './Item.js';
import { startMathQuiz } from './Quiz.js';

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 15, 'white');
let projectiles = [];
let enemies = [];
let particles = [];
let expGems = [];
let sawblades = [];
let spears = [];

let animationId;
let score = 0;
let level = 1;
let exp = 0;
let expToNextLevel = 100;
let difficultyMultiplier = 1;
let isPaused = false;
let playerDamage = 20;
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
    spear: 0
};
const MAX_LEVEL = 4;

let bossSpawnCount = 0;

// Spear Logic
// Removed cooldown logic as spears are now permanent orbiting objects

function init() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    player = new Player(canvas.width / 2, canvas.height / 2, 15, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    expGems = [];
    sawblades = [];
    spears = [];
    score = 0;
    level = 1;
    exp = 0;
    expToNextLevel = 100;
    difficultyMultiplier = 1;
    isPaused = false;
    playerDamage = 20;
    fireRate = 1000;
    projectileCount = 1;
    bossSpawnCount = 0;
    
    // Reset Upgrades
    upgradeLevels = {
        damage: 0,
        speed: 0,
        fireRate: 0,
        multishot: 0,
        sawblade: 0,
        spear: 0
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

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
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
    const x = canvas.width / 2;
    const y = -100; // Spawn top
    const radius = 80;
    const color = '#FF0000';
    const velocity = { x: 0, y: 0.5 }; // Slow move
    
    // Boss HP Logic: Base 1000, +30% of base per spawn
    // Spawn 1: 1000
    // Spawn 2: 1300
    // Spawn 3: 1600
    const baseHp = 1000;
    const health = baseHp + (baseHp * 0.3 * (bossSpawnCount - 1));
    
    const boss = new Enemy(x, y, radius, color, velocity, health, 'boss', 20);
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
    }
}

function updateExpBar() {
    const percentage = (exp / expToNextLevel) * 100;
    expBarEl.style.width = `${percentage}%`;
}

function animate(timestamp) {
    if (isPaused) return;
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    player.update();
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

    projectiles.forEach((projectile, index) => {
        projectile.update();

        // Remove from edges
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
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
            if (performance.now() - player.lastDamageTime > player.invulnerableTime) {
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
                enemy.health -= playerDamage;

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
        
        const spreadAngle = Math.PI / 6; // 30 degrees total spread maybe?
        
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
    player.velocity.x = 0;
    player.velocity.y = 0;

    if (keys.w) player.velocity.y -= player.speed;
    if (keys.s) player.velocity.y += player.speed;
    if (keys.a) player.velocity.x -= player.speed;
    if (keys.d) player.velocity.x += player.speed;
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init(); 
});

spawnEnemies();
animate();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreEl = document.getElementById('exp-score');
const levelEl = document.getElementById('level-display');
const expBarEl = document.getElementById('exp-bar');

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = { x: 0, y: 0 };
        this.speed = 5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
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

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity, health) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.health = health;
        this.maxHealth = health;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Health bar above enemy
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 15, this.y - this.radius - 10, 30, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 15, this.y - this.radius - 10, 30 * (this.health / this.maxHealth), 5);
    }

    update() {
        this.draw();
        // Move towards player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Particle {
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

class ExpGem {
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

    update() {
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

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 15, 'white');
let projectiles = [];
let enemies = [];
let particles = [];
let expGems = [];

let animationId;
let score = 0;
let level = 1;
let exp = 0;
let expToNextLevel = 100;
let difficultyMultiplier = 1;
let isPaused = false;
let playerDamage = 1;

// Math Quiz Variables
let mathTimer;
let timeLeft = 30;
let currentAnswer = 0;

function init() {
    player = new Player(canvas.width / 2, canvas.height / 2, 15, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    expGems = [];
    score = 0;
    level = 1;
    exp = 0;
    expToNextLevel = 100;
    difficultyMultiplier = 1;
    isPaused = false;
    playerDamage = 1;
    fireRate = 1000;
    scoreEl.innerHTML = score;
    levelEl.innerHTML = level;
    updateExpBar();
    document.getElementById('level-up-modal').classList.add('hidden');
    document.getElementById('math-modal').classList.add('hidden');
    animate(0);
}

function spawnEnemies() {
    setInterval(() => {
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

        // Difficulty scaling: Health increases with time/difficulty
        const health = (Math.random() * 2 + 1) * difficultyMultiplier;

        enemies.push(new Enemy(x, y, radius, color, velocity, health));
    }, 1000);
}

// Increase difficulty over time
setInterval(() => {
    difficultyMultiplier += 0.1;
    console.log("Difficulty increased:", difficultyMultiplier);
}, 10000); // Every 10 seconds

function updateExp(amount) {
    exp += amount;
    score += amount; // Total exp as score
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
    
    // Pause game and start math quiz
    isPaused = true;
    cancelAnimationFrame(animationId);
    startMathQuiz();
}

function startMathQuiz() {
    const modal = document.getElementById('math-modal');
    const questionEl = document.getElementById('math-question');
    const timerEl = document.getElementById('timer-display');
    const inputEl = document.getElementById('math-answer');
    
    modal.classList.remove('hidden');
    inputEl.value = '';
    inputEl.focus();
    
    // Generate Question
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let a, b;

    switch(operator) {
        case '+':
            a = Math.floor(Math.random() * 50) + 1;
            b = Math.floor(Math.random() * 50) + 1;
            currentAnswer = a + b;
            break;
        case '-':
            a = Math.floor(Math.random() * 50) + 20;
            b = Math.floor(Math.random() * a); // Ensure positive result
            currentAnswer = a - b;
            break;
        case '*':
            a = Math.floor(Math.random() * 12) + 1;
            b = Math.floor(Math.random() * 12) + 1;
            currentAnswer = a * b;
            break;
        case '/':
            b = Math.floor(Math.random() * 10) + 2;
            currentAnswer = Math.floor(Math.random() * 10) + 1;
            a = b * currentAnswer; // Ensure clean division
            break;
    }

    questionEl.textContent = `${a} ${operator} ${b} = ?`;

    // Start Timer
    timeLeft = 30;
    timerEl.textContent = `${timeLeft}s`;
    
    if (mathTimer) clearInterval(mathTimer);
    mathTimer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(mathTimer);
            endMathQuiz(false);
        }
    }, 1000);
}

function endMathQuiz(success) {
    clearInterval(mathTimer);
    document.getElementById('math-modal').classList.add('hidden');
    
    if (success) {
        showUpgradeOptions();
    } else {
        alert("Time's up or Wrong Answer! No upgrade for you.");
        isPaused = false;
        animate(performance.now());
    }
}

document.getElementById('submit-answer').addEventListener('click', checkAnswer);
document.getElementById('math-answer').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

function checkAnswer() {
    const input = parseInt(document.getElementById('math-answer').value);
    if (input === currentAnswer) {
        endMathQuiz(true);
    } else {
        endMathQuiz(false);
    }
}

function showUpgradeOptions() {
    const modal = document.getElementById('level-up-modal');
    const optionsContainer = document.getElementById('upgrade-options');
    optionsContainer.innerHTML = '';
    modal.classList.remove('hidden');

    const upgrades = [
        { type: 'damage', title: 'Increase Damage', desc: 'Deals +1 damage per shot' },
        { type: 'speed', title: 'Increase Speed', desc: 'Move 20% faster' },
        { type: 'fireRate', title: 'Increase Fire Rate', desc: 'Shoot 10% faster' }
    ];

    // For now, just show all 3 fixed options. In a real game, pick random ones.
    upgrades.forEach(upgrade => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `<h3>${upgrade.title}</h3><p>${upgrade.desc}</p>`;
        card.onclick = () => applyUpgrade(upgrade.type);
        optionsContainer.appendChild(card);
    });
}

function applyUpgrade(type) {
    switch(type) {
        case 'damage':
            playerDamage += 1;
            console.log("Damage Upgraded:", playerDamage);
            break;
        case 'speed':
            player.speed *= 1.2;
            console.log("Speed Upgraded:", player.speed);
            break;
        case 'fireRate':
            fireRate *= 0.9;
            console.log("Fire Rate Upgraded:", fireRate);
            break;
    }

    // Resume game
    document.getElementById('level-up-modal').classList.add('hidden');
    isPaused = false;
    animate(performance.now());
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

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    expGems.forEach((gem, index) => {
        gem.update();
        
        // Collection check
        const dist = Math.hypot(player.x - gem.x, player.y - gem.y);
        if (dist - player.radius - gem.radius < 1) {
            updateExp(gem.value);
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
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // End game
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId);
            alert('Game Over! Score: ' + score);
            init();
            animate();
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
                    // Drop EXP Gem
                    const expValue = Math.floor(enemy.radius + (difficultyMultiplier * 10));
                    expGems.push(new ExpGem(enemy.x, enemy.y, expValue));

                    setTimeout(() => {
                        enemies.splice(index, 1);
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

// Controls
// Removed click to shoot for Vampire Survivors style auto-attack

let fireRate = 1000; // ms
let lastFired = 0;

function autoAttack(timestamp) {
    if (timestamp - lastFired < fireRate) return;

    // Find nearest enemy
    let nearestEnemy = null;
    let minDist = Infinity;

    enemies.forEach(enemy => {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < minDist) {
            minDist = dist;
            nearestEnemy = enemy;
        }
    });

    if (nearestEnemy) {
        const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
        const velocity = {
            x: Math.cos(angle) * 8,
            y: Math.sin(angle) * 8
        };
        projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity));
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
    init(); // Reset game on resize or just adjust player position? Resetting is easier for now.
});

spawnEnemies();
animate();

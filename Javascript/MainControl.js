import { canvas, ctx, scoreEl, levelEl, expBarEl, world, buildings, vehicles } from './Globals.js';
import { Player, Projectile, Enemy, Particle, Sawblade, Spear, Pet, Bomb, StunBomb, DamageNumber, FirePatch, Chest, Building, ShotEffect, HitEffect, Drone } from './Entities.js';
import { ExpGem, showUpgradeOptions, showCheatMenu, Magnet, Meat, drawIcon, NightVision } from './Item.js';
import { startMathQuiz } from './Quiz.js';

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 15, 'white');
player.critRate = 0;
let projectiles = [];
let enemies = [];
let particles = [];
let effects = []; // For ShotEffect and HitEffect
let expGems = [];
let items = [];
let sawblades = [];
let spears = [];
let bombs = [];
let stunBombs = [];
let damageNumbers = [];
let firePatches = [];
let chests = [];
let pet = null;
let drone = null;

let nightVisionActive = false;
let nightVisionEndTime = 0;

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
let lastChestSpawnTime = 0; // Track chest spawn time

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
    fireRain: 0,
    crit: 0,
    drone: 0,
    stunBomb: 0
};
const MAX_LEVEL = 4;

let bossSpawnCount = 0;

// Background Canvas
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');

function drawAbandonedHelicopter(ctx, x, y, pixelSize) {
    ctx.save();
    ctx.translate(x, y);
    
    const scale = 4; // Increased scale
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-16 * scale, -10 * scale, 80 * scale, 40 * scale);
    
    // Main body - detailed fuselage
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(-16 * scale, -8 * scale, 32 * scale, 16 * scale);
    ctx.fillRect(-14 * scale, -10 * scale, 28 * scale, 4 * scale);
    ctx.fillRect(-14 * scale, 6 * scale, 28 * scale, 4 * scale);
    
    // Body panels
    ctx.fillStyle = '#34495E';
    ctx.fillRect(-12 * scale, -8 * scale, 24 * scale, 4 * scale);
    ctx.fillRect(-12 * scale, 4 * scale, 24 * scale, 4 * scale);
    
    // Cockpit area
    ctx.fillStyle = '#1C2E40';
    ctx.fillRect(-14 * scale, -8 * scale, 12 * scale, 12 * scale);
    
    // Windshield (cracked)
    ctx.fillStyle = '#34495E';
    ctx.fillRect(-12 * scale, -6 * scale, 8 * scale, 8 * scale);
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(-10 * scale, -4 * scale, 4 * scale, 4 * scale);
    
    // Windshield cracks
    ctx.fillStyle = '#1A1F18';
    ctx.fillRect(-9 * scale, -5 * scale, pixelSize, 6 * scale);
    ctx.fillRect(-11 * scale, -3 * scale, 4 * scale, pixelSize);
    
    // Door panels
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(2 * scale, -6 * scale, 8 * scale, 10 * scale);
    ctx.strokeStyle = '#1C2E40';
    ctx.lineWidth = 2;
    ctx.strokeRect(2 * scale, -6 * scale, 8 * scale, 10 * scale);
    
    // Door handle
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(8 * scale, -1 * scale, 2 * scale, 2 * scale);
    
    // Tail boom (broken)
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(16 * scale, -4 * scale, 24 * scale, 8 * scale);
    ctx.fillRect(38 * scale, -6 * scale, 4 * scale, 12 * scale);
    
    // Tail boom detail
    ctx.fillStyle = '#34495E';
    ctx.fillRect(18 * scale, -2 * scale, 20 * scale, 4 * scale);
    
    // Skids (landing gear)
    ctx.fillStyle = '#424242';
    ctx.fillRect(-18 * scale, 8 * scale, 36 * scale, 3 * scale);
    ctx.fillRect(-16 * scale, 5 * scale, 3 * scale, 6 * scale);
    ctx.fillRect(13 * scale, 5 * scale, 3 * scale, 6 * scale);
    
    // Engine housing
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(-4 * scale, -12 * scale, 8 * scale, 6 * scale);
    ctx.fillStyle = '#1C2E40';
    ctx.fillRect(-3 * scale, -11 * scale, 6 * scale, 4 * scale);
    
    // Rotor mast
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(-2 * scale, -14 * scale, 4 * scale, 4 * scale);
    
    // Rotor blades (broken, detailed)
    ctx.fillStyle = '#1A1F18';
    // Blade 1 (bent down)
    ctx.fillRect(-28 * scale, -3 * scale, 16 * scale, 3 * scale);
    ctx.fillRect(-30 * scale, -1 * scale, 4 * scale, pixelSize);
    // Blade 2 (broken off)
    ctx.fillRect(12 * scale, -3 * scale, 12 * scale, 3 * scale);
    // Blade 3 (bent)
    ctx.fillRect(-3 * scale, -18 * scale, 3 * scale, 12 * scale);
    
    // Damage - bullet holes (detailed)
    ctx.fillStyle = '#0D1117';
    ctx.fillRect(-8 * scale, -3 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(4 * scale, 3 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(-10 * scale, 5 * scale, 3 * scale, 2 * scale);
    ctx.fillRect(6 * scale, -5 * scale, 2 * scale, 3 * scale);
    
    // Burn marks (larger)
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(-6 * scale, -8 * scale, 8 * scale, 6 * scale);
    ctx.fillRect(8 * scale, -2 * scale, 10 * scale, 4 * scale);
    
    // Rust streaks
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2 * scale, -6 * scale, 3 * scale, 8 * scale);
    ctx.fillRect(10 * scale, 2 * scale, 6 * scale, 2 * scale);
    
    // Military markings (faded)
    ctx.fillStyle = '#FFD600';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-10 * scale, 0, 2 * scale, 2 * scale);
    ctx.fillRect(-6 * scale, 0, 2 * scale, 2 * scale);
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

function drawAbandonedPlane(ctx, x, y, pixelSize) {
    ctx.save();
    ctx.translate(x, y);
    
    const scale = 5; // Increased scale
    
    // Fuselage - main body (detailed)
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(-20 * scale, -5 * scale, 40 * scale, 10 * scale);
    ctx.fillRect(-18 * scale, -7 * scale, 36 * scale, 4 * scale);
    ctx.fillRect(-18 * scale, 3 * scale, 36 * scale, 4 * scale);
    
    // Body panels and rivets
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(-16 * scale, -5 * scale, 32 * scale, 3 * scale);
    ctx.fillRect(-16 * scale, 2 * scale, 32 * scale, 3 * scale);
    
    // Rivet lines
    ctx.fillStyle = '#5D6D7E';
    for (let i = -16; i < 16; i += 4) {
        ctx.fillRect(i * scale, -6 * scale, pixelSize, pixelSize);
        ctx.fillRect(i * scale, 4 * scale, pixelSize, pixelSize);
    }
    
    // Nose cone (damaged)
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(-24 * scale, -4 * scale, 4 * scale, 8 * scale);
    ctx.fillRect(-26 * scale, -3 * scale, 2 * scale, 6 * scale);
    ctx.fillStyle = '#5D6D7E';
    ctx.fillRect(-28 * scale, -2 * scale, 2 * scale, 4 * scale);
    
    // Nose damage
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(-26 * scale, -2 * scale, 4 * scale, 4 * scale);
    
    // Cockpit canopy
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(-16 * scale, -6 * scale, 10 * scale, 4 * scale);
    ctx.fillRect(-14 * scale, -8 * scale, 6 * scale, 3 * scale);
    
    // Cockpit glass (reflective)
    ctx.fillStyle = '#34495E';
    ctx.fillRect(-14 * scale, -5 * scale, 6 * scale, 3 * scale);
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(-13 * scale, -5 * scale, 4 * scale, 2 * scale);
    
    // Cracked glass
    ctx.fillStyle = '#1A1F18';
    ctx.fillRect(-12 * scale, -5 * scale, pixelSize, 4 * scale);
    ctx.fillRect(-14 * scale, -4 * scale, 6 * scale, pixelSize);
    
    // Left Wing (intact but damaged)
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(-10 * scale, -20 * scale, 16 * scale, 15 * scale);
    ctx.fillRect(-12 * scale, -18 * scale, 4 * scale, 13 * scale);
    
    // Wing panels
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(-8 * scale, -18 * scale, 12 * scale, 4 * scale);
    ctx.fillRect(-8 * scale, -10 * scale, 12 * scale, 4 * scale);
    
    // Left Engine
    ctx.fillStyle = '#34495E';
    ctx.fillRect(-6 * scale, -22 * scale, 6 * scale, 6 * scale);
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(-5 * scale, -21 * scale, 4 * scale, 4 * scale);
    
    // Right Wing (broken off - stub only)
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(-6 * scale, 5 * scale, 10 * scale, 8 * scale);
    
    // Broken wing edge (jagged)
    ctx.fillStyle = '#5D6D7E';
    ctx.fillRect(4 * scale, 6 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(3 * scale, 9 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(4 * scale, 11 * scale, 2 * scale, 2 * scale);
    
    // Tail section
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(20 * scale, -4 * scale, 12 * scale, 8 * scale);
    ctx.fillRect(22 * scale, -8 * scale, 6 * scale, 8 * scale);
    
    // Rudder
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(24 * scale, -10 * scale, 4 * scale, 6 * scale);
    
    // Major damage - large holes
    ctx.fillStyle = '#0D1117';
    ctx.fillRect(-10 * scale, -2 * scale, 4 * scale, 4 * scale);
    ctx.fillRect(6 * scale, 0, 5 * scale, 3 * scale);
    ctx.fillRect(-2 * scale, 3 * scale, 3 * scale, 4 * scale);
    ctx.fillRect(14 * scale, -3 * scale, 4 * scale, 3 * scale);
    
    // Extensive burn marks
    ctx.fillStyle = '#2C1810';
    ctx.fillRect(-14 * scale, -5 * scale, 8 * scale, 6 * scale);
    ctx.fillRect(10 * scale, -3 * scale, 12 * scale, 6 * scale);
    ctx.fillRect(-4 * scale, 4 * scale, 8 * scale, 4 * scale);
    
    // Rust streaks
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, -7 * scale, 3 * scale, 10 * scale);
    ctx.fillRect(16 * scale, 2 * scale, 6 * scale, 3 * scale);
    ctx.fillRect(-12 * scale, 0, 4 * scale, 2 * scale);
    
    // Military markings (faded star)
    ctx.fillStyle = '#FFD600';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(10 * scale, -2 * scale, 6 * scale, pixelSize);
    ctx.fillRect(12 * scale, -4 * scale, 2 * scale, 6 * scale);
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

function generateRuinedStreetBackground() {
    bgCanvas.width = world.width;
    bgCanvas.height = world.height;
    
    const pixelSize = 4;

    // 1. Base - Military Concrete
    bgCtx.fillStyle = '#3E4A3C'; // Dark olive green
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    // 2. Grid Pattern (Concrete blocks)
    bgCtx.strokeStyle = '#2C3528';
    bgCtx.lineWidth = pixelSize;
    const tileSize = 64;
    
    for (let x = 0; x < bgCanvas.width; x += tileSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, bgCanvas.height);
        bgCtx.stroke();
    }
    for (let y = 0; y < bgCanvas.height; y += tileSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(bgCanvas.width, y);
        bgCtx.stroke();
    }

    // 3. Dirt/Grime Texture
    for (let i = 0; i < 20000; i++) {
        const x = Math.floor(Math.random() * (bgCanvas.width / pixelSize)) * pixelSize;
        const y = Math.floor(Math.random() * (bgCanvas.height / pixelSize)) * pixelSize;
        bgCtx.fillStyle = Math.random() > 0.5 ? '#4A5548' : '#363D34';
        bgCtx.fillRect(x, y, pixelSize, pixelSize);
    }

    // 4. Runway/Path Markings (Yellow lines)
    bgCtx.fillStyle = 'rgba(255, 214, 0, 0.6)';
    const dashHeight = 40;
    const gapHeight = 60;
    
    // Vertical Path
    const centerX = Math.floor((bgCanvas.width / 2) / pixelSize) * pixelSize;
    for (let y = 0; y < bgCanvas.height; y += dashHeight + gapHeight) {
        const py = Math.floor(y / pixelSize) * pixelSize;
        const ph = Math.floor(dashHeight / pixelSize) * pixelSize;
        bgCtx.fillRect(centerX - pixelSize * 2, py, pixelSize * 4, ph);
    }
    
    // Horizontal Path
    const centerY = Math.floor((bgCanvas.height / 2) / pixelSize) * pixelSize;
    for (let x = 0; x < bgCanvas.width; x += dashHeight + gapHeight) {
        const px = Math.floor(x / pixelSize) * pixelSize;
        const pw = Math.floor(dashHeight / pixelSize) * pixelSize;
        bgCtx.fillRect(px, centerY - pixelSize * 2, pw, pixelSize * 4);
    }

    // 5. Battle Damage (Cracks & Craters)
    bgCtx.fillStyle = '#1A1F18';
    for (let i = 0; i < 150; i++) {
        let cx = Math.floor(Math.random() * (bgCanvas.width / pixelSize)) * pixelSize;
        let cy = Math.floor(Math.random() * (bgCanvas.height / pixelSize)) * pixelSize;
        
        for (let j = 0; j < 25; j++) {
            bgCtx.fillRect(cx, cy, pixelSize, pixelSize);
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0) cx += pixelSize;
            else if (dir === 1) cx -= pixelSize;
            else if (dir === 2) cy += pixelSize;
            else if (dir === 3) cy -= pixelSize;
        }
    }

    // 6. Sandbags / Barriers
    for (let i = 0; i < 200; i++) {
        let rx = Math.floor(Math.random() * (bgCanvas.width / pixelSize)) * pixelSize;
        let ry = Math.floor(Math.random() * (bgCanvas.height / pixelSize)) * pixelSize;
        
        bgCtx.fillStyle = '#5C5442'; // Sand color
        bgCtx.fillRect(rx, ry, pixelSize * 3, pixelSize * 2);
        bgCtx.fillRect(rx + pixelSize, ry + pixelSize * 2, pixelSize * 3, pixelSize * 2);
        
        // Highlight
        bgCtx.fillStyle = '#6E6650';
        bgCtx.fillRect(rx, ry, pixelSize, pixelSize);
    }

    // 6.5. Abandoned Helicopters and Planes
    vehicles.length = 0; // Clear vehicles array
    const numVehicles = Math.floor(Math.random() * 3) + 2; // 2-4 vehicles
    
    function checkOverlap(x, y, w, h) {
        // Check overlap with buildings
        for (const building of buildings) {
            if (!(x + w < building.x || x > building.x + building.width ||
                  y + h < building.y || y > building.y + building.height)) {
                return true;
            }
        }
        // Check overlap with other vehicles
        for (const vehicle of vehicles) {
            if (!(x + w < vehicle.x || x > vehicle.x + vehicle.width ||
                  y + h < vehicle.y || y > vehicle.y + vehicle.height)) {
                return true;
            }
        }
        return false;
    }
    
    for (let i = 0; i < numVehicles; i++) {
        let vx, vy, vehicleBox;
        let attempts = 0;
        const isHeli = Math.random() > 0.5;
        
        // Try to find non-overlapping position
        do {
            vx = Math.random() * (world.width - 400) + 200;
            vy = Math.random() * (world.height - 400) + 200;
            
            if (isHeli) {
                vehicleBox = { x: vx - 72, y: vy - 40, width: 168, height: 80 };
            } else {
                vehicleBox = { x: vx - 140, y: vy - 110, width: 360, height: 200 };
            }
            attempts++;
        } while (checkOverlap(vehicleBox.x, vehicleBox.y, vehicleBox.width, vehicleBox.height) && attempts < 20);
        
        // Only draw if valid position found
        if (attempts < 20) {
            if (isHeli) {
                drawAbandonedHelicopter(bgCtx, vx, vy, pixelSize);
                vehicles.push({
                    x: vx - 72,
                    y: vy - 40,
                    width: 168,
                    height: 80,
                    type: 'helicopter'
                });
            } else {
                drawAbandonedPlane(bgCtx, vx, vy, pixelSize);
                vehicles.push({
                    x: vx - 140,
                    y: vy - 110,
                    width: 360,
                    height: 200,
                    type: 'plane'
                });
            }
        }
    }

    // 7. Buildings (City Blocks Layout)
    // Clear existing buildings
    buildings.length = 0;

    const roadWidth = 300; // Main roads width
    const blockGridSize = 250; // Size of a city block
    const buildingPadding = 20; // Space between buildings

    const cx = world.width / 2;
    const cy = world.height / 2;

    // Iterate over the world grid
    for (let x = 50; x < world.width - 50; x += blockGridSize) {
        for (let y = 50; y < world.height - 50; y += blockGridSize) {
            
            // Calculate center of this potential block
            const blockCenterX = x + blockGridSize / 2;
            const blockCenterY = y + blockGridSize / 2;

            // Check if this block overlaps with the main cross roads
            // Horizontal Road check
            if (Math.abs(blockCenterY - cy) < roadWidth / 2 + 50) continue;
            // Vertical Road check
            if (Math.abs(blockCenterX - cx) < roadWidth / 2 + 50) continue;

            // 70% chance to spawn a building in this block (ruined city feel)
            if (Math.random() < 0.7) {
                // Randomize size slightly but keep within grid cell
                const w = blockGridSize - buildingPadding - (Math.random() * 40);
                const h = blockGridSize - buildingPadding - (Math.random() * 40);
                
                // Center the building in the grid cell
                const bx = x + (blockGridSize - w) / 2;
                const by = y + (blockGridSize - h) / 2;

                // Store building for collision
                const building = new Building(bx, by, w, h);
                buildings.push(building);

                // Draw building on background
                building.draw(bgCtx);
                
                // Shadow (on bg)
                bgCtx.fillStyle = 'rgba(0,0,0,0.5)';
                bgCtx.fillRect(bx + 10, by + 10, w, h);
            }
        }
    }
}

// Call immediately to ensure background exists before animation starts
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
generateRuinedStreetBackground();

// Spear Logic
// Removed cooldown logic as spears are now permanent orbiting objects

function spawnChests() {
    // Spawn 20 random chests
    for (let i = 0; i < 20; i++) {
        const cx = Math.random() * world.width;
        const cy = Math.random() * world.height;
        chests.push(new Chest(cx, cy));
    }
}

function init() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    player = new Player(world.width / 2, world.height / 2, 15, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    effects = [];
    expGems = [];
    items = [];
    sawblades = [];
    spears = [];
    bombs = [];
    stunBombs = [];
    damageNumbers = [];
    firePatches = [];
    chests = [];
    pet = null;
    drone = null;
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
    spawnChests();

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
        fireRain: 0,
        crit: 0,
        drone: 0,
        stunBomb: 0
    };

    player.critRate = 0; // Initialize crit rate

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
    
    let bossType = 'boss'; // Default (Skull)
    if (bossSpawnCount === 1) bossType = 'boss_spider'; // Level 10
    else if (bossSpawnCount === 2) bossType = 'boss_mutant'; // Level 20
    else bossType = Math.random() < 0.5 ? 'boss_spider' : 'boss_mutant'; // Random for later levels

    const boss = new Enemy(spawnX, spawnY, radius, color, velocity, health, bossType, 20);
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
    } else if (type === 'crit') {
        if (upgradeLevels.crit === 1) {
            player.critRate += 0.08; // Base 8%
        } else {
            player.critRate += 0.03; // +3% per level
        }
        console.log("Crit Rate:", player.critRate);
    } else if (type === 'drone') {
        if (!drone) {
            drone = new Drone(player);
        } else {
            drone.level++;
        }
    } else if (type === 'stunBomb') {
        // Logic handled in animate
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

    // Drone Logic
    if (drone) {
        drone.update(timestamp, enemies, projectiles);
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
            let valid = false;
            let fx, fy;
            let attempts = 0;
            
            while (!valid && attempts < 10) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 200;
                fx = player.x + Math.cos(angle) * dist;
                fy = player.y + Math.sin(angle) * dist;
                
                let hit = false;
                for (const b of buildings) {
                    // Simple AABB check
                    if (fx > b.x && fx < b.x + b.width && fy > b.y && fy < b.y + b.height) {
                        hit = true;
                        break;
                    }
                }
                if (!hit) valid = true;
                attempts++;
            }

            if (valid) {
                firePatches.push(new FirePatch(fx, fy));
            }
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

    // Chest Logic
    chests.forEach((chest, index) => {
        chest.draw();
        
        // Collision with player
        const dist = Math.hypot(player.x - chest.x, player.y - chest.y);
        if (dist < player.radius + chest.radius && !chest.opened) {
            chest.opened = true;
            
            // Gacha Logic (New System)
            // 1. Check for upgradable items
            const upgradableItems = Object.keys(upgradeLevels).filter(key => upgradeLevels[key] > 0 && upgradeLevels[key] < MAX_LEVEL);
            
            const rand = Math.random();
            let rewardText = "";
            
            // 40% Chance to Upgrade an existing item (if possible)
            if (rand < 0.4 && upgradableItems.length > 0) {
                const randomKey = upgradableItems[Math.floor(Math.random() * upgradableItems.length)];
                // Apply upgrade
                // For fireRate, we need to pass a value (e.g., 0.9)
                // For others, value is ignored or handled
                let val = 0;
                if (randomKey === 'fireRate') val = 0.9;
                
                updateStats(randomKey, val);
                rewardText = `Upgrade: ${randomKey.toUpperCase()}!`;
            } else {
                // 60% Chance (or fallback) for Consumables
                // Split between Meat and Magnet
                if (Math.random() < 0.5) {
                    items.push(new Meat(chest.x, chest.y));
                    rewardText = "Meat!";
                } else {
                    items.push(new Magnet(chest.x, chest.y));
                    rewardText = "Magnet!";
                }
            }

            // Show text
            damageNumbers.push(new DamageNumber(chest.x, chest.y - 30, rewardText, true)); 
            
            // Remove chest
            chests.splice(index, 1);
            
            // Particles
            for (let i = 0; i < 20; i++) {
                particles.push(new Particle(
                    chest.x, 
                    chest.y, 
                    Math.random() * 3, 
                    '#FFD700', 
                    {
                        x: (Math.random() - 0.5) * 5,
                        y: (Math.random() - 0.5) * 5
                    }
                ));
            }
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

    // Stun Bomb Logic
    if (upgradeLevels.stunBomb > 0) {
        if (!player.lastStunBombTime) player.lastStunBombTime = 0;
        const stunCooldown = 8000; // 8 seconds

        if (timestamp - player.lastStunBombTime > stunCooldown) {
            // Find nearest enemy
            let nearest = null;
            let minDist = Infinity;
            enemies.forEach(e => {
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d < minDist) {
                    minDist = d;
                    nearest = e;
                }
            });

            if (nearest) {
                // Limit throw range to 50px
                const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
                const throwDist = Math.min(minDist, 50);
                const tx = player.x + Math.cos(angle) * throwDist;
                const ty = player.y + Math.sin(angle) * throwDist;

                stunBombs.push(new StunBomb(player.x, player.y, tx, ty, upgradeLevels.stunBomb));
                player.lastStunBombTime = timestamp;
            }
        }
    }

    stunBombs.forEach((sb, index) => {
        sb.update();
        
        if (sb.exploded) {
            // Stun enemies in range
            enemies.forEach(enemy => {
                const dist = Math.hypot(sb.x - enemy.x, sb.y - enemy.y);
                if (dist < sb.range + enemy.radius) {
                    enemy.isStunned = true;
                    enemy.stunTimer = sb.stunDuration;
                    // Visual feedback
                    damageNumbers.push(new DamageNumber(enemy.x, enemy.y - 30, "STUN!", true));
                }
            });

            // Explosion visual
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(
                    sb.x, 
                    sb.y, 
                    Math.random() * 3, 
                    '#00E5FF', 
                    {
                        x: (Math.random() - 0.5) * 8,
                        y: (Math.random() - 0.5) * 8
                    }
                ));
            }
            
            stunBombs.splice(index, 1);
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
                     
                     // Add Hit Effect
                     effects.push(new HitEffect(enemy.x, enemy.y, enemy.color));

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

    // Update Effects (Shot/Hit)
    effects.forEach((effect, index) => {
        if (effect.life <= 0) {
            effects.splice(index, 1);
        } else {
            effect.update();
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
                    
                    // Add Hit Effect
                    effects.push(new HitEffect(enemy.x, enemy.y, enemy.color));

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
                const healText = new DamageNumber(player.x, player.y - 20, "+" + item.healAmount, false);
                healText.color = '#00FF00'; // Force Green Color
                damageNumbers.push(healText); 
                // Maybe add a green particle effect later
            } else if (item.type === 'nightVision') {
                nightVisionActive = true;
                nightVisionEndTime = performance.now() + item.duration;
                damageNumbers.push(new DamageNumber(player.x, player.y - 40, "Night Vision!", true));
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
                // Create Hit Effect
                effects.push(new HitEffect(projectile.x, projectile.y, enemy.color));

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
                let damage = projectile.damage || playerDamage;
                
                // Crit logic (Player and Drone share crit rate)
                let isCrit = Math.random() < player.critRate; 
                if (isCrit) {
                    damage *= 1.5; // 150% damage
                }
                damageNumbers.push(new DamageNumber(enemy.x, enemy.y - 20, damage, isCrit));

                enemy.health -= damage;

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

    // Fog of War removed
    if (nightVisionActive) {
        // Check if expired
        if (timestamp > nightVisionEndTime) {
            nightVisionActive = false;
        }
    }

    // Apply Shader Effects
    drawShaderEffect();

    // Random Chest Spawning (5% chance every second)
    if (timestamp - lastChestSpawnTime > 1000) {
        if (Math.random() < 0.05) {
            spawnRandomChest();
        }
        lastChestSpawnTime = timestamp;
    }
}

function spawnRandomChest() {
    let valid = false;
    let cx, cy;
    let attempts = 0;
    
    // Try to find a valid position not inside a building
    while (!valid && attempts < 10) {
        cx = Math.random() * world.width;
        cy = Math.random() * world.height;
        
        let hit = false;
        for (const b of buildings) {
            // Simple AABB check
            if (cx > b.x && cx < b.x + b.width && cy > b.y && cy < b.y + b.height) {
                hit = true;
                break;
            }
        }
        if (!hit) valid = true;
        attempts++;
    }
    
    if (valid) {
        chests.push(new Chest(cx, cy));
    }
}

function drawShaderEffect() {
    // 1. Vignette (Dark corners)
    const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.height/2, canvas.width/2, canvas.height/2, canvas.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Scanlines (CRT effect)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 2);
    }
    
    // 3. Color Tint (Atmosphere)
    ctx.fillStyle = 'rgba(0, 10, 30, 0.1)';
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
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

    // Find nearest enemy within range AND in facing direction
    let nearestEnemy = null;
    let minDist = Infinity;
    const attackRange = 300; // Increased range
    const viewAngle = Math.PI * 0.7; // Tầm nhìn 126 độ (rộng hơn nửa)

    enemies.forEach(enemy => {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < minDist && dist <= attackRange) {
            // Kiểm tra xem quái có trong tầm nhìn không
            const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            const angleDiff = Math.atan2(Math.sin(angleToEnemy - player.facingAngle), Math.cos(angleToEnemy - player.facingAngle));
            
            // Chỉ bắn quái trong tầm nhìn
            if (Math.abs(angleDiff) <= viewAngle / 2) {
                // Check Line of Sight
                if (hasLineOfSight(player, enemy)) {
                    minDist = dist;
                    nearestEnemy = enemy;
                }
            }
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
        
        // Add Shot Effect (Muzzle Flash) - Only one effect for all projectiles
        const muzzleDist = 45;
        const muzzleOffsetAngle = 0.1;
        const mx = player.x + Math.cos(baseAngle + muzzleOffsetAngle) * muzzleDist;
        const my = player.y + Math.sin(baseAngle + muzzleOffsetAngle) * muzzleDist;
        effects.push(new ShotEffect(mx, my, baseAngle));
        
        lastFired = timestamp;
    }
}

// --- Line of Sight Helpers ---

function hasLineOfSight(start, end) {
    for (const building of buildings) {
        if (checkLineRectCollision(start.x, start.y, end.x, end.y, building.x, building.y, building.width, building.height)) {
            return false;
        }
    }
    return true;
}

function checkLineRectCollision(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Check intersection with all 4 sides
    // Top
    if (getLineIntersection(x1, y1, x2, y2, rx, ry, rx + rw, ry)) return true;
    // Bottom
    if (getLineIntersection(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh)) return true;
    // Left
    if (getLineIntersection(x1, y1, x2, y2, rx, ry, rx, ry + rh)) return true;
    // Right
    if (getLineIntersection(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh)) return true;
    
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

    // Normalize direction to ensure diagonal speed isn't faster
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > 0) {
        // Normalize vector to length 1 if it exceeds 1 (Diagonal = ~1.414 -> 1)
        const scale = magnitude > 1 ? 1 / magnitude : 1;
        
        player.velocity.x = dx * scale * player.speed;
        player.velocity.y = dy * scale * player.speed;
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
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="drone"></div>
            <div class="guide-info">
                <h3>Combat Drone</h3>
                <p>Upgrade Item.</p>
                <p>Effect: Shoots enemies. Active 2s, Cooldown 8s.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="crit"></div>
            <div class="guide-info">
                <h3>Critical Strike</h3>
                <p>Upgrade Item.</p>
                <p>Effect: Increases Critical Hit Chance.</p>
            </div>
        </div>
    `,
    bosses: `
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="boss_spider"></div>
            <div class="guide-info">
                <h3>Giant Spider (Lvl 10)</h3>
                <p>First Boss Encounter.</p>
                <p>HP: 1000. Fast and deadly.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="boss_mutant"></div>
            <div class="guide-info">
                <h3>Mutant Zombie (Lvl 20)</h3>
                <p>Second Boss Encounter.</p>
                <p>HP: 1300. Massive damage dealer.</p>
            </div>
        </div>
        <div class="guide-item">
            <div class="guide-icon-container" data-icon="boss"></div>
            <div class="guide-info">
                <h3>Giant Skull</h3>
                <p>Random Boss (Lvl 30+).</p>
                <p>HP: Scales infinitely.</p>
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
                <p>Chance to deal 150% damage. Upgrade to increase chance.</p>
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

// Cheat Logic
const cheatBtn = document.getElementById('cheat-btn');
const cheatModal = document.getElementById('cheat-modal');
const closeCheatBtn = document.getElementById('close-cheat');

function openCheatMenu() {
    isPaused = true;
    cancelAnimationFrame(animationId);
    showCheatMenu(player, updateStats, upgradeLevels, MAX_LEVEL);
}

function closeCheatMenu() {
    cheatModal.classList.add('hidden');
    isPaused = false;
    animate(performance.now());
}

cheatBtn.addEventListener('click', openCheatMenu);
closeCheatBtn.addEventListener('click', closeCheatMenu);

// Login Logic
const loginScreen = document.getElementById('login-screen');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const uiContainer = document.querySelector('.ui-container');

// Initially hide UI and pause game logic (don't start loop yet)
uiContainer.classList.add('hidden');
guideBtn.classList.add('hidden');
cheatBtn.classList.add('hidden');
mobileToggleBtn.classList.add('hidden');

loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim() || "Soldier"; // Default if empty
    player.username = username;
    
    // Hide login, show UI
    loginScreen.classList.add('hidden');
    uiContainer.classList.remove('hidden');
    guideBtn.classList.remove('hidden');
    cheatBtn.classList.remove('hidden');
    mobileToggleBtn.classList.remove('hidden');
    
    // Start Game
    spawnEnemies();
    animate();
});

// Allow Enter key to login
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// Don't start automatically anymore
// spawnEnemies();
// animate();

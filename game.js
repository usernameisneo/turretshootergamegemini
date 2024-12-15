// filename: game.js

import { updateActionCards, updateCardDisplay, useCard } from './actionCards.js';

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = {
    level: 1,
    score: 0,
    enemiesKilled: 0,
    isPlaying: false,
    wave: 1
};

// Turret object
const turret = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    radius: 20,
    color: '#00ff00',
    rotation: 0,
    invincible: false,
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius + 10, 0);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
    },
    fire() {
        const currentWeapon = weapons[currentWeaponIndex];
        currentWeapon.fire(this.x, this.y, this.rotation);
    }
};

// Update the Weapon class based on the CSV data
class Weapon {
    constructor(name, description, damage, fireRate, bulletSpeed, bulletSize, bulletColor, specialMechanic, range, cooldown) {
        this.name = name;
        this.description = description;
        this.damage = damage;
        this.fireRate = fireRate;
        this.bulletSpeed = bulletSpeed;
        this.bulletSize = bulletSize;
        this.bulletColor = bulletColor;
        this.specialMechanic = specialMechanic;
        this.range = range;
        this.cooldown = cooldown;
        this.lastFired = 0;
    }

    canFire() {
        return Date.now() - this.lastFired > this.fireRate;
    }

    fire(x, y, angle) {
        if (this.canFire()) {
            bullets.push(new Bullet(x, y, angle, this.bulletSpeed, this.bulletSize, this.bulletColor, this.damage));
            this.lastFired = Date.now();
        }
    }
}

// Update weapons array based on CSV data
const weapons = [
    new Weapon("Laser Gun", "Fires a concentrated beam of light that deals high damage to a single target.", 100, 100, 1000, 2, '#ff0000', "Overcharge: 200% damage, 5s heat", 50, 3),
    new Weapon("Lava Gun", "Shoots globules of molten rock that splatter on impact, creating areas of burning damage over time.", 50, 300, 500, 5, '#ff6600', "20% chance for 2x area burst", 30, 2),
    new Weapon("Ice Gun", "Fires shards of ice that are particularly effective against heat-based enemies.", 30, 250, 750, 3, '#00ffff', "3s freeze, 50 bonus dmg on shatter", 25, 0),
    new Weapon("Freeze Gun", "Emits a cold blast that slows down all enemies caught in its area of effect.", 0, 400, 300, 8, '#0000ff', "50% move/attack speed reduction", 20, 5)
];

let currentWeaponIndex = 0;

// Bullet class
class Bullet {
    constructor(x, y, angle, speed, size, color, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.radius = size;
        this.color = color;
        this.damage = damage;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, radius, speed, color, health) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
        this.color = color;
        this.health = health;
        this.angle = 0;  // Initial angle towards the turret
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.angle = Math.atan2(turret.y - this.y, turret.x - this.x);
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Collision detection with turret
        const dx = this.x - turret.x;
        const dy = this.y - turret.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + turret.radius && !turret.invincible) {
            gameOver();
        }
    }
}

// Type of enemies
class BasicEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 15, 1, 'red', 10);
    }
}

class FastEnemy extends Enemy {
    constructor(x, y) {
         super(x, y, 10, 2, 'blue', 5);
    }
}


let enemies = [];
let bullets = [];
let waveInterval;


// Game functions
function startGame() {
    gameState.isPlaying = true;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    startWave();
    gameLoop();
}

function gameOver() {
    gameState.isPlaying = false;
    cancelAnimationFrame(gameLoopId);
    clearInterval(waveInterval);
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'block';
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalEnemiesKilled').textContent = gameState.enemiesKilled;
}

function restartGame() {
    gameState = {
        level: 1,
        score: 0,
        enemiesKilled: 0,
        isPlaying: false,
        wave: 1
    };
    enemies = [];
    bullets = [];
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    initGame();
    updateGameInfo();
}

function startWave() {
    clearInterval(waveInterval);

    const waveDuration = 20000; // Wave lasts 20 seconds

    waveInterval = setInterval(() => {
      spawnEnemy();
    }, 1000); // Spawn an enemy every 1 second

    setTimeout(() => {
      clearInterval(waveInterval);
       if(gameState.isPlaying) {
           gameState.level++;
           gameState.wave++;
          startWave();
       }
    }, waveDuration)
    updateGameInfo();
}

function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const spawnMargin = 50;


    // Choose spawn position based on side
    switch (side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = spawnMargin;
            break;
        case 1: // Right
            x = canvas.width - spawnMargin;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height - spawnMargin;
            break;
        case 3: // Left
            x = spawnMargin;
             y = Math.random() * canvas.height;
            break;
    }

   const enemyType = Math.random();

    if(enemyType < 0.7) {
        enemies.push(new BasicEnemy(x, y));
    }
    else {
        enemies.push(new FastEnemy(x, y));
    }
}

function updateGameInfo() {
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('enemiesKilledDisplay').textContent = gameState.enemiesKilled;
    document.getElementById('currentWeaponDisplay').textContent = weapons[currentWeaponIndex].name;
    document.getElementById('waveDisplay').textContent = gameState.wave;

}

// Function to update gun cards display
function updateGunCardDisplay() {
    const gunCardContainer = document.getElementById('gunCards');
    gunCardContainer.innerHTML = '';
    weapons.forEach((weapon, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card gun-card';
        cardElement.innerHTML = `
            <h3>${weapon.name}</h3>
            <p>${weapon.description}</p>
            <p>Damage: ${weapon.damage}</p>
            <p>Fire Rate: ${(1000/weapon.fireRate).toFixed(2)} shots/sec</p>
            <p>Range: ${weapon.range}m</p>
            <button onclick="selectWeapon(${index})">Select</button>
        `;
        if (index === currentWeaponIndex) {
            cardElement.classList.add('selected');
        }
        gunCardContainer.appendChild(cardElement);
    });
}

// Function to select a weapon
function selectWeapon(index) {
    if (index >= 0 && index < weapons.length) {
        currentWeaponIndex = index;
        updateGunCardDisplay();
        updateGameInfo();
    }
}

// Main game loop
function gameLoop() {
    if (!gameState.isPlaying) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    turret.draw();
    
      // Update and draw bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].draw();

         // Remove bullets that are out of bounds
        if (bullets[i].x < 0 || bullets[i].x > canvas.width || bullets[i].y < 0 || bullets[i].y > canvas.height) {
            bullets.splice(i, 1);
            continue;
        }


        // Check for collisions with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
           const enemy = enemies[j];
            const dx = bullets[i].x - enemy.x;
            const dy = bullets[i].y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < bullets[i].radius + enemy.radius) {

                enemy.health -= bullets[i].damage;
                bullets.splice(i, 1); // Remove the bullet after hitting
                if (enemy.health <= 0 ) {
                    enemies.splice(j, 1); // Remove the enemy if health is 0
                    gameState.score += 10;
                    gameState.enemiesKilled++;
                }
                break;
            }

        }
    }
    
    // Update and draw enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
       enemies[i].update();
       enemies[i].draw();
    }

    updateActionCards();
    updateGameInfo();
    updateGunCardDisplay(); // Add this line to update gun cards
    updateCardDisplay();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Event listeners
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', restartGame);

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    turret.rotation = Math.atan2(mouseY - turret.y, mouseX - turret.x);
    turret.fire();
});

// Update the event listener for number keys
document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '4') {
        selectWeapon(parseInt(e.key) - 1);
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    turret.rotation = Math.atan2(mouseY - turret.y, mouseX - turret.x);
});

// Initialize the game
function initGame() {
    canvas.width = 800;
    canvas.height = 600;
    document.getElementById('startScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    turret.x = canvas.width / 2;
    turret.y = canvas.height - 30;
    currentWeaponIndex = 0;
    updateGameInfo();
    updateGunCardDisplay(); // Add this line to initialize gun cards
}

window.addEventListener('load', initGame);

// Make selectWeapon function globally available
window.selectWeapon = selectWeapon;

// Variable to store the game loop animation frame ID
let gameLoopId;
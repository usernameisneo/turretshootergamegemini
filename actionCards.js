// filename: actionCards.js

// Action Card class
class ActionCard {
    constructor(name, description, duration, effect) {
        this.name = name;
        this.description = description;
        this.duration = duration; // in milliseconds
        this.effect = effect;
        this.active = false;
        this.activatedTime = 0;
    }

    activate() {
        this.active = true;
        this.activatedTime = Date.now();
        this.effect(true);
    }

    deactivate() {
        this.active = false;
        this.effect(false);
    }

    update() {
        if (this.active && Date.now() - this.activatedTime > this.duration) {
            this.deactivate();
        }
    }
}

// Define action cards
const actionCards = [
    new ActionCard("Rapid Fire", "Doubles fire rate for 10 seconds", 10000, (activate) => {
        weapons.forEach(weapon => {
            weapon.fireRate = activate ? weapon.fireRate / 2 : weapon.fireRate * 2;
        });
    }),
    new ActionCard("Shield", "Provides invincibility for 5 seconds", 5000, (activate) => {
        turret.invincible = activate;
    }),
    new ActionCard("Nuke", "Destroys all enemies on screen", 0, (activate) => {
        if (activate) {
            enemies.forEach(enemy => {
                gameState.score += 10;
                gameState.enemiesKilled++;
            });
            enemies = [];
        }
    }),
    new ActionCard("Freeze", "Slows down all enemies for 7 seconds", 7000, (activate) => {
        enemies.forEach(enemy => {
            enemy.speed = activate ? enemy.speed / 2 : enemy.speed * 2;
        });
    })
];

let availableCards = [];

// Function to add a random card to available cards
function addRandomCard() {
    if (availableCards.length < 3) {
        const randomIndex = Math.floor(Math.random() * actionCards.length);
        availableCards.push(actionCards[randomIndex]);
        updateCardDisplay();
    }
}

// Function to use a card
function useCard(index) {
    if (index >= 0 && index < availableCards.length) {
        const card = availableCards[index];
        card.activate();
        availableCards.splice(index, 1);
        updateCardDisplay();
    }
}

// Update action cards
function updateActionCards() {
    actionCards.forEach(card => card.update());
}

// Update game info display to show available cards
function updateCardDisplay() {
    const cardContainer = document.getElementById('actionCards');
    cardContainer.innerHTML = '';
    availableCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card action-card';
        cardElement.innerHTML = `
            <h3>${card.name}</h3>
            <p>${card.description}</p>
            <button onclick="useCard(${index})">Use</button>
        `;
        cardContainer.appendChild(cardElement);
    });
}

// Add a new card every 30 seconds
setInterval(addRandomCard, 30000);

// Export functions to be used in the main game file
export { updateActionCards, updateCardDisplay, useCard };
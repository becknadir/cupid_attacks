const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameCompleteDiv = document.getElementById('gameComplete');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Load background image
const backgroundImage = new Image();
backgroundImage.src = 'assets/background.jpg';

// Load cupid image
const cupidImage = new Image();
cupidImage.src = 'assets/cupid.png';

// At the top with other image loading
const personImage1 = new Image();
personImage1.src = 'assets/male.png'; // male character
const personImage2 = new Image();
personImage2.src = 'assets/female.png'; // female character

class Cupid {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = 50;
        this.speed = 5;
        this.shooting = false;
        this.direction = 'right'; // track facing direction
        this.velocity = { x: 0, y: 0 }; // for smooth movement
        this.lastShotTime = 0;
        this.shootCooldown = 500; // Changed from 2000 to 500 milliseconds (0.5 seconds)
    }

    draw() {
        ctx.save();
        if (this.direction === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(cupidImage, -this.x - this.width, this.y, this.width, this.height);
        } else {
            ctx.drawImage(cupidImage, this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }

    move() {
        // Apply velocity for smooth movement
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Boundary checks
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }

    checkCollisionWithPeople(people) {
        return people.some(person => {
            return this.x < person.x + person.width &&
                   this.x + this.width > person.x &&
                   this.y < person.y + person.height &&
                   this.y + this.height > person.y;
        });
    }

    canShoot() {
        return Date.now() - this.lastShotTime >= this.shootCooldown;
    }
}

class Arrow {
    constructor(startX, startY, direction) {
        this.x = startX;
        this.y = startY;
        this.speed = 7;
        this.width = 20;
        this.height = 5;
        this.direction = direction; // 'right', 'left'
    }

    draw() {
        ctx.save();
        ctx.fillStyle = 'pink';
        
        if (this.direction === 'left') {
            ctx.translate(this.x, this.y);
            ctx.scale(-1, 1);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.width, 0);
            ctx.lineTo(this.width + 5, this.height / 2);
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width + 5, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    update() {
        if (this.direction === 'left') {
            this.x -= this.speed;
        } else {
            this.x += this.speed;
        }
    }
}

class Person {
    constructor() {
        this.width = 40;
        this.height = 60;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = Math.random() * (canvas.height - this.height - 100) + 100;
        this.speed = Math.random() * 2 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
        this.hit = false;
        this.partner = null;
        this.directionChangeTimer = 0;
        this.directionChangeInterval = Math.random() * 100 + 50;
        // Randomly assign character type
        this.characterType = Math.random() < 0.5 ? 'type1' : 'type2';
    }

    draw() {
        const image = this.characterType === 'type1' ? personImage1 : personImage2;
        
        // Draw character with proper direction
        ctx.save();
        if (this.velocityX < 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(image, -this.x - this.width, this.y, this.width, this.height);
        } else {
            ctx.drawImage(image, this.x, this.y, this.width, this.height);
        }
        ctx.restore();
        
        if (this.hit) {
            this.drawHearts();
        }
    }

    drawHearts() {
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.fillText('❤️', this.x + this.width / 2 - 10, this.y - 10);
    }

    changeDirection() {
        // Random angle change between -45 and 45 degrees
        const angleChange = (Math.random() - 0.5) * Math.PI / 2;
        this.angle += angleChange;
        this.velocityX = Math.cos(this.angle) * this.speed;
        this.velocityY = Math.sin(this.angle) * this.speed;
    }

    update() {
        if (!this.partner) {
            // Update position
            this.x += this.velocityX;
            this.y += this.velocityY;

            // Bounce off walls
            if (this.x <= 0 || this.x + this.width >= canvas.width) {
                this.velocityX *= -1;
                this.angle = Math.atan2(this.velocityY, this.velocityX);
            }
            if (this.y <= 100 || this.y + this.height >= canvas.height) {
                this.velocityY *= -1;
                this.angle = Math.atan2(this.velocityY, this.velocityX);
            }

            // Randomly change direction
            this.directionChangeTimer++;
            if (this.directionChangeTimer >= this.directionChangeInterval) {
                this.changeDirection();
                this.directionChangeTimer = 0;
                this.directionChangeInterval = Math.random() * 100 + 50; // New random interval
            }
        } else {
            // When paired, move smoothly together
            const targetX = this.partner.x + (Math.cos(this.angle) > 0 ? 30 : -30);
            const targetY = this.partner.y;
            this.x += (targetX - this.x) * 0.1;
            this.y += (targetY - this.y) * 0.1;
        }
    }
}

let cupid = new Cupid();
let arrows = [];
let people = [];
let matchedPairs = 0;
const totalPairs = 5; // 10 people, 5 pairs

function init() {
    // Create 10 people
    for (let i = 0; i < 10; i++) {
        people.push(new Person());
    }
}

function resetGame() {
    cupid = new Cupid();
    arrows = [];
    people = [];
    matchedPairs = 0;
    gameCompleteDiv.style.display = 'none';
    init();
    // Restart the game loop
    gameLoop();
}

function checkCollisions() {
    arrows.forEach((arrow, arrowIndex) => {
        people.forEach(person => {
            if (!person.hit && 
                arrow.x < person.x + person.width &&
                arrow.x + arrow.width > person.x &&
                arrow.y < person.y + person.height &&
                arrow.y + arrow.height > person.y) {
                
                person.hit = true;
                arrows.splice(arrowIndex, 1);

                // Check for matching
                const hitPeople = people.filter(p => p.hit && !p.partner);
                if (hitPeople.length >= 2) {
                    hitPeople[0].partner = hitPeople[1];
                    hitPeople[1].partner = hitPeople[0];
                    matchedPairs++;
                }
            }
        });
    });
}

function gameLoop() {
    // Update cupid's velocity first
    updateCupidVelocity();
    
    // Revert back to original background drawing
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    
    // Check for collision between cupid and people
    if (cupid.checkCollisionWithPeople(people)) {
        gameOver();
        return;
    }

    cupid.move(); // Apply smooth movement
    cupid.draw();
    
    // Update arrows and filter out-of-bounds arrows
    arrows = arrows.filter(arrow => {
        return arrow.x > 0 && arrow.x < canvas.width;
    });
    
    arrows.forEach(arrow => {
        arrow.update();
        arrow.draw();
    });
    
    people.forEach(person => {
        person.update();
        person.draw();
    });
    
    checkCollisions();
    
    if (matchedPairs === totalPairs) {
        showVictoryScreen();
    } else {
        requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    const gameOverDiv = document.getElementById('gameComplete');
    gameOverDiv.innerHTML = `
        <h2>Game Over!</h2>
        <p>Cupid crashed into someone! 💔</p>
        <button onclick="resetGame()">Try Again</button>
    `;
    gameOverDiv.style.display = 'block';
    // Stop the current game loop by not calling requestAnimationFrame
}

// Add this new function for the victory screen
function showVictoryScreen() {
    const gameCompleteDiv = document.getElementById('gameComplete');
    gameCompleteDiv.innerHTML = `
        <h2>Congratulations!</h2>
        <p>All couples are matched! Love is in the air! ❤️</p>
        <button onclick="resetGame()">Play Again</button>
    `;
    gameCompleteDiv.style.display = 'block';
}

// Update the event listeners for smooth movement
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

document.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        
        if (e.key === 'ArrowLeft') {
            cupid.direction = 'left';
        } else if (e.key === 'ArrowRight') {
            cupid.direction = 'right';
        }
    }
    
    if (e.key === ' ' && cupid.canShoot()) {
        const arrowX = cupid.direction === 'left' ? 
            cupid.x : 
            cupid.x + cupid.width;
        arrows.push(new Arrow(arrowX, cupid.y + cupid.height / 2, cupid.direction));
        cupid.lastShotTime = Date.now();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

// Add this to your gameLoop or create a separate function to update cupid's velocity
function updateCupidVelocity() {
    cupid.velocity.x = 0;
    cupid.velocity.y = 0;
    
    if (keys.ArrowLeft) cupid.velocity.x = -cupid.speed;
    if (keys.ArrowRight) cupid.velocity.x = cupid.speed;
    if (keys.ArrowUp) cupid.velocity.y = -cupid.speed;
    if (keys.ArrowDown) cupid.velocity.y = cupid.speed;
}

// Wait for images to load before starting the game
let imagesLoaded = 0;
const totalImages = 4; // background, cupid, and 2 person images

function startGame() {
    if (imagesLoaded === totalImages) {
        init();
        gameLoop();
    }
}

backgroundImage.onload = () => {
    imagesLoaded++;
    startGame();
};

cupidImage.onload = () => {
    imagesLoaded++;
    startGame();
};

// Add to image loading checks
personImage1.onload = () => {
    imagesLoaded++;
    startGame();
};

personImage2.onload = () => {
    imagesLoaded++;
    startGame();
}; 
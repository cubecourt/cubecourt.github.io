// game.js
class Game {
    constructor() {
        this.players = [];
        this.cube = {
            x: 0,
            y: 0,
            speed: 5,
            direction: { x: 1, y: 1 }
        };
        this.currentPlayer = null;
        this.holdingCube = null;
        this.holdTimer = 15;
        this.gameInterval = null;
        this.teleportInterval = null;
        this.isPaused = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializePlayers();
    }

    initializeElements() {
        this.startScreen = document.getElementById('startScreen');
        this.gameContainer = document.getElementById('gameContainer');
        this.court = document.getElementById('court');
        this.cubeElement = document.getElementById('cube');
        this.timerElement = document.getElementById('timer');
        this.winScreen = document.getElementById('winScreen');
        this.winMessage = document.getElementById('winMessage');
    }

    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('playAgainButton').addEventListener('click', () => this.resetGame());
        
        document.addEventListener('keydown', (e) => {
            if (this.isPaused) return;
            this.handleKeyPress(e);
        });
    }

    initializePlayers() {
        // Player 1 squares (1-5)
        for (let i = 1; i <= 5; i++) {
            this.players.push({
                id: i,
                team: 1,
                x: 100 + (i * 60),
                y: 200,
                element: this.createPlayerElement(i, 1),
                randomMovement: {
                    direction: { x: 0, y: 0 },
                    timer: 0
                }
            });
        }

        // Player 2 squares (6-0)
        for (let i = 6; i <= 10; i++) {
            this.players.push({
                id: i,
                team: 2,
                x: 500 + ((i - 5) * 60),
                y: 200,
                element: this.createPlayerElement(i, 2),
                randomMovement: {
                    direction: { x: 0, y: 0 },
                    timer: 0
                }
            });
        }
    }

    createPlayerElement(id, team) {
        const player = document.createElement('div');
        player.className = `player player${team}`;
        player.textContent = id;
        this.court.appendChild(player);
        return player;
    }

    startGame() {
        this.startScreen.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        
        // Initialize cube position
        this.cube.x = this.court.offsetWidth / 2 - 15;
        this.cube.y = this.court.offsetHeight / 2 - 15;
        
        this.gameInterval = setInterval(() => this.gameLoop(), 16);
        this.teleportInterval = setInterval(() => this.teleportCube(), 6000);
    }

    gameLoop() {
        if (this.isPaused) return;

        if (!this.holdingCube) {
            // Move cube
            this.cube.x += this.cube.direction.x * this.cube.speed;
            this.cube.y += this.cube.direction.y * this.cube.speed;

            // Bounce off walls
            if (this.cube.x <= 0 || this.cube.x >= this.court.offsetWidth - 30) {
                this.cube.direction.x *= -1;
                this.cube.speed = 3 + Math.random() * 4;
            }
            if (this.cube.y <= 0 || this.cube.y >= this.court.offsetHeight - 30) {
                this.cube.direction.y *= -1;
                this.cube.speed = 3 + Math.random() * 4;
            }
        } else {
            // Update cube position to follow holding player
            this.cube.x = this.holdingCube.x + 5;
            this.cube.y = this.holdingCube.y + 5;
        }

        // Update random movement for inactive players
        this.updateRandomMovement();

        // Update positions
        this.updatePositions();

        // Keep players within bounds
        this.keepPlayersInBounds();
    }

    updateRandomMovement() {
        this.players.forEach(player => {
            if (player !== this.currentPlayer) {
                if (player.randomMovement.timer <= 0) {
                    player.randomMovement.direction = {
                        x: (Math.random() - 0.5) * 2,
                        y: (Math.random() - 0.5) * 2
                    };
                    player.randomMovement.timer = Math.random() * 60 + 30;
                }

                const speed = player === this.holdingCube ? 2 : 1;
                player.x += player.randomMovement.direction.x * speed;
                player.y += player.randomMovement.direction.y * speed;
                player.randomMovement.timer--;
            }
        });
    }

    keepPlayersInBounds() {
        this.players.forEach(player => {
            player.x = Math.max(0, Math.min(player.x, this.court.offsetWidth - 40));
            player.y = Math.max(0, Math.min(player.y, this.court.offsetHeight - 40));
        });
    }

    updatePositions() {
        // Update cube position
        this.cubeElement.style.left = `${this.cube.x}px`;
        this.cubeElement.style.top = `${this.cube.y}px`;

        // Update players positions
        this.players.forEach(player => {
            player.element.style.left = `${player.x}px`;
            player.element.style.top = `${player.y}px`;
        });
    }

    handleKeyPress(e) {
        if (!this.currentPlayer) {
            const playerNum = parseInt(e.key);
            if (!isNaN(playerNum) && playerNum >= 1 && playerNum <= 10) {
                this.currentPlayer = this.players.find(p => p.id === playerNum);
            }
            return;
        }

        // Movement
        const speed = 5;
        if (this.currentPlayer.team === 1) {
            if (e.key === 'w') this.currentPlayer.y -= speed;
            if (e.key === 's') this.currentPlayer.y += speed;
            if (e.key === 'a') this.currentPlayer.x -= speed;
            if (e.key === 'd') this.currentPlayer.x += speed;
            if (e.key === 'c') this.tryGrabCube();
        } else {
            if (e.key === 'ArrowUp') this.currentPlayer.y -= speed;
            if (e.key === 'ArrowDown') this.currentPlayer.y += speed;
            if (e.key === 'ArrowLeft') this.currentPlayer.x -= speed;
            if (e.key === 'ArrowRight') this.currentPlayer.x += speed;
            if (e.key === 'm') this.tryGrabCube();
        }

        // Switch players
        const playerNum = parseInt(e.key);
        if (!isNaN(playerNum) && playerNum >= 1 && playerNum <= 10) {
            const newPlayer = this.players.find(p => p.id === playerNum);
            if (newPlayer) {
                if (this.holdingCube && this.currentPlayer && newPlayer.team === this.currentPlayer.team) {
                    this.passCube(newPlayer);
                }
                this.currentPlayer = newPlayer;
            }
        }
    }

    tryGrabCube() {
        if (!this.currentPlayer) return;

        const distance = Math.hypot(
            this.currentPlayer.x - this.cube.x,
            this.currentPlayer.y - this.cube.y
        );

        if (distance < 50) {
            if (!this.holdingCube) {
                this.holdingCube = this.currentPlayer;
                this.timerElement.classList.remove('hidden');
                this.startHoldTimer();
            } else if (this.holdingCube.team !== this.currentPlayer.team) {
                this.holdingCube = this.currentPlayer;
                this.holdTimer = 15;
            }
        }
    }

    passCube(newPlayer) {
        if (!this.holdingCube) return;
        
        this.holdingCube = newPlayer;
        
        // Visual passing effect
        const passEffect = document.createElement('div');
        passEffect.className = 'cube';
        passEffect.style.left = `${this.cube.x}px`;
        passEffect.style.top = `${this.cube.y}px`;
        passEffect.style.opacity = '0.5';
        this.court.appendChild(passEffect);
        
        setTimeout(() => {
            this.court.removeChild(passEffect);
        }, 300);
    }

    startHoldTimer() {
        const timerInterval = setInterval(() => {
            if (this.isPaused) return;
            
            this.holdTimer -= 0.1;
            this.timerElement.textContent = Math.ceil(this.holdTimer);

            if (this.holdTimer <= 0) {
                clearInterval(timerInterval);
                this.endGame(this.holdingCube.team);
            }
        }, 100);
    }

    teleportCube() {
        if (this.isPaused || this.holdingCube) return;

        this.cube.x = Math.random() * (this.court.offsetWidth - 30);
        this.cube.y = Math.random() * (this.court.offsetHeight - 30);
        this.cube.direction = {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        };
        this.cube.speed = 3 + Math.random() * 4;

        // Teleport visual effect
        this.cubeElement.style.transform = 'scale(1.5)';
        setTimeout(() => {
            this.cubeElement.style.transform = 'scale(1)';
        }, 200);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseButton').textContent = this.isPaused ? '▶' : '❚❚';
    }

    endGame(winningTeam) {
        clearInterval(this.gameInterval);
        clearInterval(this.teleportInterval);
        
        this.winMessage.textContent = `TEAM ${winningTeam} WINS!`;
        this.winScreen.classList.remove('hidden');
    }

    resetGame() {
        window.location.reload();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});

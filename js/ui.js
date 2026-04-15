class UIManager {
    constructor() {
        this.mainMenu = document.getElementById('main-menu');
        this.hud = document.getElementById('hud');
        this.levelUpScreen = document.getElementById('level-up-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');

        this.healthBar = document.getElementById('health-bar');
        this.xpBar = document.getElementById('xp-bar');
        this.levelDisplay = document.getElementById('level-display');
        this.timerDisplay = document.getElementById('timer');
        this.upgradeOptionsContainer = document.getElementById('upgrade-options');

        this.upgradeManager = new UpgradeManager();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Character Selection
        document.querySelectorAll('.char-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                window.selectedCharacter = btn.dataset.char;
                this.checkStartReady();
            });
        });

        // Instrument Selection
        document.querySelectorAll('.inst-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.inst-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                window.selectedInstrument = btn.dataset.inst;
                this.checkStartReady();
            });
        });

        // Start Button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Restart Button
        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload(); // Simple reload to reset state
        });
    }

    checkStartReady() {
        const startBtn = document.getElementById('start-btn');
        if (window.selectedCharacter && window.selectedInstrument) {
            startBtn.disabled = false;
        } else {
            startBtn.disabled = true;
        }
    }

    startGame() {
        this.mainMenu.classList.remove('active');
        this.mainMenu.classList.add('hidden');

        this.hud.classList.remove('hidden');
        this.hud.classList.add('active');

        // Initialize Player
        let engine = window.gameEngine;
        engine.player = new Player(engine.width/2, engine.height/2, window.selectedCharacter);

        // Initialize Weapon
        let weapon;
        switch(window.selectedInstrument) {
            case 'Lute': weapon = new HollowLute(); break;
            case 'Drum': weapon = new RootDrum(); break;
            case 'Flute': weapon = new SilverFlute(); break;
        }
        engine.player.setWeapon(weapon);

        // Initialize Wave Manager
        window.waveManager = new WaveManager();

        // Initialize Miasma
        engine.miasma = new Miasma();

        engine.start();

        // Timer update loop
        this.timerInterval = setInterval(() => {
            if (engine.isRunning) {
                let time = Math.floor(engine.gameTime);
                let mins = Math.floor(time / 60).toString().padStart(2, '0');
                let secs = (time % 60).toString().padStart(2, '0');
                this.timerDisplay.textContent = `${mins}:${secs}`;
            }
        }, 1000);
    }

    updateHealth(current, max) {
        let percent = Math.max(0, (current / max) * 100);
        this.healthBar.style.width = `${percent}%`;
    }

    updateXp(current, required) {
        let percent = Math.min(100, (current / required) * 100);
        this.xpBar.style.width = `${percent}%`;
    }

    updateLevel(level) {
        this.levelDisplay.textContent = `Lv ${level}`;
    }

    showLevelUpScreen() {
        window.gameEngine.pause();

        this.levelUpScreen.classList.remove('hidden');
        this.levelUpScreen.classList.add('active');

        this.upgradeOptionsContainer.innerHTML = '';

        let options = this.upgradeManager.getOptions(3);

        options.forEach(opt => {
            let btn = document.createElement('button');
            btn.className = 'upgrade-btn';
            btn.innerHTML = `
                <h3>${opt.name}</h3>
                <div class="desc">${opt.desc}</div>
                <div class="type">${opt.type}</div>
            `;

            btn.addEventListener('click', () => {
                this.upgradeManager.applyUpgrade(opt.id);
                this.hideLevelUpScreen();
            });

            this.upgradeOptionsContainer.appendChild(btn);
        });
    }

    hideLevelUpScreen() {
        this.levelUpScreen.classList.remove('active');
        this.levelUpScreen.classList.add('hidden');
        window.gameEngine.resume();
    }

    showGameOver() {
        window.gameEngine.pause();
        clearInterval(this.timerInterval);

        this.gameOverScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('active');

        let stats = document.getElementById('game-over-stats');
        let time = Math.floor(window.gameEngine.gameTime);
        let mins = Math.floor(time / 60).toString().padStart(2, '0');
        let secs = (time % 60).toString().padStart(2, '0');

        stats.innerHTML = `
            Survived for: ${mins}:${secs}<br>
            Level Reached: ${window.gameEngine.player.level}<br>
            Harmonizations: ${this.upgradeManager.playerUpgrades.filter(id => SYMPHONIES.some(s => s.id === id)).length}
        `;
    }
}

// Global initialization
window.addEventListener('load', () => {
    window.uiManager = new UIManager();
});
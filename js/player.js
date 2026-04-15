class Player {
    constructor(x, y, characterName) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.speed = 150;

        this.characterName = characterName;
        this.setupCharacterStats();

        this.maxHealth = 100;
        this.health = this.maxHealth;

        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 10;

        this.invulnerableTime = 0;
        this.dead = false;

        this.weapon = null; // Will be set by main.js
        this.charms = []; // Orbiting charms

        this.color = '#d4af37'; // Base harmony color
    }

    setupCharacterStats() {
        switch(this.characterName) {
            case 'Lyra':
                this.speed = 160;
                break;
            case 'Bram':
                this.maxHealth = 120;
                this.speed = 130;
                break;
            case 'Sera':
                this.speed = 180;
                break;
            case 'Oren':
                this.maxHealth = 110;
                break;
        }
    }

    setWeapon(weapon) {
        this.weapon = weapon;
        this.weapon.owner = this;
    }

    update(dt, keys) {
        if (this.dead) return;

        // Movement
        let dx = 0;
        let dy = 0;

        if (keys.w || keys.ArrowUp) dy -= 1;
        if (keys.s || keys.ArrowDown) dy += 1;
        if (keys.a || keys.ArrowLeft) dx -= 1;
        if (keys.d || keys.ArrowRight) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            let length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        // Apply speed
        let currentSpeed = this.speed;

        // Sera's passive: Fleet Footed (speed boost after damage)
        if (this.characterName === 'Sera' && this.invulnerableTime > 0) {
            currentSpeed *= 1.3;
        }

        this.x += dx * currentSpeed * dt;
        this.y += dy * currentSpeed * dt;

        // Boundary checking
        const margin = this.radius;
        this.x = Math.max(margin, Math.min(window.gameEngine.width - margin, this.x));
        this.y = Math.max(margin, Math.min(window.gameEngine.height - margin, this.y));

        // Invulnerability timer
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= dt;
        }

        // Update weapon
        if (this.weapon) {
            this.weapon.update(dt, window.gameEngine.enemies);
        }

        // Update charms
        this.charms.forEach(charm => charm.update(dt));
    }

    draw(ctx) {
        if (this.dead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Flash if invulnerable
        if (this.invulnerableTime > 0) {
            ctx.globalAlpha = Math.floor(window.gameEngine.gameTime * 10) % 2 === 0 ? 0.5 : 1;
        }

        // Draw player body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw character specific details
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
        ctx.stroke();

        // Draw charms
        this.charms.forEach(charm => charm.draw(ctx));

        ctx.restore();
    }

    takeDamage(amount) {
        if (this.invulnerableTime <= 0 && !this.dead) {
            this.health -= amount;
            this.invulnerableTime = 1.0; // 1 second i-frames

            // Bram's passive: Thorned Aura
            if (this.characterName === 'Bram') {
                this.triggerThorns();
            }

            // Update UI
            if (window.uiManager) {
                window.uiManager.updateHealth(this.health, this.maxHealth);
            }

            if (this.health <= 0) {
                this.die();
            }
        }
    }

    triggerThorns() {
        // Find close enemies and damage them
        const range = 50;
        const damage = this.maxHealth * 0.1;
        window.gameEngine.enemies.forEach(enemy => {
            let dx = enemy.x - this.x;
            let dy = enemy.y - this.y;
            if (Math.sqrt(dx*dx + dy*dy) < range + enemy.radius) {
                enemy.takeDamage(damage);
            }
        });

        // Visual effect
        window.gameEngine.addEntity('effects', new ThornEffect(this.x, this.y, range));
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }

        if (window.uiManager) {
            window.uiManager.updateXp(this.xp, this.xpToNextLevel);
        }
    }

    levelUp() {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

        if (window.uiManager) {
            window.uiManager.updateLevel(this.level);
            window.uiManager.showLevelUpScreen();
        }
    }

    die() {
        this.dead = true;
        if (window.uiManager) {
            window.uiManager.showGameOver();
        }
    }
}

class ThornEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 0.2;
        this.maxLife = 0.2;
        this.dead = false;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = '#228B22'; // Forest green
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw some random spikes
        for(let i = 0; i < 8; i++) {
            let angle = (i / 8) * Math.PI * 2;
            let innerR = this.radius * 0.8;
            let outerR = this.radius * 1.2;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(angle)*innerR, this.y + Math.sin(angle)*innerR);
            ctx.lineTo(this.x + Math.cos(angle)*outerR, this.y + Math.sin(angle)*outerR);
            ctx.stroke();
        }
        ctx.restore();
    }
}

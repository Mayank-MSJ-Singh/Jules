class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = 50;
        this.maxHealth = 20;
        this.health = this.maxHealth;
        this.damage = 10;
        this.xpValue = 1;
        this.dead = false;

        // Status effects
        this.slowFactor = 1;
        this.slowTimer = 0;

        this.color = '#8b008b'; // Default discord color
    }

    update(dt, player) {
        if (!player || player.dead) return;

        // Update status effects
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            if (this.slowTimer <= 0) {
                this.slowFactor = 1;
            }
        }

        this.move(dt, player);
    }

    move(dt, player) {
        // Default behavior: move directly towards player
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 0) {
            let currentSpeed = this.speed * this.slowFactor;
            this.x += (dx/dist) * currentSpeed * dt;
            this.y += (dy/dist) * currentSpeed * dt;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Flash white if recently damaged
        if (this.damageFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.damageFlashTimer = 0.1;

        if (this.health <= 0) {
            this.die();
        }
    }

    applySlow(factor, duration) {
        this.slowFactor = factor;
        this.slowTimer = duration;
    }

    die() {
        this.dead = true;
        // Drop XP shard
        window.gameEngine.addEntity('collectibles', new HarmonyShard(this.x, this.y, this.xpValue));
        // Add death effect
        window.gameEngine.addEntity('effects', new DeathEffect(this.x, this.y, this.color));
    }
}

// 1. Enthralled Squirrel: Fast, direct charge
class EnthralledSquirrel extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 8;
        this.speed = 100;
        this.maxHealth = 15;
        this.health = this.maxHealth;
        this.damage = 5;
        this.color = '#a0522d'; // Sienna/brown
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw erratic jagged lines representing corruption
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(5, 5);
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 2. Corrupted Sprout: Stationary, fires homing seed
class CorruptedSprout extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 12;
        this.speed = 0; // Stationary
        this.maxHealth = 30;
        this.health = this.maxHealth;
        this.damage = 10;
        this.color = '#556b2f'; // Dark olive green

        this.fireCooldown = 2.0;
        this.fireTimer = Math.random() * 2.0; // Randomize start
    }

    update(dt, player) {
        super.update(dt, player);

        if (!player || player.dead) return;

        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            this.fire(player);
            this.fireTimer = this.fireCooldown;
        }
    }

    fire(player) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 0) {
            let speed = 60;
            let vx = (dx/dist) * speed;
            let vy = (dy/dist) * speed;

            let proj = new EnemyProjectile(this.x, this.y, vx, vy, 4, 10, true); // true = homing
            window.gameEngine.addEntity('projectiles', proj);
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(this.x - this.radius, this.y - this.radius, this.radius*2, this.radius*2);
        ctx.fill();

        // Draw corrupted flower
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 3. Discordant Wisp: Phases, 3-way static spread
class DiscordantWisp extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 10;
        this.speed = 40;
        this.maxHealth = 25;
        this.health = this.maxHealth;
        this.color = '#9370db'; // Medium purple

        this.phaseTimer = 0;
        this.isVisible = true;
        this.fireCooldown = 3.0;
        this.fireTimer = this.fireCooldown;
    }

    update(dt, player) {
        super.update(dt, player);

        this.phaseTimer += dt;
        if (this.phaseTimer > 2.0) {
            this.isVisible = !this.isVisible;
            this.phaseTimer = 0;

            // Fire when becoming visible
            if (this.isVisible && player) {
                this.fire(player);
            }
        }
    }

    fire(player) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let baseAngle = Math.atan2(dy, dx);

        let speed = 100;
        let angles = [baseAngle - 0.3, baseAngle, baseAngle + 0.3];

        angles.forEach(angle => {
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            let proj = new EnemyProjectile(this.x, this.y, vx, vy, 3, 8, false);
            proj.color = '#ff00ff';
            window.gameEngine.addEntity('projectiles', proj);
        });
    }

    draw(ctx) {
        if (!this.isVisible) {
            ctx.globalAlpha = 0.2;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x + this.radius, this.y + this.radius);
        ctx.lineTo(this.x - this.radius, this.y + this.radius);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1.0;
    }
}

// 4. Thorned Tangle: Large, slow, leaves brambles
class ThornedTangle extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 20;
        this.speed = 30;
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.damage = 15;
        this.xpValue = 5;
        this.color = '#2f4f4f'; // Dark slate gray

        this.brambleTimer = 0;
    }

    update(dt, player) {
        super.update(dt, player);

        this.brambleTimer -= dt;
        if (this.brambleTimer <= 0) {
            this.leaveBramble();
            this.brambleTimer = 1.5;
        }
    }

    leaveBramble() {
        let bramble = new BrambleHazard(this.x, this.y);
        window.gameEngine.addEntity('effects', bramble);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Rough circle
        for (let i = 0; i < 8; i++) {
            let angle = (i / 8) * Math.PI * 2;
            let r = this.radius + (Math.random() * 4 - 2);
            let px = this.x + Math.cos(angle) * r;
            let py = this.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#8b0000'; // Dark red thorns
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class EnemyProjectile extends Projectile {
    constructor(x, y, vx, vy, radius, damage, homing = false) {
        super(x, y, vx, vy, radius);
        this.damage = damage;
        this.isEnemyProjectile = true;
        this.homing = homing;
        this.color = '#ff00ff';
        this.speed = Math.sqrt(vx*vx + vy*vy);
    }

    update(dt) {
        if (this.homing && window.gameEngine.player) {
            let player = window.gameEngine.player;
            let dx = player.x - this.x;
            let dy = player.y - this.y;
            let targetAngle = Math.atan2(dy, dx);
            let currentAngle = Math.atan2(this.vy, this.vx);

            // Simple homing: gradually adjust angle
            // Normalize angle diff to -PI to PI
            let diff = targetAngle - currentAngle;
            while (diff <= -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            let turnSpeed = 1.0 * dt; // radians per second
            if (Math.abs(diff) < turnSpeed) {
                currentAngle = targetAngle;
            } else {
                currentAngle += Math.sign(diff) * turnSpeed;
            }

            this.vx = Math.cos(currentAngle) * this.speed;
            this.vy = Math.sin(currentAngle) * this.speed;
        }
        super.update(dt);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

class BrambleHazard {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.damage = 5;
        this.life = 5.0; // Lasts 5 seconds
        this.dead = false;
        this.tickTimer = 0;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;

        this.tickTimer -= dt;
        if (this.tickTimer <= 0) {
            // Check collision with player
            let player = window.gameEngine.player;
            if (player) {
                let dx = player.x - this.x;
                let dy = player.y - this.y;
                if (Math.sqrt(dx*dx + dy*dy) < this.radius + player.radius) {
                    player.takeDamage(this.damage);
                    this.tickTimer = 0.5; // Damage tick rate
                }
            }
        }
    }

    draw(ctx) {
        ctx.strokeStyle = '#4a0404'; // Dark red/brown
        ctx.lineWidth = 2;
        ctx.globalAlpha = Math.min(1, this.life); // Fade out

        ctx.beginPath();
        // Draw asterisk shape for thorns
        for(let i=0; i<4; i++) {
            let angle = (i/4) * Math.PI;
            let vx = Math.cos(angle) * this.radius;
            let vy = Math.sin(angle) * this.radius;
            ctx.moveTo(this.x - vx, this.y - vy);
            ctx.lineTo(this.x + vx, this.y + vy);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

class DeathEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 0.3;
        this.maxLife = 0.3;
        this.dead = false;
        this.particles = [];
        for(let i=0; i<5; i++) {
            this.particles.push({
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                x: 0, y: 0
            });
        }
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        });
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / this.maxLife;
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(this.x + p.x, this.y + p.y, 2, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}

// Wave Manager
class WaveManager {
    constructor() {
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.difficultyMultiplier = 1.0;
        this.bossSpawned = false;
    }

    update(dt) {
        this.waveTimer += dt;
        this.spawnTimer -= dt;

        // Increase difficulty every 30 seconds
        this.difficultyMultiplier = 1.0 + Math.floor(this.waveTimer / 30) * 0.5;

        let spawnRate = 1.0 / this.difficultyMultiplier; // Faster spawns

        if (this.spawnTimer <= 0 && window.gameEngine.player && !window.gameEngine.player.dead) {
            this.spawnEnemy();
            this.spawnTimer = spawnRate;
        }
    }

    spawnEnemy() {
        let padding = 50;
        let w = window.gameEngine.width;
        let h = window.gameEngine.height;

        // Spawn on an edge
        let x, y;
        let edge = Math.floor(Math.random() * 4);
        if (edge === 0) { x = Math.random() * w; y = -padding; } // Top
        else if (edge === 1) { x = w + padding; y = Math.random() * h; } // Right
        else if (edge === 2) { x = Math.random() * w; y = h + padding; } // Bottom
        else { x = -padding; y = Math.random() * h; } // Left

        // Determine type based on time
        let rand = Math.random();
        let enemy;

        if (this.waveTimer >= 180 && !this.bossSpawned) {
            enemy = new MemoryOfTheSapling(w/2, -padding);
            this.bossSpawned = true;
        } else if (this.bossSpawned) {
            // Stop spawning normal enemies during boss
            return;
        } else if (this.waveTimer < 30) {
            // Mostly squirrels early
            enemy = rand < 0.8 ? new EnthralledSquirrel(x, y) : new CorruptedSprout(x, y);
        } else if (this.waveTimer < 60) {
            // Introduce Wisps
            if (rand < 0.5) enemy = new EnthralledSquirrel(x, y);
            else if (rand < 0.8) enemy = new CorruptedSprout(x, y);
            else enemy = new DiscordantWisp(x, y);
        } else {
            // Introduce Tangles
            if (rand < 0.4) enemy = new EnthralledSquirrel(x, y);
            else if (rand < 0.6) enemy = new CorruptedSprout(x, y);
            else if (rand < 0.8) enemy = new DiscordantWisp(x, y);
            else enemy = new ThornedTangle(x, y);
        }

        // Scale health slightly
        enemy.maxHealth *= Math.min(3, this.difficultyMultiplier * 0.8);
        enemy.health = enemy.maxHealth;

        window.gameEngine.addEntity('enemies', enemy);
    }
}

class MemoryOfTheSapling extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 40;
        this.speed = 15;
        this.maxHealth = 1500;
        this.health = this.maxHealth;
        this.damage = 25;
        this.xpValue = 50;
        this.color = '#32cd32'; // Lime green but corrupted

        this.attackPhase = 0;
        this.attackTimer = 3.0;
    }

    update(dt, player) {
        super.update(dt, player);
        if (!player || player.dead) return;

        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.attack(player);
        }
    }

    attack(player) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (this.attackPhase === 0) {
            // Ring of seeds
            for(let i=0; i<12; i++) {
                let angle = (i/12) * Math.PI * 2;
                let vx = Math.cos(angle) * 80;
                let vy = Math.sin(angle) * 80;
                window.gameEngine.addEntity('projectiles', new EnemyProjectile(this.x, this.y, vx, vy, 6, 15, false));
            }
            this.attackTimer = 4.0;
            this.attackPhase = 1;
        } else {
            // Homing barrage
            for(let i=0; i<3; i++) {
                setTimeout(() => {
                    if(!this.dead) {
                        let vx = (Math.random()-0.5)*50;
                        let vy = (Math.random()-0.5)*50;
                        window.gameEngine.addEntity('projectiles', new EnemyProjectile(this.x, this.y, vx, vy, 8, 20, true));
                    }
                }, i * 500);
            }
            this.attackTimer = 5.0;
            this.attackPhase = 0;
        }
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw boss healthbar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - 30, this.y - 50, 60, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - 30, this.y - 50, 60 * (this.health / this.maxHealth), 5);
    }

    die() {
        super.die();
        // Trigger win state
        setTimeout(() => {
            window.gameEngine.pause();
            let goTitle = document.getElementById('game-over-title');
            if (goTitle) goTitle.textContent = "Melody Restored";
            if (window.uiManager) window.uiManager.showGameOver();
        }, 2000);
    }
}

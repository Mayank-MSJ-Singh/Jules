class Engine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;

        // Input state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            ArrowUp: false,
            ArrowLeft: false,
            ArrowDown: false,
            ArrowRight: false
        };

        // Game state variables
        this.gameTime = 0; // in seconds
        this.player = null;
        this.enemies = [];
        this.collectibles = [];
        this.projectiles = [];
        this.effects = [];
        this.miasma = null;

        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.loop(time));
        }
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.loop(time));
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        this.deltaTime = (currentTime - this.lastTime) / 1000; // in seconds
        this.lastTime = currentTime;

        this.update();
        this.draw();

        requestAnimationFrame((time) => this.loop(time));
    }

    update() {
        this.gameTime += this.deltaTime;

        // Update player
        if (this.player) {
            this.player.update(this.deltaTime, this.keys);
        }

        if (this.miasma) this.miasma.update(this.deltaTime);
        // Update entities
        this.enemies.forEach(enemy => enemy.update(this.deltaTime, this.player));
        this.collectibles.forEach(collectible => collectible.update(this.deltaTime));
        this.projectiles.forEach(proj => proj.update(this.deltaTime));
        this.effects.forEach(effect => effect.update(this.deltaTime));

        // Cleanup dead entities
        this.enemies = this.enemies.filter(e => !e.dead);
        this.collectibles = this.collectibles.filter(c => !c.collected);
        this.projectiles = this.projectiles.filter(p => !p.dead);
        this.effects = this.effects.filter(e => !e.dead);

        // Collision detection
        this.checkCollisions();
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#0f0f12'; // Base forest floor color
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid lines to suggest a glade
        this.ctx.strokeStyle = '#1a1a24';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.width, i);
            this.ctx.stroke();
        }

        // Save context for camera translation (if needed later)
        this.ctx.save();

        // Draw order: Collectibles, Enemies, Player, Projectiles, Effects
        this.collectibles.forEach(c => c.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        if (this.player) {
            this.player.draw(this.ctx);
        }
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.effects.forEach(e => e.draw(this.ctx));
        if (this.miasma) this.miasma.draw(this.ctx);

        this.ctx.restore();
    }

    checkCollisions() {
        if (!this.player) return;

        // Player vs Collectibles
        for (let c of this.collectibles) {
            if (this.circleCollision(this.player, c)) {
                c.collect(this.player);
            }
        }

        // Player vs Enemies (Damage)
        for (let e of this.enemies) {
            if (this.circleCollision(this.player, e)) {
                this.player.takeDamage(e.damage);
            }
        }

        // Projectiles vs Enemies
        for (let p of this.projectiles) {
            if (!p.isEnemyProjectile) {
                for (let e of this.enemies) {
                    if (this.circleCollision(p, e)) {
                        if (!p.piercing) {
                            e.takeDamage(p.damage);
                            if (p.onHit) p.onHit(e);
                            p.dead = true;
                            break;
                        } else if (!p.hitEnemies.has(e)) {
                            e.takeDamage(p.damage);
                            if (p.onHit) p.onHit(e);
                        } else {
                            if (!p.hitEnemies.has(e)) {
                                p.onHit(e);
                                e.takeDamage(p.damage);
                            }
                        }
                    }
                }
            } else {
                if (this.circleCollision(p, this.player)) {
                    this.player.takeDamage(p.damage);
                    p.dead = true;
                }
            }
        }
    }

    circleCollision(circle1, circle2) {
        let dx = circle1.x - circle2.x;
        let dy = circle1.y - circle2.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    }

    addEntity(type, entity) {
        this[type].push(entity);
    }
}

// Global instance
window.gameEngine = new Engine();

// Added at bottom for Miasma
class Miasma {
    constructor() {
        this.radius = 2000; // Start huge
        this.targetRadius = 300;
        this.shrinkStartTime = 120; // 2 minutes
        this.shrinkDuration = 60; // Shrink over 1 minute
        this.damage = 10;
        this.damageTimer = 0;
        this.isActive = false;
    }

    update(dt) {
        let gameTime = window.gameEngine.gameTime;
        if (gameTime > this.shrinkStartTime) {
            this.isActive = true;
            let progress = Math.min(1, (gameTime - this.shrinkStartTime) / this.shrinkDuration);
            this.radius = 2000 - (2000 - this.targetRadius) * progress;
        }

        if (this.isActive && window.gameEngine.player) {
            let p = window.gameEngine.player;
            let cx = window.gameEngine.width / 2;
            let cy = window.gameEngine.height / 2;
            let dx = p.x - cx;
            let dy = p.y - cy;

            this.damageTimer -= dt;
            if (Math.sqrt(dx*dx + dy*dy) > this.radius && this.damageTimer <= 0) {
                p.takeDamage(this.damage);
                this.damageTimer = 0.5; // Damage every half second
            }
        }
    }

    draw(ctx) {
        if (!this.isActive) return;

        let cx = window.gameEngine.width / 2;
        let cy = window.gameEngine.height / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(75, 0, 130, 0.4)'; // Indigo/purple fog

        // Draw the inverse of the circle
        ctx.beginPath();
        ctx.rect(0, 0, window.gameEngine.width, window.gameEngine.height);
        ctx.arc(cx, cy, this.radius, 0, Math.PI * 2, true);
        ctx.fill();

        // Draw boundary line
        ctx.strokeStyle = '#8b008b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

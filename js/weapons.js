// Base Weapon Class
class Weapon {
    constructor(name) {
        this.name = name;
        this.owner = null; // Set by player

        // Base stats
        this.damage = 10;
        this.cooldown = 1.0;
        this.currentCooldown = 0;
        this.projectileSpeed = 200;

        // Modifiers (updated by Riffs)
        this.projectiles = 1;
        this.piercing = false;
        this.knockback = 0;
        this.chain = 0;
        this.burstCount = 1;
        this.burstDelay = 0.1;

        // Internal state for burst firing
        this.isBursting = false;
        this.burstsFired = 0;
        this.burstTimer = 0;
    }

    update(dt, enemies) {
        if (!this.owner) return;

        // Handle burst firing
        if (this.isBursting) {
            this.burstTimer -= dt;
            if (this.burstTimer <= 0) {
                let target = this.getNearestEnemy(enemies);
                if (target) {
                    this.fire(target);
                }
                this.burstsFired++;
                if (this.burstsFired >= this.burstCount) {
                    this.isBursting = false;
                } else {
                    this.burstTimer = this.burstDelay;
                }
            }
            return; // Don't process main cooldown while bursting
        }

        this.currentCooldown -= dt;
        if (this.currentCooldown <= 0 && enemies.length > 0) {
            let target = this.getNearestEnemy(enemies);
            if (target) {
                if (this.burstCount > 1) {
                    this.isBursting = true;
                    this.burstsFired = 1;
                    this.burstTimer = this.burstDelay;
                }
                this.fire(target);
                this.currentCooldown = this.cooldown;
            }
        }
    }

    getNearestEnemy(enemies) {
        if (enemies.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;

        for (let e of enemies) {
            let dx = e.x - this.owner.x;
            let dy = e.y - this.owner.y;
            let dist = dx*dx + dy*dy;
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        }

        return nearest;
    }

    fire(target) {
        // To be implemented by subclasses
    }

    applyModifiers(proj) {
        proj.damage = this.damage;
        proj.piercing = this.piercing;
        proj.knockback = this.knockback;
        proj.chain = this.chain;
    }
}

// 1. Hollow Lute: Cone of slow moving soundwaves
class HollowLute extends Weapon {
    constructor() {
        super('Hollow Lute');
        this.cooldown = 1.2;
        this.damage = 15;
        this.projectileSpeed = 100;
        this.projectiles = 3; // Base cone has 3 waves
        this.spreadAngle = Math.PI / 4; // 45 degrees
    }

    fire(target) {
        let dx = target.x - this.owner.x;
        let dy = target.y - this.owner.y;
        let baseAngle = Math.atan2(dy, dx);

        let startAngle = baseAngle - (this.spreadAngle / 2);
        let angleStep = this.projectiles > 1 ? this.spreadAngle / (this.projectiles - 1) : 0;

        for (let i = 0; i < this.projectiles; i++) {
            let angle = this.projectiles === 1 ? baseAngle : startAngle + (angleStep * i);
            let vx = Math.cos(angle) * this.projectileSpeed;
            let vy = Math.sin(angle) * this.projectileSpeed;

            let proj = new SoundwaveProjectile(this.owner.x, this.owner.y, vx, vy);
            this.applyModifiers(proj);
            window.gameEngine.addEntity('projectiles', proj);
        }
    }
}

// 2. Root Drum: Pulsing Aura
class RootDrum extends Weapon {
    constructor() {
        super('Root Drum');
        this.cooldown = 1.5;
        this.damage = 10;
        this.radius = 60; // Base aura radius
        // Projectile stat increases aura radius for drum
    }

    fire(target) {
        // Doesn't need a target, pulses around player
        let currentRadius = this.radius + (this.projectiles * 10);

        let pulse = new AuraPulse(this.owner.x, this.owner.y, currentRadius);
        this.applyModifiers(pulse);
        pulse.owner = this.owner; // Needs to track owner to stay attached if desired, but we'll make it static for now
        window.gameEngine.addEntity('projectiles', pulse);
    }
}

// 3. Silver Flute: Fast, piercing needle
class SilverFlute extends Weapon {
    constructor() {
        super('Silver Flute');
        this.cooldown = 0.8;
        this.damage = 20;
        this.projectileSpeed = 400;
        this.piercing = true; // Base piercing
    }

    fire(target) {
        let dx = target.x - this.owner.x;
        let dy = target.y - this.owner.y;
        let angle = Math.atan2(dy, dx);

        // Multi-projectiles for flute fire slightly offset parallel lines or tight spread
        let spread = 0.1;
        let startAngle = angle - (spread * (this.projectiles - 1) / 2);

        for (let i = 0; i < this.projectiles; i++) {
            let curAngle = startAngle + (spread * i);
            let vx = Math.cos(curAngle) * this.projectileSpeed;
            let vy = Math.sin(curAngle) * this.projectileSpeed;

            let proj = new NeedleProjectile(this.owner.x, this.owner.y, vx, vy);
            this.applyModifiers(proj);
            window.gameEngine.addEntity('projectiles', proj);
        }
    }
}

// --- Projectile Classes ---

class Projectile {
    constructor(x, y, vx, vy, radius) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.damage = 0;
        this.piercing = false;
        this.knockback = 0;
        this.life = 2.0; // Seconds before disappearing
        this.dead = false;
        this.isEnemyProjectile = false;
        this.hitEnemies = new Set(); // Track hit enemies for piercing
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
        }

        // Bounds check
        if (this.x < 0 || this.x > window.gameEngine.width ||
            this.y < 0 || this.y > window.gameEngine.height) {
            this.dead = true;
        }
    }

    draw(ctx) {
        // Base draw
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    onHit(enemy) {
        if (this.knockback > 0) {
            // Apply knockback
            let dx = enemy.x - this.x;
            let dy = enemy.y - this.y;
            let len = Math.sqrt(dx*dx + dy*dy);
            if (len > 0) {
                enemy.x += (dx/len) * this.knockback;
                enemy.y += (dy/len) * this.knockback;
            }
        }

        if (this.piercing) {
            this.hitEnemies.add(enemy);
        }
    }
}

class SoundwaveProjectile extends Projectile {
    constructor(x, y, vx, vy) {
        super(x, y, vx, vy, 15);
        this.color = 'rgba(212, 175, 55, 0.6)'; // Amber gold
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        let angle = Math.atan2(this.vy, this.vx);
        ctx.rotate(angle);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;

        // Draw crescent shape
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, -Math.PI/3, Math.PI/3);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(5, 0, this.radius - 5, -Math.PI/4, Math.PI/4);
        ctx.stroke();

        ctx.restore();
    }
}

class AuraPulse extends Projectile {
    constructor(x, y, maxRadius) {
        super(x, y, 0, 0, 0); // starts at 0 radius
        this.maxRadius = maxRadius;
        this.life = 0.4;
        this.maxLife = 0.4;
        this.piercing = true; // Auras always pierce
        this.color = 'rgba(139, 69, 19, 0.5)'; // Earthy brown/green
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
            this.dead = true;
        }

        // Expand radius
        let progress = 1 - (this.life / this.maxLife);
        this.radius = this.maxRadius * progress;

        // Optional: Follow owner
        if (this.owner) {
            this.x = this.owner.x;
            this.y = this.owner.y;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        let alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    onHit(enemy) {
        super.onHit(enemy);
        // Apply brief slow
        if (enemy.applySlow) {
            enemy.applySlow(0.5, 0.5); // 50% slow for 0.5s
        }
    }
}

class NeedleProjectile extends Projectile {
    constructor(x, y, vx, vy) {
        super(x, y, vx, vy, 4);
        this.color = '#00ffff'; // Cyan
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        let angle = Math.atan2(this.vy, this.vx);
        ctx.rotate(angle);

        ctx.fillStyle = this.color;

        // Draw elongated needle
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-8, 2);
        ctx.lineTo(-8, -2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

const UPGRADE_TYPES = {
    INSTRUMENT: 'Instrument Riff',
    CHARM: 'Charm Riff',
    ASPECT: 'Aspect Riff',
    SYMPHONY: 'Symphony'
};

const RIFFS = [
    // Instrument Riffs
    { id: 'faster_tempo', name: 'Faster Tempo', type: UPGRADE_TYPES.INSTRUMENT, desc: '+Attack Speed', apply: (p) => { p.weapon.cooldown *= 0.8; } },
    { id: 'overtones', name: 'Overtones', type: UPGRADE_TYPES.INSTRUMENT, desc: '+1 Projectile', apply: (p) => { p.weapon.projectiles += 1; } },
    { id: 'amplify', name: 'Amplify', type: UPGRADE_TYPES.INSTRUMENT, desc: '+Damage', apply: (p) => { p.weapon.damage += 5; } },
    { id: 'concussive', name: 'Concussive', type: UPGRADE_TYPES.INSTRUMENT, desc: 'Adds Knockback', apply: (p) => { p.weapon.knockback += 5; } },
    { id: 'crescendo', name: 'Crescendo', type: UPGRADE_TYPES.INSTRUMENT, desc: '+Damage', apply: (p) => { p.weapon.damage += 10; } },

    // Charm Riffs
    { id: 'echoing_pebble', name: 'Echoing Pebble', type: UPGRADE_TYPES.CHARM, desc: 'Orbiting rock that blocks projectiles', apply: (p) => { p.charms.push(new ShieldCharm(p, 30, 1)); } },
    { id: 'singing_cicada', name: 'Singing Cicada', type: UPGRADE_TYPES.CHARM, desc: 'Orbiting buddy that damages touch', apply: (p) => { p.charms.push(new DamageCharm(p, 40, 2)); } },
    { id: 'bramble_weave', name: 'Bramble Weave', type: UPGRADE_TYPES.CHARM, desc: 'Leaves a damaging trail', apply: (p) => { /* Simplified */ } },

    // Aspect Riffs
    { id: 'staccato', name: 'Staccato', type: UPGRADE_TYPES.ASPECT, desc: 'Attacks fire in bursts', apply: (p) => { p.weapon.burstCount += 1; } },
    { id: 'legato', name: 'Legato', type: UPGRADE_TYPES.ASPECT, desc: 'Attacks pierce through enemies', apply: (p) => { p.weapon.piercing = true; } },
];

const SYMPHONIES = [
    {
        id: 'sonic_boom',
        name: 'Sonic Boom',
        req: ['overtones', 'concussive'],
        desc: 'Massive wave pushing all enemies back.',
        apply: (p) => {
            // Replace weapon attack logic or drastically buff
            p.weapon.damage += 20;
            p.weapon.knockback += 20;
            p.weapon.radius = (p.weapon.radius || 0) + 30; // for aura
        }
    },
    {
        id: 'frenzy_nocturne',
        name: 'Frenzy Nocturne',
        req: ['faster_tempo', 'staccato'],
        desc: 'Extreme burst fire.',
        apply: (p) => {
            p.weapon.cooldown *= 0.5;
            p.weapon.burstCount += 2;
        }
    },
    {
        id: 'thunderous_applause',
        name: 'Thunderous Applause',
        req: ['legato', 'crescendo'],
        desc: 'High damage piercing.',
        apply: (p) => {
            p.weapon.damage *= 2;
            p.weapon.piercing = true;
        }
    }
];

class UpgradeManager {
    constructor() {
        this.playerUpgrades = []; // Store IDs of collected upgrades
    }

    getOptions(count = 3) {
        let options = [];
        let available = [...RIFFS]; // Copy

        // Very basic random selection
        for (let i = 0; i < count; i++) {
            if (available.length === 0) break;
            let idx = Math.floor(Math.random() * available.length);
            options.push(available.splice(idx, 1)[0]);
        }

        return options;
    }

    applyUpgrade(upgradeId) {
        let upgrade = RIFFS.find(r => r.id === upgradeId) || SYMPHONIES.find(s => s.id === upgradeId);
        if (!upgrade) return;

        this.playerUpgrades.push(upgradeId);
        upgrade.apply(window.gameEngine.player);

        this.checkHarmonizations();
    }

    checkHarmonizations() {
        for (let sym of SYMPHONIES) {
            // Check if player has all requirements and doesn't already have the symphony
            if (!this.playerUpgrades.includes(sym.id)) {
                let hasAll = sym.req.every(reqId => this.playerUpgrades.includes(reqId));
                if (hasAll) {
                    // Consume components
                    sym.req.forEach(reqId => {
                        let idx = this.playerUpgrades.indexOf(reqId);
                        if (idx !== -1) this.playerUpgrades.splice(idx, 1);
                    });

                    // Add symphony
                    this.playerUpgrades.push(sym.id);
                    sym.apply(window.gameEngine.player);

                    console.log(`Harmonization Achieved: ${sym.name}`);
                    // Ideally trigger a UI notification and audio swell here
                }
            }
        }
    }
}

// Basic Charms
class BaseCharm {
    constructor(player, orbitDistance, orbitSpeed) {
        this.player = player;
        this.orbitDistance = orbitDistance;
        this.orbitSpeed = orbitSpeed;
        this.angle = Math.random() * Math.PI * 2;
        this.x = 0;
        this.y = 0;
    }

    update(dt) {
        this.angle += this.orbitSpeed * dt;
        this.x = this.player.x + Math.cos(this.angle) * this.orbitDistance;
        this.y = this.player.y + Math.sin(this.angle) * this.orbitDistance;
    }

    draw(ctx) {
        // Base draw
    }
}

class ShieldCharm extends BaseCharm {
    constructor(player, orbitDistance, orbitSpeed) {
        super(player, orbitDistance, orbitSpeed);
        this.radius = 6;
    }

    update(dt) {
        super.update(dt);
        // Block projectiles logic
        let projectiles = window.gameEngine.projectiles;
        for (let p of projectiles) {
            if (p.isEnemyProjectile && !p.dead) {
                let dx = p.x - this.x;
                let dy = p.y - this.y;
                if (Math.sqrt(dx*dx + dy*dy) < this.radius + p.radius) {
                    p.dead = true;
                    // Could add cooldown or break logic here
                }
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
    }
}

class DamageCharm extends BaseCharm {
    constructor(player, orbitDistance, orbitSpeed) {
        super(player, orbitDistance, orbitSpeed);
        this.radius = 4;
        this.damage = 5;
    }

    update(dt) {
        super.update(dt);
        // Damage enemies
        let enemies = window.gameEngine.enemies;
        for (let e of enemies) {
            let dx = e.x - this.x;
            let dy = e.y - this.y;
            if (Math.sqrt(dx*dx + dy*dy) < this.radius + e.radius) {
                e.takeDamage(this.damage * dt); // continuous damage
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
    }
}

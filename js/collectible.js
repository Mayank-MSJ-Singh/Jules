class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.collected = false;

        // Float animation
        this.baseY = y;
        this.time = Math.random() * 10;
    }

    update(dt) {
        this.time += dt;
        this.y = this.baseY + Math.sin(this.time * 5) * 3;

        // Magnetism towards player
        let player = window.gameEngine.player;
        if (player && !player.dead) {
            let dx = player.x - this.x;
            let dy = player.y - this.y;
            let distSq = dx*dx + dy*dy;
            let magnetRadius = 100;

            if (distSq < magnetRadius * magnetRadius) {
                let dist = Math.sqrt(distSq);
                let speed = 300 * (1 - dist/magnetRadius); // Faster as it gets closer
                this.x += (dx/dist) * speed * dt;
                this.baseY += (dy/dist) * speed * dt; // Update baseY so animation doesn't fight movement
            }
        }
    }

    draw(ctx) {
        // To be implemented by subclasses
    }

    collect(player) {
        this.collected = true;
    }
}

class HarmonyShard extends Collectible {
    constructor(x, y, value) {
        super(x, y);
        this.value = value;
        this.color = '#00ffff'; // Cyan glow
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x + this.radius/2, this.y);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x - this.radius/2, this.y);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0; // Reset
    }

    collect(player) {
        super.collect(player);
        player.gainXp(this.value);
    }
}

import re

with open('js/engine.js', 'r') as f:
    engine_content = f.read()

# Add miasma to engine
search_init = '''        this.projectiles = [];
        this.effects = [];

        this.setupInput();'''
replace_init = '''        this.projectiles = [];
        this.effects = [];
        this.miasma = null;

        this.setupInput();'''

search_update = '''        // Update entities
        this.enemies.forEach(enemy => enemy.update(this.deltaTime, this.player));'''
replace_update = '''        if (this.miasma) this.miasma.update(this.deltaTime);
        // Update entities
        this.enemies.forEach(enemy => enemy.update(this.deltaTime, this.player));'''

search_draw = '''        this.projectiles.forEach(p => p.draw(this.ctx));
        this.effects.forEach(e => e.draw(this.ctx));

        this.ctx.restore();'''
replace_draw = '''        this.projectiles.forEach(p => p.draw(this.ctx));
        this.effects.forEach(e => e.draw(this.ctx));
        if (this.miasma) this.miasma.draw(this.ctx);

        this.ctx.restore();'''

engine_content = engine_content.replace(search_init, replace_init).replace(search_update, replace_update).replace(search_draw, replace_draw)

with open('js/engine.js', 'w') as f:
    f.write(engine_content)

import re

# Fix 1: Engine collision to use hitEnemies for piercing
with open('js/engine.js', 'r') as f:
    engine_content = f.read()

engine_content = engine_content.replace('''                        if (!p.piercing) {
                            p.dead = true;
                            break;
                        }''', '''                        if (!p.piercing) {
                            p.dead = true;
                            break;
                        } else {
                            if (!p.hitEnemies.has(e)) {
                                p.onHit(e);
                                e.takeDamage(p.damage);
                            }
                        }''')

# Also need to make sure we don't double damage on first hit for piercing, so we modify the block slightly
search_block = '''                        e.takeDamage(p.damage);
                        if (p.onHit) p.onHit(e);
                        if (!p.piercing) {
                            p.dead = true;
                            break;
                        }'''
replace_block = '''                        if (!p.piercing) {
                            e.takeDamage(p.damage);
                            if (p.onHit) p.onHit(e);
                            p.dead = true;
                            break;
                        } else if (!p.hitEnemies.has(e)) {
                            e.takeDamage(p.damage);
                            if (p.onHit) p.onHit(e);
                        }'''
engine_content = engine_content.replace(search_block, replace_block)

with open('js/engine.js', 'w') as f:
    f.write(engine_content)

# Fix 2: Staccato crash fix in weapons.js
with open('js/weapons.js', 'r') as f:
    weapons_content = f.read()

search_burst = '''            if (this.burstTimer <= 0) {
                this.fire(this.getNearestEnemy(enemies));
                this.burstsFired++;'''
replace_burst = '''            if (this.burstTimer <= 0) {
                let target = this.getNearestEnemy(enemies);
                if (target) {
                    this.fire(target);
                }
                this.burstsFired++;'''
weapons_content = weapons_content.replace(search_burst, replace_burst)

with open('js/weapons.js', 'w') as f:
    f.write(weapons_content)

# Fix 3: Remove setInterval update of waveManager in ui.js
with open('js/ui.js', 'r') as f:
    ui_content = f.read()

search_interval = '''                this.timerDisplay.textContent = `${mins}:${secs}`;

                window.waveManager.update(1.0); // Simple 1 sec tick for wave manager for now
            }'''
replace_interval = '''                this.timerDisplay.textContent = `${mins}:${secs}`;
            }'''
ui_content = ui_content.replace(search_interval, replace_interval)

with open('js/ui.js', 'w') as f:
    f.write(ui_content)

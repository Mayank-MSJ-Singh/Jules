import re

with open('js/enemies.js', 'r') as f:
    enemy_content = f.read()

search_spawn = '''        if (this.waveTimer < 30) {
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
        }'''
replace_spawn = '''        if (this.waveTimer >= 180 && !this.bossSpawned) {
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
        }'''

search_init = '''        this.spawnTimer = 0;
        this.difficultyMultiplier = 1.0;'''
replace_init = '''        this.spawnTimer = 0;
        this.difficultyMultiplier = 1.0;
        this.bossSpawned = false;'''

enemy_content = enemy_content.replace(search_spawn, replace_spawn).replace(search_init, replace_init)

with open('js/enemies.js', 'w') as f:
    f.write(enemy_content)

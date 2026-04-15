import re

with open('js/ui.js', 'r') as f:
    ui_content = f.read()

search_init = '''        // Initialize Wave Manager
        window.waveManager = new WaveManager();'''
replace_init = '''        // Initialize Wave Manager
        window.waveManager = new WaveManager();

        // Initialize Miasma
        engine.miasma = new Miasma();'''

ui_content = ui_content.replace(search_init, replace_init)

with open('js/ui.js', 'w') as f:
    f.write(ui_content)

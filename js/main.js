// main.js handles starting the game and linking things that might need it if not done via ui.js
// Currently, ui.js handles the primary flow from Main Menu -> Game Start.

// We need to patch engine.js update loop to also call waveManager.update
const originalUpdate = window.gameEngine.update.bind(window.gameEngine);

window.gameEngine.update = function() {
    originalUpdate();

    // Wave manager needs dt which engine has
    if (window.waveManager) {
        // We override the 1 second interval hack from ui.js for smoother spawning
        window.waveManager.update(this.deltaTime);
    }
}

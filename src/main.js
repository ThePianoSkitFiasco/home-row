import BootScene from './scenes/BootScene.js';
import TypingTutorScene from './scenes/TypingTutorScene.js';
import TypingScene from './scenes/TypingScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#d8c7a1',
  scene: [BootScene, TypingScene, TypingTutorScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);

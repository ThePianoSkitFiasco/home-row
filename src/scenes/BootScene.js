export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    const title = this.add.text(cx, cy - 80, 'HOME ROW', {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      color: '#00ff00'
    }).setOrigin(0.5);

    const subtitle = this.add.text(cx, cy - 20, 'A Friendly Typing Program for Growing Hands', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#00aa00'
    }).setOrigin(0.5);

    const version = this.add.text(cx, cy + 30, 'v1.0  (c) 1997 Greyfield Educational Software', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#006600'
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, cy + 100, 'Press any key to begin...', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#00ff00'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once('keydown', () => {
      this.scene.start('TypingScene');
    });
  }
}

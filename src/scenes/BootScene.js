export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.hasStarted = false;
    this.cameras.main.setBackgroundColor('#000080');

    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    const title = this.add.text(cx, cy - 80, 'HOME ROW', {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const subtitle = this.add.text(cx, cy - 20, 'A Friendly Typing Program for Growing Hands', {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#aaaadd'
    }).setOrigin(0.5);

    const version = this.add.text(cx, cy + 30, 'v1.0  (c) 1997 Greyfield Educational Software', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#7777aa'
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, cy + 100, 'Press any key or tap to begin...', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#ffff88'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    const startGame = () => {
      if (this.hasStarted) return;
      this.hasStarted = true;
      this.scene.start('TypingScene');
    };

    this.input.keyboard.once('keydown', startGame);
    this.input.once('pointerdown', startGame);
  }
}

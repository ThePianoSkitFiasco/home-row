const BOOT_BACKGROUND_KEY = 'boot_background';
const BOOT_BACKGROUND_PATH = 'assets/images/home_row_bootscene.png';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.bootBackgroundMissing = false;

    this.load.on('loaderror', (file) => {
      if (file && file.key === BOOT_BACKGROUND_KEY) {
        this.bootBackgroundMissing = true;
      }
    });

    this.load.image(BOOT_BACKGROUND_KEY, BOOT_BACKGROUND_PATH);
  }

  create() {
    this.hasStarted = false;
    this.cameras.main.setBackgroundColor('#000080');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    if (!this.bootBackgroundMissing && this.textures.exists(BOOT_BACKGROUND_KEY)) {
      const bg = this.add.image(cx, cy, BOOT_BACKGROUND_KEY).setOrigin(0.5);
      const source = bg.texture.getSourceImage();
      const scale = Math.max(width / source.width, height / source.height);
      bg.setScale(scale);
    } else {
      this.add.text(cx, cy - 80, 'HOME ROW', {
        fontFamily: 'Courier New, monospace',
        fontSize: '48px',
        color: '#ffffff'
      }).setOrigin(0.5);

      this.add.text(cx, cy - 20, 'A Friendly Typing Program for Growing Hands', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#aaaadd'
      }).setOrigin(0.5);

      this.add.text(cx, cy + 30, 'v1.0  (c) 1997 Greyfield Educational Software', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#7777aa'
      }).setOrigin(0.5);
    }

    const prompt = this.add.text(cx, height - 46, 'PRESS ANY KEY TO BEGIN', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#ffff88',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 700,
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

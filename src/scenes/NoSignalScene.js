const DISCONNECTION_AUDIO = {
  key: 'host_found_disconnection',
  path: 'assets/audio/disconnection_sound.wav',
  volume: 0.55
};

export default class NoSignalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NoSignalScene' });
  }

  init(data) {
    this.returnScene  = data.returnScene  || 'TypingScene';
    this.nextActId    = data.nextActId    || 'act7_correction_exam';
    this.overlay      = null;
    this.flashTimer   = null;
    this.active       = false;
    this.sound_       = null;
    this.missingAudio = new Set();
    this.missingImage = new Set();
  }

  preload() {
    this.load.on('loaderror', (file) => {
      if (!file) return;
      if (file.key === DISCONNECTION_AUDIO.key)            this.missingAudio.add(file.key);
      if (file.key === 'nosignal1' || file.key === 'nosignal2') this.missingImage.add(file.key);
    });

    if (!this._audioReady(DISCONNECTION_AUDIO.key)) {
      this.load.audio(DISCONNECTION_AUDIO.key, DISCONNECTION_AUDIO.path);
    }
    if (!this.textures.exists('nosignal1')) {
      this.load.image('nosignal1', 'assets/images/mrfingers_nosignal1.png');
    }
    if (!this.textures.exists('nosignal2')) {
      this.load.image('nosignal2', 'assets/images/mrfingers_nosignal2.png');
    }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor('#000000');

    const hasNs1 = this.textures.exists('nosignal1') && !this.missingImage.has('nosignal1');
    const hasNs2 = this.textures.exists('nosignal2') && !this.missingImage.has('nosignal2');

    if (hasNs1) {
      this.overlay = this.add.image(W / 2, H / 2, 'nosignal1')
        .setOrigin(0.5)
        .setDisplaySize(W, H);
    }

    this.active = true;

    if (hasNs1 && hasNs2) {
      this._scheduleFlash();
    }

    this._stopGlobalKey('mr_fingers_music');
    this._playDisconnection(hasNs1);
  }

  // ── private ───────────────────────────────────────────────────────────────

  _audioReady(key) {
    if (!key || !this.sound || !this.cache || !this.cache.audio) return false;
    if (this.missingAudio.has(key)) return false;
    return this.cache.audio.exists ? this.cache.audio.exists(key)
         : this.cache.audio.has   ? this.cache.audio.has(key)
         : false;
  }

  _stopGlobalKey(key) {
    if (!this.sound || typeof this.sound.getAll !== 'function') return;
    this.sound.getAll()
      .filter(s => s && s.key === key)
      .forEach(s => { try { s.stop(); s.destroy(); } catch (_) {} });
  }

  _playDisconnection(hasImage) {
    if (this._audioReady(DISCONNECTION_AUDIO.key)) {
      try {
        this.sound_ = this.sound.add(DISCONNECTION_AUDIO.key, { volume: DISCONNECTION_AUDIO.volume });
        this.sound_.once('complete', () => this._finish());
        this.sound_.play();
        return;
      } catch (err) {
        console.warn('[NoSignalScene] Could not play disconnection sound:', err);
      }
    } else {
      console.warn('[NoSignalScene] Disconnection audio not ready; using fallback delay.');
    }
    // Fallback: hold the image briefly then continue
    this.time.delayedCall(hasImage ? 2000 : 100, () => this._finish());
  }

  _scheduleFlash() {
    if (!this.active || !this.overlay) return;
    const delay = 400 + Math.random() * 1400;
    this.flashTimer = this.time.delayedCall(delay, () => {
      if (!this.active || !this.overlay) return;
      this.overlay.setTexture('nosignal2');
      this.flashTimer = this.time.delayedCall(80 + Math.random() * 100, () => {
        if (!this.active || !this.overlay) return;
        this.overlay.setTexture('nosignal1');
        this._scheduleFlash();
      });
    });
  }

  _finish() {
    this.active = false;
    if (this.flashTimer) { this.flashTimer.remove(false); this.flashTimer = null; }
    if (this.sound_)     { try { this.sound_.destroy(); } catch (_) {} this.sound_ = null; }
    this.scene.start('HostFoundScene', {
      returnScene: this.returnScene,
      nextActId:   this.nextActId
    });
  }
}

// Web Audio API를 활용한 내장 감성 사운드 (나뭇잎/종이 바스락거림 & 코지 톤)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.rustleBuffer = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 나뭇잎 흔들림 / 종이 만지는 바스락거림을 위한 핑크 노이즈 버퍼 생성
  getRustleBuffer() {
    if (!this.ctx) return null;
    if (this.rustleBuffer) return this.rustleBuffer;

    const sampleRate = this.ctx.sampleRate;
    const duration = 0.25; // 250ms
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // 핑크 노이즈 알고리즘 (자연스러운 유기적 질감)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.rustleBuffer = buffer;
    return buffer;
  }

  // 상호작용 효과음: 나뭇잎/종이 바스락거리는 소리 (기존 '또잉' 사운드 완전 대체)
  playRustle() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const buffer = this.getRustleBuffer();
      if (!buffer) return;

      // 1. 바스락거리는 메인 잎사귀/종이 노이즈 레이어
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // 자연스러운 변주를 위한 주파수 랜덤화 (2400Hz ~ 3200Hz)
      const baseFreq = 2600 + (Math.random() * 600 - 300);
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(baseFreq, now);
      bandpass.Q.setValueAtTime(1.2, now);

      // 너무 날카롭지 않도록 따뜻한 로우패스 추가 (4800Hz)
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(4800, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      // 부드러운 8ms 어택, 85ms 감쇄
      noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.008);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      noiseSource.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // 2. 바스락거릴 때 만져지는 종이/나뭇가지의 부드러운 텍타일 톤 (180Hz ~ 120Hz)
      const tactileOsc = this.ctx.createOscillator();
      const tactileGain = this.ctx.createGain();
      tactileOsc.type = 'sine';
      tactileOsc.frequency.setValueAtTime(180, now);
      tactileOsc.frequency.exponentialRampToValueAtTime(110, now + 0.04);

      tactileGain.gain.setValueAtTime(0.04, now);
      tactileGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      tactileOsc.connect(tactileGain);
      tactileGain.connect(this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.09);

      tactileOsc.start(now);
      tactileOsc.stop(now + 0.05);
    } catch (e) {}
  }

  // 기존 playPop() 호출 호환성 유지 (어디서 호출하든 자연스러운 바스락 소리로 재생)
  playPop() {
    this.playRustle();
  }

  // 타이머 완료 차임벨 (맑은 종소리 화음)
  playChime() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startTime = now + idx * 0.12;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });
    } catch (e) {}
  }

  // 작업 완료 체크 사운드: 따뜻한 마림바 / 우드 실로폰 사운드
  playSuccess() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 산뜻하고 따뜻한 우드벨 화음 (E5, B5)
      const freqs = [659.25, 987.77];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const start = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.23);
      });
    } catch (e) {}
  }
}

window.soundManager = new SoundManager();

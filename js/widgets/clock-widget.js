// 디지털 & 아날로그 시계 위젯
class ClockWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'clock';
    config.title = config.title || '디지털 시계 (Clock)';
    config.icon = '🕒';
    config.minWidth = 240;
    config.minHeight = 220;
    super(board, config);

    this.viewMode = this.data.viewMode || 'digital'; // digital or analog
    this.is24Hour = typeof this.data.is24Hour === 'boolean' ? this.data.is24Hour : true;
    this.clockInterval = null;

    this.render();
    this.startClock();
  }

  getData() {
    return {
      viewMode: this.viewMode,
      is24Hour: this.is24Hour,
    };
  }

  render() {
    if (!this.bodyElement) return;

    this.bodyElement.innerHTML = `
      <div class="clock-container clock-mode-${this.viewMode}">
        <div class="clock-toolbar">
          <button class="clock-mode-toggle" title="시계 모드 전환 (${this.viewMode === 'digital' ? '아날로그로 변경' : '디지털로 변경'})">
            ${this.viewMode === 'digital' ? '아날로그' : '디지털'}
          </button>
          ${this.viewMode === 'digital' ? `
            <button class="clock-format-toggle" title="시간 표기 전환">
              ${this.is24Hour ? '24H' : '12H'}
            </button>
          ` : ''}
        </div>

        ${this.viewMode === 'digital' ? `
          <div class="clock-digital-box">
            <div class="clock-time-display">00:00:00</div>
            <div class="clock-date-display">2026. 10. 17 토요일</div>
          </div>
        ` : `
          <div class="clock-analog-box">
            <svg class="analog-svg" viewBox="0 0 200 200" width="160" height="160">
              <circle cx="100" cy="100" r="94" class="analog-dial-bg" />
              <!-- 시계 눈금 -->
              ${this.generateDialTicks()}
              <!-- 바늘 -->
              <line x1="100" y1="100" x2="100" y2="46" class="analog-hand hand-hour" id="ah-${this.id}" />
              <line x1="100" y1="100" x2="100" y2="28" class="analog-hand hand-minute" id="am-${this.id}" />
              <line x1="100" y1="108" x2="100" y2="22" class="analog-hand hand-second" id="as-${this.id}" />
              <circle cx="100" cy="100" r="5" class="analog-center-pin" />
            </svg>
            <div class="clock-date-display analog-date">2026. 10. 17 토요일</div>
          </div>
        `}
      </div>
    `;

    this.bindClockEvents();
    this.updateTime();
  }

  generateDialTicks() {
    let ticks = '';
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const x1 = 100 + 82 * Math.sin(angle);
      const y1 = 100 - 82 * Math.cos(angle);
      const x2 = 100 + 90 * Math.sin(angle);
      const y2 = 100 - 90 * Math.cos(angle);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="analog-tick ${i % 3 === 0 ? 'tick-major' : ''}" />`;
    }
    return ticks;
  }

  bindClockEvents() {
    const modeBtn = this.bodyElement.querySelector('.clock-mode-toggle');
    const formatBtn = this.bodyElement.querySelector('.clock-format-toggle');

    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        this.viewMode = this.viewMode === 'digital' ? 'analog' : 'digital';
        this.board.saveState();
        this.render();
      });
    }

    if (formatBtn) {
      formatBtn.addEventListener('click', () => {
        this.is24Hour = !this.is24Hour;
        this.board.saveState();
        this.render();
      });
    }
  }

  startClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    if (!this.bodyElement) return;

    const now = new Date();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dateStr = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')} ${days[now.getDay()]}`;

    const dateEls = this.bodyElement.querySelectorAll('.clock-date-display');
    dateEls.forEach(el => el.textContent = dateStr);

    if (this.viewMode === 'digital') {
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      let period = '';

      if (!this.is24Hour) {
        period = hours >= 12 ? 'PM ' : 'AM ';
        hours = hours % 12 || 12;
      }
      const hourStr = String(hours).padStart(2, '0');

      const timeEl = this.bodyElement.querySelector('.clock-time-display');
      if (timeEl) {
        timeEl.textContent = `${period}${hourStr}:${minutes}:${seconds}`;
      }
    } else {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const secDeg = seconds * 6;
      const minDeg = minutes * 6 + seconds * 0.1;
      const hourDeg = (hours % 12) * 30 + minutes * 0.5;

      const handH = this.bodyElement.querySelector(`#ah-${this.id}`);
      const handM = this.bodyElement.querySelector(`#am-${this.id}`);
      const handS = this.bodyElement.querySelector(`#as-${this.id}`);

      if (handH) handH.style.transform = `rotate(${hourDeg}deg)`;
      if (handM) handM.style.transform = `rotate(${minDeg}deg)`;
      if (handS) handS.style.transform = `rotate(${secDeg}deg)`;
    }
  }

  destroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    super.destroy();
  }
}

window.ClockWidget = ClockWidget;

// 미니멀 감성 시계 위젯 (글자 크기에 딱 맞는 컴팩트 배경 & 크기 비례 동적 스케일링)
class ClockWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'clock';
    config.title = config.title || '시계';
    config.icon = (window.WidgetIcons && window.WidgetIcons.clock) || '🕒';
    
    config.width = typeof config.width === 'number' ? config.width : 165;
    config.height = typeof config.height === 'number' ? config.height : 70;
    config.minWidth = 95;
    config.minHeight = 46;
    super(board, config);

    this.clockInterval = null;

    this.render();
    this.startClock();
    this.bindClockDrag();
  }

  getData() {
    return {};
  }

  render() {
    if (!this.bodyElement) return;

    this.bodyElement.innerHTML = `
      <div class="clock-clean-container">
        <div class="clock-time-display">
          <span class="time-hm">00:00</span>
        </div>
        <div class="clock-date-display">10월 17일 토요일</div>
      </div>
    `;

    this.updateTime();
    this.updateResponsiveFont(this.width, this.height);
  }

  // 위젯 크기 조절 시 실시간 폰트 크기 동적 스케일링 (글자 크기에 배경이 딱 맞게 밀착)
  onResize(width, height) {
    this.updateResponsiveFont(width, height);
  }

  updateResponsiveFont(w, h) {
    if (!this.element) return;
    const width = w || this.width || 165;
    const height = h || this.height || 70;

    // 165x70 기준 폰트 크기 (시간 40px, 날짜 13px) 비율 계산
    const scale = Math.min(width / 165, height / 70);
    const timeSize = Math.max(14, Math.round(40 * scale));
    const dateSize = Math.max(8.5, Math.round(13 * scale));

    this.element.style.setProperty('--clock-time-size', `${timeSize}px`);
    this.element.style.setProperty('--clock-date-size', `${dateSize}px`);
  }

  bindClockDrag() {
    // 시계 영역 어디를 잡아도 자유롭게 드래그하여 배치 가능
    if (this.bodyElement) {
      this.bodyElement.addEventListener('mousedown', (e) => {
        if (e.target.closest('.widget-btn') || e.target.closest('.resize-handle')) return;
        if (!this.isPinned) {
          this.startDrag(e);
        }
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
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const dayName = days[now.getDay()];
    const dateStr = `${m}월 ${d}일 ${dayName}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const hmEl = this.bodyElement.querySelector('.time-hm');
    const dateEl = this.bodyElement.querySelector('.clock-date-display');

    if (hmEl) hmEl.textContent = `${hours}:${minutes}`;
    if (dateEl) dateEl.textContent = dateStr;
  }

  destroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    super.destroy();
  }
}

window.ClockWidget = ClockWidget;

// 미니멀 감성 시계 위젯 (시간 & 날짜 깔끔 표시, 평소 투명 배경 & 호버 시 배경/닫기 버튼 노출)
class ClockWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'clock';
    config.title = config.title || '시계';
    config.icon = (window.WidgetIcons && window.WidgetIcons.clock) || '🕒';
    config.width = typeof config.width === 'number' ? config.width : 220;
    config.height = typeof config.height === 'number' ? config.height : 115;
    config.minWidth = 160;
    config.minHeight = 85;
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
          <span class="time-hm">00:00</span><span class="time-sec">:00</span>
        </div>
        <div class="clock-date-display">10월 17일 토요일</div>
      </div>
    `;

    this.updateTime();
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
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const hmEl = this.bodyElement.querySelector('.time-hm');
    const secEl = this.bodyElement.querySelector('.time-sec');
    const dateEl = this.bodyElement.querySelector('.clock-date-display');

    if (hmEl) hmEl.textContent = `${hours}:${minutes}`;
    if (secEl) secEl.textContent = `:${seconds}`;
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

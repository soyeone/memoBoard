// 집중 타이머 (뽀모도로 & 스톱워치) 위젯
class TimerWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'timer';
    config.title = config.title || '집중 타이머 (Focus)';
    config.icon = '⏱️';
    config.minWidth = 280;
    config.minHeight = 320;
    super(board, config);

    this.mode = this.data.mode || 'pomodoro'; // pomodoro(25m), shortBreak(5m), longBreak(15m), stopwatch
    this.durations = {
      pomodoro: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
    };

    this.timeLeft = typeof this.data.timeLeft === 'number' ? this.data.timeLeft : this.durations[this.mode] || (25 * 60);
    this.totalTime = typeof this.data.totalTime === 'number' ? this.data.totalTime : this.durations[this.mode] || (25 * 60);
    this.stopwatchTime = this.data.stopwatchTime || 0;
    this.completedSessions = this.data.completedSessions || 0;

    this.isRunning = false;
    this.timerInterval = null;

    this.render();
  }

  getData() {
    return {
      mode: this.mode,
      timeLeft: this.timeLeft,
      totalTime: this.totalTime,
      stopwatchTime: this.stopwatchTime,
      completedSessions: this.completedSessions,
    };
  }

  render() {
    if (!this.bodyElement) return;

    const isStopwatch = this.mode === 'stopwatch';
    const displaySeconds = isStopwatch ? this.stopwatchTime : this.timeLeft;
    const mins = Math.floor(displaySeconds / 60);
    const secs = displaySeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // SVG 프로그레스 원 둘레 계산 (반지름 r=72 => 둘레 2 * PI * 72 ≈ 452.39)
    const radius = 72;
    const circumference = 2 * Math.PI * radius;
    let strokeDashoffset = 0;
    if (!isStopwatch && this.totalTime > 0) {
      const progress = this.timeLeft / this.totalTime;
      strokeDashoffset = circumference * (1 - progress);
    }

    this.bodyElement.innerHTML = `
      <div class="timer-container">
        <div class="timer-modes">
          <button class="timer-mode-btn ${this.mode === 'pomodoro' ? 'active' : ''}" data-mode="pomodoro">뽀모도로</button>
          <button class="timer-mode-btn ${this.mode === 'shortBreak' ? 'active' : ''}" data-mode="shortBreak">휴식 (5분)</button>
          <button class="timer-mode-btn ${this.mode === 'longBreak' ? 'active' : ''}" data-mode="longBreak">긴 휴식</button>
          <button class="timer-mode-btn ${this.mode === 'stopwatch' ? 'active' : ''}" data-mode="stopwatch">스톱워치</button>
        </div>

        <div class="timer-dial-area">
          <svg class="timer-svg" width="180" height="180" viewBox="0 0 180 180">
            <circle class="timer-circle-bg" cx="90" cy="90" r="${radius}" stroke-width="8"></circle>
            ${!isStopwatch ? `
              <circle class="timer-circle-progress" cx="90" cy="90" r="${radius}" stroke-width="8"
                style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${strokeDashoffset};"></circle>
            ` : `
              <circle class="timer-circle-progress stopwatch-pulse" cx="90" cy="90" r="${radius}" stroke-width="8"
                style="stroke-dasharray: ${circumference}; stroke-dashoffset: 0;"></circle>
            `}
          </svg>
          <div class="timer-display">
            <span class="timer-time">${timeFormatted}</span>
            <span class="timer-mode-label">${this.getModeLabel()}</span>
          </div>
        </div>

        <div class="timer-controls">
          <button class="timer-btn timer-btn-toggle ${this.isRunning ? 'is-running' : ''}">
            ${this.isRunning ? `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              <span>일시정지</span>
            ` : `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>시작</span>
            `}
          </button>
          <button class="timer-btn timer-btn-reset" title="초기화">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>

        <div class="timer-footer-info">
          <span>완료한 세션: <strong>${this.completedSessions}회</strong> 🍅</span>
        </div>
      </div>
    `;

    this.bindTimerEvents();
  }

  getModeLabel() {
    switch (this.mode) {
      case 'pomodoro': return '집중 모드';
      case 'shortBreak': return '짧은 휴식';
      case 'longBreak': return '긴 휴식';
      case 'stopwatch': return '스톱워치';
      default: return '타이머';
    }
  }

  bindTimerEvents() {
    const modeBtns = this.bodyElement.querySelectorAll('.timer-mode-btn');
    const toggleBtn = this.bodyElement.querySelector('.timer-btn-toggle');
    const resetBtn = this.bodyElement.querySelector('.timer-btn-reset');

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const newMode = btn.dataset.mode;
        this.switchMode(newMode);
      });
    });

    toggleBtn.addEventListener('click', () => {
      this.toggleTimer();
    });

    resetBtn.addEventListener('click', () => {
      this.resetTimer();
    });
  }

  switchMode(newMode) {
    this.pauseTimer();
    this.mode = newMode;
    if (newMode === 'stopwatch') {
      this.stopwatchTime = 0;
    } else {
      this.totalTime = this.durations[newMode];
      this.timeLeft = this.totalTime;
    }
    this.board.saveState();
    this.render();
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
    this.render();
  }

  startTimer() {
    this.isRunning = true;
    window.soundManager.playPop();

    this.timerInterval = setInterval(() => {
      if (this.mode === 'stopwatch') {
        this.stopwatchTime++;
        this.updateDisplayOnly();
      } else {
        if (this.timeLeft > 0) {
          this.timeLeft--;
          this.updateDisplayOnly();
        } else {
          this.onTimerComplete();
        }
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.board.saveState();
  }

  resetTimer() {
    this.pauseTimer();
    if (this.mode === 'stopwatch') {
      this.stopwatchTime = 0;
    } else {
      this.timeLeft = this.totalTime;
    }
    window.soundManager.playPop();
    this.board.saveState();
    this.render();
  }

  onTimerComplete() {
    this.pauseTimer();
    if (this.mode === 'pomodoro') {
      this.completedSessions++;
    }
    window.soundManager.playChime();
    this.board.saveState();
    this.render();
  }

  // 매 초 렌더 전체를 날리지 않고 디스플레이와 원형 그래프만 부드럽게 갱신
  updateDisplayOnly() {
    const isStopwatch = this.mode === 'stopwatch';
    const displaySeconds = isStopwatch ? this.stopwatchTime : this.timeLeft;
    const mins = Math.floor(displaySeconds / 60);
    const secs = displaySeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const timeEl = this.bodyElement.querySelector('.timer-time');
    if (timeEl) timeEl.textContent = timeFormatted;

    if (!isStopwatch && this.totalTime > 0) {
      const circleProgress = this.bodyElement.querySelector('.timer-circle-progress');
      if (circleProgress) {
        const radius = 72;
        const circumference = 2 * Math.PI * radius;
        const progress = this.timeLeft / this.totalTime;
        const strokeDashoffset = circumference * (1 - progress);
        circleProgress.style.strokeDashoffset = strokeDashoffset;
      }
    }
  }

  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    super.destroy();
  }
}

window.TimerWidget = TimerWidget;

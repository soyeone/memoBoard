// 캘린더 위젯 (월별 달력 및 일자별 스케줄 관리 - 반응형 그리드 & 모달 팝업 지원)
class CalendarWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'calendar';
    config.title = config.title || '캘린더 (Calendar)';
    config.icon = (window.WidgetIcons && window.WidgetIcons.calendar) || '📅';
    config.width = typeof config.width === 'number' ? config.width : 380;
    config.height = typeof config.height === 'number' ? config.height : 360;
    config.minWidth = 260;
    config.minHeight = 240;
    super(board, config);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.currentYear = typeof this.data.year === 'number' ? this.data.year : now.getFullYear();
    this.currentMonth = typeof this.data.month === 'number' ? this.data.month : now.getMonth();
    this.selectedDate = this.data.selectedDate || todayStr;

    // 캘린더 일정 동기화 로직:
    // 1) 공유 스토리지에서 먼저 로드
    // 2) 보드에 이미 존재하는 다른 캘린더 위젯의 최신 events 참조
    // 3) 전달된 config.data.events 참조
    // 4) 아무것도 없으면 오늘 날짜의 기본 일정 샘플
    let initialEvents = null;
    if (window.storageManager && typeof window.storageManager.loadSharedCalendarEvents === 'function') {
      initialEvents = window.storageManager.loadSharedCalendarEvents();
    }

    if (!initialEvents && this.board && Array.isArray(this.board.widgets)) {
      const existingCal = this.board.widgets.find(w => w.type === 'calendar' && w !== this && w.events);
      if (existingCal) {
        initialEvents = JSON.parse(JSON.stringify(existingCal.events));
      }
    }

    if (!initialEvents && this.data && this.data.events) {
      initialEvents = this.data.events;
    }

    this.events = initialEvents || {
      [todayStr]: ['메모보드 확인하기', '중요 일정']
    };

    if (window.storageManager && typeof window.storageManager.saveSharedCalendarEvents === 'function') {
      window.storageManager.saveSharedCalendarEvents(this.events);
    }

    this.activeModal = null;
    this.render();
  }

  // 캘린더 일정 변경 시 공유 스토리지 및 보드 상의 모든 캘린더 위젯과 실시간 동기화
  updateSharedEvents(newEvents) {
    this.events = newEvents;
    if (window.storageManager && typeof window.storageManager.saveSharedCalendarEvents === 'function') {
      window.storageManager.saveSharedCalendarEvents(this.events);
    }

    // 보드 상의 다른 모든 캘린더 인스턴스에 즉각 전파 및 리렌더링
    if (this.board && Array.isArray(this.board.widgets)) {
      this.board.widgets.forEach(w => {
        if (w.type === 'calendar' && w !== this) {
          w.events = this.events;
          w.render();
        }
      });
    }

    this.board.saveState();
    this.render();
  }

  getData() {
    return {
      year: this.currentYear,
      month: this.currentMonth,
      events: this.events,
    };
  }

  render() {
    if (!this.bodyElement) return;

    this.closeModal();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const prevLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();

    const totalMonthCells = firstDayIndex + lastDay;
    const numWeeks = Math.ceil(totalMonthCells / 7);
    const totalGridCells = numWeeks * 7;
    const nextDays = totalGridCells - totalMonthCells;

    let daysHtml = '';

    // 이전 달 잔여 칸
    for (let x = firstDayIndex; x > 0; x--) {
      const dayNum = prevLastDay - x + 1;
      daysHtml += `
        <div class="calendar-day other-month">
          <div class="day-header"><span class="day-num">${dayNum}</span></div>
        </div>
      `;
    }

    // 이번 달 일수
    for (let i = 1; i <= lastDay; i++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const dayEvents = Array.isArray(this.events[dateStr]) ? this.events[dateStr] : [];

      daysHtml += `
        <div class="calendar-day current-month ${isToday ? 'is-today' : ''}" data-date="${dateStr}" title="클릭하여 새 일정 추가">
          <div class="day-header">
            <span class="day-num">${i}</span>
            ${dayEvents.length > 0 ? `<span class="day-event-count">${dayEvents.length}</span>` : ''}
          </div>
          <div class="day-events-list">
            ${dayEvents.map((evt, idx) => `
              <div class="cal-event-chip" data-date="${dateStr}" data-index="${idx}" title="클릭하여 수정 또는 삭제: ${this.escapeHtml(evt)}">
                <span class="chip-bullet"></span>
                <span class="chip-text">${this.escapeHtml(evt)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 다음 달 잔여 칸
    for (let j = 1; j <= nextDays; j++) {
      daysHtml += `
        <div class="calendar-day other-month">
          <div class="day-header"><span class="day-num">${j}</span></div>
        </div>
      `;
    }

    this.bodyElement.innerHTML = `
      <div class="calendar-container">
        <!-- 캘린더 네비게이션 헤더 -->
        <div class="calendar-header-nav">
          <span class="cal-month-title">${this.currentYear}년 ${monthNames[this.currentMonth]}</span>
          <div class="cal-nav-buttons">
            <button type="button" class="cal-btn-prev" title="이전 달">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button type="button" class="cal-btn-today" title="오늘로 이동">오늘</button>
            <button type="button" class="cal-btn-next" title="다음 달">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        <!-- 요일 헤더 -->
        <div class="calendar-weekdays">
          <span class="sun">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span class="sat">토</span>
        </div>

        <!-- 날짜 그리드 (모든 주차가 균등하게 1fr로 들어가 항상 온전히 표시됨) -->
        <div class="calendar-grid" style="grid-template-rows: repeat(${numWeeks}, minmax(0, 1fr));">
          ${daysHtml}
        </div>
      </div>
    `;

    this.bindCalendarEvents();
  }

  formatDatePretty(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const dayIdx = new Date(y, m - 1, d).getDay();
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dayIdx] || '';
      return `${m}월 ${d}일 (${dayOfWeek})`;
    } catch (e) {
      return dateStr;
    }
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  bindCalendarEvents() {
    const btnPrev = this.bodyElement.querySelector('.cal-btn-prev');
    const btnNext = this.bodyElement.querySelector('.cal-btn-next');
    const btnToday = this.bodyElement.querySelector('.cal-btn-today');
    const days = this.bodyElement.querySelectorAll('.calendar-day.current-month');
    const chips = this.bodyElement.querySelectorAll('.cal-event-chip');

    // 이전 달 버튼
    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentMonth--;
        if (this.currentMonth < 0) {
          this.currentMonth = 11;
          this.currentYear--;
        }
        this.board.saveState();
        this.render();
      });
    }

    // 다음 달 버튼
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentMonth++;
        if (this.currentMonth > 11) {
          this.currentMonth = 0;
          this.currentYear++;
        }
        this.board.saveState();
        this.render();
      });
    }

    // 오늘로 버튼
    if (btnToday) {
      btnToday.addEventListener('click', (e) => {
        e.stopPropagation();
        const now = new Date();
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
        this.selectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        this.board.saveState();
        this.render();
      });
    }

    // 날짜 칸 클릭 -> 새 일정 등록 팝업
    days.forEach(day => {
      day.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateStr = day.dataset.date;
        this.selectedDate = dateStr;
        this.openAddModal(dateStr);
      });
    });

    // 일정 글자(칩) 클릭 -> 수정/삭제 팝업
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateStr = chip.dataset.date;
        const idx = parseInt(chip.dataset.index, 10);
        this.selectedDate = dateStr;
        this.openEditModal(dateStr, idx);
      });
    });
  }

  // 모달 닫기
  closeModal() {
    if (this.activeModal && this.activeModal.parentNode) {
      this.activeModal.parentNode.removeChild(this.activeModal);
    }
    this.activeModal = null;
    this.selectedDate = null;
  }

  // 새 일정 등록 팝업 모달
  openAddModal(dateStr) {
    this.closeModal();

    const prettyDate = this.formatDatePretty(dateStr);
    const modalEl = document.createElement('div');
    modalEl.className = 'cal-modal-overlay';
    modalEl.innerHTML = `
      <div class="cal-modal-box">
        <div class="cal-modal-header">
          <span class="cal-modal-title">${prettyDate}</span>
          <button type="button" class="cal-modal-close" title="닫기">×</button>
        </div>
        <form class="cal-modal-form">
          <div class="cal-modal-body">
            <input type="text" class="cal-modal-input" placeholder="일정을 입력하세요..." autocomplete="off" />
          </div>
          <div class="cal-modal-footer">
            <div></div>
            <div class="cal-modal-footer-right">
              <button type="button" class="cal-btn-cancel">취소</button>
              <button type="submit" class="cal-btn-submit">등록</button>
            </div>
          </div>
        </form>
      </div>
    `;

    this.element.appendChild(modalEl);
    this.activeModal = modalEl;

    const input = modalEl.querySelector('.cal-modal-input');
    const form = modalEl.querySelector('.cal-modal-form');
    const closeBtn = modalEl.querySelector('.cal-modal-close');
    const cancelBtn = modalEl.querySelector('.cal-btn-cancel');

    setTimeout(() => {
      if (input) input.focus();
    }, 40);

    const handleClose = (e) => {
      if (e) e.stopPropagation();
      this.closeModal();
    };

    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        handleClose(e);
      }
    });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        handleClose(e);
        document.removeEventListener('keydown', onKey);
      }
    };
    document.addEventListener('keydown', onKey);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }

      if (!Array.isArray(this.events[dateStr])) {
        this.events[dateStr] = [];
      }
      this.events[dateStr].push(text);
      if (window.soundManager) window.soundManager.playPop();

      document.removeEventListener('keydown', onKey);
      this.closeModal();
      this.updateSharedEvents(this.events);
    });
  }

  // 일정 수정 및 삭제 팝업 모달
  openEditModal(dateStr, index) {
    this.closeModal();

    const currentText = (this.events[dateStr] && this.events[dateStr][index]) || '';
    const prettyDate = this.formatDatePretty(dateStr);

    const modalEl = document.createElement('div');
    modalEl.className = 'cal-modal-overlay';
    modalEl.innerHTML = `
      <div class="cal-modal-box">
        <div class="cal-modal-header">
          <span class="cal-modal-title">${prettyDate}</span>
          <button type="button" class="cal-modal-close" title="닫기">×</button>
        </div>
        <form class="cal-modal-form">
          <div class="cal-modal-body">
            <input type="text" class="cal-modal-input" value="${this.escapeHtml(currentText)}" autocomplete="off" />
          </div>
          <div class="cal-modal-footer">
            <button type="button" class="cal-btn-delete" title="일정 삭제">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              삭제
            </button>
            <div class="cal-modal-footer-right">
              <button type="button" class="cal-btn-cancel">취소</button>
              <button type="submit" class="cal-btn-submit">수정 완료</button>
            </div>
          </div>
        </form>
      </div>
    `;

    this.element.appendChild(modalEl);
    this.activeModal = modalEl;

    const input = modalEl.querySelector('.cal-modal-input');
    const form = modalEl.querySelector('.cal-modal-form');
    const closeBtn = modalEl.querySelector('.cal-modal-close');
    const cancelBtn = modalEl.querySelector('.cal-btn-cancel');
    const deleteBtn = modalEl.querySelector('.cal-btn-delete');

    setTimeout(() => {
      if (input) {
        input.focus();
        input.select();
      }
    }, 40);

    const handleClose = (e) => {
      if (e) e.stopPropagation();
      this.closeModal();
    };

    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        handleClose(e);
      }
    });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        handleClose(e);
        document.removeEventListener('keydown', onKey);
      }
    };
    document.addEventListener('keydown', onKey);

    // 수정 완료 제출
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newText = input.value.trim();
      if (!newText) {
        input.focus();
        return;
      }

      if (Array.isArray(this.events[dateStr])) {
        this.events[dateStr][index] = newText;
        if (window.soundManager) window.soundManager.playPop();
      }

      document.removeEventListener('keydown', onKey);
      this.closeModal();
      this.updateSharedEvents(this.events);
    });

    // 삭제 버튼 클릭
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (Array.isArray(this.events[dateStr])) {
        this.events[dateStr].splice(index, 1);
        if (this.events[dateStr].length === 0) {
          delete this.events[dateStr];
        }
        if (window.soundManager) window.soundManager.playPop();
      }

      document.removeEventListener('keydown', onKey);
      this.closeModal();
      this.updateSharedEvents(this.events);
    });
  }
}

window.CalendarWidget = CalendarWidget;

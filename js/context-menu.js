// 보드 마우스 우클릭 위젯 메뉴 컨트롤러 (Board Context Menu Manager)
class ContextMenuManager {
  constructor(memoBoard) {
    this.board = memoBoard;
    this.isOpen = false;
    this.lastDropPos = { x: 100, y: 100 };

    this.items = [
      { type: 'todo', title: '오늘의 할 일' },
      { type: 'calendar', title: '일정 캘린더' },
      { type: 'note', title: '포스트잇' },
      { type: 'photo', title: '사진 액자' },
      { type: 'timer', title: '집중 타이머' },
      { type: 'clock', title: '시계' },
    ];

    this.initContextMenu();
    this.bindEvents();
  }

  initContextMenu() {
    let menu = document.getElementById('board-context-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'board-context-menu';
      menu.className = 'board-context-menu';
      document.body.appendChild(menu);
    }
    this.menu = menu;

    this.renderMenu();
  }

  renderMenu() {
    const widgetCount = (this.board && Array.isArray(this.board.widgets)) ? this.board.widgets.length : 0;

    this.menu.innerHTML = `
      <div class="ctx-header">
        <span class="ctx-header-icon">🌿</span>
        <span class="ctx-header-title">보드 메뉴</span>
      </div>
      <div class="ctx-menu-actions ctx-top-actions">
        <div class="ctx-menu-item ctx-action-item ctx-highlight" id="ctx-btn-overview" title="현재 화면에 띄워둔 모든 아이템을 한눈에 확인하고 이동합니다">
          <div class="ctx-item-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
            </svg>
          </div>
          <span class="ctx-item-name">전체 아이템 보기</span>
          <span class="ctx-item-badge">${widgetCount}</span>
        </div>
      </div>
      <div class="ctx-divider"></div>
      <div class="ctx-section-label">위젯 추가</div>
      <div class="ctx-menu-list">
        ${this.items.map(item => {
          const svgIcon = (window.WidgetIcons && window.WidgetIcons[item.type]) || '';
          return `
            <div class="ctx-menu-item" data-type="${item.type}">
              <div class="ctx-item-icon-box">${svgIcon}</div>
              <span class="ctx-item-name">${item.title}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div class="ctx-divider"></div>
      <div class="ctx-menu-actions">
        <div class="ctx-menu-item ctx-action-item" id="ctx-btn-arrange">
          <div class="ctx-item-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <span class="ctx-item-name">위젯 자동 정렬</span>
        </div>
        <div class="ctx-menu-item ctx-action-item" id="ctx-btn-settings">
          <div class="ctx-item-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          <span class="ctx-item-name">보드 환경설정</span>
        </div>
      </div>
    `;
  }

  showMenu(clientX, clientY) {
    this.renderMenu();
    const canvasRect = this.board.canvas.getBoundingClientRect();
    
    // 캔버스 내 스크롤 위치를 감안한 실제 배치 좌표 계산
    let dropX = clientX - canvasRect.left + this.board.canvas.scrollLeft;
    let dropY = clientY - canvasRect.top + this.board.canvas.scrollTop;

    // 마우스 위치 기준 오프셋
    dropX = dropX - 40;
    dropY = dropY - 20;

    if (this.board.snapToGrid) {
      dropX = Math.round(dropX / this.board.gridSize) * this.board.gridSize;
      dropY = Math.round(dropY / this.board.gridSize) * this.board.gridSize;
    }

    this.lastDropPos = {
      x: Math.max(20, dropX),
      y: Math.max(20, dropY),
    };

    // 메뉴를 화면에 표시하고 크기 측정
    this.menu.style.display = 'block';
    this.menu.classList.remove('is-open');

    const menuRect = this.menu.getBoundingClientRect();
    let posX = clientX;
    let posY = clientY;

    // 화면 오른쪽 / 하단 경계 벗어남 방지 (안쪽으로 뒤집거나 클램프)
    if (posX + menuRect.width > window.innerWidth - 12) {
      posX = clientX - menuRect.width;
    }
    if (posY + menuRect.height > window.innerHeight - 12) {
      posY = clientY - menuRect.height;
    }

    this.menu.style.left = `${Math.max(10, posX)}px`;
    this.menu.style.top = `${Math.max(10, posY)}px`;

    // 프레임 다음 틱에 열림 애니메이션 활성화
    requestAnimationFrame(() => {
      this.menu.classList.add('is-open');
      this.isOpen = true;
    });

    if (window.soundManager) window.soundManager.playPop();
  }

  hideMenu() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.menu.classList.remove('is-open');
    setTimeout(() => {
      if (!this.isOpen) {
        this.menu.style.display = 'none';
      }
    }, 180);
  }

  bindEvents() {
    // 1. 보드 캔버스 우클릭 시 컨텍스트 메뉴 노출
    this.board.canvas.addEventListener('contextmenu', (e) => {
      // 텍스트 편집기나 인터랙티브 요소 내부 우클릭은 기본 브라우저 동작 유지
      if (e.target.closest('input, textarea, [contenteditable="true"], button')) {
        return;
      }

      // 위젯 카드 내부가 아닌 캔버스 배경 우클릭 시에만 팝업
      if (!e.target.closest('.widget-card')) {
        e.preventDefault();
        this.showMenu(e.clientX, e.clientY);
      }
    });

    // 2. 컨텍스트 메뉴 항목 클릭 시 위젯 생성
    this.menu.addEventListener('click', (e) => {
      const item = e.target.closest('.ctx-menu-item');
      if (!item) return;

      e.stopPropagation();

      const type = item.dataset.type;
      if (type) {
        this.board.addWidget(type, {
          x: this.lastDropPos.x,
          y: this.lastDropPos.y,
        });
        this.hideMenu();
        return;
      }

      if (item.id === 'ctx-btn-overview') {
        this.openOverviewModal();
        this.hideMenu();
        return;
      }

      if (item.id === 'ctx-btn-arrange') {
        this.board.arrangeWidgetsGrid();
        this.hideMenu();
        return;
      }

      if (item.id === 'ctx-btn-settings') {
        if (window.app) window.app.toggleSettingsModal();
        this.hideMenu();
        return;
      }
    });

    // 3. 바깥 영역 클릭 시 닫기
    document.addEventListener('pointerdown', (e) => {
      if (this.isOpen && !this.menu.contains(e.target)) {
        this.hideMenu();
      }
    });

    // 4. ESC 키 입력 시 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isOpen) this.hideMenu();
        if (this.overviewModal) this.closeOverviewModal();
      }
    });

    // 5. 캔버스 스크롤 및 윈도우 크기 변경 시 닫기
    this.board.canvas.addEventListener('scroll', () => {
      if (this.isOpen) this.hideMenu();
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (this.isOpen) this.hideMenu();
    });
  }

  // ========================================================
  // 전체 아이템 한눈에 보기 & 관리 모달 (Overview Modal)
  // ========================================================
  openOverviewModal() {
    this.closeOverviewModal();

    const modalEl = document.createElement('div');
    modalEl.id = 'board-overview-modal';
    modalEl.className = 'overview-modal-backdrop';

    document.body.appendChild(modalEl);
    this.overviewModal = modalEl;

    this.renderOverviewContent();

    if (window.soundManager) window.soundManager.playPop();
  }

  closeOverviewModal() {
    if (this.overviewModal) {
      this.overviewModal.remove();
      this.overviewModal = null;
    }
  }

  renderOverviewContent() {
    if (!this.overviewModal) return;
    const widgets = (this.board && Array.isArray(this.board.widgets)) ? this.board.widgets : [];

    this.overviewModal.innerHTML = `
      <div class="overview-modal-window">
        <div class="overview-modal-header">
          <div class="overview-header-title-box">
            <span class="overview-header-icon">🌿</span>
            <div>
              <h2 class="overview-modal-title">화면의 전체 아이템 <span class="overview-count-pill">${widgets.length}</span></h2>
              <p class="overview-modal-subtitle">현재 보드에 띄워둔 모든 아이템을 한눈에 보고 바로 이동하거나 관리할 수 있습니다</p>
            </div>
          </div>
          <button type="button" class="overview-modal-close" title="닫기">&times;</button>
        </div>

        <div class="overview-toolbar">
          <div class="overview-toolbar-left">
            <button type="button" class="overview-tool-btn" id="ov-btn-arrange" title="보드의 모든 위젯을 바둑판 형태로 자동 정렬합니다">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              바둑판 자동 정렬
            </button>
            <button type="button" class="overview-tool-btn" id="ov-btn-gather" title="화면 밖으로 나간 위젯들을 현재 시야 안으로 모읍니다">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              화면 안으로 모으기
            </button>
          </div>
          <div class="overview-toolbar-right">
            <button type="button" class="overview-tool-btn" id="ov-btn-unfold-all" title="모든 위젯 펼치기">모두 펼치기</button>
            <button type="button" class="overview-tool-btn" id="ov-btn-fold-all" title="모든 위젯 접기">모두 접기</button>
          </div>
        </div>

        <div class="overview-items-scroll">
          ${widgets.length === 0 ? `
            <div class="overview-empty-state">
              <span class="empty-icon">🍃</span>
              <p class="empty-title">현재 화면에 띄워둔 아이템이 없습니다</p>
              <p class="empty-sub">보드 빈 공간을 마우스 우클릭하여 원하는 위젯을 배치해보세요</p>
            </div>
          ` : `
            <div class="overview-items-grid">
              ${widgets.map(w => `
                <div class="overview-card theme-${w.theme || 'default'}" data-id="${w.id}">
                  <div class="overview-card-header">
                    <div class="overview-card-title-row">
                      <span class="overview-card-icon">${w.icon || '📌'}</span>
                      <span class="overview-card-title">${this.escapeHtml(w.title || this.getTypeKorean(w.type))}</span>
                      <span class="overview-card-type-tag">${this.getTypeKorean(w.type)}</span>
                    </div>
                    <div class="overview-card-badges">
                      ${w.isPinned ? '<span class="ov-badge ov-badge-pinned">📌 고정</span>' : ''}
                      ${w.isFolded ? '<span class="ov-badge ov-badge-folded">📁 접힘</span>' : ''}
                    </div>
                  </div>
                  <div class="overview-card-body">
                    <div class="overview-card-summary">${this.getWidgetSummary(w)}</div>
                    <div class="overview-card-meta">
                      <span>위치: (${Math.round(w.x)}, ${Math.round(w.y)})</span>
                      <span>크기: ${Math.round(w.width)}×${Math.round(w.height)}px</span>
                    </div>
                  </div>
                  <div class="overview-card-footer">
                    <button type="button" class="ov-act-btn btn-focus" title="이 위젯 위치로 이동">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
                      위치로 이동
                    </button>
                    <div class="ov-card-btn-group">
                      <button type="button" class="ov-icon-btn btn-pin ${w.isPinned ? 'is-active' : ''}" title="${w.isPinned ? '고정 해제' : '위치 고정'}">
                        📌
                      </button>
                      <button type="button" class="ov-icon-btn btn-fold ${w.isFolded ? 'is-active' : ''}" title="${w.isFolded ? '펼치기' : '접기'}">
                        📁
                      </button>
                      <button type="button" class="ov-icon-btn btn-del" title="삭제">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.bindOverviewEvents();
  }

  bindOverviewEvents() {
    if (!this.overviewModal) return;
    const modal = this.overviewModal;

    // 1. 닫기 버튼 & 배경 클릭
    const closeBtn = modal.querySelector('.overview-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeOverviewModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeOverviewModal();
    });

    // 2. 상단 툴바 버튼들
    const btnArrange = modal.querySelector('#ov-btn-arrange');
    const btnGather = modal.querySelector('#ov-btn-gather');
    const btnUnfoldAll = modal.querySelector('#ov-btn-unfold-all');
    const btnFoldAll = modal.querySelector('#ov-btn-fold-all');

    if (btnArrange) {
      btnArrange.addEventListener('click', () => {
        this.board.arrangeWidgetsGrid();
        this.renderOverviewContent();
      });
    }

    if (btnGather) {
      btnGather.addEventListener('click', () => {
        this.board.gatherWidgetsToView();
        this.renderOverviewContent();
      });
    }

    if (btnUnfoldAll) {
      btnUnfoldAll.addEventListener('click', () => {
        this.board.widgets.forEach(w => {
          if (w.isFolded) w.toggleFold();
        });
        this.renderOverviewContent();
      });
    }

    if (btnFoldAll) {
      btnFoldAll.addEventListener('click', () => {
        this.board.widgets.forEach(w => {
          if (!w.isFolded) w.toggleFold();
        });
        this.renderOverviewContent();
      });
    }

    // 3. 개별 카드 이벤트
    const cards = modal.querySelectorAll('.overview-card');
    cards.forEach(card => {
      const widgetId = card.dataset.id;
      const widget = this.board.widgets.find(w => w.id === widgetId);
      if (!widget) return;

      const btnFocus = card.querySelector('.btn-focus');
      const btnPin = card.querySelector('.btn-pin');
      const btnFold = card.querySelector('.btn-fold');
      const btnDel = card.querySelector('.btn-del');

      if (btnFocus) {
        btnFocus.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeOverviewModal();
          this.board.focusWidget(widget);
        });
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this.closeOverviewModal();
        this.board.focusWidget(widget);
      });

      if (btnPin) {
        btnPin.addEventListener('click', (e) => {
          e.stopPropagation();
          widget.togglePin();
          this.renderOverviewContent();
        });
      }

      if (btnFold) {
        btnFold.addEventListener('click', (e) => {
          e.stopPropagation();
          widget.toggleFold();
          this.renderOverviewContent();
        });
      }

      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          widget.destroy();
          setTimeout(() => this.renderOverviewContent(), 220);
        });
      }
    });
  }

  getWidgetSummary(w) {
    if (!w) return '';
    try {
      if (w.type === 'todo') {
        const todos = w.todos || [];
        const completed = todos.filter(t => t.done).length;
        const remaining = todos.length - completed;
        if (todos.length === 0) return '등록된 할 일이 없습니다.';
        return `진행 중 <b>${remaining}개</b> / 완료 ${completed}개 (총 ${todos.length}개)`;
      }
      if (w.type === 'calendar') {
        const count = Object.values(w.events || {}).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
        return `등록된 일정 <b>${count}건</b>`;
      }
      if (w.type === 'note') {
        const content = (w.data && w.data.content) || (w.textarea && w.textarea.value) || '';
        if (!content.trim()) return '작성된 메모가 없습니다.';
        const clean = content.replace(/\n+/g, ' ').trim();
        return `"${this.escapeHtml(clean.length > 32 ? clean.slice(0, 32) + '...' : clean)}"`;
      }
      if (w.type === 'photo') {
        if (w.caption && w.caption.trim()) {
          return `"${this.escapeHtml(w.caption)}"`;
        }
        return w.imageUrl ? '사진 액자 (이미지 표시 중)' : '등록된 사진 없음';
      }
      if (w.type === 'clock') {
        return '실시간 시간 & 날짜 표시 중';
      }
      if (w.type === 'timer') {
        return '뽀모도로 집중 타이머';
      }
      return '위젯 동작 중';
    } catch (e) {
      return '';
    }
  }

  getTypeKorean(type) {
    const map = {
      todo: '할 일',
      calendar: '캘린더',
      note: '포스트잇',
      photo: '사진 액자',
      clock: '시계',
      timer: '타이머',
    };
    return map[type] || '위젯';
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
}

// 하위 호환성을 위해 ContextMenuManager와 DockManager 둘 다 노출
window.ContextMenuManager = ContextMenuManager;
window.DockManager = ContextMenuManager;

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
    this.menu.innerHTML = `
      <div class="ctx-header">
        <span class="ctx-header-icon">🌿</span>
        <span class="ctx-header-title">위젯 추가</span>
      </div>
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
      if (e.key === 'Escape' && this.isOpen) {
        this.hideMenu();
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
}

// 하위 호환성을 위해 ContextMenuManager와 DockManager 둘 다 노출
window.ContextMenuManager = ContextMenuManager;
window.DockManager = ContextMenuManager;

// 하단 인터랙티브 독 (플로팅 위젯 런처 및 단일 파이프라인 드래그 앤 드롭)
class DockManager {
  constructor(dockElement, memoBoard) {
    this.dock = dockElement;
    this.board = memoBoard;

    this.items = [
      { type: 'calendar', title: '캘린더', icon: '📅', desc: '일정 및 월별 달력' },
      { type: 'todo', title: 'Todo List', icon: '✅', desc: '할 일 체크리스트 & 진행률' },
      { type: 'timer', title: '집중 타이머', icon: '⏱️', desc: '뽀모도로 & 스톱워치' },
      { type: 'photo', title: '사진 액자', icon: '🖼️', desc: '이미지 업로드 & 클립보드 붙여넣기' },
      { type: 'note', title: '포스트잇', icon: '📝', desc: '다채로운 빠른 메모장' },
      { type: 'clock', title: '시계', icon: '🕒', desc: '디지털 & 아날로그 시계' },
    ];

    this.render();
    this.bindEvents();
  }

  render() {
    this.dock.innerHTML = `
      <div class="dock-container glass-panel">
        <div class="dock-handle" title="하단 독 (보드로 아이콘을 끌어놓으세요)">
          <div class="dock-pill"></div>
        </div>
        <div class="dock-items">
          ${this.items.map(item => `
            <div class="dock-item" 
                 draggable="false"
                 data-type="${item.type}" 
                 data-title="${item.title}" 
                 data-icon="${item.icon}"
                 title="${item.title} (끌어서 보드에 배치하거나 클릭하세요)">
              <div class="dock-item-icon">${item.icon}</div>
              <span class="dock-item-tooltip">${item.title}</span>
            </div>
          `).join('')}

          <div class="dock-divider"></div>

          <div class="dock-action-btn" id="dock-btn-arrange" title="위젯 자동 바둑판 정렬">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span class="dock-item-tooltip">자동 정렬</span>
          </div>

          <div class="dock-action-btn" id="dock-btn-settings" title="보드 배경 & 설정">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span class="dock-item-tooltip">보드 설정</span>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const dockItems = this.dock.querySelectorAll('.dock-item');
    const arrangeBtn = this.dock.querySelector('#dock-btn-arrange');
    const settingsBtn = this.dock.querySelector('#dock-btn-settings');

    dockItems.forEach(item => {
      const type = item.dataset.type;
      const title = item.dataset.title;
      const icon = item.dataset.icon;

      let isDragging = false;
      let hasMovedSignificantly = false;
      let ghostEl = null;
      let startX = 0;
      let startY = 0;

      item.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      });

      item.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();

        startX = e.clientX;
        startY = e.clientY;
        isDragging = true;
        hasMovedSignificantly = false;

        const onMouseMove = (moveEv) => {
          if (!isDragging) return;
          const dist = Math.hypot(moveEv.clientX - startX, moveEv.clientY - startY);

          if (!hasMovedSignificantly && dist > 8) {
            hasMovedSignificantly = true;
            ghostEl = document.createElement('div');
            ghostEl.className = 'widget-ghost-preview';
            ghostEl.innerHTML = `
              <div class="ghost-icon">${icon}</div>
              <div class="ghost-title">${title} 놓아서 배치</div>
            `;
            document.body.appendChild(ghostEl);
            item.classList.add('is-dragging-source');
          }

          if (hasMovedSignificantly && ghostEl) {
            ghostEl.style.left = `${moveEv.clientX}px`;
            ghostEl.style.top = `${moveEv.clientY}px`;
          }
        };

        const onMouseUp = (upEv) => {
          if (!isDragging) return;
          isDragging = false;

          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          item.classList.remove('is-dragging-source');

          if (ghostEl && ghostEl.parentNode) {
            ghostEl.parentNode.removeChild(ghostEl);
            ghostEl = null;
          }

          if (hasMovedSignificantly) {
            const canvasRect = this.board.canvas.getBoundingClientRect();
            const dockRect = this.dock.getBoundingClientRect();

            const isInsideCanvas = (
              upEv.clientX >= canvasRect.left &&
              upEv.clientX <= canvasRect.right &&
              upEv.clientY >= canvasRect.top &&
              upEv.clientY <= canvasRect.bottom
            );

            const isOverDock = (
              upEv.clientX >= dockRect.left &&
              upEv.clientX <= dockRect.right &&
              upEv.clientY >= dockRect.top &&
              upEv.clientY <= dockRect.bottom
            );

            if (isInsideCanvas && !isOverDock) {
              let dropX = upEv.clientX - canvasRect.left - 130;
              let dropY = upEv.clientY - canvasRect.top - 40;

              if (this.board.snapToGrid) {
                dropX = Math.round(dropX / this.board.gridSize) * this.board.gridSize;
                dropY = Math.round(dropY / this.board.gridSize) * this.board.gridSize;
              }
              dropX = Math.max(20, dropX);
              dropY = Math.max(20, dropY);

              this.board.addWidget(type, { x: dropX, y: dropY });
            }
          } else {
            this.board.addWidget(type);
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });

    if (arrangeBtn) {
      arrangeBtn.addEventListener('click', () => {
        this.board.arrangeWidgetsGrid();
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        window.app.toggleSettingsModal();
      });
    }

    const dockContainer = this.dock.querySelector('.dock-items');
    if (dockContainer) {
      dockContainer.addEventListener('mousemove', (e) => {
        const allItems = dockContainer.querySelectorAll('.dock-item, .dock-action-btn');
        allItems.forEach(el => {
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const dist = Math.abs(e.clientX - centerX);
          if (dist < 100) {
            const scale = 1 + (0.35 * (1 - dist / 100));
            el.style.transform = `scale(${scale}) translateY(-${(scale - 1) * 20}px)`;
          } else {
            el.style.transform = 'scale(1) translateY(0)';
          }
        });
      });

      dockContainer.addEventListener('mouseleave', () => {
        const allItems = dockContainer.querySelectorAll('.dock-item, .dock-action-btn');
        allItems.forEach(el => {
          el.style.transform = 'scale(1) translateY(0)';
        });
      });
    }
  }
}

window.DockManager = DockManager;

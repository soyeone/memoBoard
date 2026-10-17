// 위젯 공통 기반 클래스 (드래그, 리사이즈, 테마, 핀, 접기, 공통 프레임)
class WidgetBase {
  constructor(board, config = {}) {
    this.board = board;
    this.id = config.id || 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    this.type = config.type || 'generic';
    this.title = config.title || '위젯';
    this.icon = (window.WidgetIcons && window.WidgetIcons[this.type]) || config.icon || '📌';
    this.x = typeof config.x === 'number' ? config.x : 60;
    this.y = typeof config.y === 'number' ? config.y : 60;
    this.width = typeof config.width === 'number' ? config.width : 320;
    this.height = typeof config.height === 'number' ? config.height : 360;
    this.minWidth = config.minWidth || 220;
    this.minHeight = config.minHeight || 180;
    this.zIndex = typeof config.zIndex === 'number' ? config.zIndex : 10;
    this.isPinned = !!config.isPinned;
    this.isFolded = !!config.isFolded;
    this.theme = config.theme || 'default';
    this.data = config.data || {};

    this.element = null;
    this.bodyElement = null;
    this.isDragging = false;
    this.isResizing = false;
    this.activeResizeHandle = null;

    this.dragStartX = 0;
    this.dragStartY = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.initialW = 0;
    this.initialH = 0;

    this.initElement();
    this.bindEvents();
    // this.render()는 서브클래스에서 자체 데이터 초기화 완료 후 명시적으로 호출합니다.
  }

  initElement() {
    const el = document.createElement('div');
    el.className = `widget-card widget-${this.type} theme-${this.theme}`;
    el.id = this.id;
    el.style.left = `${this.x}px`;
    el.style.top = `${this.y}px`;
    el.style.width = `${this.width}px`;
    el.style.height = `${this.height}px`;
    el.style.zIndex = this.zIndex;

    if (this.isPinned) el.classList.add('is-pinned');
    if (this.isFolded) el.classList.add('is-folded');

    el.innerHTML = `
      <div class="widget-header">
        <div class="widget-title-area">
          <span class="widget-icon">${this.icon}</span>
        </div>
        <div class="widget-actions">
          <button class="widget-btn btn-color" title="테마 색상 변경" aria-label="색상 테마">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 7 7c0 2-2 3-2 3s1 1 1 3-2 3-4 3c-4 0-9-2-9-9a7 7 0 0 1 7-7z"/></svg>
          </button>
          <button class="widget-btn btn-fold" title="${this.isFolded ? '펼치기' : '접기'}" aria-label="접기/펼치기">
            <svg class="icon-fold" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <button class="widget-btn btn-pin ${this.isPinned ? 'active' : ''}" title="${this.isPinned ? '고정 해제' : '위치 고정'}" aria-label="고정">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v8l3 3v2H9v-2l3-3V2z"/><line x1="12" y1="15" x2="12" y2="22"/></svg>
          </button>
          <button class="widget-btn btn-close" title="위젯 닫기" aria-label="닫기">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="widget-color-palette" style="display:none;">
        <span class="palette-chip color-default" data-theme="default" title="내추럴 크림"></span>
        <span class="palette-chip color-yellow" data-theme="yellow" title="파스텔 옐로우"></span>
        <span class="palette-chip color-blue" data-theme="blue" title="스카이 블루"></span>
        <span class="palette-chip color-mint" data-theme="mint" title="세이지 민트"></span>
        <span class="palette-chip color-purple" data-theme="purple" title="라벤더 퍼플"></span>
        <span class="palette-chip color-rose" data-theme="rose" title="피치 핑크"></span>
        <span class="palette-chip color-dark" data-theme="dark" title="다크 포레스트"></span>
      </div>
      <div class="widget-body"></div>
      <div class="resize-handles">
        <div class="resize-handle rh-e" data-direction="e"></div>
        <div class="resize-handle rh-s" data-direction="s"></div>
        <div class="resize-handle rh-se" data-direction="se"></div>
        <div class="resize-handle rh-w" data-direction="w"></div>
        <div class="resize-handle rh-sw" data-direction="sw"></div>
        <div class="resize-handle rh-n" data-direction="n"></div>
        <div class="resize-handle rh-ne" data-direction="ne"></div>
        <div class="resize-handle rh-nw" data-direction="nw"></div>
      </div>
    `;

    this.element = el;
    this.bodyElement = el.querySelector('.widget-body');
  }

  bindEvents() {
    const header = this.element.querySelector('.widget-header');
    const titleEl = this.element.querySelector('.widget-title');
    const btnFold = this.element.querySelector('.btn-fold');
    const btnPin = this.element.querySelector('.btn-pin');
    const btnColor = this.element.querySelector('.btn-color');
    const btnClose = this.element.querySelector('.btn-close');
    const palette = this.element.querySelector('.widget-color-palette');

    // 위젯 클릭 시 최상단으로 가져오기
    this.element.addEventListener('mousedown', (e) => {
      this.board.bringToFront(this);
    });

    // 드래그 이동 (헤더 드래깅)
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.widget-actions') || e.target.closest('.widget-color-palette')) return;
      if (this.isPinned) return;
      this.startDrag(e);
    });

    // 제목 더블클릭 수정 (제목 요소가 존재할 경우)
    if (titleEl) {
      titleEl.addEventListener('dblclick', () => {
        titleEl.contentEditable = 'true';
        titleEl.focus();
        document.execCommand('selectAll', false, null);
      });

      titleEl.addEventListener('blur', () => {
        titleEl.contentEditable = 'false';
        this.title = titleEl.textContent.trim() || '위젯';
        titleEl.textContent = this.title;
        this.board.saveState();
      });

      titleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          titleEl.blur();
        }
      });
    }

    // 접기 토글
    btnFold.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFold();
    });

    // 핀 고정 토글
    btnPin.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePin();
    });

    // 색상 팔레트 토글
    btnColor.addEventListener('click', (e) => {
      e.stopPropagation();
      palette.style.display = palette.style.display === 'none' ? 'flex' : 'none';
    });

    // 팔레트 칩 클릭
    palette.querySelectorAll('.palette-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedTheme = chip.dataset.theme;
        this.setTheme(selectedTheme);
        palette.style.display = 'none';
      });
    });

    // 닫기
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.destroy();
    });

    // 리사이즈 핸들러
    const handles = this.element.querySelectorAll('.resize-handle');
    handles.forEach(h => {
      h.addEventListener('mousedown', (e) => {
        if (this.isPinned || this.isFolded) return;
        e.stopPropagation();
        this.startResize(e, h.dataset.direction);
      });
    });
  }

  startDrag(e) {
    this.isDragging = true;
    this.element.classList.add('is-dragging');
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.initialX = this.x;
    this.initialY = this.y;

    const onMouseMove = (ev) => {
      if (!this.isDragging) return;
      const dx = ev.clientX - this.dragStartX;
      const dy = ev.clientY - this.dragStartY;
      let newX = this.initialX + dx;
      let newY = this.initialY + dy;

      if (this.board.snapToGrid) {
        newX = Math.round(newX / this.board.gridSize) * this.board.gridSize;
        newY = Math.round(newY / this.board.gridSize) * this.board.gridSize;
      }

      newX = Math.max(10, newX);
      newY = Math.max(10, newY);

      this.x = newX;
      this.y = newY;
      this.element.style.left = `${newX}px`;
      this.element.style.top = `${newY}px`;
    };

    const onMouseUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.element.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.board.saveState();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  startResize(e, direction) {
    this.isResizing = true;
    this.activeResizeHandle = direction;
    this.element.classList.add('is-resizing');

    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.initialX = this.x;
    this.initialY = this.y;
    this.initialW = this.width;
    this.initialH = this.height;

    const onMouseMove = (ev) => {
      if (!this.isResizing) return;
      const dx = ev.clientX - this.dragStartX;
      const dy = ev.clientY - this.dragStartY;
      let newW = this.initialW;
      let newH = this.initialH;
      let newX = this.initialX;
      let newY = this.initialY;

      if (direction.includes('e')) newW = this.initialW + dx;
      if (direction.includes('s')) newH = this.initialH + dy;
      if (direction.includes('w')) {
        newW = this.initialW - dx;
        newX = this.initialX + dx;
      }
      if (direction.includes('n')) {
        newH = this.initialH - dy;
        newY = this.initialY + dy;
      }

      if (newW < this.minWidth) {
        if (direction.includes('w')) newX = this.initialX + (this.initialW - this.minWidth);
        newW = this.minWidth;
      }
      if (newH < this.minHeight) {
        if (direction.includes('n')) newY = this.initialY + (this.initialH - this.minHeight);
        newH = this.minHeight;
      }

      if (this.board.snapToGrid) {
        newW = Math.round(newW / this.board.gridSize) * this.board.gridSize;
        newH = Math.round(newH / this.board.gridSize) * this.board.gridSize;
        if (direction.includes('w')) newX = Math.round(newX / this.board.gridSize) * this.board.gridSize;
        if (direction.includes('n')) newY = Math.round(newY / this.board.gridSize) * this.board.gridSize;
      }

      this.x = newX;
      this.y = newY;
      this.width = newW;
      this.height = newH;

      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
      this.element.style.width = `${this.width}px`;
      this.element.style.height = `${this.height}px`;

      this.onResize(newW, newH);
    };

    const onMouseUp = () => {
      if (!this.isResizing) return;
      this.isResizing = false;
      this.activeResizeHandle = null;
      this.element.classList.remove('is-resizing');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.board.saveState();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onResize(width, height) {}

  toggleFold() {
    this.isFolded = !this.isFolded;
    this.element.classList.toggle('is-folded', this.isFolded);
    const btnFold = this.element.querySelector('.btn-fold');
    btnFold.title = this.isFolded ? '펼치기' : '접기';
    if (this.isFolded) {
      this.element.style.height = 'auto';
    } else {
      this.element.style.height = `${this.height}px`;
    }
    this.board.saveState();
  }

  togglePin() {
    this.isPinned = !this.isPinned;
    this.element.classList.toggle('is-pinned', this.isPinned);
    const btnPin = this.element.querySelector('.btn-pin');
    btnPin.classList.toggle('active', this.isPinned);
    btnPin.title = this.isPinned ? '고정 해제' : '위치 고정';
    window.soundManager.playPop();
    this.board.saveState();
  }

  setTheme(themeName) {
    this.element.className = this.element.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    this.theme = themeName;
    this.element.classList.add(`theme-${themeName}`);
    window.soundManager.playPop();
    this.board.saveState();
  }

  setZIndex(idx) {
    this.zIndex = idx;
    this.element.style.zIndex = idx;
  }

  destroy() {
    this.element.classList.add('is-closing');
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.board.removeWidget(this);
    }, 180);
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      icon: this.icon,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      zIndex: this.zIndex,
      isPinned: this.isPinned,
      isFolded: this.isFolded,
      theme: this.theme,
      data: this.getData(),
    };
  }

  getData() {
    return this.data;
  }

  render() {}
}

window.WidgetBase = WidgetBase;

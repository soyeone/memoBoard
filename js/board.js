// 메인 메모보드 캔버스 컨트롤러
class MemoBoard {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.widgets = [];
    this.topZIndex = 10;
    this.snapToGrid = true;
    this.gridSize = 20;

    this.widgetClasses = {
      todo: window.TodoWidget,
      calendar: window.CalendarWidget,
      timer: window.TimerWidget,
      photo: window.PhotoWidget,
      note: window.NoteWidget,
      clock: window.ClockWidget,
    };

    this.initCanvasEvents();
  }

  initCanvasEvents() {
    // 스크롤바 자동 숨김 & 스크롤/상호작용 시에만 표시 제어
    let scrollTimer = null;
    let isDraggingScrollbar = false;

    const showScrollbar = (delay = 1000) => {
      this.canvas.classList.add('is-scrolling');
      if (scrollTimer) clearTimeout(scrollTimer);
      if (!isDraggingScrollbar) {
        scrollTimer = setTimeout(() => {
          if (!isDraggingScrollbar) {
            this.canvas.classList.remove('is-scrolling');
          }
        }, delay);
      }
    };

    // 1. 실제 스크롤 및 마우스 휠 동작 시 즉시 활성화
    this.canvas.addEventListener('scroll', () => showScrollbar(1000), { passive: true });
    this.canvas.addEventListener('wheel', () => showScrollbar(1000), { passive: true });

    // 2. 오른쪽/하단 스크롤바 영역에 마우스 접근 시 편리하게 잡을 수 있도록 활성화
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const nearRight = (rect.right - e.clientX) <= 16;
      const nearBottom = (rect.bottom - e.clientY) <= 16;
      if (nearRight || nearBottom) {
        showScrollbar(1200);
      }
    });

    // 3. 스크롤바 클릭/드래그 조작 시 조작 중 사라지지 않도록 보호
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const onRightBar = (rect.right - e.clientX) <= 16;
      const onBottomBar = (rect.bottom - e.clientY) <= 16;
      if (onRightBar || onBottomBar) {
        isDraggingScrollbar = true;
        this.canvas.classList.add('is-scrolling');
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDraggingScrollbar) {
        isDraggingScrollbar = false;
        showScrollbar(800);
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (!isDraggingScrollbar) {
        showScrollbar(400);
      }
    });

    // 외부 이미지 파일을 캔버스에 직접 드롭 시 자동으로 사진 위젯 생성 지원
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        this.canvas.classList.add('drag-target-hover');
      }
    });

    this.canvas.addEventListener('dragleave', () => {
      this.canvas.classList.remove('drag-target-hover');
    });

    this.canvas.addEventListener('drop', (e) => {
      this.canvas.classList.remove('drag-target-hover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const rect = this.canvas.getBoundingClientRect();
            let dropX = e.clientX - rect.left - 120;
            let dropY = e.clientY - rect.top - 60;
            if (this.snapToGrid) {
              dropX = Math.round(dropX / this.gridSize) * this.gridSize;
              dropY = Math.round(dropY / this.gridSize) * this.gridSize;
            }
            this.addWidget('photo', {
              x: Math.max(20, dropX),
              y: Math.max(20, dropY),
              data: { imageUrl: ev.target.result, caption: file.name }
            });
          };
          reader.readAsDataURL(file);
        }
      }
    });

    // 빈 공간 더블클릭 시 빠른 포스트잇 메모 생성
    this.canvas.addEventListener('dblclick', (e) => {
      if (e.target === this.canvas) {
        const rect = this.canvas.getBoundingClientRect();
        let clickX = e.clientX - rect.left;
        let clickY = e.clientY - rect.top;
        if (this.snapToGrid) {
          clickX = Math.round(clickX / this.gridSize) * this.gridSize;
          clickY = Math.round(clickY / this.gridSize) * this.gridSize;
        }
        this.addWidget('note', { x: clickX, y: clickY, title: '새 메모' });
      }
    });
  }

  addWidget(type, options = {}) {
    const WidgetClass = this.widgetClasses[type];
    if (!WidgetClass) {
      console.error(`Unknown widget type: ${type}`);
      return null;
    }

    this.topZIndex += 1;
    const config = Object.assign({
      type,
      zIndex: this.topZIndex,
    }, options);

    // 기본 위치 계산 (옵션에 x, y가 없으면 지그재그로 자연스럽게 배치)
    if (typeof config.x !== 'number') {
      const offset = (this.widgets.length % 5) * 36;
      config.x = 80 + offset;
      config.y = 80 + offset;
    }

    const widget = new WidgetClass(this, config);
    this.widgets.push(widget);
    this.canvas.appendChild(widget.element);

    window.soundManager.playPop();
    this.saveState();
    return widget;
  }

  bringToFront(widget) {
    this.topZIndex += 1;
    widget.setZIndex(this.topZIndex);
  }

  removeWidget(widget) {
    this.widgets = this.widgets.filter(w => w.id !== widget.id);
    this.saveState();
  }

  clearAllWidgets() {
    [...this.widgets].forEach(w => w.destroy());
    this.widgets = [];
    this.saveState();
  }

  // 깔끔한 바둑판 자동 정렬
  arrangeWidgetsGrid() {
    const padding = 30;
    const gap = 24;
    let curX = padding;
    let curY = padding;
    let rowMaxHeight = 0;
    const canvasWidth = this.canvas.clientWidth || 1200;

    this.widgets.forEach(w => {
      if (curX + w.width > canvasWidth - padding && curX > padding) {
        curX = padding;
        curY += rowMaxHeight + gap;
        rowMaxHeight = 0;
      }
      w.x = curX;
      w.y = curY;
      w.element.style.left = `${curX}px`;
      w.element.style.top = `${curY}px`;

      curX += w.width + gap;
      if (w.height > rowMaxHeight) {
        rowMaxHeight = w.height;
      }
    });

    this.saveState();
    window.soundManager.playPop();
  }

  saveState() {
    window.storageManager.saveBoardState(this.widgets);
  }

  loadState() {
    const saved = window.storageManager.loadBoardState();
    if (saved && Array.isArray(saved) && saved.length > 0) {
      saved.forEach(wConfig => {
        const WidgetClass = this.widgetClasses[wConfig.type];
        if (WidgetClass) {
          if (wConfig.zIndex > this.topZIndex) {
            this.topZIndex = wConfig.zIndex;
          }
          const widget = new WidgetClass(this, wConfig);
          this.widgets.push(widget);
          this.canvas.appendChild(widget.element);
        }
      });
    } else {
      // 첫 방문 시 멋진 기본 위젯 세트 자동 생성 (투두, 캘린더, 타이머, 사진, 포스트잇)
      this.loadDefaultLayout();
    }
  }

  loadDefaultLayout() {
    // 1. 캘린더 (좌측 상단 - 레퍼런스의 Översikt 캘린더)
    this.addWidget('calendar', {
      x: 36,
      y: 28,
      width: 320,
      height: 390,
      title: '일정 캘린더',
      theme: 'default',
    });

    // 2. 오늘의 할 일 (중앙 상단 - 레퍼런스의 Uppgifter 태스크)
    this.addWidget('todo', {
      x: 380,
      y: 28,
      width: 330,
      height: 390,
      title: '오늘의 퀘스트',
      theme: 'default',
    });

    // 3. 사진 액자 (우측 상단 - 레퍼런스의 Senaste bilden 사진)
    this.addWidget('photo', {
      x: 734,
      y: 28,
      width: 300,
      height: 390,
      title: '나의 숲속 오솔길',
      theme: 'default',
      data: {
        imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
        caption: '숲속 오솔길 산책 ✨',
        fitMode: 'cover'
      }
    });

    // 4. 포스트잇 메모 (좌측 하단 - 레퍼런스의 Anteckningar 메모)
    this.addWidget('note', {
      x: 36,
      y: 438,
      width: 340,
      height: 240,
      title: '아이디어 메모',
      theme: 'yellow',
      data: {
        content: '• 마켓 광장 플라워 가든 꾸미기 🌸\n• 카페 뒤편에 사과 과수원 만들기 🍎\n• 박물관 앞 분수대 설치 ⛲\n• K.K. 라이브 공연 보러 가기 🎸'
      }
    });

    // 5. 집중 타이머 (중앙 하단)
    this.addWidget('timer', {
      x: 396,
      y: 438,
      width: 310,
      height: 240,
      title: '집중 타이머',
      theme: 'mint',
    });

    // 6. 시계 (우측 하단)
    this.addWidget('clock', {
      x: 734,
      y: 438,
      width: 220,
      height: 120,
      title: '시계',
      theme: 'default',
    });
  }
}

window.MemoBoard = MemoBoard;


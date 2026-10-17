// 포스트잇 메모 위젯 (Pinterest 6종 레퍼런스 디자인 & 클릭 시 랜덤 전환)
class NoteWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'note';
    config.title = config.title || '메모';
    config.icon = (window.WidgetIcons && window.WidgetIcons.note) || '📝';
    config.width = typeof config.width === 'number' ? config.width : 220;
    config.height = typeof config.height === 'number' ? config.height : 220;
    config.minWidth = 160;
    config.minHeight = 150;
    super(board, config);

    // 6가지 레퍼런스 디자인
    // 1: 찢어진 양장지 (Torn Deckle Edge)
    // 2: 바인더 링 타공 가로줄 노트 (Binder Ruled Note)
    // 3: 클래식 세이지 포스트잇 (Classic Sage Post-it)
    // 4: 와이드 크림 메시지 카드 (Wide Cream Card)
    // 5: 다크 올리브 크라프트 티켓 (Dark Olive Double-tape Ticket)
    // 6: 그리드 모눈종이 카드 (Graph Grid Card)
    const ALL_DESIGNS = [1, 2, 3, 4, 5, 6];
    const savedDesign = config.design || (config.data && config.data.design);
    
    // 저장된 디자인이 있으면 유지, 새 생성 시에는 1~6 중 무작위 랜덤 배정
    this.design = savedDesign ? Number(savedDesign) : ALL_DESIGNS[Math.floor(Math.random() * ALL_DESIGNS.length)];

    this.content = typeof this.data.content === 'string' 
      ? this.data.content 
      : '기록하고 싶은 메모를\n자유롭게 적어보세요 🌿';

    this.render();
  }

  getData() {
    return {
      content: this.content,
      design: this.design,
    };
  }

  render() {
    if (!this.bodyElement) return;

    this.applyDesignClass();

    this.bodyElement.innerHTML = `
      <div class="note-paper">
        <!-- 상단 중앙 마스킹 테이프 (디자인 1, 2, 3, 4, 6) -->
        <div class="note-tape note-tape-center" title="클릭: 디자인 랜덤 변경 | 드래그: 이동"></div>

        <!-- 코너 대각선 테이프들 (디자인 5 다크 올리브 티켓용) -->
        <div class="note-tape note-tape-tr" title="클릭: 디자인 랜덤 변경 | 드래그: 이동"></div>
        <div class="note-tape note-tape-bl" title="클릭: 디자인 랜덤 변경 | 드래그: 이동"></div>

        <!-- 디자인 2 바인더 링 타공 구멍 리스트 -->
        <div class="note-binder-holes" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <!-- 상단 드래그 핸들 영역 -->
        <div class="note-paper-top" title="클릭: 디자인 랜덤 변경 | 드래그: 이동"></div>

        <!-- 오른쪽 위 깔끔한 닫기 x 버튼 -->
        <button type="button" class="note-btn-close" title="포스트잇 닫기" aria-label="닫기">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- 메모 텍스트 작성 영역 -->
        <textarea class="note-textarea" placeholder="생각나는 메모를 적어보세요..." spellcheck="false">${this.escapeHtml(this.content)}</textarea>
      </div>
    `;

    this.bindNoteEvents();
  }

  applyDesignClass() {
    if (!this.element) return;
    for (let i = 1; i <= 6; i++) {
      this.element.classList.remove(`note-design-${i}`);
    }
    this.element.classList.add(`note-design-${this.design}`);
  }

  randomizeDesign() {
    const ALL_DESIGNS = [1, 2, 3, 4, 5, 6];
    // 현재 디자인을 제외한 나머지 5개 중 하나를 무작위 선택하여 클릭할 때마다 확실한 변화 보장
    const candidates = ALL_DESIGNS.filter(d => d !== this.design);
    this.design = candidates[Math.floor(Math.random() * candidates.length)];
    
    this.applyDesignClass();

    if (window.soundManager && typeof window.soundManager.playPop === 'function') {
      window.soundManager.playPop();
    }

    this.board.saveState();
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  bindNoteEvents() {
    const textarea = this.bodyElement.querySelector('.note-textarea');
    const tapes = this.bodyElement.querySelectorAll('.note-tape');
    const paperTop = this.bodyElement.querySelector('.note-paper-top');
    const notePaper = this.bodyElement.querySelector('.note-paper');
    const closeBtn = this.bodyElement.querySelector('.note-btn-close');

    // 테이프 및 상단 여백 드래그 이동 & 클릭 시 디자인 랜덤 변경
    const attachClickOrDrag = (el) => {
      if (!el) return;
      el.addEventListener('mousedown', (e) => {
        if (e.target.closest('.note-btn-close')) return;
        let dragDist = 0;
        const startX = e.clientX;
        const startY = e.clientY;
        const startTime = Date.now();

        const onMouseMove = (moveEv) => {
          dragDist = Math.hypot(moveEv.clientX - startX, moveEv.clientY - startY);
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          const elapsed = Date.now() - startTime;
          // 4px 이하 이동 및 350ms 이하 클릭 시 디자인 랜덤 변경!
          if (dragDist < 5 && elapsed < 350) {
            this.randomizeDesign();
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        if (!this.isPinned) {
          this.startDrag(e);
        }
      });
    };

    tapes.forEach(tape => attachClickOrDrag(tape));
    attachClickOrDrag(paperTop);

    // 종이 여백 더블클릭 시에도 즉시 디자인 변경
    if (notePaper) {
      notePaper.addEventListener('dblclick', (e) => {
        if (e.target.closest('.note-textarea') || e.target.closest('.note-btn-close')) return;
        this.randomizeDesign();
      });
    }

    // 오른쪽 위 닫기(x) 버튼
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.destroy();
      });
    }

    // 텍스트 영역 입력 및 선택 이벤트
    if (textarea) {
      textarea.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      textarea.addEventListener('input', (e) => {
        this.content = e.target.value;
        this.board.saveState();
      });
    }
  }
}

window.NoteWidget = NoteWidget;

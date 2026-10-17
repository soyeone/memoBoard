// 포스트잇 메모 위젯 (Pinterest 마스킹 테이프 & 미니멀 페이퍼 디자인)
class NoteWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'note';
    config.title = config.title || '메모';
    config.icon = (window.WidgetIcons && window.WidgetIcons.note) || '📝';
    config.width = typeof config.width === 'number' ? config.width : 220;
    config.height = typeof config.height === 'number' ? config.height : 220;
    config.minWidth = 160;
    config.minHeight = 150;
    if (!config.theme) config.theme = 'default'; // 세이지 그린 기본
    super(board, config);

    this.content = typeof this.data.content === 'string' 
      ? this.data.content 
      : '기록하고 싶은 메모를\n자유롭게 적어보세요 🌿';

    this.render();
  }

  getData() {
    return {
      content: this.content,
    };
  }

  render() {
    if (!this.bodyElement) return;

    this.bodyElement.innerHTML = `
      <div class="note-paper">
        <!-- 상단 마스킹 테이프 스티커 -->
        <div class="note-tape" title="드래그하여 이동"></div>
        <!-- 상단 드래그 핸들 영역 -->
        <div class="note-paper-top" title="드래그하여 이동"></div>
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

  escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  bindNoteEvents() {
    const textarea = this.bodyElement.querySelector('.note-textarea');
    const tape = this.bodyElement.querySelector('.note-tape');
    const paperTop = this.bodyElement.querySelector('.note-paper-top');
    const closeBtn = this.bodyElement.querySelector('.note-btn-close');

    // 상단 마스킹 테이프 및 여백 드래그로 위젯 이동
    const onDragStart = (e) => {
      if (e.target.closest('.note-btn-close')) return;
      if (this.isPinned) return;
      this.startDrag(e);
    };

    if (tape) tape.addEventListener('mousedown', onDragStart);
    if (paperTop) paperTop.addEventListener('mousedown', onDragStart);

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

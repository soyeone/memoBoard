// 포스트잇 메모 위젯 (자유로운 텍스트 작성 및 크기/테마 조절)
class NoteWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'note';
    config.title = config.title || '포스트잇 메모 (Note)';
    config.icon = (window.WidgetIcons && window.WidgetIcons.note) || '📝';
    config.minWidth = 220;
    config.minHeight = 220;
    if (!config.theme) config.theme = 'yellow'; // 기본 노란색 포스트잇 테마
    super(board, config);

    // 내부 데이터 안전 초기화
    this.content = typeof this.data.content === 'string' 
      ? this.data.content 
      : '여기에 자유롭게 메모를 적어보세요!\n\n• 원하는 위치로 드래그\n• 모서리를 잡고 크기 조절\n• 헤더의 색상 버튼으로 포스트잇 색 변경!';

    this.fontSize = this.data.fontSize || 'medium'; // small, medium, large

    this.render();
  }

  getData() {
    return {
      content: this.content,
      fontSize: this.fontSize,
    };
  }

  render() {
    if (!this.bodyElement) return;

    this.bodyElement.innerHTML = `
      <div class="note-container font-${this.fontSize}">
        <div class="note-toolbar">
          <div class="note-font-selector">
            <button type="button" class="note-font-btn ${this.fontSize === 'small' ? 'active' : ''}" data-size="small" title="작은 글씨">A-</button>
            <button type="button" class="note-font-btn ${this.fontSize === 'medium' ? 'active' : ''}" data-size="medium" title="보통 글씨">A</button>
            <button type="button" class="note-font-btn ${this.fontSize === 'large' ? 'active' : ''}" data-size="large" title="큰 글씨">A+</button>
          </div>
          <span class="note-char-count">${this.content.length}자</span>
        </div>
        <textarea class="note-textarea" placeholder="생각나는 아이디어나 메모를 적어보세요..." spellcheck="false">${this.escapeHtml(this.content)}</textarea>
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
    const fontBtns = this.bodyElement.querySelectorAll('.note-font-btn');
    const charCount = this.bodyElement.querySelector('.note-char-count');

    if (textarea) {
      // 텍스트 영역 클릭 시 상위 드래그 이벤트 간섭 방지
      textarea.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });

      textarea.addEventListener('input', (e) => {
        this.content = e.target.value;
        if (charCount) {
          charCount.textContent = `${this.content.length}자`;
        }
        this.board.saveState();
      });
    }

    fontBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fontSize = btn.dataset.size;
        this.board.saveState();
        this.render();
      });
    });
  }
}

window.NoteWidget = NoteWidget;

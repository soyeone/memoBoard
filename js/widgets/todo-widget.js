// Todo List 위젯 (완벽한 체크리스트 및 상태 관리)
class TodoWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'todo';
    config.title = config.title || '할 일 목록 (Todo)';
    config.icon = '✅';
    config.minWidth = 260;
    config.minHeight = 280;
    super(board, config);

    // 내부 데이터 안전 초기화
    const defaultTodos = [
      { id: 't_1', text: '위젯 원하는 위치로 드래그해보기', done: true },
      { id: 't_2', text: '하단 독에서 새 위젯 추가하기', done: false },
      { id: 't_3', text: '모서리 잡고 크기 조절하기', done: false },
    ];

    this.todos = Array.isArray(this.data.todos) ? this.data.todos : defaultTodos;
    this.filter = this.data.filter || 'all'; // all, active, completed

    // 렌더링 시작
    this.render();
  }

  getData() {
    return {
      todos: this.todos,
      filter: this.filter,
    };
  }

  getFilteredTodos() {
    if (this.filter === 'active') return this.todos.filter(t => !t.done);
    if (this.filter === 'completed') return this.todos.filter(t => t.done);
    return this.todos;
  }

  render() {
    if (!this.bodyElement) return;

    const total = this.todos.length;
    const completed = this.todos.filter(t => t.done).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const filtered = this.getFilteredTodos();

    this.bodyElement.innerHTML = `
      <div class="todo-container">
        <!-- 상단 진행률 영역 -->
        <div class="todo-stats">
          <div class="todo-stats-info">
            <span class="todo-count">${completed}/${total} 완료</span>
            <span class="todo-percent">${percent}%</span>
          </div>
          <div class="todo-progress-bar">
            <div class="todo-progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>

        <!-- 새 할 일 입력 폼 -->
        <form class="todo-input-bar">
          <input type="text" class="todo-input" placeholder="새로운 할 일을 입력하세요..." autocomplete="off" />
          <button type="submit" class="todo-add-btn" title="추가">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </form>

        <!-- 필터 탭 -->
        <div class="todo-filters">
          <button type="button" class="todo-filter-btn ${this.filter === 'all' ? 'active' : ''}" data-filter="all">전체 (${total})</button>
          <button type="button" class="todo-filter-btn ${this.filter === 'active' ? 'active' : ''}" data-filter="active">진행 (${total - completed})</button>
          <button type="button" class="todo-filter-btn ${this.filter === 'completed' ? 'active' : ''}" data-filter="completed">완료 (${completed})</button>
        </div>

        <!-- 할 일 목록 -->
        <ul class="todo-list">
          ${filtered.map(todo => `
            <li class="todo-item ${todo.done ? 'is-done' : ''}" data-id="${todo.id}">
              <label class="todo-checkbox-wrapper">
                <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} />
                <span class="todo-checkmark"></span>
              </label>
              <span class="todo-text" title="더블 클릭하여 수정">${this.escapeHtml(todo.text)}</span>
              <button type="button" class="todo-delete-btn" title="삭제">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </li>
          `).join('')}
          ${filtered.length === 0 ? '<li class="todo-empty">할 일이 없습니다 ✨</li>' : ''}
        </ul>
      </div>
    `;

    this.bindTodoEvents();
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  bindTodoEvents() {
    const form = this.bodyElement.querySelector('.todo-input-bar');
    const input = this.bodyElement.querySelector('.todo-input');
    const list = this.bodyElement.querySelector('.todo-list');
    const filterBtns = this.bodyElement.querySelectorAll('.todo-filter-btn');

    // 1. 할 일 추가 이벤트
    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        this.todos.push({
          id: 't_' + Date.now(),
          text: text,
          done: false,
        });

        window.soundManager.playPop();
        input.value = '';
        this.board.saveState();
        this.render();
      });
    }

    // 2. 필터 버튼 이벤트
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.filter = btn.dataset.filter;
        this.board.saveState();
        this.render();
      });
    });

    // 3. 체크박스 완료 토글
    list.addEventListener('change', (e) => {
      if (e.target.classList.contains('todo-checkbox')) {
        const item = e.target.closest('.todo-item');
        if (!item) return;
        const id = item.dataset.id;
        const target = this.todos.find(t => t.id === id);
        if (target) {
          target.done = e.target.checked;
          if (target.done) {
            window.soundManager.playSuccess();
          }
          this.board.saveState();
          this.render();
        }
      }
    });

    // 4. 삭제 버튼 클릭
    list.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.todo-delete-btn');
      if (deleteBtn) {
        e.stopPropagation();
        const item = deleteBtn.closest('.todo-item');
        if (!item) return;
        const id = item.dataset.id;
        this.todos = this.todos.filter(t => t.id !== id);
        this.board.saveState();
        this.render();
      }
    });

    // 5. 더블클릭 텍스트 수정
    list.addEventListener('dblclick', (e) => {
      const textEl = e.target.closest('.todo-text');
      if (!textEl) return;
      const item = textEl.closest('.todo-item');
      if (!item) return;
      const id = item.dataset.id;
      const target = this.todos.find(t => t.id === id);
      if (!target) return;

      textEl.contentEditable = 'true';
      textEl.focus();

      const finishEdit = () => {
        textEl.contentEditable = 'false';
        const newText = textEl.textContent.trim();
        if (newText) {
          target.text = newText;
        } else {
          this.todos = this.todos.filter(t => t.id !== id);
        }
        this.board.saveState();
        this.render();
      };

      textEl.addEventListener('blur', finishEdit, { once: true });
      textEl.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          textEl.blur();
        }
      });
    });
  }
}

window.TodoWidget = TodoWidget;

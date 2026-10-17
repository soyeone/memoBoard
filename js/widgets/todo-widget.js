// Todo List 위젯 (완벽한 체크리스트 및 상태 관리)
class TodoWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'todo';
    config.title = config.title || '할 일 목록 (Todo)';
    config.icon = (window.WidgetIcons && window.WidgetIcons.todo) || '✅';
    config.minWidth = 260;
    config.minHeight = 280;
    super(board, config);

    // Todo 목록 동기화 로직:
    // 1) 공유 스토리지에서 먼저 로드
    // 2) 보드에 이미 존재하는 다른 Todo 위젯의 최신 todos 참조
    // 3) 전달된 config.data.todos 참조
    // 4) 아무것도 없으면 기본 샘플
    let initialTodos = null;
    if (window.storageManager && typeof window.storageManager.loadSharedTodos === 'function') {
      initialTodos = window.storageManager.loadSharedTodos();
    }

    if (!initialTodos && this.board && Array.isArray(this.board.widgets)) {
      const existingTodo = this.board.widgets.find(w => w.type === 'todo' && w !== this && Array.isArray(w.todos));
      if (existingTodo) {
        initialTodos = JSON.parse(JSON.stringify(existingTodo.todos));
      }
    }

    if (!initialTodos && Array.isArray(this.data && this.data.todos)) {
      initialTodos = this.data.todos;
    }

    const defaultTodos = [
      { id: 't_1', text: '위젯 원하는 위치로 드래그해보기', done: true },
      { id: 't_2', text: '보드 우클릭으로 새 위젯 추가하기', done: false },
      { id: 't_3', text: '모서리 잡고 크기 조절하기', done: false },
    ];

    this.todos = initialTodos || defaultTodos;
    this.filter = (this.data && this.data.filter) || 'all';

    if (window.storageManager && typeof window.storageManager.saveSharedTodos === 'function') {
      window.storageManager.saveSharedTodos(this.todos);
    }

    // 렌더링 시작
    this.render();
  }

  // 할 일 목록 변경 시 공유 스토리지 및 보드 상의 모든 Todo 위젯과 실시간 동기화
  updateSharedTodos(newTodos) {
    this.todos = newTodos;
    if (window.storageManager && typeof window.storageManager.saveSharedTodos === 'function') {
      window.storageManager.saveSharedTodos(this.todos);
    }

    // 보드 상의 다른 모든 Todo 인스턴스에 즉각 전파 및 리렌더링
    if (this.board && Array.isArray(this.board.widgets)) {
      this.board.widgets.forEach(w => {
        if (w.type === 'todo' && w !== this) {
          w.todos = this.todos;
          w.render();
        }
      });
    }

    this.board.saveState();
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
        this.updateSharedTodos(this.todos);
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
          this.updateSharedTodos(this.todos);
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
        this.updateSharedTodos(this.todos);
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
        this.updateSharedTodos(this.todos);
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

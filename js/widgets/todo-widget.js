// Todo List 위젯 (완벽한 체크리스트 및 상태 관리)
class TodoWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'todo';
    config.title = config.title || '할 일 목록 (Todo)';
    config.icon = (window.WidgetIcons && window.WidgetIcons.todo) || '✅';
    config.minWidth = 260;
    config.minHeight = 240;
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
    // 전체 보기: 완료되지 않은 항목(진행 중)을 위로, 완료된 항목은 아래로 정렬
    const active = this.todos.filter(t => !t.done);
    const completed = this.todos.filter(t => t.done);
    return [...active, ...completed];
  }

  // 날짜 형식 예쁘게 포맷 (오늘, 내일, D-day 등)
  formatDueDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);

      const targetDate = new Date(parseInt(parts[0], 10), m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return `오늘 (${m}/${d})`;
      if (diffDays === 1) return `내일 (${m}/${d})`;
      if (diffDays === -1) return `어제 (${m}/${d})`;
      if (diffDays < -1) return `${Math.abs(diffDays)}일 지남 (${m}/${d})`;
      if (diffDays > 1 && diffDays <= 7) return `D-${diffDays} (${m}/${d})`;
      return `${m}월 ${d}일`;
    } catch (e) {
      return dateStr;
    }
  }

  isOverdue(dateStr) {
    if (!dateStr) return false;
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return false;
      const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return targetDate < today;
    } catch (e) {
      return false;
    }
  }

  render() {
    if (!this.bodyElement) return;

    const total = this.todos.length;
    const completed = this.todos.filter(t => t.done).length;
    const filtered = this.getFilteredTodos();

    this.bodyElement.innerHTML = `
      <div class="todo-container">
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
              <div class="todo-content-col">
                <span class="todo-text" title="더블 클릭하여 수정">${this.escapeHtml(todo.text)}</span>
                ${todo.dueDate ? `
                  <div class="todo-due-badge ${this.isOverdue(todo.dueDate) && !todo.done ? 'is-overdue' : ''}" title="마감일 수정/삭제">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>${this.formatDueDate(todo.dueDate)}</span>
                  </div>
                ` : ''}
              </div>
              <div class="todo-actions">
                <button type="button" class="todo-due-btn" title="${todo.dueDate ? '마감일 수정/삭제' : '마감일 지정'}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <button type="button" class="todo-delete-btn" title="삭제">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
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

    // 4. 마감일 설정 (+ 버튼 및 날짜 배지 클릭)
    list.addEventListener('click', (e) => {
      const dueBtn = e.target.closest('.todo-due-btn');
      const badgeBtn = e.target.closest('.todo-due-badge');
      if (dueBtn || badgeBtn) {
        e.stopPropagation();
        const item = (dueBtn || badgeBtn).closest('.todo-item');
        if (!item) return;
        this.openDueModal(item.dataset.id);
        return;
      }

      // 5. 삭제 버튼 클릭
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

    // 6. 더블클릭 텍스트 수정
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

  // 마감일(Due date) 지정/수정/삭제 모달 설정창 열기
  openDueModal(todoId) {
    const target = this.todos.find(t => t.id === todoId);
    if (!target) return;

    this.closeDueModal();

    const container = this.bodyElement.querySelector('.todo-container');
    if (!container) return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentVal = target.dueDate || todayStr;

    const modalEl = document.createElement('div');
    modalEl.className = 'todo-due-modal-backdrop';
    modalEl.innerHTML = `
      <div class="todo-due-modal">
        <div class="todo-due-modal-header">
          <span class="todo-due-modal-title">마감일(Due Date) 설정</span>
          <button type="button" class="todo-due-modal-close" title="닫기">&times;</button>
        </div>
        <div class="todo-due-modal-body">
          <div class="todo-due-task-preview">${this.escapeHtml(target.text)}</div>
          <input type="date" class="todo-due-date-input" value="${currentVal}" />
          <div class="todo-due-quick-chips">
            <button type="button" class="due-chip" data-days="0">오늘</button>
            <button type="button" class="due-chip" data-days="1">내일</button>
            <button type="button" class="due-chip" data-days="3">3일 후</button>
            <button type="button" class="due-chip" data-days="7">1주일 후</button>
          </div>
        </div>
        <div class="todo-due-modal-footer">
          ${target.dueDate ? '<button type="button" class="btn-due-delete">날짜 삭제</button>' : ''}
          <button type="button" class="btn-due-save">저장</button>
        </div>
      </div>
    `;

    container.appendChild(modalEl);

    const input = modalEl.querySelector('.todo-due-date-input');
    const closeBtn = modalEl.querySelector('.todo-due-modal-close');
    const saveBtn = modalEl.querySelector('.btn-due-save');
    const deleteBtn = modalEl.querySelector('.btn-due-delete');
    const chips = modalEl.querySelectorAll('.due-chip');

    // 퀵 칩 선택 시 날짜 인풋 즉시 변경
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const days = parseInt(chip.dataset.days, 10);
        const d = new Date();
        d.setDate(d.getDate() + days);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        input.value = ymd;
      });
    });

    // 저장
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (input.value) {
        target.dueDate = input.value;
      } else {
        delete target.dueDate;
      }
      this.closeDueModal();
      this.updateSharedTodos(this.todos);
      window.soundManager.playPop();
    });

    // 기존 마감일 삭제
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        delete target.dueDate;
        this.closeDueModal();
        this.updateSharedTodos(this.todos);
      });
    }

    // 닫기
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeDueModal();
    });

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        this.closeDueModal();
      }
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeDueModal();
        window.removeEventListener('keydown', escHandler);
      }
    };
    window.addEventListener('keydown', escHandler);
  }

  closeDueModal() {
    if (!this.bodyElement) return;
    const existing = this.bodyElement.querySelector('.todo-due-modal-backdrop');
    if (existing) {
      existing.remove();
    }
  }
}

window.TodoWidget = TodoWidget;

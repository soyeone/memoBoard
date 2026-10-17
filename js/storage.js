// 메모보드 데이터 저장소 관리자
class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'desktop_memo_board_state_v3';
    this.SETTINGS_KEY = 'desktop_memo_board_settings_v3';
  }

  loadBoardState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load board state', e);
      return null;
    }
  }

  saveBoardState(widgets) {
    try {
      const serialized = widgets.map(w => w.serialize());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.error('Failed to save board state', e);
    }
  }

  // 캘린더 위젯 간 공통 일정 데이터 로드 (기존 캘린더 데이터 자동 마이그레이션 포함)
  loadSharedCalendarEvents() {
    try {
      const raw = localStorage.getItem('desktop_memo_board_calendar_events_shared');
      if (raw) {
        return JSON.parse(raw);
      }

      // 공유 키에 아직 없다면 기존 보드 상태의 캘린더 위젯에서 일정 데이터 마이그레이션
      const boardState = this.loadBoardState();
      if (Array.isArray(boardState)) {
        for (const w of boardState) {
          if (w.type === 'calendar' && w.data && w.data.events && Object.keys(w.data.events).length > 0) {
            this.saveSharedCalendarEvents(w.data.events);
            return w.data.events;
          }
        }
      }
      return null;
    } catch (e) {
      console.error('Failed to load shared calendar events', e);
      return null;
    }
  }

  // 캘린더 공통 일정 데이터 저장
  saveSharedCalendarEvents(events) {
    try {
      if (events && typeof events === 'object') {
        localStorage.setItem('desktop_memo_board_calendar_events_shared', JSON.stringify(events));
      }
    } catch (e) {
      console.error('Failed to save shared calendar events', e);
    }
  }

  // Todo 위젯 간 공통 할 일 목록 로드 (기존 위젯 데이터 자동 마이그레이션 포함)
  loadSharedTodos() {
    try {
      const raw = localStorage.getItem('desktop_memo_board_todos_shared');
      if (raw) {
        return JSON.parse(raw);
      }

      // 공유 키에 아직 없다면 기존 보드 상태의 Todo 위젯에서 할 일 목록 마이그레이션
      const boardState = this.loadBoardState();
      if (Array.isArray(boardState)) {
        for (const w of boardState) {
          if (w.type === 'todo' && w.data && Array.isArray(w.data.todos) && w.data.todos.length > 0) {
            this.saveSharedTodos(w.data.todos);
            return w.data.todos;
          }
        }
      }
      return null;
    } catch (e) {
      console.error('Failed to load shared todos', e);
      return null;
    }
  }

  // Todo 위젯 공통 할 일 목록 저장
  saveSharedTodos(todos) {
    try {
      if (Array.isArray(todos)) {
        localStorage.setItem('desktop_memo_board_todos_shared', JSON.stringify(todos));
      }
    } catch (e) {
      console.error('Failed to save shared todos', e);
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      if (!raw) {
        return {
          theme: 'dark-glass',
          snapToGrid: true,
          gridSize: 20,
          soundEnabled: true,
          boardBackground: 'dots',
        };
      }
      return JSON.parse(raw);
    } catch (e) {
      return {
        theme: 'dark-glass',
        snapToGrid: true,
        gridSize: 20,
        soundEnabled: true,
        boardBackground: 'dots',
      };
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  exportData(widgets, settings) {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: settings,
      widgets: widgets.map(w => w.serialize()),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && Array.isArray(data.widgets)) {
          callback(null, data);
        } else {
          callback(new Error('올바른 백업 파일 형식이 아닙니다.'));
        }
      } catch (err) {
        callback(err);
      }
    };
    reader.readAsText(file);
  }
}

window.storageManager = new StorageManager();

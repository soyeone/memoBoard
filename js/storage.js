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

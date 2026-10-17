// 앱 초기화 및 전역 설정/창 제어 컨트롤러
class App {
  constructor() {
    this.board = null;
    this.dock = null;
    this.settings = window.storageManager.loadSettings();

    this.init();
  }

  init() {
    const canvas = document.getElementById('board-canvas');
    const dockEl = document.getElementById('dock-launcher');

    this.board = new MemoBoard(canvas);
    this.dock = new DockManager(dockEl, this.board);

    this.applySettings();
    this.board.loadState();
    this.bindWindowControls();
    this.bindSettingsEvents();
    this.startLiveStatus();

    // 환영 토스트 (첫 실행 또는 단축키 안내)
    this.showToast('🍃 메모 아일랜드에 오신 것을 환영합니다!');
  }

  startLiveStatus() {
    const update = () => {
      const now = new Date();
      const m = now.getMonth() + 1;
      const d = now.getDate();
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const dateEl = document.getElementById('topbar-date');
      const timeEl = document.getElementById('topbar-time');

      if (dateEl) dateEl.textContent = `${m}월 ${d}일 (${days[now.getDay()]})`;
      if (timeEl) {
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hh}:${mm}`;
      }
    };
    update();
    setInterval(update, 1000);
  }

  applySettings() {
    document.body.className = 'theme-cottagecore';
    this.board.snapToGrid = typeof this.settings.snapToGrid === 'boolean' ? this.settings.snapToGrid : true;
    this.board.gridSize = this.settings.gridSize || 20;
    window.soundManager.enabled = typeof this.settings.soundEnabled === 'boolean' ? this.settings.soundEnabled : true;

    const snapToggle = document.getElementById('setting-snap-grid');
    const soundToggle = document.getElementById('setting-sound');

    if (snapToggle) snapToggle.checked = this.board.snapToGrid;
    if (soundToggle) soundToggle.checked = window.soundManager.enabled;
  }

  bindWindowControls() {
    const btnMin = document.getElementById('win-btn-minimize');
    const btnMax = document.getElementById('win-btn-maximize');
    const btnClose = document.getElementById('win-btn-close');
    const btnPinTop = document.getElementById('win-btn-pin-top');

    const isElectron = window.electronAPI && window.electronAPI.isElectron;

    if (btnMin) {
      btnMin.addEventListener('click', () => {
        if (isElectron) {
          window.electronAPI.minimize();
        } else {
          this.showToast('웹 브라우저 모드에서는 창 최소화가 제한됩니다.');
        }
      });
    }

    if (btnMax) {
      btnMax.addEventListener('click', () => {
        if (isElectron) {
          window.electronAPI.maximize();
        } else {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (isElectron) {
          window.electronAPI.close();
        } else {
          window.close();
        }
      });
    }

    if (btnPinTop) {
      btnPinTop.addEventListener('click', async () => {
        if (isElectron) {
          const newState = await window.electronAPI.toggleAlwaysOnTop();
          btnPinTop.classList.toggle('active', newState);
          this.showToast(newState ? '항상 위에 고정되었습니다.' : '항상 위 고정이 해제되었습니다.');
        } else {
          btnPinTop.classList.toggle('active');
          this.showToast('웹 브라우저에서는 윈도우 "항상 위" 기능이 시뮬레이션됩니다.');
        }
      });
    }
  }

  bindSettingsEvents() {
    const modal = document.getElementById('settings-modal');
    const btnCloseModal = document.getElementById('btn-close-settings');
    const themeSelect = document.getElementById('setting-theme');
    const bgSelect = document.getElementById('setting-bg');
    const snapToggle = document.getElementById('setting-snap-grid');
    const soundToggle = document.getElementById('setting-sound');
    const btnExport = document.getElementById('btn-export-data');
    const btnImport = document.getElementById('btn-import-data');
    const importInput = document.getElementById('input-import-file');
    const btnResetDefaults = document.getElementById('btn-reset-defaults');

    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        this.toggleSettingsModal(false);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.toggleSettingsModal(false);
      }
    });

    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.settings.theme = e.target.value;
        this.saveSettings();
      });
    }

    if (bgSelect) {
      bgSelect.addEventListener('change', (e) => {
        this.settings.boardBackground = e.target.value;
        this.saveSettings();
      });
    }

    if (snapToggle) {
      snapToggle.addEventListener('change', (e) => {
        this.settings.snapToGrid = e.target.checked;
        this.saveSettings();
      });
    }

    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        this.settings.soundEnabled = e.target.checked;
        this.saveSettings();
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        window.storageManager.exportData(this.board.widgets, this.settings);
        this.showToast('보드 백업 파일(.json)이 다운로드되었습니다.');
      });
    }

    if (btnImport && importInput) {
      btnImport.addEventListener('click', () => {
        importInput.click();
      });

      importInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          window.storageManager.importData(e.target.files[0], (err, data) => {
            if (err) {
              alert('불러오기 실패: ' + err.message);
              return;
            }
            if (data.settings) {
              this.settings = Object.assign(this.settings, data.settings);
              this.saveSettings();
            }
            this.board.clearAllWidgets();
            data.widgets.forEach(wConfig => {
              const WidgetClass = this.board.widgetClasses[wConfig.type];
              if (WidgetClass) {
                const widget = new WidgetClass(this.board, wConfig);
                this.board.widgets.push(widget);
                this.board.canvas.appendChild(widget.element);
              }
            });
            this.board.saveState();
            this.toggleSettingsModal(false);
            this.showToast('백업 데이터를 성공적으로 복원했습니다.');
          });
        }
      });
    }

    if (btnResetDefaults) {
      btnResetDefaults.addEventListener('click', () => {
        if (confirm('모든 위젯을 초기화하고 기본 배치로 되돌리시겠습니까?')) {
          this.board.clearAllWidgets();
          this.board.loadDefaultLayout();
          this.toggleSettingsModal(false);
          this.showToast('기본 레이아웃으로 초기화되었습니다.');
        }
      });
    }
  }

  toggleSettingsModal(show) {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    const isVisible = modal.classList.contains('active');
    const targetState = typeof show === 'boolean' ? show : !isVisible;
    modal.classList.toggle('active', targetState);
  }

  saveSettings() {
    window.storageManager.saveSettings(this.settings);
    this.applySettings();
  }

  showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let saveStateTimer = null;

// 창 크기 및 위치 영구 저장 파일 경로
function getWindowStateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

// 저장된 창 크기/위치 불러오기
function loadWindowState() {
  try {
    const filePath = getWindowStateFile();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
  } catch (err) {
    console.error('Failed to load window state:', err);
  }
  return null;
}

// 화면 영역 내에 위치하는지 검증 (디스플레이 분리/해상도 변경 대응)
function isBoundsWithinDisplay(bounds) {
  if (!bounds) return false;
  try {
    const displays = screen.getAllDisplays();
    return displays.some(display => {
      const area = display.workArea;
      return (
        bounds.x + 100 >= area.x &&
        bounds.x <= area.x + area.width - 100 &&
        bounds.y + 100 >= area.y &&
        bounds.y <= area.y + area.height - 100
      );
    });
  } catch (e) {
    return true;
  }
}

// 현재 창 크기/위치 저장
function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  try {
    const isMax = win.isMaximized();
    let bounds;
    if (isMax && typeof win.getNormalBounds === 'function') {
      bounds = win.getNormalBounds();
    } else {
      bounds = win.getBounds();
    }

    const state = {
      x: bounds.x,
      y: bounds.y,
      width: Math.max(800, bounds.width),
      height: Math.max(560, bounds.height),
      isMaximized: isMax,
    };

    fs.writeFileSync(getWindowStateFile(), JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save window state:', err);
  }
}

function triggerSaveWindowState() {
  if (saveStateTimer) clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(() => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  }, 350);
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  const defaultWidth = Math.min(1360, screenW);
  const defaultHeight = Math.min(860, screenH);
  const savedState = loadWindowState();

  const winOptions = {
    minWidth: 800,
    minHeight: 560,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
    title: '메모보드',
    icon: path.join(__dirname, 'assets', 'app-icon.png'),
  };

  if (savedState && isBoundsWithinDisplay(savedState)) {
    winOptions.width = Math.max(800, savedState.width || defaultWidth);
    winOptions.height = Math.max(560, savedState.height || defaultHeight);
    if (typeof savedState.x === 'number') winOptions.x = savedState.x;
    if (typeof savedState.y === 'number') winOptions.y = savedState.y;
  } else {
    winOptions.width = defaultWidth;
    winOptions.height = defaultHeight;
  }

  mainWindow = new BrowserWindow(winOptions);

  if (savedState && savedState.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.loadFile('index.html');

  // 창 크기 변경 및 이동 시 디바운스 저장
  mainWindow.on('resize', triggerSaveWindowState);
  mainWindow.on('move', triggerSaveWindowState);

  // 창 닫히기 전 즉시 상태 최종 저장
  mainWindow.on('close', () => {
    if (saveStateTimer) clearTimeout(saveStateTimer);
    saveWindowState(mainWindow);
  });

  // IPC 핸들러 등록
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      triggerSaveWindowState();
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('toggle-always-on-top', (event, flag) => {
    if (mainWindow) {
      const isTop = typeof flag === 'boolean' ? flag : !mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(isTop, 'screen-saver');
      return isTop;
    }
    return false;
  });

  ipcMain.handle('is-always-on-top', () => {
    return mainWindow ? mainWindow.isAlwaysOnTop() : false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

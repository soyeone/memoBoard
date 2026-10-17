// 사진 액자 위젯
class PhotoWidget extends WidgetBase {
  constructor(board, config = {}) {
    config.type = 'photo';
    config.title = config.title || '사진 액자 (Photo)';
    config.icon = (window.WidgetIcons && window.WidgetIcons.photo) || '🖼️';
    config.minWidth = 160;
    config.minHeight = 160;
    super(board, config);

    this.imageUrl = this.data.imageUrl || '';
    this.fitMode = this.data.fitMode || 'cover'; // 'cover' or 'contain'
    this.caption = this.data.caption || '';
    this.showCaption = Boolean(this.data.showCaption ?? (this.caption && this.caption.trim().length > 0));

    this.render();
    this.bindPhotoDrag();
  }

  getData() {
    return {
      imageUrl: this.imageUrl,
      fitMode: this.fitMode,
      caption: this.caption,
      showCaption: this.showCaption,
    };
  }

  render() {
    if (!this.bodyElement) return;

    if (!this.imageUrl) {
      this.bodyElement.innerHTML = `
        <div class="photo-dropzone">
          <input type="file" class="photo-file-input" accept="image/*" style="display:none;" />
          <div class="dropzone-content">
            <div class="dropzone-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <p class="dropzone-text">이미지를 여기로 드래그하거나<br/>클릭하여 파일을 선택하세요</p>
            <span class="dropzone-hint">💡 클립보드 이미지 붙여넣기 (Ctrl+V) 가능</span>
          </div>
        </div>
      `;
    } else {
      this.bodyElement.innerHTML = `
        <div class="photo-container fit-${this.fitMode} ${this.showCaption ? 'has-caption' : 'no-caption'}">
          <div class="photo-image-wrapper">
            <img class="photo-img" src="${this.imageUrl}" alt="메모보드 사진" />
            <div class="photo-overlay-tools">
              <button class="photo-tool-btn btn-caption ${this.showCaption ? 'is-active' : ''}" title="${this.showCaption ? '캡션 숨기기/삭제' : '캡션/메모 추가 (+)'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button class="photo-tool-btn btn-fit" title="화면 맞춤 방식 전환 (${this.fitMode})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              </button>
              <button class="photo-tool-btn btn-replace" title="사진 교체">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </button>
              <button class="photo-tool-btn btn-remove" title="사진 지우기">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <input type="file" class="photo-file-input-replace" accept="image/*" style="display:none;" />
            </div>
          </div>
          ${this.showCaption ? `
            <div class="photo-caption-bar">
              <input type="text" class="photo-caption-input" placeholder="메모나 캡션을 적어보세요..." value="${this.escapeHtml(this.caption)}" />
            </div>
          ` : ''}
        </div>
      `;
    }

    this.bindPhotoEvents();
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  bindPhotoEvents() {
    const dropzone = this.bodyElement.querySelector('.photo-dropzone');
    const fileInput = this.bodyElement.querySelector('.photo-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.loadFile(e.target.files[0]);
        }
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('is-dragover');
      });

      dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('is-dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('is-dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.loadFile(e.dataTransfer.files[0]);
        }
      });
    }

    // 사진 뷰 모드일 때
    const btnCaption = this.bodyElement.querySelector('.btn-caption');
    const btnFit = this.bodyElement.querySelector('.btn-fit');
    const btnReplace = this.bodyElement.querySelector('.btn-replace');
    const btnRemove = this.bodyElement.querySelector('.btn-remove');
    const replaceInput = this.bodyElement.querySelector('.photo-file-input-replace');
    const captionInput = this.bodyElement.querySelector('.photo-caption-input');

    if (btnCaption) {
      btnCaption.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showCaption = !this.showCaption;
        if (!this.showCaption) {
          this.caption = '';
        }
        this.board.saveState();
        this.render();
        if (this.showCaption) {
          const capInput = this.bodyElement.querySelector('.photo-caption-input');
          if (capInput) {
            capInput.focus();
          }
        }
      });
    }

    if (btnFit) {
      btnFit.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fitMode = this.fitMode === 'cover' ? 'contain' : 'cover';
        this.board.saveState();
        this.render();
      });
    }

    if (btnReplace && replaceInput) {
      btnReplace.addEventListener('click', (e) => {
        e.stopPropagation();
        replaceInput.click();
      });

      replaceInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.loadFile(e.target.files[0]);
        }
      });
    }

    if (btnRemove) {
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        this.imageUrl = '';
        this.caption = '';
        this.showCaption = false;
        this.board.saveState();
        this.render();
      });
    }

    if (captionInput) {
      captionInput.addEventListener('input', (e) => {
        this.caption = e.target.value;
        this.board.saveState();
      });
      captionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          captionInput.blur();
        }
      });
    }

    // Ctrl+V 클립보드 붙여넣기 지원
    this.element.tabIndex = 0;
    this.element.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const blob = item.getAsFile();
          this.loadFile(blob);
          e.preventDefault();
          break;
        }
      }
    });
  }

  loadFile(file) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      this.imageUrl = ev.target.result;
      window.soundManager.playPop();
      this.board.saveState();
      this.render();
    };
    reader.readAsDataURL(file);
  }

  bindPhotoDrag() {
    if (this.bodyElement) {
      this.bodyElement.addEventListener('mousedown', (e) => {
        if (e.target.closest('.widget-btn') || 
            e.target.closest('.photo-tool-btn') || 
            e.target.closest('.photo-caption-input') || 
            e.target.closest('.photo-dropzone') ||
            e.target.closest('.resize-handle')) {
          return;
        }
        if (!this.isPinned) {
          this.startDrag(e);
        }
      });
    }
  }
}

window.PhotoWidget = PhotoWidget;

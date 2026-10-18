/* Read-only PDF canvas preview. Generated document bytes stay on this device. */
(function (root) {
  let library;
  async function loadPdfJs() {
    if (!library) library = import('./vendor/pdfjs/pdf.mjs').then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('vendor/pdfjs/pdf.worker.mjs', document.baseURI).href;
      return pdfjs;
    }).catch(error => { library = null; throw error; });
    return library;
  }

  class LessonPdfPreview {
    constructor({viewport, canvas, message, onPageChange = () => {}, pdfjsLoader = loadPdfJs}) {
      Object.assign(this, {viewport, canvas, message, onPageChange, pdfjsLoader});
      this.serial = 0; this.renderSerial = 0; this.page = 0; this.total = 0;
      this.fit = 'width'; this.zoom = 1;
      if (typeof ResizeObserver !== 'undefined') {
        this.observer = new ResizeObserver(() => {
          clearTimeout(this.resizeTimer);
          this.resizeTimer = setTimeout(() => { if (this.pdf) this.render(); }, 120);
        });
        this.observer.observe(viewport);
      }
    }
    status(text) {
      this.message.textContent = text;
      this.message.hidden = !text;
    }
    clear(text = 'Choose a saved lesson to view its PDF.') {
      this.serial++; this.renderSerial++;
      this.renderTask?.cancel(); this.renderTask = null;
      const resource = this.loadingTask;
      this.pdf = null; this.loadingTask = null;
      Promise.resolve(resource?.destroy?.()).catch(() => {});
      this.page = 0; this.total = 0;
      this.canvas.hidden = true; this.canvas.width = this.canvas.height = 1;
      this.viewport.setAttribute('aria-busy', 'false');
      this.status(text); this.onPageChange({page:0,total:0,busy:false});
      return this.serial;
    }
    async load(bytes) {
      const serial = this.clear('Preparing lesson-plan PDF…');
      try {
        const pdfjs = await this.pdfjsLoader();
        if (serial !== this.serial) return false;
        this.loadingTask = pdfjs.getDocument({
          data: bytes.slice(), isEvalSupported: false, useWasm: false,
          standardFontDataUrl: new URL('vendor/pdfjs/standard_fonts/', document.baseURI).href
        });
        const pdf = await this.loadingTask.promise;
        if (serial !== this.serial) return false;
        this.pdf = pdf;
        this.page = 1; this.total = pdf.numPages;
        await this.render();
        return serial === this.serial;
      } catch (error) {
        if (serial === this.serial) {
          this.clear('PDF preview unavailable. Use View PDF or Preview PDF to open this lesson.');
        }
        return false;
      }
    }
    async render() {
      if (!this.pdf || !this.page) return;
      const pdf = this.pdf, pageNumber = this.page, serial = this.serial, renderSerial = ++this.renderSerial;
      this.renderTask?.cancel();
      this.viewport.setAttribute('aria-busy', 'true');
      this.onPageChange({page:pageNumber,total:this.total,busy:true});
      try {
        const page = await pdf.getPage(pageNumber);
        if (serial !== this.serial || renderSerial !== this.renderSerial) return;
        const original = page.getViewport({scale:1});
        const width = Math.max(100, this.viewport.clientWidth - 24);
        const height = Math.max(100, this.viewport.clientHeight - 24);
        const scale = (this.fit === 'page' ? Math.min(width / original.width, height / original.height) : width / original.width) * this.zoom;
        const view = page.getViewport({scale});
        const density = Math.min(root.devicePixelRatio || 1, 2, Math.sqrt(8000000 / (view.width * view.height)));
        // Render into a fresh canvas, then swap it in only if still selected.
        // Rapid row/page changes cannot paint an old PDF over the new selection.
        const canvas = this.canvas.ownerDocument.createElement('canvas');
        canvas.id = this.canvas.id;
        canvas.setAttribute('role','img');
        canvas.setAttribute('aria-label',`Lesson-plan page ${pageNumber} of ${this.total}`);
        canvas.width = Math.ceil(view.width * density); canvas.height = Math.ceil(view.height * density);
        canvas.style.width = `${Math.round(view.width)}px`; canvas.style.height = `${Math.round(view.height)}px`;
        const task = page.render({canvasContext:canvas.getContext('2d', {alpha:false}),viewport:view,
          transform:density === 1 ? null : [density,0,0,density,0,0]});
        this.renderTask = task;
        await task.promise;
        if (serial !== this.serial || renderSerial !== this.renderSerial) return;
        const previous = this.canvas;
        previous.replaceWith(canvas); this.canvas = canvas; this.renderTask = null;
        previous.width = previous.height = 1;
        this.status('');
        this.viewport.setAttribute('aria-busy','false');
        this.onPageChange({page:pageNumber,total:this.total,busy:false});
      } catch (error) {
        if (serial === this.serial && renderSerial === this.renderSerial) {
          this.viewport.setAttribute('aria-busy','false');
          this.status('This page could not be displayed. Use View PDF or Preview PDF.');
          this.onPageChange({page:pageNumber,total:this.total,busy:false});
        }
      }
    }
    goTo(page) {
      if (!this.pdf) return;
      this.page = Math.max(1,Math.min(this.total,page));
      this.viewport.scrollTop = this.viewport.scrollLeft = 0;
      return this.render();
    }
    setView({fit = this.fit, zoom = this.zoom} = {}) {
      this.fit = fit === 'page' ? 'page' : 'width';
      this.zoom = Math.max(.5,Math.min(2,zoom));
      return this.render();
    }
  }
  root.TeachTodayLessonPdfPreview = LessonPdfPreview;
  if (typeof module !== 'undefined' && module.exports) module.exports = LessonPdfPreview;
})(typeof window !== 'undefined' ? window : globalThis);

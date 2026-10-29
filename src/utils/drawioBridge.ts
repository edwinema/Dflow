import { FLOW_SHAPES, BASIC_SHAPES, EVC_SHAPES, SWIMLANE_SHAPES } from './flowSchema';

export interface CanvasStats {
  zoom: number;
  vertexCount: number;
  edgeCount: number;
  totalCount: number;
  selectedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  connectMode: boolean;
  pointerTool: 'select' | 'pan';
  hasFormatBrush: boolean;
  gridVisible: boolean;
}

export interface DrawioBridgeHandlers {
  onInit?: () => void;
  onReady?: () => void;
  onLoaded?: () => void;
  onSelection?: (cells: any[]) => void;
  onOpenProps?: (cell: any | null) => void;
  onInserted?: (cell: any) => void;
  onBadgeClick?: (payload: { badge: string; kind: string; cell: any }) => void;
  onAutosave?: (xml: string) => void;
  onExport?: (payload: { format: string; data: string; xml: string }) => void;
  onOpenAiModal?: () => void;
  onStats?: (stats: CanvasStats) => void;
  onCells?: (cells: any[]) => void;
}

export class DrawioBridge {
  private iframe: HTMLIFrameElement | null = null;
  private handlers: DrawioBridgeHandlers;
  private isInitialized = false;
  private retryTimer: number | null = null;
  private retryCount = 0;
  private messageListener: (ev: MessageEvent) => void;

  constructor(handlers: DrawioBridgeHandlers) {
    this.handlers = handlers;
    this.messageListener = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageListener);
  }

  public attachIframe(iframe: HTMLIFrameElement | null) {
    this.iframe = iframe;
    this.startSelfHealingHandshake();
  }

  public attach(iframe: HTMLIFrameElement | null) {
    this.attachIframe(iframe);
  }

  public detach() {
    this.destroy();
  }

  private startSelfHealingHandshake() {
    if (this.retryTimer) window.clearInterval(this.retryTimer);
    this.retryCount = 0;
    this.retryTimer = window.setInterval(() => {
      if (this.isInitialized || this.retryCount >= 25) {
        if (this.retryTimer) window.clearInterval(this.retryTimer);
        return;
      }
      this.retryCount++;
      this.sendConfigure();
    }, 400);
  }

  private sendConfigure() {
    this.post({
      action: 'configure',
      config: {
        defaultFonts: ['Plus Jakarta Sans', 'PingFang SC', 'Microsoft YaHei'],
        aiEnabled: true,
        version: '32.1.0',
      },
    });
  }

  public post(payload: Record<string, any>) {
    if (!this.iframe || !this.iframe.contentWindow) return;
    this.iframe.contentWindow.postMessage(JSON.stringify(payload), '*');
  }

  private handleMessage(ev: MessageEvent) {
    if (this.iframe && ev.source !== this.iframe.contentWindow) return;
    let msg = ev.data;
    if (typeof msg === 'string') {
      try {
        msg = JSON.parse(msg);
      } catch {
        return;
      }
    }
    if (!msg || typeof msg !== 'object') return;

    switch (msg.event) {
      case 'init':
      case 'configure':
        this.isInitialized = true;
        if (this.retryTimer) window.clearInterval(this.retryTimer);
        this.sendConfigure();
        this.post({
          action: 'dflow:shapes',
          shapes: [...FLOW_SHAPES, ...BASIC_SHAPES, ...EVC_SHAPES, ...SWIMLANE_SHAPES],
        });
        this.handlers.onInit?.();
        break;
      case 'dflow:ready':
        this.isInitialized = true;
        if (this.retryTimer) window.clearInterval(this.retryTimer);
        this.post({
          action: 'dflow:shapes',
          shapes: [...FLOW_SHAPES, ...BASIC_SHAPES, ...EVC_SHAPES, ...SWIMLANE_SHAPES],
        });
        this.handlers.onReady?.();
        break;
      case 'load':
        this.fit({ border: 56, maxScale: 1.15 });
        this.handlers.onLoaded?.();
        break;
      case 'dflow:selection':
        this.handlers.onSelection?.(msg.cells || []);
        break;
      case 'dflow:openProps':
        this.handlers.onOpenProps?.(msg.cell || null);
        break;
      case 'dflow:inserted':
        this.handlers.onInserted?.(msg.cell);
        break;
      case 'dflow:badge':
        this.handlers.onBadgeClick?.({ badge: msg.badge, kind: msg.kind, cell: msg.cell });
        break;
      case 'dflow:cells':
        this.handlers.onCells?.(msg.cells || []);
        break;
      case 'dflow:stats':
        this.handlers.onStats?.({
          zoom: msg.zoom ?? 100,
          vertexCount: msg.vertexCount ?? 0,
          edgeCount: msg.edgeCount ?? 0,
          totalCount: msg.totalCount ?? 0,
          selectedCount: msg.selectedCount ?? 0,
          canUndo: !!msg.canUndo,
          canRedo: !!msg.canRedo,
          connectMode: !!msg.connectMode,
          pointerTool: msg.pointerTool === 'pan' ? 'pan' : 'select',
          hasFormatBrush: !!msg.hasFormatBrush,
          gridVisible: msg.gridVisible !== false,
        });
        break;
      case 'autosave':
      case 'save':
        if (msg.xml) this.handlers.onAutosave?.(msg.xml);
        break;
      case 'export':
        this.handlers.onExport?.({
          format: msg.format || 'xml',
          data: msg.data || '',
          xml: msg.xml || msg.data || '',
        });
        break;
      case 'dflow:openAiModal':
        this.handlers.onOpenAiModal?.();
        break;
    }
  }

  public loadXml(xml: string, title = '流程图') {
    this.post({ action: 'load', xml, title });
  }

  public mergeXml(xml: string) {
    this.post({ action: 'merge', xml });
  }

  public exportDiagram(format: 'xml' | 'png' | 'svg' = 'xml') {
    this.post({ action: 'export', format });
  }

  public insertNode(
    shape: { type: string; label: string; style: string; w: number; h: number },
    coords?: { clientX: number; clientY: number }
  ) {
    this.post({
      action: 'dflow:insert',
      ...shape,
      ...(coords ? { clientX: coords.clientX, clientY: coords.clientY } : {}),
    });
  }

  public setCellAttrs(id: string, attrs: Record<string, any>) {
    this.post({ action: 'dflow:setAttrs', id, attrs });
  }

  public requestCells() {
    this.post({ action: 'dflow:getCells' });
  }

  public highlightCell(id: string) {
    this.post({ action: 'dflow:highlight', id });
  }

  public updateStyle(stylePatch: Record<string, any>, id?: string) {
    this.post({ action: 'dflow:updateStyle', id, stylePatch });
  }

  public invokeAction(actionName: string, extra?: Record<string, any>) {
    this.post({ action: 'invokeAction', actionName, ...(extra || {}) });
  }

  public fit(opts: { border?: number; maxScale?: number } = {}) {
    this.post({ action: 'dflow:fit', border: opts.border ?? 56, maxScale: opts.maxScale ?? 1.15 });
  }

  public zoomIn() {
    this.invokeAction('zoomIn');
  }

  public zoomOut() {
    this.invokeAction('zoomOut');
  }

  public setZoom(zoomPercent: number) {
    this.invokeAction('setZoom', { zoom: zoomPercent });
  }

  public destroy() {
    if (this.retryTimer) window.clearInterval(this.retryTimer);
    window.removeEventListener('message', this.messageListener);
  }
}

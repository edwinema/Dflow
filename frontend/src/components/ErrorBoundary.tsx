import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-[#fef0f0] border border-[#fde2e2] rounded-lg m-4 text-[#f56c6c] space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="w-5 h-5 text-[#f56c6c]" />
            <span>{this.props.fallbackTitle || '组件加载异常'}</span>
          </div>
          <p className="text-xs text-[#909399]">
            {this.state.error?.message || '发生未知错误，点击重试按钮可恢复操作'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#f56c6c] text-white text-xs font-medium hover:bg-[#e65d5d] cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重试并恢复</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

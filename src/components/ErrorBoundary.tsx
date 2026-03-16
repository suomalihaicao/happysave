'use client';

import React from 'react';
import { Button, Result } from 'antd';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Sentry 会自动捕获这个错误（如果已配置）
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Result
            status="error"
            title="出了点问题"
            subTitle="请刷新页面重试，如果问题持续请联系客服。"
            extra={[
              <Button key="reload" type="primary" onClick={() => window.location.reload()}>
                刷新页面
              </Button>,
              <Button key="home" onClick={() => window.location.href = '/'}>
                返回首页
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

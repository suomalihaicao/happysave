// Ant Design Provider for Next.js App Router
'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

const theme = {
  token: {
    colorPrimary: '#ff6b35',
    borderRadius: 8,
    fontSize: 14,
    colorLink: '#ff6b35',
    colorLinkHover: '#ff8555',
    colorLinkActive: '#e55a28',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Table: {
      borderRadius: 8,
    },
    Tag: {
      borderRadius: 6,
    },
  },
};

interface AntdProviderProps {
  children: React.ReactNode;
  locale?: 'zh' | 'en';
}

export function AntdProvider({ children, locale = 'zh' }: AntdProviderProps) {
  return (
    <ConfigProvider
      theme={theme}
      locale={locale === 'zh' ? zhCN : enUS}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}

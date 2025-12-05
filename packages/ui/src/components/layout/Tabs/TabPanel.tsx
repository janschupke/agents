import React from 'react';

export interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export default function TabPanel({ id, activeTab, children }: TabPanelProps) {
  if (id !== activeTab) {
    return null;
  }

  return <div>{children}</div>;
}

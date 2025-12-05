import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  children,
}: TabsProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-text-tertiary border-transparent hover:text-text-secondary hover:border-border'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

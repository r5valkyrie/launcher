import React, { useRef, useEffect } from 'react';
import { animations } from '../common/animations';

export type ActiveTab = 'general' | 'mods' | 'launch' | 'settings';

type TabNavProps = {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
};

export default function TabNav({ activeTab, onChange }: TabNavProps) {
  const tabNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabNavRef.current) {
      animations.slideInRight(tabNavRef.current, 200);
    }
  }, []);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'general',
      label: 'Home',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
    },
    {
      id: 'mods',
      label: 'Mods',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
    },
    {
      id: 'launch',
      label: 'Launch Options',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-6 mt-4 mb-8 flex justify-center">
      <nav 
        ref={tabNavRef} 
        className="bg-base-300/30 backdrop-blur-md rounded-2xl p-1.5 border border-white/5 shadow-lg" 
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-1">
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.id}>
              {index > 0 && (
                <div className="w-px h-5 bg-white/10" />
              )}
              <button
                className={`
                  relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
                  transition-all duration-200 ease-out
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/25'
                    : 'text-base-content/60 hover:text-base-content hover:bg-white/5'
                  }
                `}
                onClick={() => onChange(tab.id)}
              >
                <span className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </nav>
    </div>
  );
}

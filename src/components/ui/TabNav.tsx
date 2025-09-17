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

  const handleTabClick = (tab: ActiveTab) => {
    onChange(tab);
  };

  return (
    <div className="mx-6 mt-4 mb-8 flex justify-center">
      <nav ref={tabNavRef} className="glass-soft rounded-[2.3vw] p-2 backdrop-blur-sm min-w-fit" style={{ opacity: 0 }}>
        <div className="flex items-center">
          <button
            className={`nav-tab ${activeTab === 'general' ? 'nav-tab-active' : ''}`}
            onClick={() => handleTabClick('general')}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            <span className="whitespace-nowrap">Home</span>
          </button>
          <div className="nav-separator"></div>
          <button
            className={`nav-tab ${activeTab === 'mods' ? 'nav-tab-active' : ''}`}
            onClick={() => handleTabClick('mods')}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15.5c-.621 0-1-.504-1-1.125V12"/>
              <path d="M3 8.5c.621 0 1 .504 1 1.125V12"/>
            </svg>
            <span className="whitespace-nowrap">Mods</span>
          </button>
          <div className="nav-separator"></div>
          <button
            className={`nav-tab ${activeTab === 'launch' ? 'nav-tab-active' : ''}`}
            onClick={() => handleTabClick('launch')}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
            <span className="whitespace-nowrap">Launch Options</span>
          </button>
          <div className="nav-separator"></div>
          <button
            className={`nav-tab ${activeTab === 'settings' ? 'nav-tab-active' : ''}`}
            onClick={() => handleTabClick('settings')}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span className="whitespace-nowrap">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}



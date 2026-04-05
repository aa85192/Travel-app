import React from 'react';
import { Home, ClipboardList, Map as MapIcon, Wallet, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: '首頁' },
    { id: 'itinerary', icon: ClipboardList, label: '行程' },
    { id: 'map', icon: MapIcon, label: '地圖' },
    { id: 'budget', icon: Wallet, label: '預算' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-milk-tea-200 px-4 py-2 flex justify-between items-center z-50 pb-safe">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center space-y-1 transition-colors ${
            activeTab === tab.id ? 'text-milk-tea-500' : 'text-milk-tea-300'
          }`}
        >
          <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-milk-tea-500/10' : ''}`} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

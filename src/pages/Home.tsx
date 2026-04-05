import React from 'react';
import { Search, Bell, MapPin, Download, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { Trip } from '../types';
import { useUIStore } from '../stores/uiStore';

interface HomeProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
}

export const Home: React.FC<HomeProps> = ({ trip, onUpdateTrip }) => {
  const { addToast } = useUIStore();

  const handleExport = () => {
    const dataStr = JSON.stringify(trip, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `milktea_trip_${trip.id}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    addToast('行程已匯出', 'success');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTrip = JSON.parse(e.target?.result as string);
        onUpdateTrip(importedTrip);
        addToast('行程匯入成功！', 'success');
      } catch (err) {
        addToast('匯入失敗，請檢查檔案格式。', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">MilkTea Travel</h1>
          <p className="text-milk-tea-500 text-sm font-medium">簡約可愛的旅遊分帳工具 🧋</p>
        </div>
        <div className="flex space-x-2">
          <label className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-milk-tea-100 cursor-pointer">
            <Upload className="w-5 h-5 text-milk-tea-600" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-milk-tea-100"
          >
            <Download className="w-5 h-5 text-milk-tea-600" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 mt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-milk-tea-400" />
          <input 
            type="text" 
            placeholder="搜尋目的地或行程模板..."
            className="w-full bg-white border border-milk-tea-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-milk-tea-300 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Upcoming Trip */}
      <section className="mt-8">
        <div className="px-6 flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold">即將出發</h2>
          <button className="text-xs font-bold text-milk-tea-500">查看全部</button>
        </div>
        
        <div className="px-6">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="relative h-48 rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
          >
            <img 
              src={trip.coverImage} 
              alt={trip.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center text-[10px] font-bold bg-white/20 backdrop-blur-md w-fit px-2 py-0.5 rounded-full mb-2">
                <MapPin className="w-3 h-3 mr-1" />
                {trip.destination}
              </div>
              <h3 className="text-xl font-bold">{trip.title}</h3>
              <p className="text-xs opacity-80 mt-1">{trip.startDate} - {trip.endDate}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="mt-10">
        <div className="px-6 flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold">推薦行程</h2>
          <div className="flex space-x-2">
            <span className="text-xs font-bold text-milk-tea-500 bg-milk-tea-100 px-3 py-1 rounded-full">首爾</span>
            <span className="text-xs font-bold text-milk-tea-300 px-3 py-1 rounded-full">釜山</span>
            <span className="text-xs font-bold text-milk-tea-300 px-3 py-1 rounded-full">濟州</span>
          </div>
        </div>

        <div className="flex overflow-x-auto no-scrollbar space-x-4 px-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <div className="h-40 bg-milk-tea-200 rounded-xl mb-2 overflow-hidden shadow-sm">
                <img 
                  src={`https://picsum.photos/seed/travel${i}/400/400`} 
                  alt="Template" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-sm font-bold text-milk-tea-900 line-clamp-1">首爾文青咖啡之旅</h4>
              <p className="text-[10px] text-milk-tea-500">3 天 2 夜 ・ 12 個景點</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Share2, Map as MapIcon, List, MoreVertical, Edit2, Plus, GripVertical, Calendar, MapPin } from 'lucide-react';
import { DaySelector } from '../components/itinerary/DaySelector';
import { SpotCard } from '../components/itinerary/SpotCard';
import { TransitCard } from '../components/itinerary/TransitCard';
import { useTripStore } from '../stores/tripStore';
import { useUIStore } from '../stores/uiStore';
import { SpotEditModal } from '../components/editor/SpotEditModal';
import { AddSpotModal } from '../components/editor/AddSpotModal';
import { DayEditModal } from '../components/editor/DayEditModal';
import { TripInfoEditModal } from '../components/editor/TripInfoEditModal';
import { CopySpotModal } from '../components/editor/CopySpotModal';
import { ReorderModeBanner } from '../components/reorder/ReorderModeBanner';
import { SpotReorderMode } from '../components/reorder/SpotReorderMode';
import { DayReorderMode } from '../components/reorder/DayReorderMode';

interface TripOverviewProps {
  onBack: () => void;
}

export const TripOverview: React.FC<TripOverviewProps> = ({ onBack }) => {
  const { trip, addDay } = useTripStore();
  const { reorderMode, setReorderMode, openModal } = useUIStore();
  const [currentDay, setCurrentDay] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showTripMenu, setShowTripMenu] = useState(false);

  const activeDayPlan = trip.days.find((d) => d.dayNumber === currentDay);

  const handleEditTrip = () => {
    openModal('trip-info', { tripId: trip.id, dayNumber: 1 });
    setShowTripMenu(false);
  };

  const handleEditDay = () => {
    openModal('day-edit', { tripId: trip.id, dayNumber: currentDay });
  };

  return (
    <div className="min-h-screen bg-milk-tea-50 pb-32">
      <ReorderModeBanner />

      {/* Header */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={trip.coverImage} 
          alt={trip.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-milk-tea-900/80 via-milk-tea-900/20 to-transparent" />
        
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
          <button 
            onClick={onBack}
            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex space-x-2">
            <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all">
              <Share2 size={20} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowTripMenu(!showTripMenu)}
                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
              >
                <MoreVertical size={20} />
              </button>
              <AnimatePresence>
                {showTripMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowTripMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-milk-tea-100 z-30 py-2 overflow-hidden"
                    >
                      <button 
                        onClick={handleEditTrip}
                        className="w-full px-4 py-2 text-left text-sm text-milk-tea-700 hover:bg-milk-tea-50 flex items-center"
                      >
                        <Edit2 size={14} className="mr-2" /> 編輯行程資訊
                      </button>
                      <button 
                        onClick={() => {
                          setReorderMode('days');
                          setShowTripMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-milk-tea-700 hover:bg-milk-tea-50 flex items-center"
                      >
                        <Calendar size={14} className="mr-2" /> 重新排序天數
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <h1 className="text-3xl font-extrabold mb-1 font-display tracking-tight">{trip.title}</h1>
          <div className="flex items-center text-sm font-medium text-white/80">
            <MapPin size={14} className="mr-1" />
            {trip.destination}
            <span className="mx-2 opacity-50">|</span>
            {trip.startDate} ~ {trip.endDate}
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="sticky top-0 z-30 bg-milk-tea-50/80 backdrop-blur-md border-b border-milk-tea-200 px-6 py-4 flex items-center space-x-4 overflow-x-auto no-scrollbar">
        <DaySelector 
          totalDays={trip.days.length} 
          currentDay={currentDay} 
          onSelectDay={setCurrentDay} 
        />
        <button
          onClick={() => {
            const newDayNumber = trip.days.length + 1;
            addDay();
            setCurrentDay(newDayNumber);
          }}
          className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-milk-tea-300 flex items-center justify-center text-milk-tea-400 hover:border-milk-tea-500 hover:text-milk-tea-600 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {reorderMode === 'days' ? (
          <DayReorderMode />
        ) : reorderMode === 'spots' ? (
          <SpotReorderMode />
        ) : (
          <>
            {/* Day Header */}
            <div className="px-6 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-milk-tea-900 font-display flex items-center">
                  Day {currentDay}
                  <button 
                    onClick={handleEditDay}
                    className="ml-2 p-1.5 text-milk-tea-300 hover:text-milk-tea-500 hover:bg-milk-tea-100 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                </h2>
                <p className="text-sm font-bold text-milk-tea-400 mt-0.5">
                  {activeDayPlan?.title || '未命名的一天'} · {activeDayPlan?.date}
                </p>
              </div>
              <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-milk-tea-100">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-milk-tea-500 text-white shadow-md' : 'text-milk-tea-300 hover:text-milk-tea-500'}`}
                >
                  <List size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-milk-tea-500 text-white shadow-md' : 'text-milk-tea-300 hover:text-milk-tea-500'}`}
                >
                  <MapIcon size={18} />
                </button>
              </div>
            </div>

            {/* Itinerary List */}
            <div className="px-6 space-y-2">
              {activeDayPlan?.spots.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-milk-tea-100 rounded-full flex items-center justify-center text-milk-tea-300 mb-4">
                    <MapIcon size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-milk-tea-800 mb-1 font-display">這一天還沒有景點</h3>
                  <p className="text-sm text-milk-tea-400 max-w-[200px]">點擊下方按鈕開始規劃你的行程吧！</p>
                </div>
              ) : (
                activeDayPlan?.spots.map((spot, index) => (
                  <React.Fragment key={spot.id}>
                    <SpotCard spot={spot} dayNumber={currentDay} index={index} />
                    {index < activeDayPlan.spots.length - 1 && (
                      <TransitCard 
                        transit={activeDayPlan.transits[index]} 
                        originName={spot.name}
                        destinationName={activeDayPlan.spots[index + 1].name}
                        originCoords={{ lat: spot.lat, lng: spot.lng }}
                        destinationCoords={{ lat: activeDayPlan.spots[index + 1].lat, lng: activeDayPlan.spots[index + 1].lng }}
                      />
                    )}
                  </React.Fragment>
                ))
              )}

              {/* Action Buttons */}
              <div className="pt-6 space-y-3">
                <button 
                  onClick={() => openModal('add-spot', { tripId: trip.id, dayNumber: currentDay })}
                  className="w-full py-4 bg-white border-2 border-dashed border-milk-tea-200 text-milk-tea-500 rounded-3xl font-bold flex items-center justify-center hover:border-milk-tea-400 hover:text-milk-tea-600 transition-all active:scale-[0.98]"
                >
                  <Plus size={20} className="mr-2" />
                  新增景點到 Day {currentDay}
                </button>
                
                {activeDayPlan && activeDayPlan.spots.length > 1 && (
                  <button 
                    onClick={() => setReorderMode('spots')}
                    className="w-full py-4 bg-milk-tea-100/50 text-milk-tea-600 rounded-3xl font-bold flex items-center justify-center hover:bg-milk-tea-200/50 transition-all active:scale-[0.98]"
                  >
                    <GripVertical size={18} className="mr-2" />
                    重新排序景點
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Map View Placeholder (if active) */}
      {viewMode === 'map' && !reorderMode && (
        <div className="fixed inset-0 z-40 bg-white pt-20">
           <div className="h-full w-full bg-milk-tea-100 flex flex-col items-center justify-center p-10 text-center">
              <MapIcon className="w-16 h-16 text-milk-tea-300 mb-4" />
              <h3 className="text-lg font-bold text-milk-tea-800">Naver Map 載入中...</h3>
              <p className="text-sm text-milk-tea-500 mt-2">
                此預覽環境暫未配置 Naver Maps API Key。<br/>
                正式環境將顯示完整互動地圖。
              </p>
              <button 
                onClick={() => setViewMode('list')}
                className="mt-6 px-6 py-2 bg-milk-tea-500 text-white rounded-full font-bold shadow-md"
              >
                返回列表視圖
              </button>
           </div>
        </div>
      )}

      {/* Modals */}
      <SpotEditModal />
      <AddSpotModal />
      <DayEditModal />
      <TripInfoEditModal />
      <CopySpotModal />
    </div>
  );
};

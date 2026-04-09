import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Cloud, CloudDownload, Map as MapIcon, List,
  MoreVertical, Edit2, Plus, GripVertical, Calendar, MapPin,
  Copy, Check, Loader2, CloudOff,
} from 'lucide-react';
import { DaySelector } from '../components/itinerary/DaySelector';
import { SpotCard } from '../components/itinerary/SpotCard';
import { TransitCard } from '../components/itinerary/TransitCard';
import { WeatherStrip } from '../components/weather/WeatherStrip';
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
import { fetchWeatherRange, DayWeather } from '../services/weatherService';
import { saveTrip, loadTrip, getOrCreateSyncCode } from '../services/syncService';

interface TripOverviewProps {
  onBack: () => void;
}

export const TripOverview: React.FC<TripOverviewProps> = ({ onBack }) => {
  const { trip, setTrip, addDay } = useTripStore();
  const { reorderMode, setReorderMode, openModal, addToast } = useUIStore();
  const [currentDay, setCurrentDay] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showTripMenu, setShowTripMenu] = useState(false);

  // Weather
  const [weather, setWeather] = useState<DayWeather[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Cloud Sync
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [syncCode] = useState(() => getOrCreateSyncCode());
  const [loadCode, setLoadCode] = useState('');
  const [syncSaving, setSyncSaving] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saved' | 'loaded' | 'error'>('idle');

  const activeDayPlan = trip.days.find((d) => d.dayNumber === currentDay);

  // Fetch weather on mount
  useEffect(() => {
    let cancelled = false;
    setWeatherLoading(true);
    fetchWeatherRange(trip.startDate, trip.endDate).then((data) => {
      if (!cancelled) {
        setWeather(data);
        setWeatherLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [trip.startDate, trip.endDate]);

  const handleEditTrip = () => {
    openModal('trip-info', { tripId: trip.id, dayNumber: 1 });
    setShowTripMenu(false);
  };

  const handleEditDay = () => {
    openModal('day-edit', { tripId: trip.id, dayNumber: currentDay });
  };

  const handleSaveSync = async () => {
    setSyncSaving(true);
    setSyncStatus('idle');
    const code = await saveTrip(trip);
    setSyncSaving(false);
    if (code) {
      setSyncStatus('saved');
      addToast('行程已儲存到雲端！', 'success');
    } else {
      setSyncStatus('error');
      addToast('儲存失敗，請確認 Worker KV 已設定', 'error');
    }
  };

  const handleLoadSync = async () => {
    if (!loadCode.trim()) return;
    setSyncLoading(true);
    setSyncStatus('idle');
    const data = await loadTrip(loadCode);
    setSyncLoading(false);
    if (data) {
      setTrip(data as any);
      setSyncStatus('loaded');
      setShowSyncPanel(false);
      addToast('行程載入成功！', 'success');
    } else {
      setSyncStatus('error');
      addToast('找不到該代碼的行程', 'error');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
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
            {/* 雲端同步按鈕 */}
            <button
              onClick={() => setShowSyncPanel(true)}
              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
              title="雲端同步"
            >
              <Cloud size={20} />
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
                        onClick={() => { setReorderMode('days'); setShowTripMenu(false); }}
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
            <div className="px-6 mb-4">
              <div className="flex items-center justify-between mb-3">
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

              {/* 天氣條 */}
              {activeDayPlan && (
                <WeatherStrip
                  weather={weather}
                  currentDate={activeDayPlan.date}
                  loading={weatherLoading}
                />
              )}
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
                        dayNumber={currentDay}
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

      {/* Map View Placeholder */}
      {viewMode === 'map' && !reorderMode && (
        <div className="fixed inset-0 z-40 bg-white pt-20">
          <div className="h-full w-full bg-milk-tea-100 flex flex-col items-center justify-center p-10 text-center">
            <MapIcon className="w-16 h-16 text-milk-tea-300 mb-4" />
            <h3 className="text-lg font-bold text-milk-tea-800">Naver Map 載入中...</h3>
            <p className="text-sm text-milk-tea-500 mt-2">此預覽環境暫未配置 Naver Maps API Key。</p>
            <button
              onClick={() => setViewMode('list')}
              className="mt-6 px-6 py-2 bg-milk-tea-500 text-white rounded-full font-bold shadow-md"
            >
              返回列表視圖
            </button>
          </div>
        </div>
      )}

      {/* ── 雲端同步面板 ── */}
      <AnimatePresence>
        {showSyncPanel && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSyncPanel(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
            >
              <div className="w-10 h-1 bg-milk-tea-200 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-black text-milk-tea-900 mb-1 flex items-center">
                <Cloud className="w-5 h-5 mr-2 text-[#AAB6FB]" />
                雲端同步
              </h2>
              <p className="text-xs text-milk-tea-400 mb-6">用代碼在不同裝置間共享行程</p>

              {/* 儲存區 */}
              <div className="bg-milk-tea-50 rounded-2xl p-4 mb-4">
                <p className="text-xs font-bold text-milk-tea-500 mb-2">你的同步代碼</p>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex-1 bg-white border-2 border-[#AAB6FB] rounded-xl px-4 py-2.5 font-mono text-xl font-black text-milk-tea-800 tracking-[0.3em] text-center">
                    {syncCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 bg-[#AAB6FB]/20 rounded-xl text-[#8896F5] hover:bg-[#AAB6FB]/40 transition-all"
                  >
                    {codeCopied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveSync}
                  disabled={syncSaving}
                  className="w-full py-3 bg-[#8896F5] text-white rounded-xl font-bold flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {syncSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Cloud className="w-4 h-4" />
                  }
                  <span>{syncSaving ? '儲存中…' : '儲存行程到雲端'}</span>
                </motion.button>
                {syncStatus === 'saved' && (
                  <p className="text-[10px] text-[#3DBDAD] mt-2 text-center font-bold">✓ 已儲存！把代碼給朋友或在其他裝置輸入</p>
                )}
              </div>

              {/* 載入區 */}
              <div className="bg-milk-tea-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-milk-tea-500 mb-2">輸入代碼載入行程</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={loadCode}
                    onChange={e => setLoadCode(e.target.value.toUpperCase())}
                    placeholder="輸入 6 碼代碼"
                    maxLength={6}
                    className="flex-1 bg-white border border-milk-tea-200 rounded-xl px-3 py-2.5 font-mono font-bold text-center tracking-[0.2em] text-milk-tea-800 focus:outline-none focus:border-[#AAB6FB]"
                  />
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLoadSync}
                    disabled={syncLoading || loadCode.length < 4}
                    className="px-4 py-2.5 bg-[#FF6FA3] text-white rounded-xl font-bold flex items-center space-x-1 disabled:opacity-40"
                  >
                    {syncLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CloudDownload className="w-4 h-4" />
                    }
                  </motion.button>
                </div>
                {syncStatus === 'error' && (
                  <p className="text-[10px] text-red-400 mt-2 flex items-center">
                    <CloudOff className="w-3 h-3 mr-1" />
                    找不到行程或連線失敗
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <SpotEditModal />
      <AddSpotModal />
      <DayEditModal />
      <TripInfoEditModal />
      <CopySpotModal />
    </div>
  );
};

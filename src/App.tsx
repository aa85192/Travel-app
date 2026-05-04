import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut } from 'lucide-react';
import { Home } from './pages/Home';
import { TripOverview } from './pages/TripOverview';
import { Budget } from './pages/Budget';
import { MapPage } from './pages/MapPage';
import { Settings } from './pages/Settings';
import { TodoList } from './pages/TodoList';
import { BottomNav } from './components/layout/BottomNav';
import { PasswordGate, isAuthenticated, logout } from './components/PasswordGate';
import { useTripStore } from './stores/tripStore';
import { useUIStore } from './stores/uiStore';
import { useSettingsStore, applyTheme } from './stores/settingsStore';


export default function App() {
  const [authed, setAuthed] = React.useState<boolean>(isAuthenticated);
  const [activeTab, setActiveTab] = React.useState('home');
  const { trip, setTrip } = useTripStore();
  const { toasts, navigateTo, setNavigateTo } = useUIStore();
  const { themeHue, themeMode } = useSettingsStore();

  // Restore persisted theme on first render
  React.useEffect(() => { applyTheme(themeHue, themeMode); }, []);

  // 接收來自子元件（如 TransitCard）的跨層導航請求
  React.useEffect(() => {
    if (navigateTo) {
      setActiveTab(navigateTo);
      setNavigateTo(null);
    }
  }, [navigateTo, setNavigateTo]);

  // 未登入 → 顯示密碼輸入頁
  if (!authed) {
    return (
      <PasswordGate
        onSuccess={() => {
          // 登入後重新載入，讓 tripStore 以正確的 key 重新初始化
          window.location.reload();
        }}
      />
    );
  }

  return (
    // 外殼：固定佔滿 dvh，內部 flex 直向；只有 .scroll-area 會卷動。
    // 這樣 BottomNav 就不再依賴 viewport `position: fixed`，
    // 在 iOS 把網頁加到主畫面時也不會因為 rubber-band 而跳動。
    <div className="fixed inset-0 max-w-md mx-auto bg-milk-tea-50 shadow-2xl flex flex-col font-sans selection:bg-milk-tea-200 selection:text-milk-tea-900">
      <main className="scroll-area flex-1 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Home trip={trip} onUpdateTrip={setTrip} onNavigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === 'itinerary' && (
            <motion.div
              key="itinerary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TripOverview onBack={() => setActiveTab('home')} />
            </motion.div>
          )}
          {activeTab === 'todo' && (
            <motion.div
              key="todo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TodoList onBack={() => setActiveTab('home')} />
            </motion.div>
          )}
          {activeTab === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Budget trip={trip} onUpdateTrip={setTrip} onBack={() => setActiveTab('home')} />
            </motion.div>
          )}
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <MapPage onBack={() => setActiveTab('itinerary')} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Settings />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 登出按鈕（外殼右上角；以 absolute 對齊外殼，不受卷動影響） */}
      <button
        onClick={logout}
        title="登出"
        className="absolute right-4 z-40 w-8 h-8 rounded-full bg-milk-tea-100 flex items-center justify-center text-milk-tea-400 hover:bg-milk-tea-200 hover:text-milk-tea-600 transition-all"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <LogOut className="w-4 h-4" />
      </button>

      {/* Toast 系統：對齊外殼頂端，避免被卷動帶走 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 5rem)' }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 pointer-events-auto ${
                toast.type === 'success' ? 'bg-[#3DBDAD] text-white' :
                toast.type === 'error'   ? 'bg-[#E8538C] text-white' :
                                           'bg-[#E8A830] text-white'
              }`}
            >
              <span className="text-sm font-bold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

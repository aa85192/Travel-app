import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut } from 'lucide-react';
import { Home } from './pages/Home';
import { TripOverview } from './pages/TripOverview';
import { Budget } from './pages/Budget';
import { BottomNav } from './components/layout/BottomNav';
import { PasswordGate, isAuthenticated, logout } from './components/PasswordGate';
import { useTripStore } from './stores/tripStore';
import { useUIStore } from './stores/uiStore';


export default function App() {
  const [authed, setAuthed] = React.useState<boolean>(isAuthenticated);
  const [activeTab, setActiveTab] = React.useState('home');
  const { trip, setTrip } = useTripStore();
  const { toasts } = useUIStore();

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
    <div className="max-w-md mx-auto bg-milk-tea-50 min-h-screen shadow-2xl relative overflow-hidden font-sans selection:bg-milk-tea-200 selection:text-milk-tea-900">
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
        {(activeTab === 'map' || activeTab === 'settings') && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-screen p-10 text-center"
          >
            <div className="w-20 h-20 bg-milk-tea-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-milk-tea-900">功能開發中</h2>
            <p className="text-sm text-milk-tea-500 mt-2">
              「{activeTab === 'map' ? '地圖' : '設定'}」功能即將上線，敬請期待！
            </p>
            <button
              onClick={() => setActiveTab('home')}
              className="mt-6 px-8 py-2 bg-milk-tea-500 text-white rounded-full font-bold shadow-md"
            >
              回首頁
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 登出按鈕（固定右上角，低調） */}
      <button
        onClick={logout}
        title="登出"
        className="fixed top-4 right-4 z-40 w-8 h-8 rounded-full bg-milk-tea-100 flex items-center justify-center text-milk-tea-400 hover:bg-milk-tea-200 hover:text-milk-tea-600 transition-all"
      >
        <LogOut className="w-4 h-4" />
      </button>

      {/* Toast System */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-2 pointer-events-auto ${
                toast.type === 'success' ? 'bg-milk-tea-700 text-white' :
                toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-white text-milk-tea-900'
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

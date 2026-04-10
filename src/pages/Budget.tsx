import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Wallet, ArrowRight, UserPlus, Trash2, RefreshCw, ArrowLeftRight, Loader2 } from 'lucide-react';
import { Trip, Expense, Participant } from '../types';
import { calculateSettlement } from '../utils/settlement';
import { fetchKrwTwdRate, fetchExchangeRates, RateResult } from '../services/exchangeRateService';

interface BudgetProps {
  trip: Trip;
  onUpdateTrip: (trip: Trip) => void;
  onBack?: () => void;
}

const EMOJIS = ['🐱', '🐰', '🐻', '🦊', '🐶', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺'];
const COLORS = ['#FFACBB', '#AAB6FB', '#99F2E6', '#FFFEE1', '#FFD4B8', '#C5B8FF', '#B8DCFF', '#FFE4A0'];

export const Budget: React.FC<BudgetProps> = ({ trip, onUpdateTrip }) => {
  const [activeView, setActiveView] = useState<'expenses' | 'settlement' | 'participants'>('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [rateData, setRateData] = useState<RateResult | null>(null);
  const [rates, setRates] = useState<{ [key: string]: number } | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<'KRW' | 'TWD'>('KRW');

  // New Expense State
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    currency: 'KRW',
    payerId: trip.participants[0]?.id || '',
    splitWithIds: trip.participants.map(p => p.id),
    date: new Date().toISOString().split('T')[0],
    category: 'other'
  });

  // New Participant State
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    emoji: EMOJIS[0],
    color: COLORS[0]
  });

  useEffect(() => {
    const loadRates = async () => {
      setLoadingRates(true);
      const [krwTwd, allRates] = await Promise.all([
        fetchKrwTwdRate(),
        fetchExchangeRates('TWD'),
      ]);
      if (krwTwd) setRateData(krwTwd);
      if (allRates) setRates(allRates);
      setLoadingRates(false);
    };
    loadRates();
  }, []);

  // 換算顯示金額（僅顯示用，不修改原始資料）
  const convertToDisplay = (amount: number, fromCurrency: string): { value: number; label: string } => {
    if (!rateData) return { value: amount, label: fromCurrency };
    const from = fromCurrency.toUpperCase();
    if (from === displayCurrency) return { value: amount, label: displayCurrency };
    if (from === 'KRW' && displayCurrency === 'TWD') {
      return { value: amount * rateData.TWD, label: 'TWD' };
    }
    if (from === 'TWD' && displayCurrency === 'KRW') {
      return { value: amount * rateData.KRW, label: 'KRW' };
    }
    // 其他幣別不換算
    return { value: amount, label: from };
  };

  const refreshRates = async () => {
    setLoadingRates(true);
    const [krwTwd, allRates] = await Promise.all([
      fetchKrwTwdRate(),
      fetchExchangeRates('TWD'),
    ]);
    if (krwTwd) setRateData(krwTwd);
    if (allRates) setRates(allRates);
    setLoadingRates(false);
  };

  const handleAddExpense = () => {
    if (!newExpense.title || !newExpense.amount) return;
    const expense: Expense = {
      ...newExpense as Expense,
      id: `e_${Date.now()}`
    };
    onUpdateTrip({
      ...trip,
      expenses: [expense, ...trip.expenses]
    });
    setShowAddExpense(false);
    setNewExpense({
      title: '',
      amount: 0,
      currency: 'KRW',
      payerId: trip.participants[0]?.id || '',
      splitWithIds: trip.participants.map(p => p.id),
      date: new Date().toISOString().split('T')[0],
      category: 'other'
    });
  };

  const handleAddParticipant = () => {
    if (!newParticipant.name) return;
    const participant: Participant = {
      ...newParticipant,
      id: `p_${Date.now()}`
    };
    onUpdateTrip({
      ...trip,
      participants: [...trip.participants, participant]
    });
    setShowAddParticipant(false);
    setNewParticipant({ name: '', emoji: EMOJIS[0], color: COLORS[0] });
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateTrip({
      ...trip,
      expenses: trip.expenses.filter(e => e.id !== id)
    });
  };

  // Calculate balances for settlement
  const calculateBalances = () => {
    const balances: { [id: string]: number } = {};
    trip.participants.forEach(p => balances[p.id] = 0);

    trip.expenses.forEach(exp => {
      // For simplicity, we assume all expenses are in the same currency for settlement
      // In a real app, we'd convert them all to a base currency using `rates`
      const amount = exp.amount;
      
      // Payer gets credit
      balances[exp.payerId] += amount;
      
      // Splitters get debt
      const splitCount = exp.splitWithIds.length;
      if (splitCount > 0) {
        const share = amount / splitCount;
        exp.splitWithIds.forEach(id => {
          balances[id] -= share;
        });
      }
    });
    return balances;
  };

  const settlements = calculateSettlement(calculateBalances());

  return (
    <div className="pb-24 min-h-screen bg-milk-tea-50">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold">分帳系統</h1>
        <div className="flex space-x-4 mt-4 border-b border-milk-tea-200">
          {['expenses', 'settlement', 'participants'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view as any)}
              className={`pb-2 text-sm font-bold transition-all ${
                activeView === view ? 'text-milk-tea-500 border-b-2 border-milk-tea-500' : 'text-milk-tea-300'
              }`}
            >
              {view === 'expenses' ? '支出記錄' : view === 'settlement' ? '結算指示' : '旅伴管理'}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6">
        {activeView === 'expenses' && (
          <div className="space-y-3">
            <button
              onClick={() => setShowAddExpense(true)}
              className="w-full py-3 bg-milk-tea-500 text-white rounded-xl font-bold shadow-md flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>新增支出</span>
            </button>

            {/* 匯率換算列 */}
            <div className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2.5 border border-milk-tea-100">
              <div className="flex flex-col">
                {loadingRates ? (
                  <div className="flex items-center space-x-1 text-[10px] text-milk-tea-300">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>載入匯率中…</span>
                  </div>
                ) : rateData ? (
                  <>
                    <span className="text-[10px] font-mono text-milk-tea-700 font-bold">
                      1 TWD = {rateData.KRW.toFixed(1)} KRW
                    </span>
                    <span className="text-[9px] text-milk-tea-300 flex items-center space-x-1">
                      <span className={rateData.source === 'visa' ? 'text-[#3DBDAD]' : 'text-milk-tea-300'}>
                        {rateData.source === 'visa' ? '● Visa 即時匯率' : '○ 市場參考匯率'}
                      </span>
                      <span>· {rateData.updatedAt}</span>
                      <button onClick={refreshRates} className="ml-1 text-milk-tea-300 hover:text-milk-tea-500">
                        <RefreshCw className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-milk-tea-300">匯率載入失敗</span>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => setDisplayCurrency(c => c === 'KRW' ? 'TWD' : 'KRW')}
                disabled={!rateData}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  rateData
                    ? displayCurrency === 'KRW'
                      ? 'bg-[#AAB6FB] text-white shadow-sm'
                      : 'bg-[#FF6FA3] text-white shadow-sm'
                    : 'bg-milk-tea-100 text-milk-tea-300 cursor-not-allowed'
                }`}
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>換算 {displayCurrency === 'KRW' ? 'TWD' : 'KRW'}</span>
              </motion.button>
            </div>

            {trip.expenses.length === 0 && (
              <div className="text-center py-10 text-milk-tea-300">
                <Wallet className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>尚無支出紀錄</p>
              </div>
            )}

            {trip.expenses.map(exp => {
              const converted = convertToDisplay(exp.amount, exp.currency);
              const isConverted = converted.label !== exp.currency.toUpperCase();
              return (
                <div key={exp.id} className="bg-white p-4 rounded-xl shadow-sm border border-milk-tea-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-milk-tea-900">{exp.title}</h3>
                    <p className="text-xs text-milk-tea-400">{exp.date} ・ {trip.participants.find(p => p.id === exp.payerId)?.name} 付款</p>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <p className="font-mono font-bold text-milk-tea-700">
                        {converted.label}{' '}
                        {converted.label === 'KRW'
                          ? Math.round(converted.value).toLocaleString()
                          : converted.value.toFixed(0)}
                      </p>
                      {isConverted && (
                        <p className="text-[9px] text-milk-tea-300 font-mono">
                          原 {exp.currency} {exp.amount.toLocaleString()}
                        </p>
                      )}
                      <p className="text-[10px] text-milk-tea-400">分給 {exp.splitWithIds.length} 人</p>
                    </div>
                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-accent-error opacity-50 hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeView === 'settlement' && (
          <div className="space-y-4">
            <div className="bg-accent-cream/30 p-4 rounded-xl border border-accent-cream">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-milk-tea-800">當前匯率 (1 TWD =)</h3>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setDisplayCurrency(c => c === 'KRW' ? 'TWD' : 'KRW')}
                    disabled={!rateData}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      rateData
                        ? displayCurrency === 'KRW'
                          ? 'bg-[#AAB6FB] text-white shadow-sm'
                          : 'bg-[#FF6FA3] text-white shadow-sm'
                        : 'bg-milk-tea-100 text-milk-tea-300 cursor-not-allowed'
                    }`}
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>換算 {displayCurrency === 'KRW' ? 'TWD' : 'KRW'}</span>
                  </motion.button>
                  <button onClick={refreshRates} className="text-milk-tea-500">
                    <RefreshCw className={`w-4 h-4 ${loadingRates ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/50 p-2 rounded-lg">
                  <p className="text-[10px] text-milk-tea-400">KRW</p>
                  <p className="text-xs font-mono font-bold">{rateData?.KRW?.toFixed(1) || rates?.KRW?.toFixed(2) || '--'}</p>
                </div>
                <div className="bg-white/50 p-2 rounded-lg">
                  <p className="text-[10px] text-milk-tea-400">JPY</p>
                  <p className="text-xs font-mono font-bold">{rates?.JPY?.toFixed(2) || '--'}</p>
                </div>
                <div className="bg-white/50 p-2 rounded-lg">
                  <p className="text-[10px] text-milk-tea-400">USD</p>
                  <p className="text-xs font-mono font-bold">{rates?.USD?.toFixed(4) || '--'}</p>
                </div>
              </div>
              {rateData && (
                <p className="text-[9px] text-milk-tea-300 mt-2 text-center flex items-center justify-center space-x-1">
                  <span className={rateData.source === 'visa' ? 'text-[#3DBDAD]' : 'text-milk-tea-300'}>
                    {rateData.source === 'visa' ? '● Visa 即時匯率' : '○ 市場參考匯率'}
                  </span>
                  <span>· {rateData.updatedAt}</span>
                </p>
              )}
            </div>

            {settlements.length === 0 ? (
              <div className="text-center py-10 text-milk-tea-300">
                <Wallet className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>目前沒有需要結算的帳務</p>
              </div>
            ) : (
              settlements.map((s, i) => {
                const from = trip.participants.find(p => p.id === s.from);
                const to = trip.participants.find(p => p.id === s.to);
                const converted = convertToDisplay(s.amount, 'KRW');
                const isConverted = converted.label !== 'KRW';
                return (
                  <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-milk-tea-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{from?.emoji}</span>
                      <span className="font-bold">{from?.name}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-milk-tea-700 font-mono">
                        {converted.label} {isConverted ? converted.value.toFixed(0) : Math.round(converted.value).toLocaleString()}
                      </span>
                      {isConverted && (
                        <span className="text-[9px] text-milk-tea-300 font-mono">
                          ≈ KRW {Math.round(s.amount).toLocaleString()}
                        </span>
                      )}
                      <ArrowRight className="w-5 h-5 text-milk-tea-300 mt-0.5" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{to?.name}</span>
                      <span className="text-2xl">{to?.emoji}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeView === 'participants' && (
          <div className="space-y-4">
            <button 
              onClick={() => setShowAddParticipant(true)}
              className="w-full py-3 border-2 border-dashed border-milk-tea-300 text-milk-tea-500 rounded-xl font-bold flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>新增旅伴</span>
            </button>

            <div className="grid grid-cols-2 gap-4">
              {trip.participants.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-milk-tea-100 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2" style={{ backgroundColor: `${p.color}20`, border: `2px solid ${p.color}` }}>
                    {p.emoji}
                  </div>
                  <span className="font-bold text-milk-tea-900">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl p-6 overflow-y-auto max-h-dvh"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">新增支出</h2>
                <button onClick={() => setShowAddExpense(false)} className="text-milk-tea-300">取消</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-milk-tea-400 block mb-1">支出名稱</label>
                  <input 
                    type="text" 
                    value={newExpense.title}
                    onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                    className="w-full bg-milk-tea-50 border border-milk-tea-100 rounded-xl p-3"
                    placeholder="例如：晚餐、車票..."
                  />
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-milk-tea-400 block mb-1">金額</label>
                    <input 
                      type="number" 
                      value={newExpense.amount || ''}
                      onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                      className="w-full bg-milk-tea-50 border border-milk-tea-100 rounded-xl p-3 font-mono"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-bold text-milk-tea-400 block mb-1">幣別</label>
                    <select 
                      value={newExpense.currency}
                      onChange={e => setNewExpense({...newExpense, currency: e.target.value})}
                      className="w-full bg-milk-tea-50 border border-milk-tea-100 rounded-xl p-3"
                    >
                      <option value="KRW">KRW</option>
                      <option value="TWD">TWD</option>
                      <option value="JPY">JPY</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-milk-tea-400 block mb-1">誰付的？</label>
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {trip.participants.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setNewExpense({...newExpense, payerId: p.id})}
                        className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${
                          newExpense.payerId === p.id ? 'bg-milk-tea-500 text-white border-milk-tea-500' : 'bg-white text-milk-tea-400 border-milk-tea-200'
                        }`}
                      >
                        {p.emoji} {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleAddExpense}
                  className="w-full py-4 bg-milk-tea-500 text-white rounded-xl font-bold shadow-lg mt-4"
                >
                  確認新增
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Participant Modal */}
      <AnimatePresence>
        {showAddParticipant && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6"
            >
              <h2 className="text-xl font-bold mb-6">新增旅伴</h2>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="旅伴名稱"
                  value={newParticipant.name}
                  onChange={e => setNewParticipant({...newParticipant, name: e.target.value})}
                  className="w-full bg-milk-tea-50 border border-milk-tea-100 rounded-xl p-3"
                />
                <div>
                  <label className="text-xs font-bold text-milk-tea-400 block mb-2">選擇頭像</label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1">
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setNewParticipant({...newParticipant, emoji: e})}
                        className={`text-xl p-2 rounded-lg transition-all ${newParticipant.emoji === e ? 'bg-milk-tea-100 scale-110' : 'hover:bg-milk-tea-50'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2 pt-4">
                  <button onClick={() => setShowAddParticipant(false)} className="flex-1 py-3 text-milk-tea-400 font-bold">取消</button>
                  <button onClick={handleAddParticipant} className="flex-1 py-3 bg-milk-tea-500 text-white rounded-xl font-bold shadow-md">確認</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

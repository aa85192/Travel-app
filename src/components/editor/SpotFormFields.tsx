import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Image as ImageIcon, Clock, CircleDollarSign, Tag, Info, Search, Loader2, ExternalLink } from 'lucide-react';
import { Spot, SpotCategory } from '../../types';
import { TagInput } from './TagInput';
import { DurationStepper } from './DurationStepper';
import { parseNaverMapLink } from '../../services/naverLinkParser';
import { useUIStore } from '../../stores/uiStore';
import { fetchExchangeRates } from '../../services/exchangeRateService';

interface SpotFormFieldsProps {
  formData: Partial<Spot>;
  setFormData: (data: Partial<Spot>) => void;
}

export const SpotFormFields: React.FC<SpotFormFieldsProps> = ({ formData, setFormData }) => {
  const [naverUrl, setNaverUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [rates, setRates] = useState<any>(null);
  const addToast = useUIStore((state) => state.addToast);

  useEffect(() => {
    const loadRates = async () => {
      const r = await fetchExchangeRates('KRW');
      if (r) setRates(r);
    };
    loadRates();
  }, []);

  const twdAmount = rates && formData.cost ? (formData.cost * rates.TWD).toFixed(0) : null;

  const categories: { value: SpotCategory; label: string; emoji: string }[] = [
    { value: 'attraction', label: '景點', emoji: '🏛️' },
    { value: 'restaurant', label: '餐廳', emoji: '🍴' },
    { value: 'cafe', label: '咖啡廳', emoji: '☕' },
    { value: 'shopping', label: '購物', emoji: '🛍️' },
    { value: 'hotel', label: '住宿', emoji: '🏨' },
    { value: 'transport', label: '交通', emoji: '🚌' },
    { value: 'activity', label: '活動', emoji: '🎡' },
    { value: 'other', label: '其他', emoji: '📍' },
  ];

  const handleParseNaver = async () => {
    if (!naverUrl.trim()) return;
    setIsParsing(true);
    try {
      const result = await parseNaverMapLink(naverUrl);
      if ('error' in result) {
        addToast(`解析失敗: ${result.error}`, 'error');
      } else {
        setFormData({
          ...formData,
          name: result.name || formData.name,
          lat: result.lat || formData.lat,
          lng: result.lng || formData.lng,
          address: result.address || formData.address,
        });
        addToast('✅ 已匯入景點資訊，請檢查並補充其他欄位', 'success');
      }
    } catch (err) {
      addToast('解析過程發生錯誤', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSearchOnNaver = () => {
    if (!formData.name) {
      addToast('請先輸入景點名稱', 'error');
      return;
    }
    const searchUrl = `https://map.naver.com/v5/search/${encodeURIComponent(formData.name)}`;
    window.open(searchUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Naver Link Importer */}
      <div className="p-4 bg-white border border-milk-tea-200 rounded-2xl shadow-sm">
        <label className="flex items-center text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-2">
          <Globe size={14} className="mr-1.5" />
          從 Naver Map 連結匯入
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={naverUrl}
            onChange={(e) => setNaverUrl(e.target.value)}
            placeholder="貼上 Naver Map 連結 (naver.me/...)"
            className="flex-1 px-4 py-2 bg-milk-tea-50 border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
          />
          <button
            type="button"
            onClick={handleParseNaver}
            disabled={isParsing || !naverUrl}
            className="px-4 py-2 bg-milk-tea-500 text-white rounded-xl text-sm font-bold hover:bg-milk-tea-600 disabled:opacity-50 transition-all flex items-center"
          >
            {isParsing ? <Loader2 size={16} className="animate-spin" /> : '解析'}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            景點名稱 *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
            placeholder="例如：景福宮"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            韓文名 / 當地名
          </label>
          <input
            type="text"
            value={formData.nameLocal || ''}
            onChange={(e) => setFormData({ ...formData, nameLocal: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
            placeholder="例如：경복궁"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            類別 *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  formData.category === cat.value
                    ? 'bg-milk-tea-500 border-milk-tea-500 text-white shadow-md scale-105'
                    : 'bg-white border-milk-tea-100 text-milk-tea-500 hover:border-milk-tea-300'
                }`}
              >
                <span className="text-lg mb-1">{cat.emoji}</span>
                <span className="text-[10px] font-bold">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center justify-between">
            <span>地址</span>
            <button 
              type="button"
              onClick={handleSearchOnNaver}
              className="text-[10px] text-milk-tea-400 hover:text-milk-tea-600 flex items-center"
            >
              <ExternalLink size={10} className="mr-1" /> 在 Naver Map 搜尋
            </button>
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
              placeholder="輸入地址"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
              緯度 *
            </label>
            <input
              type="number"
              step="any"
              value={formData.lat || ''}
              onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
              經度 *
            </label>
            <input
              type="number"
              step="any"
              value={formData.lng || ''}
              onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors font-mono"
            />
          </div>
        </div>
      </div>

      {/* Media & Time */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            照片 URL
          </label>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <ImageIcon size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
              <input
                type="text"
                value={formData.photo || ''}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
                placeholder="https://..."
              />
            </div>
            {formData.photo && (
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-milk-tea-200 flex-shrink-0 bg-milk-tea-50">
                <img 
                  src={formData.photo} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/placeholder/100/100';
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            建議停留時間 *
          </label>
          <DurationStepper
            value={formData.duration || 60}
            onChange={(val) => setFormData({ ...formData, duration: val })}
          />
        </div>
      </div>

      {/* Cost & Notes */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center justify-between">
            <span>預估費用 (KRW)</span>
            {twdAmount && (
              <span className="text-[10px] text-milk-tea-400 font-bold">
                ≈ NT$ {twdAmount}
              </span>
            )}
          </label>
          <div className="relative">
            <CircleDollarSign size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
            <input
              type="number"
              value={formData.cost || ''}
              onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
              className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors font-mono"
              placeholder="例如：3000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            備註
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors min-h-[100px] resize-none"
            placeholder="推薦穿韓服免費入場！"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            標籤
          </label>
          <TagInput
            tags={formData.tags || []}
            onChange={(tags) => setFormData({ ...formData, tags })}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            營業時間
          </label>
          <div className="relative">
            <Clock size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
            <input
              type="text"
              value={formData.openingHours || ''}
              onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
              placeholder="09:00 - 18:00"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

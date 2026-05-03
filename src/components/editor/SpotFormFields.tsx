import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Globe, Image as ImageIcon, Clock, CircleDollarSign, Search, Loader2, ExternalLink, X, Sparkles, Map } from 'lucide-react';
import { Spot, SpotCategory, Mood, MOOD_META } from '../../types';
import { TagInput } from './TagInput';
import { DurationStepper } from './DurationStepper';
import { PhotoGalleryEditor } from '../common/PhotoGalleryEditor';
import { parseNaverMapLink } from '../../services/naverLinkParser';
import { searchPlaces, PlaceResult } from '../../services/placeSearchService';
import { searchSpotsWithGemini, GeminiSpotResult } from '../../services/geminiSearchService';
import { fetchWikipediaPhoto } from '../../services/wikipediaPhotoService';
import { searchInNaverMap } from '../../utils/deepLink';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geminiResults, setGeminiResults] = useState<GeminiSpotResult[]>([]);
  const [isGeminiSearching, setIsGeminiSearching] = useState(false);
  const [isFetchingPhoto, setIsFetchingPhoto] = useState(false);
  const [inputMode, setInputMode] = useState<'search' | 'naver'>('search');
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setGeminiResults([]);
    try {
      const results = await searchPlaces(searchQuery);
      if (results.length === 0) {
        addToast('找不到相關地點，試試韓文或英文名稱', 'error');
      }
      setSearchResults(results);
    } catch {
      addToast('搜尋失敗，請稍後再試', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: PlaceResult) => {
    const newData = {
      ...formData,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    };
    setFormData(newData);
    setSearchResults([]);
    setSearchQuery('');
    setIsFetchingPhoto(true);
    try {
      const photoUrl = await fetchWikipediaPhoto(place.nameLocal || place.name, place.name);
      if (photoUrl) {
        setFormData({ ...newData, photo: photoUrl });
        addToast(`✅ 已選擇「${place.name}」並自動取得照片`, 'success');
      } else {
        addToast(`✅ 已選擇「${place.name}」，請補充其他欄位`, 'success');
      }
    } catch {
      addToast(`✅ 已選擇「${place.name}」，請補充其他欄位`, 'success');
    } finally {
      setIsFetchingPhoto(false);
    }
  };

  const handleGeminiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsGeminiSearching(true);
    setGeminiResults([]);
    setSearchResults([]);
    try {
      const results = await searchSpotsWithGemini(searchQuery);
      if (results.length === 0) {
        addToast('AI 找不到相關景點，請換個描述', 'error');
      } else {
        setGeminiResults(results);
      }
    } catch (e: any) {
      console.error('[Gemini]', e);
      addToast(`AI 搜尋失敗：${e?.message ?? '未知錯誤'}`, 'error');
    } finally {
      setIsGeminiSearching(false);
    }
  };

  // AI 結果點選 → 貼韓文名到搜尋欄，讓使用者自行按 🗺️ 開 NaverMap
  const handleSelectGeminiPlace = (place: GeminiSpotResult) => {
    setSearchQuery(place.nameKo);
    setGeminiResults([]);
    searchInputRef.current?.focus();
  };

  const handleFetchPhoto = async () => {
    const query = formData.nameLocal || formData.name;
    if (!query) {
      addToast('請先輸入景點名稱', 'warning');
      return;
    }
    setIsFetchingPhoto(true);
    try {
      const photoUrl = await fetchWikipediaPhoto(query, formData.name);
      console.info('[auto-photo] query:', query, 'fallback:', formData.name, '→', photoUrl);
      if (photoUrl) {
        setFormData({ ...formData, photo: photoUrl });
        addToast('✅ 已自動取得照片', 'success');
      } else {
        addToast('找不到相關照片，請手動貼上圖片網址', 'error');
      }
    } catch (e) {
      console.error('[auto-photo] failed:', e);
      addToast('照片取得失敗', 'error');
    } finally {
      setIsFetchingPhoto(false);
    }
  };

  const handleSearchOnNaver = () => {
    const query = (formData.name || formData.address || '').trim();
    if (!query) {
      addToast('請先輸入景點名稱或地址', 'warning');
      return;
    }

    const url = `https://map.naver.com/v5/search/${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 地點輸入方式切換 */}
      <div className="p-4 bg-white border border-milk-tea-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex rounded-xl overflow-hidden border border-milk-tea-200">
          <button
            type="button"
            onClick={() => setInputMode('search')}
            className={`flex-1 py-2 text-xs font-bold transition-all ${
              inputMode === 'search'
                ? 'bg-milk-tea-500 text-white'
                : 'bg-white text-milk-tea-400 hover:bg-milk-tea-50'
            }`}
          >
            🔍 搜尋地點
          </button>
          <button
            type="button"
            onClick={() => setInputMode('naver')}
            className={`flex-1 py-2 text-xs font-bold transition-all ${
              inputMode === 'naver'
                ? 'bg-milk-tea-500 text-white'
                : 'bg-white text-milk-tea-400 hover:bg-milk-tea-50'
            }`}
          >
            🗺️ 貼上 Naver 連結
          </button>
        </div>

        {inputMode === 'search' && (
          <div className="space-y-2">
            {/* 搜尋輸入框 — 獨立一行不擠壓 */}
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setGeminiResults([]);
                setSearchResults([]);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="輸入地點名稱（中文、韓文、英文皆可）"
              className="w-full px-3 py-2 bg-milk-tea-50 border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
            />
            {/* 三顆按鈕平均分配第二行 */}
            <div className="grid grid-cols-3 gap-2">
              {/* AI 找韓文景點名 */}
              <button
                type="button"
                onClick={handleGeminiSearch}
                disabled={isGeminiSearching || !searchQuery.trim()}
                title="AI 從知識庫找韓文景點名"
                className="py-2 bg-[#E8ECFF] text-[#2D3A8A] rounded-xl text-xs font-black disabled:opacity-50 transition-all flex items-center justify-center space-x-1 hover:bg-[#AAB6FB] hover:text-white border border-[#AAB6FB]"
              >
                {isGeminiSearching ? <Loader2 size={13} className="animate-spin" /> : <><span>🇰🇷</span><span>AI</span></>}
              </button>
              {/* 地點搜尋（可選後自動匯入） */}
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                title="搜尋地點並自動匯入"
                className="py-2 bg-milk-tea-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all flex items-center justify-center space-x-1"
              >
                {isSearching ? <Loader2 size={14} className="animate-spin" /> : <><Search size={14} /><span>搜尋</span></>}
              </button>
              {/* 在 NaverMap 搜尋 */}
              <button
                type="button"
                onClick={() => { if (searchQuery.trim()) searchInNaverMap(searchQuery); }}
                disabled={!searchQuery.trim()}
                title="在 Naver Map 搜尋"
                className="py-2 bg-green-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all flex items-center justify-center space-x-1"
              >
                <Map size={14} /><span>地圖</span>
              </button>
            </div>

            {/* Gemini AI 結果下拉：點選貼到搜尋欄，再按 🗺️ 開 NaverMap */}
            {geminiResults.length > 0 && (
              <div className="rounded-xl border border-[#AAB6FB] overflow-hidden divide-y divide-[#E8ECFF] bg-white shadow-md">
                <div className="px-3 py-1.5 bg-[#E8ECFF] flex items-center justify-between">
                  <span className="text-[9px] font-black text-[#2D3A8A] tracking-wide">✨ AI 景點建議（點選→貼到搜尋欄，再按 🗺️）</span>
                  <button type="button" onClick={() => setGeminiResults([])} className="text-[#8896F5] hover:text-[#2D3A8A]">
                    <X size={12} />
                  </button>
                </div>
                {geminiResults.map((place, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectGeminiPlace(place)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#E8ECFF]/50 transition-colors"
                  >
                    <p className="text-sm font-black text-milk-tea-900">{place.nameZh}</p>
                    <p className="text-[11px] text-milk-tea-400 mt-0.5">{place.nameKo}</p>
                  </button>
                ))}
              </div>
            )}

            {/* 地點搜尋結果下拉：點選自動匯入名稱/座標 */}
            {searchResults.length > 0 && (
              <div className="rounded-xl border border-milk-tea-200 overflow-hidden divide-y divide-milk-tea-100">
                {searchResults.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left px-3 py-2.5 hover:bg-milk-tea-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-milk-tea-900 truncate">{place.name}</p>
                        <p className="text-[10px] text-milk-tea-400 truncate mt-0.5">{place.address}</p>
                      </div>
                      <span className="text-[10px] text-milk-tea-300 font-mono ml-2 flex-shrink-0">
                        {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                      </span>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSearchResults([])}
                  className="w-full py-2 text-[10px] text-milk-tea-300 hover:text-milk-tea-500 flex items-center justify-center space-x-1"
                >
                  <X size={10} /><span>收起</span>
                </button>
              </div>
            )}

            <p className="text-[10px] text-milk-tea-300 text-center">
              找到後複製 Naver Map 連結，切換到
              <button type="button" onClick={() => setInputMode('naver')} className="ml-1 underline text-milk-tea-400">
                貼上連結模式
              </button>
            </p>
          </div>
        )}

        {inputMode === 'naver' && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={naverUrl}
                onChange={(e) => setNaverUrl(e.target.value)}
                placeholder="貼上 Naver Map 連結 (naver.me/...)"
                className="flex-1 px-3 py-2 bg-milk-tea-50 border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
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
            <button
              type="button"
              onClick={() => {
                const url = `https://map.naver.com/v5/search/${encodeURIComponent(formData.name || '')}`;
                window.open(url, '_blank');
              }}
              className="flex items-center space-x-1 text-[10px] text-milk-tea-400 hover:text-milk-tea-600"
            >
              <ExternalLink size={10} />
              <span>開啟 Naver Map 搜尋地點</span>
            </button>
          </div>
        )}
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
              onClick={() => window.open(`https://map.naver.com/v5/search/${encodeURIComponent(formData.name || '')}`, '_blank')}
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
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center justify-between">
            <span>照片 URL</span>
            <button
              type="button"
              onClick={handleFetchPhoto}
              disabled={isFetchingPhoto}
              className="flex items-center space-x-1 text-[10px] text-milk-tea-400 hover:text-milk-tea-600 disabled:opacity-50 transition-colors"
            >
              {isFetchingPhoto
                ? <Loader2 size={10} className="animate-spin" />
                : <Sparkles size={10} />}
              <span>{isFetchingPhoto ? '搜尋中...' : '自動抓取'}</span>
            </button>
          </label>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <ImageIcon size={16} className="absolute left-4 top-3.5 text-milk-tea-300" />
              <input
                type="text"
                value={formData.photo || ''}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
                placeholder="https://... 或點選「自動抓取」"
              />
            </div>
            {isFetchingPhoto ? (
              <div className="w-12 h-12 rounded-xl border border-milk-tea-200 flex-shrink-0 bg-milk-tea-50 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-milk-tea-300" />
              </div>
            ) : formData.photo ? (
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
            ) : null}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-milk-tea-500 uppercase tracking-wider mb-1.5 ml-1">
            旅遊相簿（裝置端，最多 9 張）
          </label>
          <PhotoGalleryEditor
            photoIds={formData.photoIds || []}
            onChange={(ids) => setFormData({ ...formData, photoIds: ids })}
          />
          <p className="text-[10px] text-milk-tea-300 mt-1.5 ml-1">
            照片自動上傳到 Google Drive，旅伴打開行程也看得到。
          </p>
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
            玩過後的心情
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['love', 'wow', 'meh', 'cry'] as Mood[]).map((m) => {
              const meta = MOOD_META[m];
              const active = formData.mood === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, mood: active ? undefined : m })
                  }
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all ${
                    active
                      ? 'bg-milk-tea-50 border-milk-tea-400 scale-105'
                      : 'bg-white border-milk-tea-100 hover:border-milk-tea-300'
                  }`}
                  style={active ? { borderWidth: 2 } : undefined}
                >
                  <span className="text-xl mb-0.5">{meta.emoji}</span>
                  <span className="text-[10px] font-bold text-milk-tea-500">
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={formData.moodNote || ''}
            onChange={(e) => setFormData({ ...formData, moodNote: e.target.value })}
            placeholder="一句話印象（例：氣氛超棒、人爆多）"
            maxLength={40}
            className="w-full mt-2 px-4 py-2.5 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
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

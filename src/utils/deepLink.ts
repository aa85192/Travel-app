// services/deepLinks.ts — PWA 相容修正版
// ═══════════════════════════════════════════════════════════════
// 修正目的：解決在 PWA standalone 模式下 Naver Map / Uber 按鈕無反應
// 核心策略：
//   1. 用真正的 <a> 元素觸發（繞過 window.location.href 的 PWA 限制）
//   2. Android 使用 intent:// 格式 + S.browser_fallback_url 內建降級
//   3. iOS 使用 visibilitychange 偵測 App 是否真的開啟
// ═══════════════════════════════════════════════════════════════

// ─── 平台偵測 ──────────────────────────────────────────────

/** 是否為 iOS（含 iPadOS） */
function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ 會回報 MacIntel，需額外檢查
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** 是否為 Android */
function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/** 是否為行動裝置 */
function isMobile(): boolean {
  return isIOS() || isAndroid();
}

/** 是否為 PWA standalone 模式（加到主畫面後開啟） */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true || // iOS Safari
    document.referrer.startsWith('android-app://')
  );
}

// ─── 核心：用 <a> 元素觸發導航 ─────────────────────────────

/**
 * 動態建立 <a> 並觸發點擊。
 * 這是繞過 PWA standalone 限制的關鍵——瀏覽器會把 a.click() 視為
 * 使用者意圖，而非程式式導航，因此會放行 custom URL scheme。
 */
function triggerAnchorClick(url: string, newTab = true): void {
  const a = document.createElement('a');
  a.href = url;
  if (newTab) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // 延遲移除，避免部分瀏覽器來不及處理
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a);
  }, 100);
}

// ─── Android Intent URL 組裝 ──────────────────────────────

/**
 * 將 nmap:// URL 轉為 Android intent:// 格式
 * 優點：若 App 已安裝 → 直接開啟；若未安裝 → 自動導向 fallback URL
 * （由作業系統處理，不需前端自己 setTimeout）
 */
function buildNaverIntentUrl(nmapUrl: string, webFallbackUrl: string): string {
  const withoutScheme = nmapUrl.replace(/^nmap:\/\//, '');
  const encodedFallback = encodeURIComponent(webFallbackUrl);
  return (
    `intent://${withoutScheme}` +
    `#Intent;` +
    `scheme=nmap;` +
    `action=android.intent.action.VIEW;` +
    `category=android.intent.category.BROWSABLE;` +
    `package=com.nhn.android.nmap;` +
    `S.browser_fallback_url=${encodedFallback};` +
    `end`
  );
}

/**
 * 將 uber:// URL 轉為 Android intent:// 格式
 */
function buildUberIntentUrl(uberUrl: string, webFallbackUrl: string): string {
  const withoutScheme = uberUrl.replace(/^uber:\/\//, '');
  const encodedFallback = encodeURIComponent(webFallbackUrl);
  return (
    `intent://${withoutScheme}` +
    `#Intent;` +
    `scheme=uber;` +
    `action=android.intent.action.VIEW;` +
    `category=android.intent.category.BROWSABLE;` +
    `package=com.ubercab;` +
    `S.browser_fallback_url=${encodedFallback};` +
    `end`
  );
}

// ─── iOS: 用 visibilitychange 偵測 App 是否開啟 ────────────

/**
 * iOS 的 fallback 策略：
 * 1. 觸發 URL scheme
 * 2. 監聽 visibilitychange（App 開啟時瀏覽器會進入背景）
 * 3. 1.5 秒後若仍在前景，代表 App 未安裝，開啟 web fallback
 */
function openOnIOSWithFallback(appUrl: string, webUrl: string): void {
  let appOpened = false;

  const onVisibilityChange = () => {
    if (document.hidden || document.visibilityState === 'hidden') {
      appOpened = true;
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onVisibilityChange);
  window.addEventListener('blur', onVisibilityChange);

  // 觸發 URL scheme
  triggerAnchorClick(appUrl, false);

  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onVisibilityChange);
    window.removeEventListener('blur', onVisibilityChange);

    if (!appOpened && !document.hidden) {
      // App 未安裝 → 開啟 web 版
      triggerAnchorClick(webUrl, true);
    }
  }, 1500);
}

// ─── 通用 App 開啟邏輯 ────────────────────────────────────

/**
 * 統一入口：根據平台選擇最適合的開啟方式
 * @param {object} options
 * @param {string} options.iosScheme   - iOS 用的 URL scheme (e.g. “nmap://…”)
 * @param {string} options.androidIntent - Android 用的 intent:// URL
 * @param {string} options.webFallback - 桌面/無 App 時的 web URL
 */
function openApp({ iosScheme, androidIntent, webFallback }: { iosScheme: string; androidIntent: string; webFallback: string }): void {
  // 桌面裝置：直接開 web
  if (!isMobile()) {
    triggerAnchorClick(webFallback, true);
    return;
  }

  // Android：intent URL 自帶 fallback，最可靠
  if (isAndroid()) {
    triggerAnchorClick(androidIntent, false);
    return;
  }

  // iOS：用 visibilitychange 偵測
  if (isIOS()) {
    openOnIOSWithFallback(iosScheme, webFallback);
    return;
  }

  // 未知平台：保險起見開 web
  triggerAnchorClick(webFallback, true);
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/**
 * 在 Naver Map 開啟指定地點（僅顯示地點 marker）
 * 文件：https://guide.ncloud-docs.com/docs/en/maps-url-scheme
 * 
 * @param {object} place
 * @param {number} place.lat - 緯度
 * @param {number} place.lng - 經度
 * @param {string} place.name - 地點名稱
 */
export function openInNaverMap(place: { lat: number; lng: number; name: string }): void {
  const { lat, lng, name } = place;
  const encodedName = encodeURIComponent(name);

  // iOS URL Scheme
  const iosScheme =
    `nmap://place?lat=${lat}&lng=${lng}` +
    `&name=${encodedName}` +
    `&appname=com.milkteatravel`;

  // Web fallback
  const webFallback = `https://map.naver.com/v5/search/${encodedName}`;

  // Android Intent
  const androidIntent = buildNaverIntentUrl(iosScheme, webFallback);

  openApp({ iosScheme, androidIntent, webFallback });
}

/**
 * 在 Kakao Map 開啟路線（深層連結，不需 API key）
 * URL 格式：https://map.kakao.com/link/by/{mode}/{name},{lat},{lng}/{name},{lat},{lng}
 * mode: car | traffic(大眾運輸) | walk | bicycle
 */
export function openKakaoMapDirections(
  origin: { lat: number; lng: number; name: string },
  destination: { lat: number; lng: number; name: string },
  mode: 'car' | 'traffic' | 'walk' | 'bicycle' = 'traffic'
): void {
  const from = `${encodeURIComponent(origin.name)},${origin.lat},${origin.lng}`;
  const to   = `${encodeURIComponent(destination.name)},${destination.lat},${destination.lng}`;
  const webUrl = `https://map.kakao.com/link/by/${mode}/${from}/${to}`;
  triggerAnchorClick(webUrl, true);
}

/**
 * 用關鍵字在 Naver Map 搜尋（不需座標）
 * 適合用於 AI 產生的韓文店名搜尋
 */
export function searchInNaverMap(query: string): void {
  const encodedQuery = encodeURIComponent(query);
  const iosScheme = `nmap://search?query=${encodedQuery}&appname=com.milkteatravel`;
  const webFallback = `https://map.naver.com/v5/search/${encodedQuery}`;
  const androidIntent = buildNaverIntentUrl(iosScheme, webFallback);
  openApp({ iosScheme, androidIntent, webFallback });
}

/**
 * 在 Naver Map 開啟路線導航（大眾運輸）
 * 起點由 Naver Map 自動使用當前位置
 */
export function openNaverMapDirections(destination: { lat: number; lng: number; name: string }): void {
  const { lat, lng, name } = destination;
  const encodedName = encodeURIComponent(name);

  const iosScheme =
    `nmap://route/public?dlat=${lat}&dlng=${lng}` +
    `&dname=${encodedName}` +
    `&appname=com.milkteatravel`;

  const webFallback =
    `https://map.naver.com/v5/directions/-/` +
    `${lng},${lat},${encodedName}/-/transit`;

  const androidIntent = buildNaverIntentUrl(iosScheme, webFallback);

  openApp({ iosScheme, androidIntent, webFallback });
}

/**
 * 開啟 Uber App 並自動設定目的地（起點為使用者目前位置）
 * 文件：https://developer.uber.com/docs/riders/ride-requests/tutorials/deep-links
 */
export function openUberToDestination(destination: { lat: number; lng: number; name: string }): void {
  const { lat, lng, name } = destination;

  const params = new URLSearchParams({
    action: 'setPickup',
    'pickup[my_location]': 'true',
    'dropoff[latitude]': String(lat),
    'dropoff[longitude]': String(lng),
    'dropoff[nickname]': name,
  });

  const iosScheme = `uber://?${params.toString()}`;
  const webFallback = `https://m.uber.com/ul/?${params.toString()}`;
  const androidIntent = buildUberIntentUrl(iosScheme, webFallback);

  openApp({ iosScheme, androidIntent, webFallback });
}

// ─── 診斷用：將平台資訊印到 console ──────────────────────

/**
 * 若 App 按鈕依然沒反應，呼叫此函數查看平台偵測狀態
 * 用法：在 button onClick 暫時加上 diagnoseDeepLink(place)
 */
export function diagnoseDeepLink(place: { lat: number; lng: number; name: string }): void {
  console.group('🔧 Deep Link 診斷');
  console.log('UserAgent:', navigator.userAgent);
  console.log('isIOS:', isIOS());
  console.log('isAndroid:', isAndroid());
  console.log('isMobile:', isMobile());
  console.log('isStandalone (PWA):', isStandalone());
  console.log('place:', place);

  const encodedName = encodeURIComponent(place.name);
  const iosScheme =
    `nmap://place?lat=${place.lat}&lng=${place.lng}` +
    `&name=${encodedName}&appname=com.milkteatravel`;
  const webFallback = `https://map.naver.com/v5/search/${encodedName}`;

  console.log('iOS scheme URL:', iosScheme);
  console.log('Web fallback URL:', webFallback);
  console.log('Android intent URL:', buildNaverIntentUrl(iosScheme, webFallback));
  console.groupEnd();
}

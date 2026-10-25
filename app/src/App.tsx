import React, { useState, useEffect, useRef } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  RotateCcw,
  Play,
  Pause,
  SlidersHorizontal,
  Wifi,
  X,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  Check,
  Settings,
  Languages as LanguagesIcon,
  ScanLine,
  Search,
  Utensils,
  CameraOff,
  Trash2
} from 'lucide-react';
import { scaleBle } from './services/bleService';
import { foodService, calculateNutrition } from './services/foodService';
import type { WeightUnit, ConnectionStatus } from './types/scale';
import type { FoodProduct } from './types/food';
import { translations, getInitialLanguage, LANGUAGES, type Language } from './i18n';

type ThemeMode = 'dark' | 'light' | 'system';

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('smartcale-theme') || localStorage.getItem('smartscale-theme');
  if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  return 'system';
};

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(getInitialLanguage);
  const t = translations[lang];

  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [weightGrams, setWeightGrams] = useState<number>(0.0);
  const [unit, setUnit] = useState<WeightUnit>('g');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [deviceName, setDeviceName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer state (for coffee brewing / recipes)
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Modals
  const [showCalModal, setShowCalModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showFoodModal, setShowFoodModal] = useState<boolean>(false);
  const [refWeightGrams, setRefWeightGrams] = useState<string>('500');
  const [rawAdcInput, setRawAdcInput] = useState<string>('210000');

  // Food & Barcode state
  const [activeProduct, setActiveProduct] = useState<FoodProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerSupported, setScannerSupported] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const [history, setHistory] = useState<number[]>(new Array(25).fill(0));
  const tareFeedbackTimeout = useRef<number | null>(null);
  const [isTared, setIsTared] = useState<boolean>(false);

  // Stop scanner safely
  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach((track) => track.stop());
      scanStreamRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setSearchError(null);
    if (!('BarcodeDetector' in window)) {
      setScannerSupported(false);
      setIsScanning(true);
      return;
    }

    setScannerSupported(true);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      scanStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // @ts-expect-error Native Web BarcodeDetector API
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
      });

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            if (rawVal) {
              stopScanner();
              setIsSearching(true);
              const found = await foodService.getByBarcode(rawVal);
              setIsSearching(false);
              if (found) {
                setActiveProduct(found);
                setShowFoodModal(false);
              } else {
                setSearchError(`${t.noProductsFound} (${rawVal})`);
              }
            }
          }
        } catch {
          // ignore detection frame errors
        }
      }, 350);
    } catch (err) {
      console.error('Camera access error:', err);
      stopScanner();
      setSearchError(t.connFailed);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    stopScanner();

    try {
      if (/^\d{8,14}$/.test(query)) {
        const direct = await foodService.getByBarcode(query);
        if (direct) {
          setSearchResults([direct]);
          setIsSearching(false);
          return;
        }
      }

      const results = await foodService.search(query);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(t.noProductsFound);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('smartcale-lang', lang);
  }, [lang]);

  useEffect(() => {
    const applyTheme = () => {
      let effective = theme;
      if (theme === 'system') {
        effective = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', effective);
    };

    applyTheme();
    localStorage.setItem('smartcale-theme', theme);

    if (theme === 'system' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  // Close modals with Escape key
  useEffect(() => {
    if (!showCalModal && !showSettingsModal && !showFoodModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCalModal(false);
        setShowSettingsModal(false);
        setShowFoodModal(false);
        stopScanner();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCalModal, showSettingsModal, showFoodModal]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Connect BLE handler
  const handleConnect = async () => {
    try {
      setConnectionStatus('connecting');
      setErrorMessage(null);

      const name = await scaleBle.connect(
        (weight) => {
          setWeightGrams(weight);
          setHistory((prev) => [...prev.slice(1), weight]);
        },
        () => {
          setConnectionStatus('disconnected');
          setDeviceName('');
        }
      );

      setDeviceName(name);
      setConnectionStatus('connected');
    } catch (err: unknown) {
      console.error('BLE connection error:', err);
      setConnectionStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg.includes('cancelled') ? t.connCancelled : t.connFailed);
    }
  };

  const handleDisconnect = async () => {
    await scaleBle.disconnect();
    setConnectionStatus('disconnected');
    setDeviceName('');
  };

  // Remote Tare command
  const handleTare = async () => {
    try {
      if (scaleBle.isConnected()) {
        await scaleBle.sendTare();
      }
      setIsTared(true);
      if (tareFeedbackTimeout.current) clearTimeout(tareFeedbackTimeout.current);
      tareFeedbackTimeout.current = window.setTimeout(() => setIsTared(false), 800);
    } catch (err) {
      console.error('Tare failed:', err);
    }
  };

  // Unit conversion
  const formatWeight = (g: number): string => {
    switch (unit) {
      case 'oz':
        return (g * 0.035274).toFixed(2);
      case 'ml':
        return g.toFixed(1); // 1g water = 1ml
      case 'g':
      default:
        return g.toFixed(1);
    }
  };

  // Format timer MM:SS
  const formatTimer = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calibration calculation
  const computedCalFactor = (): string => {
    const raw = parseFloat(rawAdcInput);
    const ref = parseFloat(refWeightGrams);
    if (!isNaN(raw) && !isNaN(ref) && ref > 0) {
      return (raw / ref).toFixed(1);
    }
    return '420.0';
  };

  // Sparkline SVG calculation
  const minW = Math.min(0, ...history);
  const maxW = Math.max(10, ...history);
  const range = maxW - minW || 1;
  const svgPoints = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * 100;
      const y = 35 - ((val - minW) / range) * 30;
      return `${x},${y}`;
    })
    .join(' ');

  const liveNutrition = activeProduct
    ? calculateNutrition(activeProduct.nutriments, weightGrams)
    : null;

  return (
    <div className="app-container">
      {errorMessage && (
        <div role="alert" className="error-alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="icon-btn"
            style={{
              marginLeft: 'auto',
              minWidth: '44px',
              minHeight: '44px',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer'
            }}
            aria-label={t.dismissError}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main className="scale-card">
        <div className="unit-selector" role="group" aria-label={t.unitSelection}>
          {(['g', 'oz', 'ml'] as WeightUnit[]).map((u) => (
            <button
              key={u}
              className={`unit-btn ${unit === u ? 'active' : ''}`}
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
              aria-label={t.unitAria(u)}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="weight-value-container" aria-live="polite">
          <span className="weight-digits">{formatWeight(weightGrams)}</span>
          <span className="weight-unit">{unit}</span>
        </div>

        <div style={{ width: '100%', height: '40px', padding: '0 10px', opacity: 0.8 }} aria-hidden="true">
          <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke="var(--accent-blue)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgPoints}
            />
          </svg>
        </div>

        <div className="weight-meta">
          {isTared && (
            <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} aria-hidden="true" /> {t.tared}
            </span>
          )}
          {!isTared && (
            <span>{connectionStatus === 'connected' ? t.liveStream : t.standby}</span>
          )}
        </div>
      </main>

      <button
        className="btn btn-primary btn-tare-huge"
        onClick={handleTare}
        aria-label={t.tareAria}
      >
        <RotateCcw size={22} aria-hidden="true" />
        <span>{t.tareBtn}</span>
      </button>

      {activeProduct && liveNutrition && (
        <section className="nutrition-card" aria-label={t.foodNutritionTitle}>
          <div className="nutrition-product-header">
            {activeProduct.imageUrl ? (
              <img src={activeProduct.imageUrl} alt="" className="nutrition-thumb" />
            ) : (
              <div className="nutrition-thumb-fallback">
                <Utensils size={22} />
              </div>
            )}
            <div className="nutrition-title-area">
              <div className="nutrition-product-name">{activeProduct.name}</div>
              <div className="nutrition-product-brand">
                {activeProduct.brands || activeProduct.code} • {activeProduct.nutriments.calories100g.toFixed(2)} kcal {t.per100gSuffix}
              </div>
            </div>
            <button
              className="icon-btn"
              onClick={() => setActiveProduct(null)}
              aria-label={t.removeProduct}
              title={t.removeProduct}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="macros-grid">
            <div className="macro-box calories">
              <span className="macro-value">{liveNutrition.calories.toFixed(2)}</span>
              <span className="macro-label">kcal</span>
            </div>
            <div className="macro-box">
              <span className="macro-value">{liveNutrition.proteins.toFixed(2)}g</span>
              <span className="macro-label">{t.proteinLabel}</span>
            </div>
            <div className="macro-box">
              <span className="macro-value">{liveNutrition.carbs.toFixed(2)}g</span>
              <span className="macro-label">{t.carbsLabel}</span>
            </div>
            <div className="macro-box">
              <span className="macro-value">{liveNutrition.fat.toFixed(2)}g</span>
              <span className="macro-label">{t.fatLabel}</span>
            </div>
          </div>
        </section>
      )}

      <section className="feature-card" aria-label={t.timerAria}>
        <div className="card-header">
          <span>{t.timerTitle}</span>
          <span>{isTimerRunning ? t.timerRunning : t.timerStopped}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="timer-digits" aria-live="off">{formatTimer(timerSeconds)}</span>

          <div className="timer-actions">
            <button
              className="icon-btn"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              aria-label={isTimerRunning ? t.timerStop : t.timerStart}
            >
              {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              aria-label={t.timerReset}
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </section>

      {showCalModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCalModal(false)}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cal-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="cal-modal-title" className="modal-title">{t.calTitle}</h2>
              <button
                className="icon-btn"
                onClick={() => setShowCalModal(false)}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            <p className="modal-desc">
              {t.calDesc}
            </p>

            <div>
              <label htmlFor="cal-ref-weight" className="input-label">
                {t.calRefWeightLabel}
              </label>
              <input
                id="cal-ref-weight"
                type="number"
                className="input-field"
                value={refWeightGrams}
                onChange={(e) => setRefWeightGrams(e.target.value)}
                placeholder="500"
              />
            </div>

            <div>
              <label htmlFor="cal-raw-adc" className="input-label">
                {t.calRawAdcLabel}
              </label>
              <input
                id="cal-raw-adc"
                type="number"
                className="input-field"
                value={rawAdcInput}
                onChange={(e) => setRawAdcInput(e.target.value)}
                placeholder="210000"
              />
            </div>

            <div className="cal-result-box">
              <div className="cal-result-label">
                {t.calFactorTitle}
              </div>
              <div className="cal-result-value">
                {computedCalFactor()}
              </div>
            </div>

            <p className="modal-footer-note">
              {t.calNote}
            </p>

            <button
              className="btn btn-primary"
              onClick={() => setShowCalModal(false)}
            >
              {t.calDone}
            </button>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="settings-modal-title" className="modal-title">{t.settingsTitle}</h2>
              <button
                className="icon-btn"
                onClick={() => setShowSettingsModal(false)}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            <div className="settings-section">
              <div className="settings-section-header">
                <span className="settings-section-title">
                  <Sun size={15} aria-hidden="true" />
                  {t.themeSection}
                </span>
                <span className="settings-section-desc">{t.themeSectionDesc}</span>
              </div>

              <div className="theme-segmented" role="radiogroup" aria-label={t.themeSection}>
                <button
                  type="button"
                  className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                  role="radio"
                  aria-checked={theme === 'light'}
                >
                  <Sun size={18} aria-hidden="true" />
                  <span>{t.themeLightLabel}</span>
                </button>

                <button
                  type="button"
                  className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                  role="radio"
                  aria-checked={theme === 'dark'}
                >
                  <Moon size={18} aria-hidden="true" />
                  <span>{t.themeDarkLabel}</span>
                </button>

                <button
                  type="button"
                  className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                  role="radio"
                  aria-checked={theme === 'system'}
                >
                  <Monitor size={18} aria-hidden="true" />
                  <span>{t.themeSystemLabel}</span>
                </button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-header">
                <span className="settings-section-title">
                  <LanguagesIcon size={15} aria-hidden="true" />
                  {t.langSection}
                </span>
                <span className="settings-section-desc">{t.langSectionDesc}</span>
              </div>

              <div className="lang-grid" role="radiogroup" aria-label={t.langSection}>
                {LANGUAGES.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    className={`lang-card ${lang === opt.code ? 'active' : ''}`}
                    onClick={() => setLang(opt.code)}
                    role="radio"
                    aria-checked={lang === opt.code}
                  >
                    <div className="lang-card-left">
                      <span className="lang-badge">{opt.shortLabel}</span>
                      <span>{opt.label}</span>
                    </div>
                    {lang === opt.code && <Check size={16} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-about">
              <span>Smartcale ESP32</span>
              <span>{t.versionLabel} 1.1.0</span>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowSettingsModal(false)}
            >
              {t.calDone}
            </button>
          </div>
        </div>
      )}

      {showFoodModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowFoodModal(false);
            stopScanner();
          }}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="food-modal-title" className="modal-title">{t.foodNutritionTitle}</h2>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowFoodModal(false);
                  stopScanner();
                }}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="food-search-row">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.foodSearchPlaceholder}
                  aria-label={t.foodSearchPlaceholder}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 14px', flexShrink: 0 }}
                disabled={isSearching}
              >
                {isSearching ? t.searchingProducts : t.searchBtn}
              </button>

              <button
                type="button"
                className={`icon-btn btn-scan-camera ${isScanning ? 'scanning' : ''}`}
                onClick={isScanning ? stopScanner : startScanner}
                aria-label={isScanning ? t.stopScannerBtn : t.scanBarcodeBtn}
                title={isScanning ? t.stopScannerBtn : t.scanBarcodeBtn}
              >
                {isScanning ? <CameraOff size={18} /> : <ScanLine size={18} />}
              </button>
            </form>

            {isScanning && (
              <div className="scanner-container">
                {scannerSupported ? (
                  <>
                    <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
                    <div className="scanner-overlay">
                      <div className="scanner-guide-box">
                        <div className="scanner-laser" />
                      </div>
                      <span className="scanner-prompt">{t.scannerHint}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <AlertCircle size={24} style={{ color: 'var(--accent-amber)', marginBottom: '8px' }} />
                    <p>{t.scannerNotSupported}</p>
                  </div>
                )}
              </div>
            )}

            {searchError && (
              <div className="error-alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{searchError}</span>
              </div>
            )}

            <div className="products-results-list">
              {searchResults.map((product) => (
                <button
                  key={product.code}
                  type="button"
                  className="product-result-item"
                  onClick={() => {
                    setActiveProduct(product);
                    setShowFoodModal(false);
                    stopScanner();
                  }}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="nutrition-thumb" />
                  ) : (
                    <div className="nutrition-thumb-fallback">
                      <Utensils size={20} />
                    </div>
                  )}
                  <div className="product-result-info">
                    <div className="product-result-name">{product.name}</div>
                    <div className="product-result-sub">{product.brands || product.code}</div>
                    <div className="product-result-macros">
                      <span className="macro-chip protein">{t.proteinLabel}: {product.nutriments.proteins100g.toFixed(2)}g</span>
                      <span className="macro-chip carbs">{t.carbsLabel}: {product.nutriments.carbs100g.toFixed(2)}g</span>
                      <span className="macro-chip fat">{t.fatLabel}: {product.nutriments.fat100g.toFixed(2)}g</span>
                    </div>
                  </div>
                  <div className="product-result-badge">
                    {product.nutriments.calories100g.toFixed(2)} kcal
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Bottom Navigation">
        <button
          type="button"
          className={`bottom-nav-item ${connectionStatus === 'connected' ? 'connected' : ''}`}
          onClick={connectionStatus === 'connected' ? handleDisconnect : handleConnect}
          aria-label={connectionStatus === 'connected' ? t.disconnect : t.connectToScale}
        >
          <div className="nav-icon-wrapper">
            {connectionStatus === 'connected' ? (
              <BluetoothConnected size={20} aria-hidden="true" />
            ) : (
              <Bluetooth size={20} aria-hidden="true" />
            )}
            <span className={`nav-dot ${connectionStatus}`} />
          </div>
          <span>
            {connectionStatus === 'connected'
              ? (deviceName || t.connected)
              : connectionStatus === 'connecting'
              ? t.searching
              : t.connect}
          </span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${showFoodModal ? 'active' : ''}`}
          onClick={() => setShowFoodModal(true)}
          aria-label={t.foodSearchOrScan}
        >
          <ScanLine size={20} aria-hidden="true" />
          <span>{t.navFood}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${showCalModal ? 'active' : ''}`}
          onClick={() => setShowCalModal(true)}
          aria-label={t.calibrationAria}
        >
          <SlidersHorizontal size={20} aria-hidden="true" />
          <span>{t.navCal}</span>
        </button>

        <a
          className="bottom-nav-item"
          href="http://192.168.4.1"
          target="_blank"
          rel="noreferrer"
          aria-label={t.wifiPortalAria}
        >
          <Wifi size={20} aria-hidden="true" />
          <span>{t.navWifi}</span>
        </a>

        <button
          type="button"
          className={`bottom-nav-item ${showSettingsModal ? 'active' : ''}`}
          onClick={() => setShowSettingsModal(true)}
          aria-label={t.settingsBtnAria}
        >
          <Settings size={20} aria-hidden="true" />
          <span>{t.navSettings}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

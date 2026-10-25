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
  Trash2,
  ExternalLink,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronDown,
  ChevronUp,
  Cpu,
  Globe
} from 'lucide-react';
import { scaleBle } from './services/bleService';
import { foodService, calculateNutrition } from './services/foodService';
import { mealService, getLocalDateString } from './services/mealService';
import type { WeightUnit, ConnectionStatus } from './types/scale';
import type { FoodProduct } from './types/food';
import type { MealType } from './types/meal';
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
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showFoodModal, setShowFoodModal] = useState<boolean>(false);
  const [showDiaryModal, setShowDiaryModal] = useState<boolean>(false);
  const [showMealPicker, setShowMealPicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString);
  const [, setDiaryRevision] = useState<number>(0);
  const mealEntries = mealService.getByDate(selectedDate);
  const [logSuccessToast, setLogSuccessToast] = useState<string | null>(null);
  const [refWeightGrams, setRefWeightGrams] = useState<string>('500');
  const [rawAdcInput, setRawAdcInput] = useState<string>('210000');
  const [isCalOpen, setIsCalOpen] = useState<boolean>(false);

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
    if (!showSettingsModal && !showFoodModal && !showDiaryModal && !showMealPicker) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettingsModal(false);
        setShowFoodModal(false);
        setShowDiaryModal(false);
        setShowMealPicker(false);
        stopScanner();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettingsModal, showFoodModal, showDiaryModal, showMealPicker]);

  const handleLogMeal = (mealType: MealType) => {
    if (!activeProduct) return;
    const effectiveWeight = weightGrams > 0 ? weightGrams : 100;
    const scaled = calculateNutrition(activeProduct.nutriments, effectiveWeight);
    const today = getLocalDateString();

    const added = mealService.add({
      date: today,
      mealType,
      foodName: activeProduct.name,
      brand: activeProduct.brands,
      weightGrams: effectiveWeight,
      calories: scaled.calories,
      proteins: scaled.proteins,
      carbs: scaled.carbs,
      fat: scaled.fat,
    });

    setShowMealPicker(false);
    setDiaryRevision((r) => r + 1);

    const mealLabel = t[mealType];
    setLogSuccessToast(`${mealLabel}: ${activeProduct.name} (${added.weightGrams.toFixed(0)}g • ${added.calories.toFixed(2)} kcal)`);
    setTimeout(() => {
      setLogSuccessToast(null);
    }, 2800);
  };

  const handleDeleteEntry = (id: string) => {
    mealService.delete(id);
    setDiaryRevision((r) => r + 1);
  };

  const stepDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    setSelectedDate(getLocalDateString(dateObj));
  };

  const formatDisplayDate = (dateStr: string): string => {
    const todayStr = getLocalDateString();
    if (dateStr === todayStr) {
      return `${t.today} (${dateStr})`;
    }
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(lang, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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

          <div className="nutrition-actions-row">
            <button
              type="button"
              className="btn btn-primary btn-log-meal"
              onClick={() => setShowMealPicker(true)}
            >
              <Plus size={16} aria-hidden="true" />
              <span>{t.logMeal}</span>
            </button>
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

            <div className="settings-body">
              {/* Category 1: Device & Connectivity */}
              <div className="settings-group">
                <span className="settings-group-title">
                  <Cpu size={14} aria-hidden="true" />
                  {t.deviceSectionTitle}
                </span>

                {/* Bluetooth Device Card */}
                <div className="settings-card">
                  <div className="settings-card-left">
                    <div className="settings-card-icon">
                      {connectionStatus === 'connected' ? (
                        <BluetoothConnected size={18} style={{ color: 'var(--accent-green)' }} />
                      ) : (
                        <Bluetooth size={18} />
                      )}
                    </div>
                    <div className="settings-card-info">
                      <span className="settings-card-title">
                        {connectionStatus === 'connected' ? (deviceName || 'Smartcale ESP32') : 'Smartcale ESP32'}
                      </span>
                      <span className="settings-card-sub">
                        <span className={`nav-dot ${connectionStatus}`} style={{ position: 'static', display: 'inline-block' }} />
                        {connectionStatus === 'connected'
                          ? t.connected
                          : connectionStatus === 'connecting'
                          ? t.searching
                          : t.standby}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn ${connectionStatus === 'connected' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={connectionStatus === 'connected' ? handleDisconnect : handleConnect}
                    disabled={connectionStatus === 'connecting'}
                    style={{ minHeight: '36px', padding: '6px 12px', fontSize: '12px' }}
                  >
                    {connectionStatus === 'connected'
                      ? t.disconnect
                      : connectionStatus === 'connecting'
                      ? t.searching
                      : t.connect}
                  </button>
                </div>

                {/* Wi-Fi Setup Portal Row */}
                <div className="settings-card">
                  <div className="settings-card-left">
                    <div className="settings-card-icon">
                      <Wifi size={18} />
                    </div>
                    <div className="settings-card-info">
                      <span className="settings-card-title">{t.wifiSection}</span>
                      <span className="settings-card-sub">192.168.4.1</span>
                    </div>
                  </div>

                  <a
                    href="http://192.168.4.1"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      minHeight: '36px',
                      padding: '6px 12px',
                      fontSize: '12px',
                    }}
                  >
                    <span>{t.openWifiPortal}</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </div>

                {/* Advanced Calibration Accordion */}
                <div className="settings-accordion">
                  <button
                    type="button"
                    className="settings-accordion-header"
                    onClick={() => setIsCalOpen(!isCalOpen)}
                    aria-expanded={isCalOpen}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SlidersHorizontal size={15} />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{t.calAdvancedToggle}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="settings-tag">{computedCalFactor()}</span>
                      {isCalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isCalOpen && (
                    <div className="settings-accordion-content">
                      <p className="modal-desc" style={{ marginBottom: '8px', fontSize: '12px' }}>
                        {t.calDesc}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label htmlFor="cal-ref-weight" className="input-label" style={{ fontSize: '11px' }}>
                            {t.calRefWeightLabel}
                          </label>
                          <input
                            id="cal-ref-weight"
                            type="number"
                            className="input-field"
                            style={{ minHeight: '38px', padding: '6px 10px', fontSize: '13px' }}
                            value={refWeightGrams}
                            onChange={(e) => setRefWeightGrams(e.target.value)}
                            placeholder="500"
                          />
                        </div>

                        <div>
                          <label htmlFor="cal-raw-adc" className="input-label" style={{ fontSize: '11px' }}>
                            {t.calRawAdcLabel}
                          </label>
                          <input
                            id="cal-raw-adc"
                            type="number"
                            className="input-field"
                            style={{ minHeight: '38px', padding: '6px 10px', fontSize: '13px' }}
                            value={rawAdcInput}
                            onChange={(e) => setRawAdcInput(e.target.value)}
                            placeholder="210000"
                          />
                        </div>
                      </div>

                      <div className="cal-result-box" style={{ padding: '8px', marginTop: '8px' }}>
                        <div className="cal-result-label">{t.calFactorTitle}</div>
                        <div className="cal-result-value" style={{ fontSize: '20px' }}>{computedCalFactor()}</div>
                      </div>

                      <p className="modal-footer-note" style={{ textAlign: 'left', fontSize: '11px', marginTop: '6px' }}>
                        {t.calNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Category 2: Preferences */}
              <div className="settings-group">
                <span className="settings-group-title">
                  <Globe size={14} aria-hidden="true" />
                  {t.preferencesSectionTitle}
                </span>

                {/* Theme Selector */}
                <div className="settings-field-block">
                  <div className="settings-field-header">
                    <span className="settings-field-label">
                      <Sun size={14} aria-hidden="true" />
                      {t.themeSection}
                    </span>
                  </div>

                  <div className="theme-segmented" role="radiogroup" aria-label={t.themeSection}>
                    <button
                      type="button"
                      className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setTheme('light')}
                      role="radio"
                      aria-checked={theme === 'light'}
                    >
                      <Sun size={16} aria-hidden="true" />
                      <span>{t.themeLightLabel}</span>
                    </button>

                    <button
                      type="button"
                      className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setTheme('dark')}
                      role="radio"
                      aria-checked={theme === 'dark'}
                    >
                      <Moon size={16} aria-hidden="true" />
                      <span>{t.themeDarkLabel}</span>
                    </button>

                    <button
                      type="button"
                      className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                      onClick={() => setTheme('system')}
                      role="radio"
                      aria-checked={theme === 'system'}
                    >
                      <Monitor size={16} aria-hidden="true" />
                      <span>{t.themeSystemLabel}</span>
                    </button>
                  </div>
                </div>

                {/* Language Selector (Clean compact grid) */}
                <div className="settings-field-block">
                  <div className="settings-field-header">
                    <span className="settings-field-label">
                      <LanguagesIcon size={14} aria-hidden="true" />
                      {t.langSection}
                    </span>
                  </div>

                  <div className="lang-compact-grid" role="radiogroup" aria-label={t.langSection}>
                    {LANGUAGES.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        className={`lang-pill ${lang === opt.code ? 'active' : ''}`}
                        onClick={() => setLang(opt.code)}
                        role="radio"
                        aria-checked={lang === opt.code}
                      >
                        <span className="lang-badge">{opt.shortLabel}</span>
                        <span>{opt.label}</span>
                        {lang === opt.code && <Check size={14} aria-hidden="true" style={{ marginLeft: 'auto' }} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category 3: About */}
              <div className="settings-about" style={{ marginTop: '0', padding: '6px 0' }}>
                <span>Smartcale ESP32 • AtaCanYmc</span>
                <span>{t.versionLabel} 1.1.0</span>
              </div>
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

      {/* Quick Meal Picker Modal */}
      {showMealPicker && activeProduct && (
        <div
          className="modal-overlay"
          onClick={() => setShowMealPicker(false)}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-picker-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '360px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="meal-picker-title" className="modal-title">{t.selectMeal}</h2>
              <button
                className="icon-btn"
                onClick={() => setShowMealPicker(false)}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            <p className="modal-desc" style={{ marginBottom: '4px' }}>
              {activeProduct.name} ({weightGrams > 0 ? `${weightGrams.toFixed(0)}g` : `100g ${t.standby}`})
            </p>

            <div className="meal-picker-grid">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="meal-picker-btn"
                  onClick={() => handleLogMeal(m)}
                >
                  <Utensils size={18} />
                  <span>{t[m]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Diary / Calendar Modal */}
      {showDiaryModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDiaryModal(false)}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="diary-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="diary-modal-title" className="modal-title">{t.mealTitle}</h2>
              <button
                className="icon-btn"
                onClick={() => setShowDiaryModal(false)}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            {/* Date Navigator & Native Calendar Picker */}
            <div className="date-nav-bar">
              <button
                type="button"
                className="icon-btn"
                onClick={() => stepDate(-1)}
                aria-label="Previous day"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="date-picker-wrapper">
                <label htmlFor="diary-date-input" className="date-display-btn">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>{formatDisplayDate(selectedDate)}</span>
                </label>
                <input
                  id="diary-date-input"
                  type="date"
                  className="sr-date-input"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => stepDate(1)}
                aria-label="Next day"
              >
                <ChevronRight size={18} />
              </button>

              {selectedDate !== getLocalDateString() && (
                <button
                  type="button"
                  className="btn-today-chip"
                  onClick={() => setSelectedDate(getLocalDateString())}
                >
                  {t.today}
                </button>
              )}
            </div>

            <div className="settings-body">
              {/* Daily Total Summary Card */}
              <div className="day-summary-card">
                <div className="day-summary-header">
                  <span className="day-summary-title">{t.dailyTotal}</span>
                  <span className="day-summary-calories">
                    {mealService.calculateDaySummary(mealEntries).calories.toFixed(2)} kcal
                  </span>
                </div>

                <div className="day-summary-macros">
                  <div className="day-macro-box">
                    <span className="day-macro-value">
                      {mealService.calculateDaySummary(mealEntries).proteins.toFixed(2)}g
                    </span>
                    <span className="day-macro-label">{t.proteinLabel}</span>
                  </div>
                  <div className="day-macro-box">
                    <span className="day-macro-value">
                      {mealService.calculateDaySummary(mealEntries).carbs.toFixed(2)}g
                    </span>
                    <span className="day-macro-label">{t.carbsLabel}</span>
                  </div>
                  <div className="day-macro-box">
                    <span className="day-macro-value">
                      {mealService.calculateDaySummary(mealEntries).fat.toFixed(2)}g
                    </span>
                    <span className="day-macro-label">{t.fatLabel}</span>
                  </div>
                </div>
              </div>

              {/* Grouped Meals */}
              {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mType) => {
                const groupEntries = mealEntries.filter((e) => e.mealType === mType);
                const groupSummary = mealService.calculateDaySummary(groupEntries);

                return (
                  <div key={mType} className="meal-group">
                    <div className="meal-group-header">
                      <span>{t[mType]}</span>
                      {groupEntries.length > 0 && (
                        <span className="meal-group-cals">{groupSummary.calories.toFixed(2)} kcal</span>
                      )}
                    </div>

                    {groupEntries.length === 0 ? (
                      <div className="meal-empty-hint">-</div>
                    ) : (
                      groupEntries.map((item) => (
                        <div key={item.id} className="meal-item">
                          <div className="meal-item-info">
                            <span className="meal-item-name">{item.foodName}</span>
                            <span className="meal-item-sub">
                              {item.weightGrams.toFixed(0)}g {item.brand ? `• ${item.brand}` : ''}
                            </span>
                            <div className="meal-item-macros">
                              <span className="macro-chip protein">P: {item.proteins.toFixed(2)}g</span>
                              <span className="macro-chip carbs">K: {item.carbs.toFixed(2)}g</span>
                              <span className="macro-chip fat">Y: {item.fat.toFixed(2)}g</span>
                            </div>
                          </div>

                          <div className="meal-item-right">
                            <span className="meal-item-cals">{item.calories.toFixed(2)} kcal</span>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => handleDeleteEntry(item.id)}
                              aria-label={t.deleteEntry}
                              title={t.deleteEntry}
                              style={{ width: '32px', height: '32px', color: 'var(--accent-red)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}

              {mealEntries.length === 0 && (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Utensils size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '13px' }}>{t.noEntriesToday}</p>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowDiaryModal(false)}
            >
              {t.calDone}
            </button>
          </div>
        </div>
      )}

      {logSuccessToast && (
        <div className="log-toast" role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{logSuccessToast}</span>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Bottom Navigation">
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
          className={`bottom-nav-item ${showDiaryModal ? 'active' : ''}`}
          onClick={() => setShowDiaryModal(true)}
          aria-label={t.mealTitle}
        >
          <CalendarDays size={20} aria-hidden="true" />
          <span>{t.navDiary}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${showSettingsModal ? 'active' : ''}`}
          onClick={() => setShowSettingsModal(true)}
          aria-label={t.settingsBtnAria}
        >
          <div className="nav-icon-wrapper">
            <Settings size={20} aria-hidden="true" />
            <span className={`nav-dot ${connectionStatus}`} />
          </div>
          <span>{t.navSettings}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

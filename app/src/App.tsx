import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  Bluetooth,
  BluetoothConnected,
  RotateCcw,
  Play,
  Pause,
  SlidersHorizontal,
  Wifi,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Languages as LanguagesIcon
} from 'lucide-react';
import { scaleBle } from './services/bleService';
import type { WeightUnit, ConnectionStatus } from './types/scale';
import { translations, getInitialLanguage, LANGUAGES, type Language } from './i18n';

type ThemeMode = 'dark' | 'light';

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('smartscale-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
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

  // Calibration Modal
  const [showCalModal, setShowCalModal] = useState<boolean>(false);
  const [refWeightGrams, setRefWeightGrams] = useState<string>('500');
  const [rawAdcInput, setRawAdcInput] = useState<string>('210000');

  const [history, setHistory] = useState<number[]>(new Array(25).fill(0));
  const tareFeedbackTimeout = useRef<number | null>(null);
  const [isTared, setIsTared] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('smartscale-lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smartscale-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Close calibration modal with Escape key
  useEffect(() => {
    if (!showCalModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCalModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCalModal]);

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

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="brand-title">SmartScale</h1>
            <p className="brand-subtitle">{t.brandSubtitle}</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="lang-picker">
            <LanguagesIcon size={15} className="lang-icon" aria-hidden="true" />
            <select
              className="lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              aria-label={t.selectLanguage}
            >
              {LANGUAGES.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.shortLabel} - {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t.switchToLight : t.switchToDark}
            title={theme === 'dark' ? t.themeLight : t.themeDark}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>

          <button
            className={`status-pill ${connectionStatus}`}
            onClick={connectionStatus === 'connected' ? handleDisconnect : handleConnect}
            aria-label={connectionStatus === 'connected' ? t.disconnect : t.connectToScale}
          >
            <span className={`status-dot ${connectionStatus === 'connecting' ? 'pulse' : ''}`} aria-hidden="true" />
            {connectionStatus === 'connected' ? (
              <>
                <BluetoothConnected size={14} aria-hidden="true" />
                <span>{deviceName || t.connected}</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <span>{t.searching}</span>
            ) : (
              <>
                <Bluetooth size={14} aria-hidden="true" />
                <span>{t.connect}</span>
              </>
            )}
          </button>
        </div>
      </header>

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

      <div className="controls-grid">
        <button
          className="btn btn-primary btn-tare-huge"
          onClick={handleTare}
          aria-label={t.tareAria}
        >
          <RotateCcw size={22} aria-hidden="true" />
          <span>{t.tareBtn}</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setShowCalModal(true)}
          aria-label={t.calibrationAria}
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          <span>{t.calibrationBtn}</span>
        </button>

        <a
          className="btn btn-secondary"
          href="http://192.168.4.1"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'none' }}
          aria-label={t.wifiPortalAria}
        >
          <Wifi size={18} aria-hidden="true" />
          <span>{t.wifiPortalBtn}</span>
          <ExternalLink size={13} style={{ opacity: 0.6 }} aria-hidden="true" />
        </a>
      </div>

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
    </div>
  );
};

export default App;

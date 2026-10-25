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
  AlertCircle
} from 'lucide-react';
import { scaleBle } from './services/bleService';
import type { WeightUnit, ConnectionStatus } from './types/scale';

export const App: React.FC = () => {
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
      setErrorMessage(msg.includes('cancelled') ? 'Bağlantı iptal edildi' : 'Tartıya bağlanılamadı. Bluetooth açık mı?');
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
            <p className="brand-subtitle">ESP32-C3 GATT v1.0</p>
          </div>
        </div>

        <button
          className={`status-pill ${connectionStatus}`}
          onClick={connectionStatus === 'connected' ? handleDisconnect : handleConnect}
          aria-label={connectionStatus === 'connected' ? 'Bağlantıyı Kes' : 'Tartıya Bağlan'}
        >
          <span className={`status-dot ${connectionStatus === 'connecting' ? 'pulse' : ''}`} aria-hidden="true" />
          {connectionStatus === 'connected' ? (
            <>
              <BluetoothConnected size={14} aria-hidden="true" />
              <span>{deviceName || 'Bağlı'}</span>
            </>
          ) : connectionStatus === 'connecting' ? (
            <span>Aranıyor...</span>
          ) : (
            <>
              <Bluetooth size={14} aria-hidden="true" />
              <span>Bağlan</span>
            </>
          )}
        </button>
      </header>

      {errorMessage && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fca5a5'
          }}
        >
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
              color: '#fca5a5',
              cursor: 'pointer'
            }}
            aria-label="Hatayı kapat"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main className="scale-card">
        <div className="unit-selector" role="group" aria-label="Ağırlık birimi seçimi">
          {(['g', 'oz', 'ml'] as WeightUnit[]).map((u) => (
            <button
              key={u}
              className={`unit-btn ${unit === u ? 'active' : ''}`}
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
              aria-label={`${u.toUpperCase()} birimi`}
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
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgPoints}
            />
          </svg>
        </div>

        <div className="weight-meta">
          {isTared && (
            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} aria-hidden="true" /> Dara Alındı
            </span>
          )}
          {!isTared && (
            <span>{connectionStatus === 'connected' ? 'Canlı Akış (100ms)' : 'Demo / Beklemede'}</span>
          )}
        </div>
      </main>

      <div className="controls-grid">
        <button
          className="btn btn-primary btn-tare-huge"
          onClick={handleTare}
          aria-label="Tartının darasını al"
        >
          <RotateCcw size={22} aria-hidden="true" />
          <span>DARA AL (TARE)</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setShowCalModal(true)}
          aria-label="Kalibrasyon asistanını aç"
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          <span>Kalibrasyon</span>
        </button>

        <a
          className="btn btn-secondary"
          href="http://192.168.4.1"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'none' }}
          aria-label="Wi-Fi Kurulum Paneli (yeni sekmede açılır)"
        >
          <Wifi size={18} aria-hidden="true" />
          <span>Wi-Fi Paneli</span>
          <ExternalLink size={13} style={{ opacity: 0.6 }} aria-hidden="true" />
        </a>
      </div>

      <section className="feature-card" aria-label="Demleme Kronometresi">
        <div className="card-header">
          <span>KRONOMETRE & DEMLEME</span>
          <span>{isTimerRunning ? 'ÇALIŞIYOR' : 'DURDU'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="timer-digits" aria-live="off">{formatTimer(timerSeconds)}</span>

          <div className="timer-actions">
            <button
              className="icon-btn"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              aria-label={isTimerRunning ? 'Zamanlayıcıyı durdur' : 'Zamanlayıcıyı başlat'}
            >
              {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              aria-label="Zamanlayıcıyı sıfırla"
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
              <h2 id="cal-modal-title" className="modal-title">Kalibrasyon Asistanı</h2>
              <button
                className="icon-btn"
                onClick={() => setShowCalModal(false)}
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
              Tartınızın kalibrasyon katsayısını hesaplamak için bilinen bir ağırlık (örneğin 500g) kullanın:
            </p>

            <div>
              <label
                htmlFor="cal-ref-weight"
                style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}
              >
                Referans Ağırlık (Gram)
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
              <label
                htmlFor="cal-raw-adc"
                style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}
              >
                Okunan Ham Değer (Katsayı 1.0 iken)
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

            <div style={{
              background: '#0f172a',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid #334155',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>
                Hesaplanan Katsayı
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginTop: '2px' }}>
                {computedCalFactor()}
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#cbd5e1', textAlign: 'center' }}>
              Bu değeri 192.168.4.1 web arayüzüne girerek tartınıza kaydedebilirsiniz.
            </p>

            <button
              className="btn btn-primary"
              onClick={() => setShowCalModal(false)}
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

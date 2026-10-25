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

  // Sparkline history (last 25 points)
  const [history, setHistory] = useState<number[]>(new Array(25).fill(0));
  const tareFeedbackTimeout = useRef<number | null>(null);
  const [isTared, setIsTared] = useState<boolean>(false);

  // Timer interval
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
      {/* 1. Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
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
          title={connectionStatus === 'connected' ? 'Bağlantıyı Kes' : 'Tartıya Bağlan'}
        >
          <span className={`status-dot ${connectionStatus === 'connecting' ? 'pulse' : ''}`} />
          {connectionStatus === 'connected' ? (
            <>
              <BluetoothConnected size={14} />
              <span>{deviceName || 'Bağlı'}</span>
            </>
          ) : connectionStatus === 'connecting' ? (
            <span>Aranıyor...</span>
          ) : (
            <>
              <Bluetooth size={14} />
              <span>Bağlan</span>
            </>
          )}
        </button>
      </header>

      {/* Error alert if any */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#fca5a5'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Main Scale Weight Card */}
      <main className="scale-card">
        {/* Unit Selector */}
        <div className="unit-selector">
          {(['g', 'oz', 'ml'] as WeightUnit[]).map((u) => (
            <button
              key={u}
              className={`unit-btn ${unit === u ? 'active' : ''}`}
              onClick={() => setUnit(u)}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Big Weight Numbers */}
        <div className="weight-value-container">
          <span className="weight-digits">{formatWeight(weightGrams)}</span>
          <span className="weight-unit">{unit}</span>
        </div>

        {/* Live History SVG Sparkline */}
        <div style={{ width: '100%', height: '40px', padding: '0 10px', opacity: 0.8 }}>
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

        {/* Meta / Tare status */}
        <div className="weight-meta">
          {isTared && (
            <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Dara Alındı
            </span>
          )}
          {!isTared && (
            <span>{connectionStatus === 'connected' ? 'Canlı Akış (100ms)' : 'Demo / Beklemede'}</span>
          )}
        </div>
      </main>

      {/* 3. Action Controls Grid */}
      <div className="controls-grid">
        <button
          className="btn btn-primary btn-tare-huge"
          onClick={handleTare}
        >
          <RotateCcw size={22} />
          <span>DARA AL (TARE)</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setShowCalModal(true)}
        >
          <SlidersHorizontal size={18} />
          <span>Kalibrasyon</span>
        </button>

        <a
          className="btn btn-secondary"
          href="http://192.168.4.1"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <Wifi size={18} />
          <span>Wi-Fi Paneli</span>
          <ExternalLink size={13} style={{ opacity: 0.5 }} />
        </a>
      </div>

      {/* 4. Pour-Over Timer Card */}
      <section className="feature-card">
        <div className="card-header">
          <span>KRONOMETRE & DEMLEME</span>
          <span>{isTimerRunning ? 'ÇALIŞIYOR' : 'DURDU'}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="timer-digits">{formatTimer(timerSeconds)}</span>

          <div className="timer-actions">
            <button
              className="icon-btn"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={isTimerRunning ? 'Durdur' : 'Başlat'}
            >
              {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              title="Sıfırla"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Calibration Assistant Modal */}
      {showCalModal && (
        <div className="modal-overlay" onClick={() => setShowCalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="modal-title">Kalibrasyon Asistanı</h2>
              <button
                className="icon-btn"
                onClick={() => setShowCalModal(false)}
                style={{ width: '30px', height: '30px' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
              Tartınızın kalibrasyon katsayısını hesaplamak için bilinen bir ağırlık (örneğin 500g) kullanın:
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                Referans Ağırlık (Gram)
              </label>
              <input
                type="number"
                className="input-field"
                value={refWeightGrams}
                onChange={(e) => setRefWeightGrams(e.target.value)}
                placeholder="500"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                Okunan Ham Değer (Katsayı 1.0 iken)
              </label>
              <input
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
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
                Hesaplanan Katsayı
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginTop: '2px' }}>
                {computedCalFactor()}
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
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

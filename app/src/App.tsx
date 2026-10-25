import React, { useState, useEffect, useRef } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  RotateCcw,
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
  Globe,
  Home,
  Info,
  Code,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileText,
  UploadCloud,
  Share2,
  RefreshCw,
  Zap,
  ChefHat
} from 'lucide-react';
import logoUrl from './assets/logo.jpg';
import { scaleBle } from './services/bleService';
import { barcodeScanner } from './services/barcodeScanner';
import { recipeService, type RecipeIngredient } from './services/recipeService';
import { foodService, calculateNutrition, getOpenFoodFactsEditUrl } from './services/foodService';
import { mealService, getLocalDateString, downloadFile, generateAiPrompt } from './services/mealService';
import type { WeightUnit, ConnectionStatus } from './types/scale';
import type { FoodProduct } from './types/food';
import type { MealType } from './types/meal';
import { translations, getInitialLanguage, LANGUAGES, type Language } from './i18n';
import { WEEKDAY_NAMES_BY_LANG, getCalendarGrid } from './utils/calendar';
import { formatWeight, computeCalFactor, adjustCalFactor, calculateSparklinePoints } from './utils/scaleMath';

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
  const [bleReconnectInfo, setBleReconnectInfo] = useState<{ attempt: number; max: number } | null>(null);

  type AppTab = 'scale' | 'food' | 'diary' | 'about';
  const [activeTab, setActiveTab] = useState<AppTab>('scale');

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showMealPicker, setShowMealPicker] = useState<boolean>(false);
  const [showManualAddModal, setShowManualAddModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Manual Food Form State
  const [manualMealType, setManualMealType] = useState<MealType>('breakfast');
  const [manualFoodName, setManualFoodName] = useState<string>('');
  const [manualWeight, setManualWeight] = useState<string>('150');
  const [manualCalories, setManualCalories] = useState<string>('');
  const [manualProteins, setManualProteins] = useState<string>('');
  const [manualCarbs, setManualCarbs] = useState<string>('');
  const [manualFat, setManualFat] = useState<string>('');
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [manualBrand, setManualBrand] = useState<string>('');
  const [contributeToOff, setContributeToOff] = useState<boolean>(false);
  const [isContributing, setIsContributing] = useState<boolean>(false);

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString);
  const [, setDiaryRevision] = useState<number>(0);
  const mealEntries = mealService.getByDate(selectedDate);
  const [logSuccessToast, setLogSuccessToast] = useState<string | null>(null);
  const [refWeightGrams, setRefWeightGrams] = useState<string>('500');
  const [rawAdcInput, setRawAdcInput] = useState<string>('210000');
  const [isCalOpen, setIsCalOpen] = useState<boolean>(false);

  // Calibration Wizard State
  const [showCalWizard, setShowCalWizard] = useState<boolean>(false);
  const [calWizardStep, setCalWizardStep] = useState<number>(1);
  const [calRefPreset, setCalRefPreset] = useState<number>(500);
  const [calCustomWeight, setCalCustomWeight] = useState<string>('500');
  const [calCurrentFactor, setCalCurrentFactor] = useState<string>('420.0');
  const [isCalApplying, setIsCalApplying] = useState<boolean>(false);
  const [calSuccessMsg, setCalSuccessMsg] = useState<string | null>(null);

  // Recipe Mode State
  const [showRecipeModal, setShowRecipeModal] = useState<boolean>(false);
  const [recipeTitle, setRecipeTitle] = useState<string>('');
  const [recipeServings, setRecipeServings] = useState<number>(4);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [recipeActiveName, setRecipeActiveName] = useState<string>('');
  const [recipeSuccessToast, setRecipeSuccessToast] = useState<string | null>(null);

  const handleGoHome = () => {
    setActiveTab('scale');
    setShowSettingsModal(false);
    setShowMealPicker(false);
    setShowManualAddModal(false);
    setShowExportModal(false);
    setShowCalendarModal(false);
    setShowCalWizard(false);
    setShowRecipeModal(false);
    stopScanner();
  };

  // Food & Barcode state
  const [activeProduct, setActiveProduct] = useState<FoodProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>('');
  const [homeSearchResults, setHomeSearchResults] = useState<FoodProduct[]>([]);
  const [isHomeSearching, setIsHomeSearching] = useState<boolean>(false);
  const [homeSearchError, setHomeSearchError] = useState<string | null>(null);
  const [showHomeSearch, setShowHomeSearch] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerSupported, setScannerSupported] = useState<boolean>(true);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [history, setHistory] = useState<number[]>(new Array(25).fill(0));
  const tareFeedbackTimeout = useRef<number | null>(null);
  const [isTared, setIsTared] = useState<boolean>(false);

  // Stop scanner safely
  const stopScanner = () => {
    barcodeScanner.stop();
    setIsScanning(false);
    setHasTorch(false);
    setIsTorchOn(false);
  };

  const handleBarcodeScanned = async (rawVal: string) => {
    stopScanner();
    setSearchQuery(rawVal);
    setIsSearching(true);
    setSearchError(null);
    try {
      const found = await foodService.getByBarcode(rawVal);
      if (found) {
        setActiveProduct(found);
        setSearchResults([found]);
        setSearchError(null);
      } else {
        setSearchResults([]);
        setSearchError(`${t.noProductsFound} (${rawVal})`);
      }
    } catch (err) {
      console.error('Barcode lookup error:', err);
      setSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  };

  const startScanner = async () => {
    setSearchError(null);
    if (!barcodeScanner.isSupported()) {
      setScannerSupported(false);
      setIsScanning(true);
      return;
    }

    setScannerSupported(true);
    setIsScanning(true);

    // Wait for video element to mount in the DOM
    setTimeout(async () => {
      if (!videoRef.current) return;
      try {
        await barcodeScanner.start(
          videoRef.current,
          (barcode) => {
            handleBarcodeScanned(barcode);
          },
          (err) => {
            console.warn('Scanner warning:', err);
          }
        );
        setHasTorch(barcodeScanner.hasTorch());
      } catch (err) {
        console.error('Camera scanner start error:', err);
        stopScanner();
        setSearchError(t.connFailed);
      }
    }, 120);
  };

  const handleToggleTorch = async () => {
    const nextTorch = await barcodeScanner.toggleTorch();
    setIsTorchOn(nextTorch);
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

  const handleHomeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = homeSearchQuery.trim();
    if (!query) return;

    setIsHomeSearching(true);
    setHomeSearchError(null);

    try {
      if (/^\d{8,14}$/.test(query)) {
        const direct = await foodService.getByBarcode(query);
        if (direct) {
          setHomeSearchResults([direct]);
          setIsHomeSearching(false);
          return;
        }
      }

      const results = await foodService.search(query);
      setHomeSearchResults(results);
      if (results.length === 0) {
        setHomeSearchError(t.noProductsFound);
      }
    } catch (err) {
      console.error('Home search error:', err);
      setHomeSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsHomeSearching(false);
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
    if (!showSettingsModal && !showMealPicker && !showManualAddModal && !showExportModal && !showCalendarModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettingsModal(false);
        setShowMealPicker(false);
        setShowManualAddModal(false);
        setShowExportModal(false);
        setShowCalendarModal(false);
        stopScanner();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettingsModal, showMealPicker, showManualAddModal, showExportModal, showCalendarModal]);

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const foodName = manualFoodName.trim();
    if (!foodName) return;

    const cals = parseFloat(manualCalories);
    const weight = parseFloat(manualWeight) || 100;
    if (isNaN(cals) || cals < 0) return;

    const added = mealService.add({
      date: selectedDate,
      mealType: manualMealType,
      foodName,
      brand: manualBrand.trim() || undefined,
      weightGrams: weight,
      calories: cals,
      proteins: parseFloat(manualProteins) || 0,
      carbs: parseFloat(manualCarbs) || 0,
      fat: parseFloat(manualFat) || 0,
    });

    const barcodeToUpload = manualBarcode.trim();
    const willContribute = contributeToOff && barcodeToUpload.length >= 8;

    if (willContribute) {
      setIsContributing(true);
      try {
        const factor = weight > 0 ? 100 / weight : 1;
        const uploadResult = await foodService.uploadProduct({
          code: barcodeToUpload,
          name: foodName,
          brand: manualBrand.trim() || undefined,
          calories100g: Math.round(cals * factor * 100) / 100,
          proteins100g: Math.round((parseFloat(manualProteins) || 0) * factor * 100) / 100,
          carbs100g: Math.round((parseFloat(manualCarbs) || 0) * factor * 100) / 100,
          fat100g: Math.round((parseFloat(manualFat) || 0) * factor * 100) / 100,
        });

        if (uploadResult.success) {
          setLogSuccessToast(t.contributeSuccessToast);
        } else {
          setLogSuccessToast(`${t[manualMealType]}: ${added.foodName} (${added.weightGrams.toFixed(0)}g • ${added.calories.toFixed(2)} kcal)`);
        }
      } catch (err) {
        console.error('OFF contribution error:', err);
        setLogSuccessToast(`${t[manualMealType]}: ${added.foodName} (${added.weightGrams.toFixed(0)}g • ${added.calories.toFixed(2)} kcal)`);
      } finally {
        setIsContributing(false);
      }
    } else {
      setLogSuccessToast(`${t[manualMealType]}: ${added.foodName} (${added.weightGrams.toFixed(0)}g • ${added.calories.toFixed(2)} kcal)`);
    }

    setShowManualAddModal(false);
    setDiaryRevision((r) => r + 1);
    setManualFoodName('');
    setManualCalories('');
    setManualProteins('');
    setManualCarbs('');
    setManualFat('');
    setManualBarcode('');
    setManualBrand('');
    setContributeToOff(false);

    setTimeout(() => setLogSuccessToast(null), 3200);
  };

  const handleExportJSON = () => {
    const data = mealService.exportAsJSON();
    downloadFile(data, `smartcale-diary-${selectedDate}.json`, 'application/json');
    setShowExportModal(false);
  };

  const handleExportCSV = () => {
    const data = mealService.exportAsCSV();
    downloadFile(data, `smartcale-diary-${selectedDate}.csv`, 'text/csv;charset=utf-8;');
    setShowExportModal(false);
  };

  const handleShareAi = async () => {
    if (mealEntries.length === 0) {
      setLogSuccessToast(t.noEntriesToday);
      setTimeout(() => setLogSuccessToast(null), 2500);
      return;
    }

    const mealLabels: Record<MealType, string> = {
      breakfast: t.breakfast,
      lunch: t.lunch,
      dinner: t.dinner,
      snack: t.snack,
    };

    const promptText = generateAiPrompt(selectedDate, mealEntries, mealLabels);

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `Smartcale - ${selectedDate}`,
          text: promptText,
        });
        return;
      } catch {
        // User cancelled or unsupported target -> fall through to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(promptText);
        setLogSuccessToast(t.shareAiSuccessToast);
        setTimeout(() => setLogSuccessToast(null), 3200);
      } catch (err) {
        console.error('Clipboard write error:', err);
      }
    }
  };

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

  // Connect BLE handler
  const handleConnect = async (directReconnect = false) => {
    try {
      setConnectionStatus('connecting');
      setErrorMessage(null);
      setBleReconnectInfo(null);

      const callbacks = {
        onWeightUpdate: (weight: number) => {
          setWeightGrams(weight);
          setHistory((prev) => [...prev.slice(1), weight]);
        },
        onDisconnected: (unexpected: boolean) => {
          if (!unexpected) {
            setConnectionStatus('disconnected');
            setDeviceName('');
            setBleReconnectInfo(null);
          } else {
            setConnectionStatus('reconnecting');
            setErrorMessage(t.bleLostWarning);
          }
        },
        onReconnecting: (attempt: number, maxAttempts: number) => {
          setConnectionStatus('reconnecting');
          setBleReconnectInfo({ attempt, max: maxAttempts });
          setErrorMessage(`${t.bleLostWarning} ${t.bleReconnecting} (${attempt}/${maxAttempts})`);
        },
        onReconnected: (name: string) => {
          setConnectionStatus('connected');
          setDeviceName(name);
          setErrorMessage(null);
          setBleReconnectInfo(null);
          setLogSuccessToast(t.bleReconnectedToast);
          window.setTimeout(() => setLogSuccessToast(null), 3000);
        },
        onReconnectFailed: () => {
          setConnectionStatus('disconnected');
          setBleReconnectInfo(null);
          setErrorMessage(t.bleReconnectFailed);
        },
      };

      let name: string;
      if (directReconnect && scaleBle.getLastDeviceId()) {
        try {
          name = await scaleBle.reconnect(callbacks);
        } catch {
          name = await scaleBle.connect(callbacks);
        }
      } else {
        name = await scaleBle.connect(callbacks);
      }

      setDeviceName(name);
      setConnectionStatus('connected');
      setErrorMessage(null);
    } catch (err: unknown) {
      console.error('BLE connection error:', err);
      setConnectionStatus('error');
      setBleReconnectInfo(null);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg.includes('cancelled') ? t.connCancelled : t.connFailed);
    }
  };

  const handleDisconnect = async () => {
    await scaleBle.disconnect();
    setConnectionStatus('disconnected');
    setDeviceName('');
    setBleReconnectInfo(null);
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

  const computedFactor = computeCalFactor(rawAdcInput, refWeightGrams);
  const svgPoints = calculateSparklinePoints(history);

  const effectiveRefWeight = calRefPreset > 0 ? calRefPreset : (parseFloat(calCustomWeight) || 500);
  const wizardComputedFactor = connectionStatus === 'connected' && weightGrams > 0
    ? adjustCalFactor(calCurrentFactor, weightGrams, effectiveRefWeight)
    : computeCalFactor(rawAdcInput, String(effectiveRefWeight));

  const handleApplyCalibration = async () => {
    try {
      setIsCalApplying(true);
      await scaleBle.sendCalibration(wizardComputedFactor);
      setCalCurrentFactor(wizardComputedFactor);
      setCalSuccessMsg(t.calAppliedSuccess);
      setLogSuccessToast(t.calAppliedSuccess);
      window.setTimeout(() => setLogSuccessToast(null), 3000);
    } catch (err) {
      console.error('Calibration send failed:', err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCalApplying(false);
    }
  };

  const handleCopyFactor = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(wizardComputedFactor);
      setLogSuccessToast(t.calCopiedToast);
      window.setTimeout(() => setLogSuccessToast(null), 3000);
    }
  };

  // Recipe Mode Calculations and Handlers
  const recipeTotals = recipeService.calculateTotals(recipeIngredients);
  const recipePerServing = recipeService.calculatePerServing(recipeTotals, recipeServings);

  const handleAddIngredientAndTare = async () => {
    const w = Math.round(weightGrams * 10) / 10;
    if (w <= 0) return;

    const name = recipeActiveName.trim() || `${t.recipeIngredientsTitle} #${recipeIngredients.length + 1}`;
    let newIngredient: RecipeIngredient;

    if (activeProduct) {
      newIngredient = recipeService.createIngredientFromProduct(activeProduct, w);
    } else {
      newIngredient = recipeService.createManualIngredient(name, w);
    }

    setRecipeIngredients((prev) => [...prev, newIngredient]);
    setRecipeActiveName('');

    try {
      await handleTare();
    } catch {
      // ignore
    }

    setRecipeSuccessToast(`+ ${newIngredient.name} (${w}g)`);
    window.setTimeout(() => setRecipeSuccessToast(null), 2500);
  };

  const handleRemoveIngredient = (id: string) => {
    setRecipeIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearRecipe = () => {
    setRecipeIngredients([]);
    setRecipeTitle('');
    setRecipeActiveName('');
  };

  const handleLogRecipeToDiary = () => {
    if (recipeIngredients.length === 0) return;
    const title = recipeTitle.trim() || 'Özel Tarif / Karışım';
    mealService.add({
      date: selectedDate,
      mealType: 'snack',
      foodName: title,
      weightGrams: recipeTotals.totalWeight,
      calories: recipeTotals.calories,
      proteins: recipeTotals.proteins,
      carbs: recipeTotals.carbs,
      fat: recipeTotals.fat,
    });
    setDiaryRevision((r) => r + 1);
    setLogSuccessToast(t.recipeAddedToDiaryToast);
    window.setTimeout(() => setLogSuccessToast(null), 3000);
    setShowRecipeModal(false);
  };

  const handleShareRecipeAi = async () => {
    if (recipeIngredients.length === 0) return;
    const promptText = recipeService.generateAiRecipePrompt(recipeTitle, recipeIngredients, recipeServings);

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: recipeTitle || t.recipeModeTitle,
          text: promptText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(promptText);
      setLogSuccessToast(t.shareAiSuccessToast);
      window.setTimeout(() => setLogSuccessToast(null), 3000);
    }
  };

  const liveNutrition = activeProduct
    ? calculateNutrition(activeProduct.nutriments, weightGrams)
    : null;

  return (
    <div className="app-container">
      {errorMessage && (
        <div role="alert" className={`error-alert ${connectionStatus === 'reconnecting' ? 'warning-alert' : ''}`}>
          {connectionStatus === 'reconnecting' ? (
            <RefreshCw size={16} className="spin" aria-hidden="true" />
          ) : (
            <AlertCircle size={16} aria-hidden="true" />
          )}
          <span style={{ flex: 1 }}>{errorMessage}</span>
          {connectionStatus === 'disconnected' && scaleBle.getLastDeviceId() && (
            <button
              type="button"
              onClick={() => handleConnect(true)}
              className="btn btn-secondary"
              style={{
                minHeight: '32px',
                padding: '4px 10px',
                fontSize: '12px',
                marginRight: '6px',
                borderRadius: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              {t.retryBtn}
            </button>
          )}
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

      {activeTab === 'scale' ? (
        <>
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
              <span className="weight-digits">{formatWeight(weightGrams, unit)}</span>
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
                <span>
                  {connectionStatus === 'connected' ? (
                    t.liveStream
                  ) : connectionStatus === 'reconnecting' ? (
                    <span style={{ color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <RefreshCw size={12} className="spin" aria-hidden="true" />
                      {bleReconnectInfo
                        ? `${t.bleReconnecting} (${bleReconnectInfo.attempt}/${bleReconnectInfo.max})`
                        : t.bleReconnecting}
                    </span>
                  ) : (
                    t.standby
                  )}
                </span>
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

          {/* Quick Recipe / Mixing Mode Action */}
          <div className="home-recipe-trigger-row">
            <button
              type="button"
              className="btn btn-secondary btn-home-recipe"
              onClick={() => setShowRecipeModal(true)}
            >
              <ChefHat size={18} style={{ color: 'var(--accent-amber, #f59e0b)' }} />
              <span>{t.recipeModeTitle}</span>
              {recipeIngredients.length > 0 && (
                <span className="recipe-count-badge">{recipeIngredients.length}</span>
              )}
            </button>
          </div>

          {/* Home Screen Nutrition & Search Section */}
          <section className="home-nutrition-section" aria-label={t.foodNutritionTitle}>
            <div className="home-nutrition-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={16} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {t.foodNutritionTitle}
                </span>
              </div>
              {activeProduct && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ minWidth: '32px', minHeight: '32px', width: '32px', height: '32px' }}
                    onClick={() => setShowHomeSearch((prev) => !prev)}
                    title={showHomeSearch ? t.cancelBtn : t.searchBtn}
                    aria-label={showHomeSearch ? t.cancelBtn : t.searchBtn}
                  >
                    <Search size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ minWidth: '32px', minHeight: '32px', width: '32px', height: '32px' }}
                    onClick={() => {
                      setActiveProduct(null);
                      setShowHomeSearch(true);
                    }}
                    title={t.removeProduct}
                    aria-label={t.removeProduct}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Inline Search: visible when no product is selected OR user clicked search toggle */}
            {(!activeProduct || showHomeSearch) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <form onSubmit={handleHomeSearch} className="food-search-row" style={{ marginTop: '2px' }}>
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" aria-hidden="true" />
                    <input
                      type="text"
                      value={homeSearchQuery}
                      onChange={(e) => setHomeSearchQuery(e.target.value)}
                      placeholder={t.foodSearchPlaceholder}
                      aria-label={t.foodSearchPlaceholder}
                    />
                    {homeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setHomeSearchQuery('');
                          setHomeSearchResults([]);
                          setHomeSearchError(null);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 6px', display: 'flex' }}
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', flexShrink: 0, minHeight: '40px' }}
                    disabled={isHomeSearching}
                  >
                    {isHomeSearching ? t.searchingProducts : t.searchBtn}
                  </button>
                </form>

                {homeSearchError && (
                  <div className="error-alert" style={{ fontSize: '12px', padding: '8px 12px' }}>
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>{homeSearchError}</span>
                  </div>
                )}

                {/* Inline Results List */}
                {homeSearchResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                    {homeSearchResults.map((prod) => (
                      <div
                        key={prod.code}
                        className="home-search-result-item"
                        onClick={() => {
                          setActiveProduct(prod);
                          setHomeSearchResults([]);
                          setHomeSearchQuery('');
                          setShowHomeSearch(false);
                          setHomeSearchError(null);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setActiveProduct(prod);
                            setHomeSearchResults([]);
                            setHomeSearchQuery('');
                            setShowHomeSearch(false);
                            setHomeSearchError(null);
                          }
                        }}
                      >
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt="" className="home-search-thumb" />
                        ) : (
                          <div className="home-search-thumb-fallback">
                            <Utensils size={16} />
                          </div>
                        )}
                        <div className="home-search-info">
                          <span className="home-search-name">{prod.name}</span>
                          <span className="home-search-brand">{prod.brands || prod.code}</span>
                        </div>
                        <div className="home-search-kcal">
                          {prod.nutriments.calories100g.toFixed(1)} kcal
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Product Details & Live Macro Scaling from Scale Weight */}
            {activeProduct && liveNutrition && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: showHomeSearch ? '8px' : '0' }}>
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
              </div>
            )}
          </section>
        </>
      ) : activeTab === 'food' ? (
        <div className="food-screen">
          <div className="food-screen-header">
            <div className="food-title-area">
              <h1 className="food-screen-title">{t.foodNutritionTitle}</h1>
              <span className="food-screen-sub">{t.foodSearchPlaceholder}</span>
            </div>

            <div className="food-header-actions">
              <button
                type="button"
                className="btn btn-primary btn-header-action"
                onClick={() => {
                  setManualMealType('breakfast');
                  setShowManualAddModal(true);
                }}
                title={t.manualAddBtn}
                aria-label={t.manualAddBtn}
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="food-search-row">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
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
                    {hasTorch && (
                      <button
                        type="button"
                        className={`scanner-torch-btn ${isTorchOn ? 'active' : ''}`}
                        onClick={handleToggleTorch}
                        aria-label="Toggle Flashlight"
                        title="Flaş / Torch"
                      >
                        <Zap size={16} />
                      </button>
                    )}
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

          {/* Unknown barcode / product not found contribute callout */}
          {searchQuery.trim().length >= 8 && /^\d+$/.test(searchQuery.trim()) && searchResults.length === 0 && !isSearching && (
            <div
              style={{
                marginTop: '12px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                textAlign: 'center',
              }}
            >
              <Globe size={26} style={{ color: 'var(--accent-blue)', margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                {t.productNotFoundAdd}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                {t.productNotFoundDesc}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '340px', margin: '0 auto' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setManualBarcode(searchQuery.trim());
                    setContributeToOff(true);
                    setManualMealType('breakfast');
                    setShowManualAddModal(true);
                  }}
                >
                  <Plus size={15} />
                  <span>{t.productNotFoundAdd} ({searchQuery.trim()})</span>
                </button>
                <a
                  href={getOpenFoodFactsEditUrl(searchQuery.trim())}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <UploadCloud size={15} />
                  <span>{t.openInOffWeb}</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}

          {searchResults.length > 0 ? (
            <div className="products-results-list" style={{ maxHeight: 'none', overflowY: 'visible' }}>
              {searchResults.map((product) => (
                <div key={product.code} className="product-result-card">
                  <div className="product-result-header">
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
                  </div>

                  <div className="product-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-product-action"
                      onClick={() => {
                        setActiveProduct(product);
                        stopScanner();
                        setActiveTab('scale');
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>{t.weighOnScale}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-product-action"
                      onClick={() => {
                        setActiveProduct(product);
                        stopScanner();
                        setShowMealPicker(true);
                      }}
                    >
                      <Plus size={14} />
                      <span>{t.logMeal}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isSearching && (
              <div className="food-empty-card">
                <Search size={36} style={{ margin: '0 auto 10px', opacity: 0.35, color: 'var(--accent-blue)' }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {t.foodNutritionTitle}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto 16px', lineHeight: 1.4 }}>
                  {t.foodScreenHint}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ margin: '0 auto', minHeight: '40px', padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => {
                    setManualMealType('breakfast');
                    setShowManualAddModal(true);
                  }}
                >
                  <Plus size={15} />
                  <span>{t.manualAddBtn}</span>
                </button>
              </div>
            )
          )}
        </div>
      ) : activeTab === 'diary' ? (
        <div className="diary-screen">
          <div className="diary-screen-header">
            <div className="diary-title-area">
              <h1 className="diary-screen-title">{t.mealTitle}</h1>
              <span className="diary-screen-sub">{mealEntries.length} {t.logMeal.toLowerCase()}</span>
            </div>

            <div className="diary-header-actions">
              <button
                type="button"
                className="btn btn-secondary btn-header-action"
                onClick={handleShareAi}
                title={t.shareAiBtn}
                aria-label={t.shareAiBtn}
              >
                <Share2 size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-header-action"
                onClick={() => setShowExportModal(true)}
                title={t.exportDataBtn}
                aria-label={t.exportDataBtn}
              >
                <Download size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="btn btn-primary btn-header-action"
                onClick={() => {
                  setManualMealType('breakfast');
                  setShowManualAddModal(true);
                }}
                title={t.manualAddBtn}
                aria-label={t.manualAddBtn}
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
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

            <button
              type="button"
              className="date-display-btn"
              onClick={() => {
                const [y, m, d] = selectedDate.split('-').map(Number);
                setCalendarViewDate(new Date(y, (m || 1) - 1, d || 1));
                setShowCalendarModal(true);
              }}
              aria-label={t.selectDate}
              title={t.selectDate}
            >
              <CalendarDays size={16} aria-hidden="true" />
              <span>{formatDisplayDate(selectedDate)}</span>
            </button>

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{t[mType]}</span>
                    {groupEntries.length > 0 && (
                      <span className="meal-group-cals">{groupSummary.calories.toFixed(2)} kcal</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-meal-add-pill"
                    onClick={() => {
                      setManualMealType(mType);
                      setShowManualAddModal(true);
                    }}
                    title={t.quickAddMeal}
                  >
                    <Plus size={13} />
                    <span>{t.quickAddMeal}</span>
                  </button>
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
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Utensils size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '13px' }}>{t.noEntriesToday}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="about-screen">
          <div className="about-screen-header">
            <div className="about-title-area">
              <h1 className="about-screen-title">{t.aboutTitle}</h1>
              <span className="about-screen-sub">{t.aboutTagline}</span>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={handleGoHome}
              aria-label={t.navHome}
              title={t.navHome}
            >
              <Home size={18} />
            </button>
          </div>

          {/* Hero branding */}
          <div className="about-hero">
            <img src={logoUrl} alt="Smartcale Logo" className="about-logo" />
            <h2 className="about-app-name">Smartcale ESP32</h2>
            <p className="about-tagline">{t.aboutTagline}</p>
            <div className="about-badges-row">
              <span className="about-badge version">v1.1.0</span>
              <span className="about-badge tag">ESP32-C3 GATT</span>
              <span className="about-badge license">Apache 2.0 License</span>
            </div>
          </div>

          {/* Developer & GitHub Card */}
          <div className="about-section">
            <span className="settings-group-title">
              <Code size={14} aria-hidden="true" />
              {t.aboutDeveloper} & {t.aboutOpenSource}
            </span>

            <div className="about-card">
              <div className="about-dev-row">
                <div className="about-dev-avatar">AC</div>
                <div className="about-dev-info">
                  <span className="about-dev-name">Ata Can Yaymacı</span>
                </div>
              </div>

              <a
                href="https://github.com/AtaCanYmc/SmartcaleESP32"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary about-github-btn"
              >
                <Code size={15} />
                <span>github.com/AtaCanYmc/SmartcaleESP32</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Open Food Facts API & Database Card */}
          <div className="about-section">
            <span className="settings-group-title">
              <Globe size={14} aria-hidden="true" />
              {t.aboutApiTitle}
            </span>

            <div className="about-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Open Food Facts REST API v2
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {t.aboutApiDesc}
                </span>
                <div className="about-badges-row" style={{ justifyContent: 'flex-start', marginTop: '2px' }}>
                  <span className="about-badge version">JSON REST API</span>
                  <span className="about-badge license">ODbL / DbCL</span>
                  <span className="about-badge tag">3M+ Products</span>
                </div>
                <div style={{ marginTop: '8px', padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                    {t.offCommunityContribution}
                  </strong>
                  {t.offCommunityDesc}
                </div>
              </div>

              <a
                href="https://world.openfoodfacts.org"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary about-github-btn"
              >
                <Globe size={15} />
                <span>world.openfoodfacts.org</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Hardware & Tech Specs */}
          <div className="about-section">
            <span className="settings-group-title">
              <Cpu size={14} aria-hidden="true" />
              {t.aboutHardwareTitle}
            </span>

            <div className="about-specs-grid">
              <div className="about-spec-item">
                <span className="about-spec-label">MCU</span>
                <span className="about-spec-val">ESP32-C3 SuperMini</span>
                <span className="about-spec-desc">RISC-V 160MHz 32-bit</span>
              </div>

              <div className="about-spec-item">
                <span className="about-spec-label">ADC & Sensor</span>
                <span className="about-spec-val">HX711 (24-bit)</span>
                <span className="about-spec-desc">Strain Gauge Load Cell</span>
              </div>

              <div className="about-spec-item">
                <span className="about-spec-label">Wireless</span>
                <span className="about-spec-val">BLE 5.0 + Wi-Fi</span>
                <span className="about-spec-desc">Custom GATT + SoftAP</span>
              </div>

              <div className="about-spec-item">
                <span className="about-spec-label">Software Stack</span>
                <span className="about-spec-val">React 19 + Capacitor 8</span>
                <span className="about-spec-desc">Vite, TypeScript, iOS/Android</span>
              </div>
            </div>
          </div>

          {/* Key Features List */}
          <div className="about-section">
            <span className="settings-group-title">
              <Sparkles size={14} aria-hidden="true" />
              {t.aboutFeaturesTitle}
            </span>

            <div className="about-features-card">
              <div className="about-feature-row">
                <div className="about-feature-bullet" />
                <span>Hassas Canlı Ağırlık Akışı & Tek Tıkla Dara (Tare)</span>
              </div>
              <div className="about-feature-row">
                <div className="about-feature-bullet" />
                <span>Open Food Facts Entegrasyonu & Barkod Tarayıcı</span>
              </div>
              <div className="about-feature-row">
                <div className="about-feature-bullet" />
                <span>Çevrimdışı Günlük Öğün Takibi & Takvim Geçmişi</span>
              </div>
              <div className="about-feature-row">
                <div className="about-feature-bullet" />
                <span>Wi-Fi Portal Erişimi & Yerleşik 2 Noktalı Kalibrasyon</span>
              </div>
              <div className="about-feature-row">
                <div className="about-feature-bullet" />
                <span>5 Dil (TR/EN/DE/FR/ES) & Otomatik Açık/Koyu Tema</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGoHome}
          >
            <Home size={16} aria-hidden="true" />
            <span>{t.navHome}</span>
          </button>
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
            <div className="modal-header">
              <h2 id="settings-modal-title" className="modal-title">{t.settingsTitle}</h2>
              <button
                type="button"
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
                          : connectionStatus === 'reconnecting'
                          ? (bleReconnectInfo ? `${t.bleReconnecting} (${bleReconnectInfo.attempt}/${bleReconnectInfo.max})` : t.bleReconnecting)
                          : t.standby}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn ${connectionStatus === 'connected' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={connectionStatus === 'connected' ? handleDisconnect : () => handleConnect(false)}
                    disabled={connectionStatus === 'connecting' || connectionStatus === 'reconnecting'}
                    style={{ minHeight: '36px', padding: '6px 12px', fontSize: '12px' }}
                  >
                    {connectionStatus === 'connected'
                      ? t.disconnect
                      : connectionStatus === 'connecting'
                      ? t.searching
                      : connectionStatus === 'reconnecting'
                      ? t.bleReconnecting
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

                {/* Calibration Wizard Launch Card */}
                <div className="settings-card">
                  <div className="settings-card-left">
                    <div className="settings-card-icon">
                      <SlidersHorizontal size={18} />
                    </div>
                    <div className="settings-card-info">
                      <span className="settings-card-title">{t.calWizardTitle}</span>
                      <span className="settings-card-sub">{t.calWizardSub}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setCalWizardStep(1);
                      setCalSuccessMsg(null);
                      setShowCalWizard(true);
                    }}
                    style={{ minHeight: '36px', padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    <span>{t.calWizardStart}</span>
                  </button>
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
                      <span className="settings-tag">{computedFactor}</span>
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
                        <div className="cal-result-value" style={{ fontSize: '20px' }}>{computedFactor}</div>
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
              <div className="settings-group">
                <span className="settings-group-title">
                  <Info size={14} aria-hidden="true" />
                  {t.aboutTitle}
                </span>

                <div
                  className="settings-card"
                  onClick={() => {
                    setActiveTab('about');
                    setShowSettingsModal(false);
                  }}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveTab('about');
                      setShowSettingsModal(false);
                    }
                  }}
                >
                  <div className="settings-card-left">
                    <div className="settings-card-icon">
                      <Info size={18} />
                    </div>
                    <div className="settings-card-info">
                      <span className="settings-card-title">Smartcale ESP32</span>
                      <span className="settings-card-sub">{t.versionLabel} 1.1.0 • AtaCanYmc</span>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
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
            <div className="modal-header">
              <h2 id="meal-picker-title" className="modal-title">{t.selectMeal}</h2>
              <button
                type="button"
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

      {/* Manual Food Add Modal */}
      {showManualAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowManualAddModal(false)}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="manual-add-title" className="modal-title">{t.manualAddBtn}</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowManualAddModal(false)}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="settings-body" style={{ gap: '12px' }}>
              {/* Meal Selector */}
              <div>
                <label className="input-label">{t.selectMeal}</label>
                <div className="meal-picker-grid" style={{ marginTop: '0', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`meal-pill-btn ${manualMealType === m ? 'active' : ''}`}
                      onClick={() => setManualMealType(m)}
                    >
                      {t[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Name */}
              <div>
                <label htmlFor="manual-food-name" className="input-label">{t.foodNameLabel} *</label>
                <input
                  id="manual-food-name"
                  type="text"
                  required
                  className="input-field"
                  placeholder={t.foodNamePlaceholder}
                  value={manualFoodName}
                  onChange={(e) => setManualFoodName(e.target.value)}
                />
              </div>

              {/* Optional Barcode & Brand */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor="manual-barcode" className="input-label">{t.barcodeLabel}</label>
                  <input
                    id="manual-barcode"
                    type="text"
                    className="input-field"
                    placeholder="8690504..."
                    value={manualBarcode}
                    onChange={(e) => {
                      setManualBarcode(e.target.value);
                      if (e.target.value.trim().length >= 8) {
                        setContributeToOff(true);
                      }
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="manual-brand" className="input-label">{t.brandLabel}</label>
                  <input
                    id="manual-brand"
                    type="text"
                    className="input-field"
                    placeholder="Nestle, Pinar..."
                    value={manualBrand}
                    onChange={(e) => setManualBrand(e.target.value)}
                  />
                </div>
              </div>

              {/* Calories & Weight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label htmlFor="manual-calories" className="input-label">{t.caloriesLabel} (kcal) *</label>
                  <input
                    id="manual-calories"
                    type="number"
                    step="0.1"
                    required
                    className="input-field"
                    placeholder="250"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="manual-weight" className="input-label">{t.weightLabel} (g)</label>
                  <input
                    id="manual-weight"
                    type="number"
                    step="1"
                    className="input-field"
                    placeholder="150"
                    value={manualWeight}
                    onChange={(e) => setManualWeight(e.target.value)}
                  />
                </div>
              </div>

              {/* Optional Macros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div>
                  <label htmlFor="manual-protein" className="input-label">{t.proteinLabel} (g)</label>
                  <input
                    id="manual-protein"
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="0"
                    value={manualProteins}
                    onChange={(e) => setManualProteins(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="manual-carbs" className="input-label">{t.carbsLabel} (g)</label>
                  <input
                    id="manual-carbs"
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="0"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="manual-fat" className="input-label">{t.fatLabel} (g)</label>
                  <input
                    id="manual-fat"
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="0"
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                  />
                </div>
              </div>

              {/* Open Food Facts Contribution Toggle */}
              {manualBarcode.trim().length >= 8 && (
                <div style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={contributeToOff}
                      onChange={(e) => setContributeToOff(e.target.checked)}
                      style={{ marginTop: '2px', accentColor: 'var(--accent-blue)', cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                    <span style={{ lineHeight: 1.4, flex: 1 }}>
                      <strong>Open Food Facts:</strong> {t.contributeToOffCheckbox}
                    </span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowManualAddModal(false)}
                  disabled={isContributing}
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isContributing}
                >
                  {isContributing ? t.uploadingToOff : t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Data Modal */}
      {showExportModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px' }}
          >
            <div className="modal-header">
              <h2 id="export-modal-title" className="modal-title">{t.exportDataBtn}</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowExportModal(false)}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            <p className="modal-desc" style={{ marginBottom: '6px' }}>
              {mealService.getAll().length} kayıt mevcut. Format seçin:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="export-card-btn"
                onClick={handleExportCSV}
              >
                <div className="export-card-icon csv">
                  <FileSpreadsheet size={22} />
                </div>
                <div className="export-card-info">
                  <span className="export-card-title">{t.exportCSV}</span>
                  <span className="export-card-sub">Excel, Google E-Tablolar & Numbers uyumlu</span>
                </div>
                <Download size={16} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
              </button>

              <button
                type="button"
                className="export-card-btn"
                onClick={handleExportJSON}
              >
                <div className="export-card-icon json">
                  <FileText size={22} />
                </div>
                <div className="export-card-info">
                  <span className="export-card-title">{t.exportJSON}</span>
                  <span className="export-card-sub">Ham JSON yedekleme formatı</span>
                </div>
                <Download size={16} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
              </button>

              <button
                type="button"
                className="export-card-btn"
                onClick={() => {
                  setShowExportModal(false);
                  handleShareAi();
                }}
              >
                <div className="export-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple, #a855f7)' }}>
                  <Sparkles size={22} />
                </div>
                <div className="export-card-info">
                  <span className="export-card-title">{t.exportAiPrompt}</span>
                  <span className="export-card-sub">ChatGPT, Claude, Gemini için beslenme analizi istemi</span>
                </div>
                <Share2 size={16} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
              </button>
            </div>

            <button
              className="btn btn-secondary"
              style={{ marginTop: '8px' }}
              onClick={() => setShowExportModal(false)}
            >
              {t.cancelBtn}
            </button>
          </div>
        </div>
      )}

      {/* Calendar Picker Modal */}
      {showCalendarModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCalendarModal(false)}
        >
          <div
            className="modal-content calendar-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header calendar-modal-header">
              <h2 id="calendar-modal-title" className="modal-title">
                {t.selectDate}
              </h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowCalendarModal(false)}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            {/* Month & Year Navigation */}
            <div className="calendar-nav-row">
              <button
                type="button"
                className="icon-btn calendar-nav-btn"
                onClick={() => {
                  setCalendarViewDate(
                    new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1)
                  );
                }}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="calendar-month-title">
                {calendarViewDate.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}
              </span>

              <button
                type="button"
                className="icon-btn calendar-nav-btn"
                onClick={() => {
                  setCalendarViewDate(
                    new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1)
                  );
                }}
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday Row */}
            <div className="calendar-weekdays-row">
              {WEEKDAY_NAMES_BY_LANG[lang].map((dayName, idx) => (
                <div key={idx} className="calendar-weekday-cell">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="calendar-days-grid">
              {getCalendarGrid(calendarViewDate, selectedDate, new Set(mealService.getLoggedDates())).map((day, idx) => (
                <button
                  key={`${day.dateStr}-${idx}`}
                  type="button"
                  className={`calendar-day-cell ${
                    !day.isCurrentMonth ? 'other-month' : ''
                  } ${day.isToday ? 'is-today' : ''} ${
                    day.isSelected ? 'is-selected' : ''
                  }`}
                  onClick={() => {
                    setSelectedDate(day.dateStr);
                    setShowCalendarModal(false);
                  }}
                  aria-label={day.dateStr}
                >
                  <span className="calendar-day-num">{day.dayNumber}</span>
                  {day.hasLogs && <span className="calendar-day-dot" aria-hidden="true" />}
                </button>
              ))}
            </div>

            {/* Quick Actions Footer */}
            <div className="calendar-modal-footer">
              <button
                type="button"
                className="btn btn-secondary calendar-footer-btn"
                onClick={() => {
                  const today = getLocalDateString();
                  setSelectedDate(today);
                  setCalendarViewDate(new Date());
                  setShowCalendarModal(false);
                }}
              >
                {t.goToToday}
              </button>
              <button
                type="button"
                className="btn btn-primary calendar-footer-btn"
                onClick={() => setShowCalendarModal(false)}
              >
                {t.cancelBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Wizard Modal */}
      {showCalWizard && (
        <div
          className="modal-overlay"
          onClick={() => setShowCalWizard(false)}
        >
          <div
            className="modal-content cal-wizard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cal-wizard-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
                <SlidersHorizontal size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                <h2 id="cal-wizard-title" className="modal-title">
                  {t.calWizardTitle}
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowCalWizard(false)}
                aria-label={t.calClose}
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="cal-stepper-row" role="tablist" aria-label={t.calWizardTitle}>
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`cal-stepper-item ${calWizardStep === stepNum ? 'active' : ''} ${calWizardStep > stepNum ? 'completed' : ''}`}
                >
                  <div className="cal-stepper-dot">
                    {calWizardStep > stepNum ? <Check size={12} /> : stepNum}
                  </div>
                  <span className="cal-stepper-label">
                    {stepNum === 1 ? (t.calStep1Title.includes(':') ? t.calStep1Title.split(':')[1].trim() : t.calStep1Title) :
                     stepNum === 2 ? (t.calStep2Title.includes(':') ? t.calStep2Title.split(':')[1].trim() : t.calStep2Title) :
                     (t.calStep3Title.includes(':') ? t.calStep3Title.split(':')[1].trim() : t.calStep3Title)}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Zero / Tare */}
            {calWizardStep === 1 && (
              <div className="cal-step-body">
                <div className="cal-step-icon-badge">
                  <RotateCcw size={26} />
                </div>
                <h3 className="cal-step-heading">
                  {t.calStep1Title.includes(':') ? t.calStep1Title.split(':')[1].trim() : t.calStep1Title}
                </h3>
                <p className="cal-step-text">{t.calStep1Desc}</p>

                <div className="cal-live-card">
                  <div className="cal-live-label">{t.calCurrentReading}</div>
                  <div className="cal-live-value">
                    {formatWeight(weightGrams, 'g')} <span className="cal-live-unit">g</span>
                  </div>
                  <div className="cal-live-status">
                    <span className={`nav-dot ${connectionStatus}`} style={{ position: 'static', display: 'inline-block' }} />
                    {connectionStatus === 'connected' ? t.connected : t.standby}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleTare}
                  style={{ width: '100%', minHeight: '44px', gap: '8px' }}
                >
                  <RotateCcw size={16} />
                  <span>{t.tareBtn}</span>
                </button>
              </div>
            )}

            {/* Step 2: Reference Weight */}
            {calWizardStep === 2 && (
              <div className="cal-step-body">
                <div className="cal-step-icon-badge">
                  <SlidersHorizontal size={26} />
                </div>
                <h3 className="cal-step-heading">
                  {t.calStep2Title.includes(':') ? t.calStep2Title.split(':')[1].trim() : t.calStep2Title}
                </h3>
                <p className="cal-step-text">{t.calStep2Desc}</p>

                {/* Preset Chips */}
                <div className="cal-preset-grid">
                  {[100, 200, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`cal-preset-btn ${calRefPreset === preset ? 'active' : ''}`}
                      onClick={() => setCalRefPreset(preset)}
                    >
                      {preset}g
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`cal-preset-btn ${calRefPreset === 0 ? 'active' : ''}`}
                    onClick={() => setCalRefPreset(0)}
                  >
                    {t.calCustomRef}
                  </button>
                </div>

                {calRefPreset === 0 && (
                  <div style={{ marginTop: '8px', width: '100%' }}>
                    <label htmlFor="cal-custom-weight-input" className="input-label" style={{ textAlign: 'left' }}>
                      {t.calTargetWeight} (g)
                    </label>
                    <input
                      id="cal-custom-weight-input"
                      type="number"
                      className="input-field"
                      value={calCustomWeight}
                      onChange={(e) => setCalCustomWeight(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                )}

                <div className="cal-live-card" style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="cal-live-label">{t.calCurrentReading}</div>
                      <div className="cal-live-value" style={{ fontSize: '24px' }}>
                        {formatWeight(weightGrams, 'g')} <span className="cal-live-unit">g</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="cal-live-label">{t.calTargetWeight}</div>
                      <div className="cal-live-value" style={{ fontSize: '24px', color: 'var(--accent-blue)' }}>
                        {effectiveRefWeight} <span className="cal-live-unit">g</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Result & Apply */}
            {calWizardStep === 3 && (
              <div className="cal-step-body">
                <div className="cal-step-icon-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green)' }}>
                  <CheckCircle2 size={26} />
                </div>
                <h3 className="cal-step-heading">
                  {t.calStep3Title.includes(':') ? t.calStep3Title.split(':')[1].trim() : t.calStep3Title}
                </h3>
                <p className="cal-step-text">{t.calStep3Desc}</p>

                <div className="cal-result-box" style={{ padding: '14px', margin: '10px 0', width: '100%' }}>
                  <div className="cal-result-label">{t.calFactorTitle}</div>
                  <div className="cal-result-value" style={{ fontSize: '28px' }}>
                    {wizardComputedFactor}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.calTargetWeight}: {effectiveRefWeight}g | {t.calCurrentReading}: {formatWeight(weightGrams > 0 ? weightGrams : (parseFloat(rawAdcInput) ? parseFloat(rawAdcInput) / 420 : effectiveRefWeight), 'g')}g
                  </div>
                </div>

                {calSuccessMsg && (
                  <div className="cal-success-banner" role="status">
                    <CheckCircle2 size={16} />
                    <span>{calSuccessMsg}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  {connectionStatus === 'connected' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleApplyCalibration}
                      disabled={isCalApplying}
                      style={{ minHeight: '44px' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isCalApplying ? '...' : t.calApplyBle}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCopyFactor}
                    style={{ minHeight: '40px' }}
                  >
                    <Download size={15} />
                    <span>{t.calCopyFactor}</span>
                  </button>

                  <a
                    href="http://192.168.4.1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{
                      textDecoration: 'none',
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{t.openWifiPortal} (192.168.4.1)</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            )}

            {/* Wizard Modal Navigation Footer */}
            <div className="cal-wizard-footer">
              {calWizardStep > 1 ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCalWizardStep((prev) => prev - 1)}
                  style={{ minWidth: '90px' }}
                >
                  <ChevronLeft size={16} />
                  <span>{t.prevBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCalWizard(false)}
                  style={{ minWidth: '90px' }}
                >
                  {t.cancelBtn}
                </button>
              )}

              {calWizardStep < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCalWizardStep((prev) => prev + 1)}
                  style={{ minWidth: '100px', marginLeft: 'auto' }}
                >
                  <span>{t.nextBtn}</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowCalWizard(false)}
                  style={{ minWidth: '100px', marginLeft: 'auto' }}
                >
                  <span>{t.finishBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recipe / Mixing Mode Modal */}
      {showRecipeModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRecipeModal(false)}
        >
          <div
            className="modal-content recipe-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
                <ChefHat size={20} style={{ color: 'var(--accent-amber, #f59e0b)', flexShrink: 0 }} />
                <h2 id="recipe-modal-title" className="modal-title">
                  {t.recipeModeTitle}
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowRecipeModal(false)}
                aria-label={t.cancelBtn}
              >
                <X size={18} />
              </button>
            </div>

            <p className="modal-desc" style={{ marginBottom: '12px' }}>
              {t.recipeModeSub}
            </p>

            {/* Recipe Metadata: Name & Servings */}
            <div className="recipe-meta-row">
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t.recipeNamePlaceholder}
                  value={recipeTitle}
                  onChange={(e) => setRecipeTitle(e.target.value)}
                  style={{ minHeight: '38px', fontSize: '13px' }}
                />
              </div>
              <div className="recipe-servings-box">
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.servingsLabel}:</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setRecipeServings((prev) => Math.max(1, prev - 1))}
                  style={{ width: '28px', height: '28px' }}
                  aria-label="Decrease servings"
                >
                  <ChevronDown size={14} />
                </button>
                <span style={{ fontWeight: 700, fontSize: '14px', minWidth: '18px', textAlign: 'center' }}>
                  {recipeServings}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setRecipeServings((prev) => Math.min(24, prev + 1))}
                  style={{ width: '28px', height: '28px' }}
                  aria-label="Increase servings"
                >
                  <ChevronUp size={14} />
                </button>
              </div>
            </div>

            {/* Live Scale Bowl & Next Ingredient Section */}
            <div className="recipe-live-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {connectionStatus === 'connected' ? t.liveStream : t.standby}
                </span>
                <span className={`nav-dot ${connectionStatus}`} style={{ position: 'static', display: 'inline-block' }} />
              </div>

              <div className="recipe-live-reading">
                <span className="recipe-live-digits">{formatWeight(weightGrams, 'g')}</span>
                <span className="recipe-live-unit">g</span>
              </div>

              {recipeSuccessToast && (
                <div className="recipe-tare-feedback">
                  <CheckCircle2 size={14} />
                  <span>{recipeSuccessToast}</span>
                </div>
              )}

              {/* Active ingredient name input */}
              <div style={{ marginTop: '4px', width: '100%' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={activeProduct ? activeProduct.name : t.activeIngredientLabel}
                  value={recipeActiveName}
                  onChange={(e) => setRecipeActiveName(e.target.value)}
                  style={{ minHeight: '36px', fontSize: '13px' }}
                />
              </div>

              {/* Huge Add Ingredient & Tare Button */}
              <button
                type="button"
                className="btn btn-primary btn-recipe-add-tare"
                onClick={handleAddIngredientAndTare}
                disabled={weightGrams <= 0}
              >
                <RotateCcw size={18} />
                <span>
                  {t.addIngredientAndTare} ({formatWeight(weightGrams, 'g')}g)
                </span>
              </button>
            </div>

            {/* List of Added Ingredients */}
            <div className="recipe-ingredients-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {t.recipeIngredientsTitle} ({recipeIngredients.length})
                </span>
                {recipeIngredients.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRecipe}
                    className="icon-btn"
                    title={t.clearRecipeBtn}
                    aria-label={t.clearRecipeBtn}
                    style={{ color: 'var(--accent-red)', width: '28px', height: '28px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {recipeIngredients.length === 0 ? (
                <div className="recipe-empty-box">
                  <ChefHat size={32} style={{ opacity: 0.35, marginBottom: '6px' }} />
                  <p>{t.noIngredientsYet}</p>
                </div>
              ) : (
                <div className="recipe-items-list">
                  {recipeIngredients.map((item, idx) => (
                    <div key={item.id} className="recipe-item-row">
                      <span className="recipe-item-num">{idx + 1}</span>
                      <div className="recipe-item-info">
                        <span className="recipe-item-name">{item.name}</span>
                        <span className="recipe-item-macros">
                          {item.calories} kcal · P:{item.proteins}g · K:{item.carbs}g · Y:{item.fat}g
                        </span>
                      </div>
                      <span className="recipe-item-weight">{item.weightGrams}g</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(item.id)}
                        className="icon-btn"
                        style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nutrition & Totals Card */}
            {recipeIngredients.length > 0 && (
              <div className="recipe-totals-card">
                <div className="recipe-totals-row">
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.recipeTotalWeight}:</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, marginLeft: '6px' }}>
                      {recipeTotals.totalWeight}g
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.servingsLabel}:</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: '6px', color: 'var(--accent-blue)' }}>
                      {recipeServings}
                    </span>
                  </div>
                </div>

                <div className="recipe-macro-grid">
                  <div className="recipe-macro-item">
                    <span className="recipe-macro-label">{t.caloriesLabel}</span>
                    <span className="recipe-macro-val">{recipeTotals.calories}</span>
                    <span className="recipe-macro-sub">({recipePerServing.calories} / {t.perServingLabel})</span>
                  </div>
                  <div className="recipe-macro-item">
                    <span className="recipe-macro-label">{t.proteinLabel}</span>
                    <span className="recipe-macro-val">{recipeTotals.proteins}g</span>
                    <span className="recipe-macro-sub">({recipePerServing.proteins}g / {t.perServingLabel})</span>
                  </div>
                  <div className="recipe-macro-item">
                    <span className="recipe-macro-label">{t.carbsLabel}</span>
                    <span className="recipe-macro-val">{recipeTotals.carbs}g</span>
                    <span className="recipe-macro-sub">({recipePerServing.carbs}g / {t.perServingLabel})</span>
                  </div>
                  <div className="recipe-macro-item">
                    <span className="recipe-macro-label">{t.fatLabel}</span>
                    <span className="recipe-macro-val">{recipeTotals.fat}g</span>
                    <span className="recipe-macro-sub">({recipePerServing.fat}g / {t.perServingLabel})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="recipe-modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleLogRecipeToDiary}
                disabled={recipeIngredients.length === 0}
                style={{ flex: 1, minHeight: '40px' }}
              >
                <Plus size={16} />
                <span>{t.logRecipeToDiary}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleShareRecipeAi}
                disabled={recipeIngredients.length === 0}
                style={{ minHeight: '40px', padding: '8px 12px' }}
                title={t.recipeAiShareBtn}
                aria-label={t.recipeAiShareBtn}
              >
                <Sparkles size={16} style={{ color: 'var(--accent-purple, #a855f7)' }} />
              </button>
            </div>
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
          className={`bottom-nav-item ${activeTab === 'scale' && !showSettingsModal ? 'active' : ''}`}
          onClick={handleGoHome}
          aria-label={t.navHome}
        >
          <Home size={20} aria-hidden="true" />
          <span>{t.navHome}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'food' && !showSettingsModal ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('food');
            setShowSettingsModal(false);
          }}
          aria-label={t.foodSearchOrScan}
        >
          <ScanLine size={20} aria-hidden="true" />
          <span>{t.navFood}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${activeTab === 'diary' && !showSettingsModal ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('diary');
            setShowSettingsModal(false);
          }}
          aria-label={t.mealTitle}
        >
          <CalendarDays size={20} aria-hidden="true" />
          <span>{t.navDiary}</span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${showSettingsModal ? 'active' : ''}`}
          onClick={() => {
            setShowSettingsModal(true);
          }}
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

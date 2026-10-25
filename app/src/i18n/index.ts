export type Language = 'tr' | 'en' | 'de' | 'fr' | 'es';

export interface LanguageOption {
  code: Language;
  label: string;
  shortLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'tr', label: 'Türkçe', shortLabel: 'TR' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE' },
  { code: 'fr', label: 'Français', shortLabel: 'FR' },
  { code: 'es', label: 'Español', shortLabel: 'ES' },
];

export interface Translations {
  brandSubtitle: string;
  themeLight: string;
  themeDark: string;
  switchToLight: string;
  switchToDark: string;
  selectLanguage: string;
  connect: string;
  connected: string;
  searching: string;
  disconnect: string;
  connectToScale: string;
  connCancelled: string;
  connFailed: string;
  dismissError: string;
  unitSelection: string;
  unitAria: (unit: string) => string;
  tared: string;
  liveStream: string;
  standby: string;
  tareBtn: string;
  tareAria: string;
  calibrationBtn: string;
  calibrationAria: string;
  wifiPortalBtn: string;
  wifiPortalAria: string;
  timerTitle: string;
  timerRunning: string;
  timerStopped: string;
  timerAria: string;
  timerStart: string;
  timerStop: string;
  timerReset: string;
  calTitle: string;
  calClose: string;
  calDesc: string;
  calRefWeightLabel: string;
  calRawAdcLabel: string;
  calFactorTitle: string;
  calNote: string;
  calDone: string;
  settingsTitle: string;
  settingsBtnAria: string;
  themeSection: string;
  themeSectionDesc: string;
  themeLightLabel: string;
  themeDarkLabel: string;
  themeSystemLabel: string;
  langSection: string;
  langSectionDesc: string;
  aboutSection: string;
  versionLabel: string;
}

export const translations: Record<Language, Translations> = {
  tr: {
    brandSubtitle: 'ESP32-C3 GATT v1.0',
    themeLight: 'Açık Tema',
    themeDark: 'Koyu Tema',
    switchToLight: 'Açık temaya geç',
    switchToDark: 'Koyu temaya geç',
    selectLanguage: 'Dil seçimi',
    connect: 'Bağlan',
    connected: 'Bağlı',
    searching: 'Aranıyor...',
    disconnect: 'Bağlantıyı Kes',
    connectToScale: 'Tartıya Bağlan',
    connCancelled: 'Bağlantı iptal edildi',
    connFailed: 'Tartıya bağlanılamadı. Bluetooth açık mı?',
    dismissError: 'Hatayı kapat',
    unitSelection: 'Ağırlık birimi seçimi',
    unitAria: (u) => `${u.toUpperCase()} birimi`,
    tared: 'Dara Alındı',
    liveStream: 'Canlı Akış (100ms)',
    standby: 'Beklemede',
    tareBtn: 'DARA AL',
    tareAria: 'Tartının darasını al',
    calibrationBtn: 'Kalibrasyon',
    calibrationAria: 'Kalibrasyon asistanını aç',
    wifiPortalBtn: 'Wi-Fi Paneli',
    wifiPortalAria: 'Wi-Fi Kurulum Paneli (yeni sekmede açılır)',
    timerTitle: 'KRONOMETRE & DEMLEME',
    timerRunning: 'ÇALIŞIYOR',
    timerStopped: 'DURDU',
    timerAria: 'Demleme Kronometresi',
    timerStart: 'Zamanlayıcıyı başlat',
    timerStop: 'Zamanlayıcıyı durdur',
    timerReset: 'Zamanlayıcıyı sıfırla',
    calTitle: 'Kalibrasyon Asistanı',
    calClose: 'Kapat',
    calDesc: 'Tartınızın kalibrasyon katsayısını hesaplamak için bilinen bir ağırlık (örneğin 500g) kullanın:',
    calRefWeightLabel: 'Referans Ağırlık (Gram)',
    calRawAdcLabel: 'Okunan Ham Değer (Katsayı 1.0 iken)',
    calFactorTitle: 'Hesaplanan Katsayı',
    calNote: 'Bu değeri 192.168.4.1 web arayüzüne girerek tartınıza kaydedebilirsiniz.',
    calDone: 'Tamam',
    settingsTitle: 'Ayarlar',
    settingsBtnAria: 'Ayarları aç',
    themeSection: 'Görünüm ve Tema',
    themeSectionDesc: 'Uygulama temasını belirleyin',
    themeLightLabel: 'Açık',
    themeDarkLabel: 'Koyu',
    themeSystemLabel: 'Sistem',
    langSection: 'Dil Seçimi',
    langSectionDesc: 'Kullanmak istediğiniz dili seçin',
    aboutSection: 'Hakkında',
    versionLabel: 'Sürüm',
  },
  en: {
    brandSubtitle: 'ESP32-C3 GATT v1.0',
    themeLight: 'Light Theme',
    themeDark: 'Dark Theme',
    switchToLight: 'Switch to light theme',
    switchToDark: 'Switch to dark theme',
    selectLanguage: 'Select language',
    connect: 'Connect',
    connected: 'Connected',
    searching: 'Searching...',
    disconnect: 'Disconnect',
    connectToScale: 'Connect to scale',
    connCancelled: 'Connection cancelled',
    connFailed: 'Could not connect to scale. Is Bluetooth turned on?',
    dismissError: 'Dismiss error',
    unitSelection: 'Weight unit selection',
    unitAria: (u) => `${u.toUpperCase()} unit`,
    tared: 'Tared',
    liveStream: 'Live Stream (100ms)',
    standby: 'Standby',
    tareBtn: 'TARE',
    tareAria: 'Tare the scale',
    calibrationBtn: 'Calibration',
    calibrationAria: 'Open calibration assistant',
    wifiPortalBtn: 'Wi-Fi Portal',
    wifiPortalAria: 'Wi-Fi Setup Portal (opens in a new tab)',
    timerTitle: 'TIMER & BREW',
    timerRunning: 'RUNNING',
    timerStopped: 'STOPPED',
    timerAria: 'Brewing Timer',
    timerStart: 'Start timer',
    timerStop: 'Stop timer',
    timerReset: 'Reset timer',
    calTitle: 'Calibration Assistant',
    calClose: 'Close',
    calDesc: 'Use a known reference weight (e.g. 500g) to compute your scale\'s calibration factor:',
    calRefWeightLabel: 'Reference Weight (Grams)',
    calRawAdcLabel: 'Raw Reading (with Factor 1.0)',
    calFactorTitle: 'Calculated Factor',
    calNote: 'Enter this value in the 192.168.4.1 setup portal to save it to your scale.',
    calDone: 'Done',
    settingsTitle: 'Settings',
    settingsBtnAria: 'Open settings',
    themeSection: 'Appearance & Theme',
    themeSectionDesc: 'Choose your preferred app theme',
    themeLightLabel: 'Light',
    themeDarkLabel: 'Dark',
    themeSystemLabel: 'System',
    langSection: 'Language',
    langSectionDesc: 'Select your language',
    aboutSection: 'About',
    versionLabel: 'Version',
  },
  de: {
    brandSubtitle: 'ESP32-C3 GATT v1.0',
    themeLight: 'Helles Design',
    themeDark: 'Dunkles Design',
    switchToLight: 'Zu hellem Design wechseln',
    switchToDark: 'Zu dunklem Design wechseln',
    selectLanguage: 'Sprache auswählen',
    connect: 'Verbinden',
    connected: 'Verbunden',
    searching: 'Suchen...',
    disconnect: 'Trennen',
    connectToScale: 'Mit Waage verbinden',
    connCancelled: 'Verbindung abgebrochen',
    connFailed: 'Verbindung zur Waage fehlgeschlagen. Ist Bluetooth aktiviert?',
    dismissError: 'Fehler schließen',
    unitSelection: 'Gewichtseinheit auswählen',
    unitAria: (u) => `Einheit ${u.toUpperCase()}`,
    tared: 'Tariert',
    liveStream: 'Live-Stream (100ms)',
    standby: 'Bereit',
    tareBtn: 'TARIEREN',
    tareAria: 'Waage tarieren',
    calibrationBtn: 'Kalibrierung',
    calibrationAria: 'Kalibrierungsassistent öffnen',
    wifiPortalBtn: 'WLAN-Portal',
    wifiPortalAria: 'WLAN-Einrichtungsportal (öffnet in neuem Tab)',
    timerTitle: 'TIMER & BRÜHEN',
    timerRunning: 'LÄUFT',
    timerStopped: 'GESTOPPT',
    timerAria: 'Brüh-Timer',
    timerStart: 'Timer starten',
    timerStop: 'Timer stoppen',
    timerReset: 'Timer zurücksetzen',
    calTitle: 'Kalibrierungsassistent',
    calClose: 'Schließen',
    calDesc: 'Verwenden Sie ein bekanntes Referenzgewicht (z. B. 500g), um den Kalibrierungsfaktor zu berechnen:',
    calRefWeightLabel: 'Referenzgewicht (Gramm)',
    calRawAdcLabel: 'Rohwert (bei Faktor 1.0)',
    calFactorTitle: 'Berechneter Faktor',
    calNote: 'Geben Sie diesen Wert unter 192.168.4.1 ein, um ihn auf der Waage zu speichern.',
    calDone: 'Fertig',
    settingsTitle: 'Einstellungen',
    settingsBtnAria: 'Einstellungen öffnen',
    themeSection: 'Erscheinungsbild & Design',
    themeSectionDesc: 'Wählen Sie das App-Design',
    themeLightLabel: 'Hell',
    themeDarkLabel: 'Dunkel',
    themeSystemLabel: 'System',
    langSection: 'Sprache',
    langSectionDesc: 'Wählen Sie Ihre Sprache',
    aboutSection: 'Über',
    versionLabel: 'Version',
  },
  fr: {
    brandSubtitle: 'ESP32-C3 GATT v1.0',
    themeLight: 'Thème clair',
    themeDark: 'Thème sombre',
    switchToLight: 'Passer au thème clair',
    switchToDark: 'Passer au thème sombre',
    selectLanguage: 'Sélectionner la langue',
    connect: 'Connecter',
    connected: 'Connecté',
    searching: 'Recherche...',
    disconnect: 'Déconnecter',
    connectToScale: 'Connecter à la balance',
    connCancelled: 'Connexion annulée',
    connFailed: 'Impossible de se connecter à la balance. Le Bluetooth est-il activé ?',
    dismissError: 'Fermer l\'erreur',
    unitSelection: 'Sélection de l\'unité de poids',
    unitAria: (u) => `Unité ${u.toUpperCase()}`,
    tared: 'Taré',
    liveStream: 'Flux en direct (100ms)',
    standby: 'Démo / En attente',
    tareBtn: 'TARER',
    tareAria: 'Tarer la balance',
    calibrationBtn: 'Étalonnage',
    calibrationAria: 'Ouvrir l\'assistant d\'étalonnage',
    wifiPortalBtn: 'Portail Wi-Fi',
    wifiPortalAria: 'Portail de configuration Wi-Fi (s\'ouvre dans un nouvel onglet)',
    timerTitle: 'CHRONOMÈTRE & INFUSION',
    timerRunning: 'EN COURS',
    timerStopped: 'ARRÊTÉ',
    timerAria: 'Chronomètre d\'infusion',
    timerStart: 'Démarrer le chronomètre',
    timerStop: 'Arrêter le chronomètre',
    timerReset: 'Réinitialiser le chronomètre',
    calTitle: 'Assistant d\'étalonnage',
    calClose: 'Fermer',
    calDesc: 'Utilisez un poids de référence connu (par ex. 500g) pour calculer le facteur d\'étalonnage :',
    calRefWeightLabel: 'Poids de référence (Grammes)',
    calRawAdcLabel: 'Valeur brute lue (avec facteur 1.0)',
    calFactorTitle: 'Facteur calculé',
    calNote: 'Saisissez cette valeur sur 192.168.4.1 pour l\'enregistrer sur votre balance.',
    calDone: 'Terminé',
    settingsTitle: 'Paramètres',
    settingsBtnAria: 'Ouvrir les paramètres',
    themeSection: 'Apparence & Thème',
    themeSectionDesc: 'Choisissez le thème de l\'application',
    themeLightLabel: 'Clair',
    themeDarkLabel: 'Sombre',
    themeSystemLabel: 'Système',
    langSection: 'Langue',
    langSectionDesc: 'Sélectionnez votre langue',
    aboutSection: 'À propos',
    versionLabel: 'Version',
  },
  es: {
    brandSubtitle: 'ESP32-C3 GATT v1.0',
    themeLight: 'Tema claro',
    themeDark: 'Tema oscuro',
    switchToLight: 'Cambiar a tema claro',
    switchToDark: 'Cambiar a tema oscuro',
    selectLanguage: 'Seleccionar idioma',
    connect: 'Conectar',
    connected: 'Conectado',
    searching: 'Buscando...',
    disconnect: 'Desconectar',
    connectToScale: 'Conectar a la báscula',
    connCancelled: 'Conexión cancelada',
    connFailed: 'No se pudo conectar a la báscula. ¿Está activado el Bluetooth?',
    dismissError: 'Cerrar error',
    unitSelection: 'Selección de unidad de peso',
    unitAria: (u) => `Unidad ${u.toUpperCase()}`,
    tared: 'Tarado',
    liveStream: 'Transmisión en vivo (100ms)',
    standby: 'En espera',
    tareBtn: 'TARAR',
    tareAria: 'Tarar la báscula',
    calibrationBtn: 'Calibración',
    calibrationAria: 'Abrir asistente de calibración',
    wifiPortalBtn: 'Panel Wi-Fi',
    wifiPortalAria: 'Panel de configuración Wi-Fi (se abre en una nueva pestaña)',
    timerTitle: 'TEMPORIZADOR & INFUSIÓN',
    timerRunning: 'ACTIVO',
    timerStopped: 'DETENIDO',
    timerAria: 'Temporizador de infusión',
    timerStart: 'Iniciar temporizador',
    timerStop: 'Detener temporizador',
    timerReset: 'Reiniciar temporizador',
    calTitle: 'Asistente de calibración',
    calClose: 'Cerrar',
    calDesc: 'Utilice un peso de referencia conocido (p. ej. 500g) para calcular el factor de calibración:',
    calRefWeightLabel: 'Peso de referencia (Gramos)',
    calRawAdcLabel: 'Lectura cruda (con factor 1.0)',
    calFactorTitle: 'Factor calculado',
    calNote: 'Ingrese este valor en 192.168.4.1 para guardarlo en su báscula.',
    calDone: 'Listo',
    settingsTitle: 'Configuración',
    settingsBtnAria: 'Abrir configuración',
    themeSection: 'Apariencia y Tema',
    themeSectionDesc: 'Elija el tema de la aplicación',
    themeLightLabel: 'Claro',
    themeDarkLabel: 'Oscuro',
    themeSystemLabel: 'Sistema',
    langSection: 'Idioma',
    langSectionDesc: 'Seleccione su idioma',
    aboutSection: 'Acerca de',
    versionLabel: 'Versión',
  },
};

export const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem('smartcale-lang') || localStorage.getItem('smartscale-lang');
  if (saved && ['tr', 'en', 'de', 'fr', 'es'].includes(saved)) {
    return saved as Language;
  }
  const browserLang = (navigator.language || '').toLowerCase().slice(0, 2);
  if (['tr', 'en', 'de', 'fr', 'es'].includes(browserLang)) {
    return browserLang as Language;
  }
  return 'tr';
};

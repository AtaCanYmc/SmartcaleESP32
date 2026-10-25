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
  foodNutritionTitle: string;
  foodSearchOrScan: string;
  foodSearchPlaceholder: string;
  searchBtn: string;
  scanBarcodeBtn: string;
  stopScannerBtn: string;
  scannerScanning: string;
  scannerHint: string;
  scannerNotSupported: string;
  noProductsFound: string;
  searchingProducts: string;
  selectedProduct: string;
  removeProduct: string;
  caloriesLabel: string;
  proteinLabel: string;
  carbsLabel: string;
  fatLabel: string;
  sugarLabel: string;
  saltLabel: string;
  per100gSuffix: string;
  onScaleNutrition: string;
  navFood: string;
  navCal: string;
  navWifi: string;
  navSettings: string;
  bluetoothSection: string;
  wifiSection: string;
  wifiDesc: string;
  navDiary: string;
  mealTitle: string;
  logMeal: string;
  selectMeal: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  loggedSuccess: string;
  noEntriesToday: string;
  today: string;
  dailyTotal: string;
  deleteEntry: string;
  weightLabel: string;
  deviceSectionTitle: string;
  preferencesSectionTitle: string;
  calAdvancedToggle: string;
  openWifiPortal: string;
  navHome: string;
  aboutTitle: string;
  aboutTagline: string;
  aboutDeveloper: string;
  aboutHardwareTitle: string;
  aboutFeaturesTitle: string;
  aboutOpenSource: string;
  manualAddBtn: string;
  exportDataBtn: string;
  exportJSON: string;
  exportCSV: string;
  foodNameLabel: string;
  foodNamePlaceholder: string;
  saveBtn: string;
  cancelBtn: string;
  quickAddMeal: string;
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
    calRawAdcLabel: 'Okunan Ham Değer',
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
    foodNutritionTitle: 'Besin & Kalori Takibi',
    foodSearchOrScan: 'Ürün veya Barkod Ara',
    foodSearchPlaceholder: 'Ürün adı veya barkod no girin...',
    searchBtn: 'Ara',
    scanBarcodeBtn: 'Barkod Tara',
    stopScannerBtn: 'Kamerayı Kapat',
    scannerScanning: 'Barkod taranıyor...',
    scannerHint: 'Barkodu kameranın ortasındaki kutuya hizalayın',
    scannerNotSupported: 'Tarayıcınızda otomatik barkod tarama desteklenmiyor. Barkod numarasını arama kutusuna yazabilirsiniz.',
    noProductsFound: 'Ürün bulunamadı',
    searchingProducts: 'Aranıyor...',
    selectedProduct: 'Seçili Ürün',
    removeProduct: 'Ürünü Kaldır',
    caloriesLabel: 'Kalori',
    proteinLabel: 'Protein',
    carbsLabel: 'Karb',
    fatLabel: 'Yağ',
    sugarLabel: 'Şeker',
    saltLabel: 'Tuz',
    per100gSuffix: '100g başına',
    onScaleNutrition: 'Terazideki Miktar',
    navFood: 'Besin',
    navCal: 'Kalibrasyon',
    navWifi: 'Wi-Fi',
    navSettings: 'Ayarlar',
    bluetoothSection: 'Bluetooth Bağlantısı',
    wifiSection: 'Wi-Fi Kurulum Portalı',
    wifiDesc: 'Tartı ağı ve cihaz ayarları için 192.168.4.1 adresini açın',
    navDiary: 'Günlük',
    mealTitle: 'Öğün Günlüğü',
    logMeal: 'Öğüne Ekle',
    selectMeal: 'Öğün Seçin',
    breakfast: 'Kahvaltı',
    lunch: 'Öğle Yemeği',
    dinner: 'Akşam Yemeği',
    snack: 'Ara Öğün',
    loggedSuccess: 'Öğüne kaydedildi!',
    noEntriesToday: 'Bu tarihte henüz bir beslenme kaydı yok.',
    today: 'Bugün',
    dailyTotal: 'Günlük Toplam',
    deleteEntry: 'Kaydı Sil',
    weightLabel: 'Miktar',
    deviceSectionTitle: 'Cihaz & Donanım',
    preferencesSectionTitle: 'Uygulama Tercihleri',
    calAdvancedToggle: 'Kalibrasyon (Gelişmiş)',
    openWifiPortal: 'Portalı Aç',
    navHome: 'Anasayfa',
    aboutTitle: 'Hakkında',
    aboutTagline: 'Hassas Akıllı Tartı & Beslenme Takip Asistanı',
    aboutDeveloper: 'Geliştirici',
    aboutHardwareTitle: 'Donanım & Mimari',
    aboutFeaturesTitle: 'Öne Çıkan Özellikler',
    aboutOpenSource: 'Açık Kaynak Kod',
    manualAddBtn: 'Manuel Ekle',
    exportDataBtn: 'Dışa Aktar',
    exportJSON: 'JSON İndir',
    exportCSV: 'CSV (Excel) İndir',
    foodNameLabel: 'Besin / Yemek Adı',
    foodNamePlaceholder: 'Örn. Izgara Tavuk, Salata...',
    saveBtn: 'Kaydet',
    cancelBtn: 'İptal',
    quickAddMeal: 'Öğüne Ekle',
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
    tareAria: 'Tare scale',
    calibrationBtn: 'Calibration',
    calibrationAria: 'Open calibration assistant',
    wifiPortalBtn: 'Wi-Fi Portal',
    wifiPortalAria: 'Wi-Fi Setup Portal (opens in a new tab)',
    timerTitle: 'TIMER & BREWING',
    timerRunning: 'RUNNING',
    timerStopped: 'STOPPED',
    timerAria: 'Brewing Timer',
    timerStart: 'Start timer',
    timerStop: 'Stop timer',
    timerReset: 'Reset timer',
    calTitle: 'Calibration Assistant',
    calClose: 'Close',
    calDesc: 'Use a known reference weight (e.g. 500g) to compute your scale calibration factor:',
    calRefWeightLabel: 'Reference Weight (Grams)',
    calRawAdcLabel: 'Raw Reading (with Factor 1.0)',
    calFactorTitle: 'Computed Calibration Factor',
    calNote: 'Enter this factor into 192.168.4.1 to save it onto your scale.',
    calDone: 'Done',
    settingsTitle: 'Settings',
    settingsBtnAria: 'Open settings',
    themeSection: 'Appearance & Theme',
    themeSectionDesc: 'Select application theme',
    themeLightLabel: 'Light',
    themeDarkLabel: 'Dark',
    themeSystemLabel: 'System',
    langSection: 'Language',
    langSectionDesc: 'Select your preferred language',
    aboutSection: 'About',
    versionLabel: 'Version',
    foodNutritionTitle: 'Food & Nutrition Tracker',
    foodSearchOrScan: 'Search Product or Barcode',
    foodSearchPlaceholder: 'Enter product name or barcode...',
    searchBtn: 'Search',
    scanBarcodeBtn: 'Scan Barcode',
    stopScannerBtn: 'Close Camera',
    scannerScanning: 'Scanning barcode...',
    scannerHint: 'Align barcode inside the camera box',
    scannerNotSupported: 'Camera barcode detection is not supported in this browser. You can type the barcode into the search box.',
    noProductsFound: 'No products found',
    searchingProducts: 'Searching...',
    selectedProduct: 'Selected Product',
    removeProduct: 'Remove Product',
    caloriesLabel: 'Calories',
    proteinLabel: 'Protein',
    carbsLabel: 'Carbs',
    fatLabel: 'Fat',
    sugarLabel: 'Sugar',
    saltLabel: 'Salt',
    per100gSuffix: 'per 100g',
    onScaleNutrition: 'On Scale Weight',
    navFood: 'Food',
    navCal: 'Calibration',
    navWifi: 'Wi-Fi',
    navSettings: 'Settings',
    bluetoothSection: 'Bluetooth Connection',
    wifiSection: 'Wi-Fi Setup Portal',
    wifiDesc: 'Open 192.168.4.1 to configure scale Wi-Fi and device settings',
    navDiary: 'Diary',
    mealTitle: 'Meal Diary',
    logMeal: 'Log to Meal',
    selectMeal: 'Select Meal',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    loggedSuccess: 'Logged to meal!',
    noEntriesToday: 'No meal records logged for this date.',
    today: 'Today',
    dailyTotal: 'Daily Total',
    deleteEntry: 'Delete Entry',
    weightLabel: 'Amount',
    deviceSectionTitle: 'Device & Hardware',
    preferencesSectionTitle: 'App Preferences',
    calAdvancedToggle: 'Calibration (Advanced)',
    openWifiPortal: 'Open Portal',
    navHome: 'Home',
    aboutTitle: 'About',
    aboutTagline: 'Precision Smart Scale & Nutrition Companion',
    aboutDeveloper: 'Developer',
    aboutHardwareTitle: 'Hardware & Architecture',
    aboutFeaturesTitle: 'Key Features',
    aboutOpenSource: 'Open Source Code',
    manualAddBtn: 'Add Manually',
    exportDataBtn: 'Export',
    exportJSON: 'Download JSON',
    exportCSV: 'Download CSV (Excel)',
    foodNameLabel: 'Food / Meal Name',
    foodNamePlaceholder: 'e.g. Grilled Chicken, Salad...',
    saveBtn: 'Save',
    cancelBtn: 'Cancel',
    quickAddMeal: 'Add to Meal',
  },
  de: {
    brandSubtitle: 'ESP32-C3 GATT v1.0',
    themeLight: 'Helles Design',
    themeDark: 'Dunkles Design',
    switchToLight: 'Zu hellem Design wechseln',
    switchToDark: 'Zu dunklem Design wechseln',
    selectLanguage: 'Sprache wählen',
    connect: 'Verbinden',
    connected: 'Verbunden',
    searching: 'Suche...',
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
    timerStopped: 'ANGEHALTEN',
    timerAria: 'Brüh-Timer',
    timerStart: 'Timer starten',
    timerStop: 'Timer stoppen',
    timerReset: 'Timer zurücksetzen',
    calTitle: 'Kalibrierungsassistent',
    calClose: 'Schließen',
    calDesc: 'Verwenden Sie ein bekanntes Referenzgewicht (z. B. 500g), um den Faktor zu berechnen:',
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
    foodNutritionTitle: 'Nährwert-Tracker',
    foodSearchOrScan: 'Produkt oder Barcode suchen',
    foodSearchPlaceholder: 'Produktname oder Barcode eingeben...',
    searchBtn: 'Suchen',
    scanBarcodeBtn: 'Barcode scannen',
    stopScannerBtn: 'Kamera schließen',
    scannerScanning: 'Barcode wird gescannt...',
    scannerHint: 'Barcode im Kamerarahmen ausrichten',
    scannerNotSupported: 'Barcode-Erkennung wird vom Browser nicht unterstützt. Geben Sie den Barcode manuell ein.',
    noProductsFound: 'Keine Produkte gefunden',
    searchingProducts: 'Suche läuft...',
    selectedProduct: 'Ausgewähltes Produkt',
    removeProduct: 'Produkt entfernen',
    caloriesLabel: 'Kalorien',
    proteinLabel: 'Protein',
    carbsLabel: 'Kohlenhydrate',
    fatLabel: 'Fett',
    sugarLabel: 'Zucker',
    saltLabel: 'Salz',
    per100gSuffix: 'pro 100g',
    onScaleNutrition: 'Aktuelles Gewicht',
    navFood: 'Nährwerte',
    navCal: 'Kalibrierung',
    navWifi: 'WLAN',
    navSettings: 'Optionen',
    bluetoothSection: 'Bluetooth-Verbindung',
    wifiSection: 'WLAN-Einrichtungsportal',
    wifiDesc: 'Öffnen Sie 192.168.4.1 für WLAN- und Geräteeinstellungen',
    navDiary: 'Tagebuch',
    mealTitle: 'Mahlzeiten-Tagebuch',
    logMeal: 'Zu Mahlzeit',
    selectMeal: 'Mahlzeit wählen',
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
    loggedSuccess: 'Zur Mahlzeit hinzugefügt!',
    noEntriesToday: 'Keine Mahlzeiten für dieses Datum eingetragen.',
    today: 'Heute',
    dailyTotal: 'Tagesgesamt',
    deleteEntry: 'Eintrag löschen',
    weightLabel: 'Menge',
    deviceSectionTitle: 'Gerät & Hardware',
    preferencesSectionTitle: 'App-Einstellungen',
    calAdvancedToggle: 'Kalibrierung (Erweitert)',
    openWifiPortal: 'Portal öffnen',
    navHome: 'Start',
    aboutTitle: 'Über',
    aboutTagline: 'Präzisions-Smartwaage & Ernährungs-Assistent',
    aboutDeveloper: 'Entwickler',
    aboutHardwareTitle: 'Hardware & Architektur',
    aboutFeaturesTitle: 'Hauptfunktionen',
    aboutOpenSource: 'Open-Source-Code',
    manualAddBtn: 'Manuell hinzufügen',
    exportDataBtn: 'Exportieren',
    exportJSON: 'JSON herunterladen',
    exportCSV: 'CSV (Excel) herunterladen',
    foodNameLabel: 'Lebensmittelname',
    foodNamePlaceholder: 'z.B. Gegrilltes Hähnchen, Salat...',
    saveBtn: 'Speichern',
    cancelBtn: 'Abbrechen',
    quickAddMeal: 'Zu Mahlzeit',
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
    connectToScale: 'Se connecter à la balance',
    connCancelled: 'Connexion annulée',
    connFailed: 'Impossible de se connecter à la balance. Le Bluetooth est-il activé ?',
    dismissError: 'Ignorer l\'erreur',
    unitSelection: 'Sélection de l\'unité de poids',
    unitAria: (u) => `Unité ${u.toUpperCase()}`,
    tared: 'Taré',
    liveStream: 'Flux en direct (100ms)',
    standby: 'En attente',
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
    foodNutritionTitle: 'Suivi Nutritionnel',
    foodSearchOrScan: 'Rechercher produit ou code-barres',
    foodSearchPlaceholder: 'Nom du produit ou code-barres...',
    searchBtn: 'Rechercher',
    scanBarcodeBtn: 'Scanner code-barres',
    stopScannerBtn: 'Fermer caméra',
    scannerScanning: 'Scan du code-barres...',
    scannerHint: 'Alignez le code-barres dans le cadre',
    scannerNotSupported: 'La détection de code-barres n\'est pas prise en charge par ce navigateur. Saisissez le code manuellement.',
    noProductsFound: 'Aucun produit trouvé',
    searchingProducts: 'Recherche en cours...',
    selectedProduct: 'Produit sélectionné',
    removeProduct: 'Supprimer le produit',
    caloriesLabel: 'Calories',
    proteinLabel: 'Protéines',
    carbsLabel: 'Glucides',
    fatLabel: 'Lipides',
    sugarLabel: 'Sucres',
    saltLabel: 'Sel',
    per100gSuffix: 'par 100g',
    onScaleNutrition: 'Poids sur la balance',
    navFood: 'Aliments',
    navCal: 'Étalonnage',
    navWifi: 'Wi-Fi',
    navSettings: 'Réglages',
    bluetoothSection: 'Connexion Bluetooth',
    wifiSection: 'Portail de configuration Wi-Fi',
    wifiDesc: 'Ouvrez 192.168.4.1 pour configurer le Wi-Fi et les paramètres',
    navDiary: 'Journal',
    mealTitle: 'Journal des repas',
    logMeal: 'Ajouter au repas',
    selectMeal: 'Choisir le repas',
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snack: 'Collation',
    loggedSuccess: 'Ajouté au repas !',
    noEntriesToday: 'Aucun enregistrement pour cette date.',
    today: "Aujourd'hui",
    dailyTotal: 'Total du jour',
    deleteEntry: "Supprimer l'entrée",
    weightLabel: 'Quantité',
    deviceSectionTitle: 'Appareil & Matériel',
    preferencesSectionTitle: "Préférences de l'application",
    calAdvancedToggle: 'Étalonnage (Avancé)',
    openWifiPortal: 'Ouvrir le portail',
    navHome: 'Accueil',
    aboutTitle: 'À propos',
    aboutTagline: 'Balance connectée de précision & Suivi nutritionnel',
    aboutDeveloper: 'Développeur',
    aboutHardwareTitle: 'Matériel & Architecture',
    aboutFeaturesTitle: 'Fonctionnalités clés',
    aboutOpenSource: 'Code source ouvert',
    manualAddBtn: 'Ajouter manuellement',
    exportDataBtn: 'Exporter',
    exportJSON: 'Télécharger JSON',
    exportCSV: 'Télécharger CSV (Excel)',
    foodNameLabel: "Nom de l'aliment",
    foodNamePlaceholder: 'ex. Poulet grillé, Salade...',
    saveBtn: 'Enregistrer',
    cancelBtn: 'Annuler',
    quickAddMeal: 'Ajouter au repas',
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
    foodNutritionTitle: 'Seguimiento Nutricional',
    foodSearchOrScan: 'Buscar producto o código de barras',
    foodSearchPlaceholder: 'Nombre del producto o código...',
    searchBtn: 'Buscar',
    scanBarcodeBtn: 'Escanear código de barras',
    stopScannerBtn: 'Cerrar cámara',
    scannerScanning: 'Escaneando código de barras...',
    scannerHint: 'Alinee el código de barras en el recuadro',
    scannerNotSupported: 'Este navegador no admite el escaneo de código de barras. Puede ingresarlo manualmente.',
    noProductsFound: 'No se encontraron productos',
    searchingProducts: 'Buscando...',
    selectedProduct: 'Producto seleccionado',
    removeProduct: 'Quitar producto',
    caloriesLabel: 'Calorías',
    proteinLabel: 'Proteínas',
    carbsLabel: 'Carbohidratos',
    fatLabel: 'Grasas',
    sugarLabel: 'Azúcar',
    saltLabel: 'Sal',
    per100gSuffix: 'por 100g',
    onScaleNutrition: 'Peso en báscula',
    navFood: 'Alimentos',
    navCal: 'Calibración',
    navWifi: 'Wi-Fi',
    navSettings: 'Ajustes',
    bluetoothSection: 'Conexión Bluetooth',
    wifiSection: 'Portal de configuración Wi-Fi',
    wifiDesc: 'Abra 192.168.4.1 para configurar Wi-Fi y ajustes de la báscula',
    navDiary: 'Diario',
    mealTitle: 'Diario de comidas',
    logMeal: 'Añadir a comida',
    selectMeal: 'Elegir comida',
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Merienda',
    loggedSuccess: '¡Añadido a la comida!',
    noEntriesToday: 'No hay registros para esta fecha.',
    today: 'Hoy',
    dailyTotal: 'Total diario',
    deleteEntry: 'Eliminar registro',
    weightLabel: 'Cantidad',
    deviceSectionTitle: 'Dispositivo y Hardware',
    preferencesSectionTitle: 'Preferencias de la aplicación',
    calAdvancedToggle: 'Calibración (Avanzado)',
    openWifiPortal: 'Abrir portal',
    navHome: 'Inicio',
    aboutTitle: 'Acerca de',
    aboutTagline: 'Báscula inteligente de precisión y Asistente nutricional',
    aboutDeveloper: 'Desarrollador',
    aboutHardwareTitle: 'Hardware y Arquitectura',
    aboutFeaturesTitle: 'Características principales',
    aboutOpenSource: 'Código fuente abierto',
    manualAddBtn: 'Añadir manualmente',
    exportDataBtn: 'Exportar',
    exportJSON: 'Descargar JSON',
    exportCSV: 'Descargar CSV (Excel)',
    foodNameLabel: 'Nombre del alimento',
    foodNamePlaceholder: 'ej. Pollo a la plancha, Ensalada...',
    saveBtn: 'Guardar',
    cancelBtn: 'Cancelar',
    quickAddMeal: 'Añadir a comida',
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

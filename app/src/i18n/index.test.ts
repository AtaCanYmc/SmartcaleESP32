import assert from 'node:assert/strict';
import { translations, LANGUAGES, getInitialLanguage, type Language } from './index';

// Mock localStorage and navigator for Node test environment
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, val: string) => {
      storage.set(key, val);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  },
  configurable: true,
});

let mockLanguage = 'en-US';
try {
  Object.defineProperty(globalThis.navigator, 'language', {
    get: () => mockLanguage,
    configurable: true,
  });
} catch {
  Object.defineProperty(globalThis, 'navigator', {
    value: { get language() { return mockLanguage; } },
    configurable: true,
  });
}

// 1. Language list verification
assert.equal(LANGUAGES.length, 8);
const expectedCodes: Language[] = ['tr', 'en', 'de', 'fr', 'es', 'zh', 'ja', 'ru'];
assert.deepEqual(LANGUAGES.map((l) => l.code), expectedCodes);

// 2. Translation key parity and non-empty check
const baseKeys = Object.keys(translations.tr) as (keyof typeof translations.tr)[];
assert.ok(baseKeys.length > 50, 'Base translations should have 50+ keys');

for (const lang of expectedCodes) {
  const langObj = translations[lang];
  assert.ok(langObj, `Language object for ${lang} must exist`);

  for (const key of baseKeys) {
    const val = langObj[key];
    assert.ok(
      val !== undefined && val !== null,
      `Language [${lang}] is missing key: "${String(key)}"`
    );

    if (typeof val === 'string') {
      assert.ok(
        val.trim().length > 0,
        `Language [${lang}] key "${String(key)}" must not be empty`
      );
    } else if (typeof val === 'function') {
      const fnRes = (val as (arg: string) => string)('test');
      assert.ok(typeof fnRes === 'string' && fnRes.length > 0);
    }
  }
}

// 3. Dynamic function translation check (unitAria)
assert.equal(translations.tr.unitAria('g'), 'G birimi');
assert.equal(translations.en.unitAria('g'), 'G unit');
assert.equal(translations.de.unitAria('oz'), 'Einheit OZ');
assert.equal(translations.fr.unitAria('ml'), 'Unité ML');
assert.equal(translations.es.unitAria('g'), 'Unidad G');
assert.equal(translations.zh.unitAria('g'), 'G 单位');
assert.equal(translations.ja.unitAria('g'), '単位 G');
assert.equal(translations.ru.unitAria('g'), 'Единица G');

// 4. getInitialLanguage tests
// A. When saved in localStorage
storage.set('smartcale-lang', 'zh');
assert.equal(getInitialLanguage(), 'zh');

storage.set('smartscale-lang', 'ja');
storage.delete('smartcale-lang');
assert.equal(getInitialLanguage(), 'ja');

storage.set('smartcale-lang', 'ru');
assert.equal(getInitialLanguage(), 'ru');

// B. When not saved, use navigator.language
storage.clear();
mockLanguage = 'zh-CN';
assert.equal(getInitialLanguage(), 'zh');

mockLanguage = 'ja-JP';
assert.equal(getInitialLanguage(), 'ja');

mockLanguage = 'ru-RU';
assert.equal(getInitialLanguage(), 'ru');

// C. When navigator language is unsupported, fallback to 'tr'
mockLanguage = 'ko-KR';
assert.equal(getInitialLanguage(), 'tr');

console.log('✓ All i18n tests passed!');

// API конфігурація
export const API_CONFIG = {
  URL: "https://script.google.com/macros/s/AKfycbxAcsIMFSDcEPJuHQfMSedSavl_IgO5KO2JM_Vt9koY5Xt3MEul5F-RwUynXLKGUIaW/exec",
  TIMEOUT: 10000, // 10 секунд
  RETRY_ATTEMPTS: 3,
};

// Кольори силосів
export const SILO_COLORS = {
  1: "#FBE393",
  2: "#9CFB93",
  3: {
    HIGH_GLUTEN: "#9CFB93", // > 23%
    LOW_GLUTEN: "#FBE393", // ≤ 23%
  },
  EMPTY: "#B0B0B0",
};

// Налаштування за замовчуванням для нових ям
export const DEFAULT_PIT_VALUES = {
  силос: 1,
  W: 15.5,
  ЧП: 350,
  Kл: 22.0,
  ВДК: 80,
  m: 10.0,
  дата: () => new Date().toLocaleDateString("uk-UA"),
};

// Конфігурація ям
export const PIT_CONFIG = {
  TOTAL_PITS: 6,
  PITS_PER_ROW: 2,
  GLUTEN_THRESHOLD: 23, // Поріг клейковини для 3 силосу
  PERCENTAGE_STEP: 10, // Крок зміни відсотків
  GLUTEN_STEP: 0.1, // Крок зміни клейковини
};

// ID ям
export const PIT_IDS = [
  "1",
  "1a",
  "2",
  "2a",
  "3",
  "3a",
  "4",
  "4a",
  "5",
  "5a",
  "6",
  "6a",
];

// Режими роботи додатка
export const APP_MODES = {
  MAIN: "main",
  CALCULATOR: "calc",
  SELECT: "select",
};

// Валідаційні правила
export const VALIDATION_RULES = {
  W: { min: 0, max: 30, step: 0.1 },
  ЧП: { min: 200, max: 800, step: 1 },
  Kл: { min: 10, max: 40, step: 0.1 },
  ВДК: { min: 50, max: 150, step: 1 },
  m: { min: 0, max: 1000, step: 0.1 },
  силос: { values: [1, 2, 3] },
};

// Повідомлення про помилки
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Помилка мережі. Перевірте підключення до інтернету.",
  API_ERROR: "Помилка сервера. Спробуйте пізніше.",
  VALIDATION_ERROR: "Некоректні дані. Перевірте введені значення.",
  SAVE_ERROR: "Не вдалося зберегти дані. Спробуйте ще раз.",
  LOAD_ERROR:
    "Не вдалося завантажити дані. Використовуються значення за замовчуванням.",
  EMPTY_SELECTION: "Виберіть принаймні одну яму для розрахунку.",
  INVALID_GLUTEN: "Некоректне значення клейковини.",
};

// Налаштування інтерфейсу
export const UI_CONFIG = {
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  MOBILE_BREAKPOINT: 480,
  MODAL_Z_INDEX: 1000,
};

// Локалізація
export const LOCALE_CONFIG = {
  LANGUAGE: "uk-UA",
  DATE_FORMAT: "DD.MM.YYYY",
  NUMBER_FORMAT: {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  },
};

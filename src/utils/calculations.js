/**
 * Розрахунок суміші на основі вибраних ям та відсотків
 */
export const calculateMixture = (selectedPits, percentages) => {
  const totalPerc = Object.values(percentages).reduce(
    (sum, p) => sum + (p || 0),
    0
  );

  if (totalPerc === 0) {
    return { W: 0, ЧП: 0, Kл: 0, ВДК: 0, m: 0 };
  }

  let mixW = 0,
    mixЧП = 0,
    mixKл = 0,
    mixВДК = 0,
    maxMass = Infinity;

  selectedPits.forEach((pit) => {
    const perc = percentages[pit.id] || 0;
    if (perc > 0) {
      const factor = perc / 100;

      mixW += (parseFloat(pit.W) || 0) * factor;
      mixЧП += (parseFloat(pit.ЧП) || 0) * factor;
      mixKл += (parseFloat(pit.Kл) || 0) * factor;
      mixВДК += (parseFloat(pit.ВДК) || 0) * factor;

      const pitMass = parseFloat(pit.m) || 0;
      if (pitMass > 0) {
        const maxFromPit = pitMass / factor;
        maxMass = Math.min(maxMass, maxFromPit);
      }
    }
  });

  return {
    W: Math.round(mixW * 10) / 10,
    ЧП: Math.round(mixЧП),
    Kл: Math.round(mixKл * 10) / 10,
    ВДК: Math.round(mixВДК),
    m: maxMass === Infinity ? 0 : Math.round(maxMass * 10) / 10,
  };
};

/**
 * Нормалізація відсотків до 100% з кратністю 10
 */
export const normalizePercentages = (percentages) => {
  const total = Object.values(percentages).reduce(
    (sum, p) => sum + (p || 0),
    0
  );

  if (total === 0) return percentages;
  if (total === 100) return percentages;

  const normalized = {};

  // Спочатку округлюємо кожне значення до кратного 10
  Object.keys(percentages).forEach((id) => {
    const value = ((percentages[id] || 0) / total) * 100;
    normalized[id] = Math.round(value / 10) * 10;
  });

  // Корекція для точної суми 100%
  const newTotal = Object.values(normalized).reduce(
    (sum, p) => sum + (p || 0),
    0
  );
  if (newTotal !== 100) {
    const diff = 100 - newTotal;
    const firstNonZeroKey = Object.keys(normalized).find(
      (id) => normalized[id] > 0
    );
    if (firstNonZeroKey) {
      normalized[firstNonZeroKey] += diff;
      // Переконуємося що результат кратний 10
      normalized[firstNonZeroKey] = Math.max(
        0,
        Math.round(normalized[firstNonZeroKey] / 10) * 10
      );
    }
  }

  return normalized;
};

/**
 * Розрахунок оптимального співвідношення для двох ям
 */
export const calculateOptimalRatio = (pit1, pit2, targetGluten) => {
  const g1 = parseFloat(pit1.Kл);
  const g2 = parseFloat(pit2.Kл);

  if (g1 === g2) {
    return { [pit1.id]: 50, [pit2.id]: 50 };
  }

  const p1 = ((targetGluten - g2) / (g1 - g2)) * 100;
  const p2 = 100 - p1;

  return {
    [pit1.id]: Math.max(0, Math.min(100, Math.round(p1))),
    [pit2.id]: Math.max(0, Math.min(100, Math.round(p2))),
  };
};

/**
 * Перевірка валідності значень ями
 */
export const isValidPit = (pit) => {
  return (
    pit &&
    pit.W !== null &&
    pit.W !== undefined &&
    pit.Kл !== null &&
    pit.Kл !== undefined &&
    pit.силос !== null &&
    pit.силос !== undefined
  );
};

/**
 * Отримання кольору ями на основі силосу та клейковини
 */
export const getPitColor = (pit) => {
  if (!isValidPit(pit)) return "var(--color-empty)";

  if (pit.силос === 1) return "var(--color-silo-1)";
  if (pit.силос === 2) return "var(--color-silo-2)";
  if (pit.силос === 3) {
    return parseFloat(pit.Kл) > 23
      ? "var(--color-silo-3-high)"
      : "var(--color-silo-3-low)";
  }

  return "var(--color-empty)";
};

/**
 * Форматування значень для відображення
 */
export const formatValue = (value, unit = "") => {
  if (value === null || value === undefined || value === "") return "-";
  return `${value}${unit}`;
};

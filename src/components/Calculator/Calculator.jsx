import React, { useState, useEffect } from "react";
import PitCard from "../PitCard/PitCard";
import styles from "./Calculator.module.css";

const Calculator = ({ selectedPits, onBack, allPits, onPitSelect }) => {
  // Основні стани компонента
  const [targetGluten, setTargetGluten] = useState(null); // Цільова клейковина
  const [percentages, setPercentages] = useState({}); // Відсотки ям {id: percentage}
  const [mixData, setMixData] = useState({}); // Дані результуючої суміші
  const [isAutoMode, setIsAutoMode] = useState(true); // true = автоматичний, false = ручний режим
  const [savedTargetGluten, setSavedTargetGluten] = useState(null); // Збережена цільова клейковина

  // Стани для фільтрів та опцій відображення
  const [componentFilter, setComponentFilter] = useState("best"); // Фільтр по кількості компонентів
  const [showTopResults, setShowTopResults] = useState(false); // Показувати топ 5 чи найкращий
  const [topResults, setTopResults] = useState([]); // Масив топ результатів
  const [selectedResultIndex, setSelectedResultIndex] = useState(0); // Індекс вибраного результату

  useEffect(() => {
    const savedGluten = localStorage.getItem("labcalc_target_gluten");
    if (savedGluten) {
      const value = parseFloat(savedGluten);
      if (!isNaN(value)) {
        setSavedTargetGluten(value);
      }
    }
  }, []);

  // Ефект що спрацьовує при зміні вибраних ям або режиму
  useEffect(() => {
    if (selectedPits.length === 1) {
      if (showTopResults) {
        setSelectedResultIndex(0);
      }
      // Одна яма - завжди 100%
      setPercentages({ [selectedPits[0].id]: 100 });
      setMixData(selectedPits[0]);
      setTargetGluten(parseFloat(selectedPits[0].Kл));
      setTopResults([]);
    } else if (selectedPits.length >= 2) {
      if (selectedPits.length === 0 && savedTargetGluten && !targetGluten) {
        setTargetGluten(savedTargetGluten);
      }
      if (isAutoMode) {
        initializeAutoMode();
      } else {
        initializeManualMode();
      }
    }
  }, [
    selectedPits,
    isAutoMode,
    componentFilter,
    savedTargetGluten,
    showTopResults,
  ]);

  // Ініціалізація автоматичного режиму
  const initializeAutoMode = () => {
    const glutenValues = selectedPits
      .map((pit) => parseFloat(pit.Kл))
      .filter((v) => !isNaN(v));

    const minGluten = Math.min(...glutenValues);
    const maxGluten = Math.max(...glutenValues);

    // Використовуємо збережене значення клейковини або середнє арифметичне
    const targetValue =
      savedTargetGluten ||
      (glutenValues.length > 0 ? (minGluten + maxGluten) / 2 : 22.0);

    setTargetGluten(Math.round(targetValue * 10) / 10);

    // Запускаємо оптимізацію
    const results = optimizeForTargetGluten(targetValue, selectedPits);

    if (
      showTopResults &&
      results.alternatives &&
      results.alternatives.length > 0
    ) {
      // Режим топ 5 - зберігаємо всі варіанти
      setTopResults(results.alternatives);
      setSelectedResultIndex(0);
      setPercentages(results.alternatives[0].percentages);
      setMixData(results.alternatives[0].mixData);
    } else {
      // Режим найкращого - показуємо тільки один варіант
      setPercentages(results.percentages || results);
      calculateMixFromPercentages(results.percentages || results);
      setTopResults([]);
    }
  };

  // Ініціалізація ручного режиму
  const initializeManualMode = () => {
    // Рівномірний розподіл для початкового стану
    const initialPercentages = {};
    const equalShare = Math.floor(100 / selectedPits.length / 10) * 10;
    let remaining = 100;

    selectedPits.forEach((pit, index) => {
      if (index === selectedPits.length - 1) {
        // Остання яма отримує залишок
        initialPercentages[pit.id] = Math.max(0, remaining);
      } else {
        const share = Math.max(0, equalShare);
        initialPercentages[pit.id] = share;
        remaining -= share;
      }
    });

    setPercentages(initialPercentages);
    calculateMixFromPercentages(initialPercentages);
    updateTargetFromPercentages(initialPercentages);
  };

  // Основна функція оптимізації суміші
  const optimizeForTargetGluten = (targetGluten, pits) => {
    if (pits.length < 2) return {};

    const TARGET_FALLING_NUMBER = 350; // Цільове число падіння

    // Для 2 ям - математично точне рішення
    if (pits.length === 2) {
      const [pit1, pit2] = pits;
      const g1 = parseFloat(pit1.Kл);
      const g2 = parseFloat(pit2.Kл);

      if (Math.abs(g1 - g2) < 0.01) {
        // Однакова клейковина - 50/50
        return { [pit1.id]: 50, [pit2.id]: 50 };
      }

      // Формула для 2 компонентів: p1 = (target - g2) / (g1 - g2)
      const p1 = ((targetGluten - g2) / (g1 - g2)) * 100;
      const p2 = 100 - p1;

      return {
        [pit1.id]: Math.max(0, Math.min(100, Math.round(p1 / 10) * 10)),
        [pit2.id]: Math.max(0, Math.min(100, Math.round(p2 / 10) * 10)),
      };
    }

    // Для 3+ ям - повний перебір з фільтрацією
    console.log(
      `Оптимізація для цільової клейковини: ${targetGluten}%, цільове число падіння: ${TARGET_FALLING_NUMBER}с`
    );
    console.log(`Фільтр компонентів: ${componentFilter}`);
    console.log(
      "Ями:",
      pits.map((p) => `${p.id}(Kл:${p.Kл}%, ЧП:${p.ЧП}с)`)
    );

    let bestCombinations = [];
    let bestGlutenError = Infinity;

    // Функція для підрахунку кількості активних компонентів
    const getComponentCount = (percentages) => {
      return Object.values(percentages).filter((p) => p > 0).length;
    };

    // Функція фільтрації по кількості компонентів
    const passesComponentFilter = (percentages) => {
      const componentCount = getComponentCount(percentages);

      switch (componentFilter) {
        case "2-comp":
          return componentCount === 2;
        case "3-comp":
          return componentCount === 3;
        case "multi-comp":
          return componentCount >= 4;
        case "best":
        default:
          return true; // Без фільтра
      }
    };

    // Рекурсивна функція для генерації всіх можливих комбінацій
    const generateAllCombinations = (
      pitIndex,
      currentPercentages,
      remainingPerc
    ) => {
      if (pitIndex >= pits.length) {
        // Перевіряємо фінальну комбінацію
        if (remainingPerc === 0) {
          // Застосовуємо фільтр компонентів
          if (!passesComponentFilter(currentPercentages)) return;

          // Мінімум 2 ями повинні брати участь
          const nonZeroCount = getComponentCount(currentPercentages);
          if (nonZeroCount < 2) return;

          // Обчислюємо характеристики суміші
          let mixW = 0,
            mixЧП = 0,
            mixGluten = 0,
            mixВДК = 0,
            mixM = Infinity;
          let totalWeight = 0;

          pits.forEach((pit) => {
            const perc = currentPercentages[pit.id];
            if (perc > 0) {
              const weight = perc / 100;
              mixW += parseFloat(pit.W || 0) * weight;
              mixЧП += parseFloat(pit.ЧП || 0) * weight;
              mixGluten += parseFloat(pit.Kл || 0) * weight;
              mixВДК += parseFloat(pit.ВДК || 0) * weight;

              // Обчислюємо максимальну масу суміші (обмежена найменшою ямою)
              const maxFromPit = parseFloat(pit.m || 0) / weight;
              if (maxFromPit > 0) {
                mixM = Math.min(mixM, maxFromPit);
              }

              totalWeight += weight;
            }
          });

          if (totalWeight === 0) return;

          // Нормалізуємо до зваженого середнього
          mixW = mixW / totalWeight;
          mixЧП = mixЧП / totalWeight;
          mixGluten = mixGluten / totalWeight;
          mixВДК = mixВДК / totalWeight;

          // Обчислюємо помилки
          const glutenError = Math.abs(mixGluten - targetGluten);
          const fallingNumberError = Math.abs(mixЧП - TARGET_FALLING_NUMBER);

          // Формуємо об'єкт даних суміші
          const mixDataObj = {
            W: Math.round(mixW * 10) / 10,
            ЧП: Math.round(mixЧП),
            Kл: Math.round(mixGluten * 10) / 10,
            ВДК: Math.round(mixВДК),
            m: mixM === Infinity ? 0 : Math.round(mixM * 10) / 10,
          };

          // Якщо помилка клейковини краща - починаємо новий список
          if (glutenError < bestGlutenError - 0.049) {
            bestGlutenError = glutenError;
            bestCombinations = [
              {
                percentages: { ...currentPercentages },
                glutenError: glutenError,
                fallingNumberError: fallingNumberError,
                mixGluten: mixGluten,
                mixFallingNumber: mixЧП,
                mixData: mixDataObj,
                componentCount: nonZeroCount,
              },
            ];
          }
          // Якщо помилка клейковини приблизно така ж - додаємо до списку
          else if (Math.abs(glutenError - bestGlutenError) <= 0.049) {
            bestCombinations.push({
              percentages: { ...currentPercentages },
              glutenError: glutenError,
              fallingNumberError: fallingNumberError,
              mixGluten: mixGluten,
              mixFallingNumber: mixЧП,
              mixData: mixDataObj,
              componentCount: nonZeroCount,
            });
          }
        }
        return;
      }

      const currentPit = pits[pitIndex];

      // Для поточної ями пробуємо всі можливі відсотки від 0 до 100 з кроком 10
      for (let perc = 0; perc <= Math.min(100, remainingPerc); perc += 10) {
        currentPercentages[currentPit.id] = perc;
        generateAllCombinations(
          pitIndex + 1,
          currentPercentages,
          remainingPerc - perc
        );
      }
    };

    // Запускаємо повний перебір
    console.log("Початок повного перебору комбінацій...");
    const startTime = Date.now();
    generateAllCombinations(0, {}, 100);
    const endTime = Date.now();
    console.log(`Перебір завершено за ${endTime - startTime}мс`);

    // Обробляємо результати
    if (bestCombinations.length === 0) {
      console.log(
        "Не знайдено валідних комбінацій, використовуємо запасний варіант"
      );
      return {
        percentages: pits.reduce((acc, pit, index) => {
          acc[pit.id] = index === 0 ? 100 : 0;
          return acc;
        }, {}),
      };
    }

    // Сортуємо по помилці числа падіння
    bestCombinations.sort(
      (a, b) => a.fallingNumberError - b.fallingNumberError
    );

    console.log(
      `Знайдено ${
        bestCombinations.length
      } комбінацій з помилкою клейковини ≤ ${bestGlutenError.toFixed(3)}`
    );

    // Якщо потрібно показати топ результати
    if (showTopResults) {
      const top10 = bestCombinations.slice(0, 10);
      console.log("Топ 10 результатів:");
      top10.forEach((combo, index) => {
        console.log(
          `${index + 1}. ${
            combo.componentCount
          }-комп: Kл:${combo.mixGluten.toFixed(
            1
          )}% ЧП:${combo.mixFallingNumber.toFixed(0)}с W:${
            combo.mixData.W
          }% m:${combo.mixData.m}т`
        );
        console.log(`   Відсотки: ${JSON.stringify(combo.percentages)}`);
      });

      return {
        percentages: top10[0].percentages,
        alternatives: top10,
      };
    } else {
      const bestCombo = bestCombinations[0];
      console.log("Обрана найкраща комбінація:");
      console.log(`  ${bestCombo.componentCount}-компонентна суміш`);
      console.log(
        `  Клейковина: ${bestCombo.mixGluten.toFixed(
          1
        )}% (помилка: ${bestCombo.glutenError.toFixed(3)})`
      );
      console.log(
        `  Число падіння: ${bestCombo.mixFallingNumber.toFixed(
          0
        )}с (помилка: ${bestCombo.fallingNumberError.toFixed(1)})`
      );
      console.log(`  Повні дані суміші:`, bestCombo.mixData);
      console.log(`  Відсотки:`, bestCombo.percentages);

      return {
        percentages: bestCombo.percentages,
      };
    }
  };

  // Розрахунок характеристик суміші з відсотків
  const calculateMixFromPercentages = (percs) => {
    const totalPerc = Object.values(percs).reduce(
      (sum, p) => sum + (p || 0),
      0
    );
    if (totalPerc === 0) return;

    let mixW = 0,
      mixЧП = 0,
      mixKл = 0,
      mixВДК = 0,
      maxMass = Infinity;

    selectedPits.forEach((pit) => {
      const perc = percs[pit.id] || 0;
      if (perc > 0) {
        const factor = perc / 100;
        mixW += parseFloat(pit.W || 0) * factor;
        mixЧП += parseFloat(pit.ЧП || 0) * factor;
        mixKл += parseFloat(pit.Kл || 0) * factor;
        mixВДК += parseFloat(pit.ВДК || 0) * factor;

        const maxFromPit = parseFloat(pit.m || 0) / factor;
        if (maxFromPit > 0) {
          maxMass = Math.min(maxMass, maxFromPit);
        }
      }
    });

    setMixData({
      W: Math.round(mixW * 10) / 10,
      ЧП: Math.round(mixЧП),
      Kл: Math.round(mixKл * 10) / 10,
      ВДК: Math.round(mixВДК),
      m: maxMass === Infinity ? 0 : Math.round(maxMass * 10) / 10,
    });
  };

  // Оновлення цільової клейковини з поточних відсотків (для ручного режиму)
  const updateTargetFromPercentages = (percs) => {
    let mixGluten = 0;
    let totalPerc = 0;

    selectedPits.forEach((pit) => {
      const perc = percs[pit.id] || 0;
      if (perc > 0) {
        mixGluten += parseFloat(pit.Kл || 0) * (perc / 100);
        totalPerc += perc / 100;
      }
    });

    if (totalPerc > 0) {
      const calculatedGluten = mixGluten / totalPerc;
      setTargetGluten(Math.round(calculatedGluten * 10) / 10);
    }
  };

  // Зміна цільової клейковини (автоматичний режим)
  const adjustGluten = (delta) => {
    if (selectedPits.length < 2) return;

    const glutenValues = selectedPits.map((pit) => parseFloat(pit.Kл));
    const minGluten = Math.min(...glutenValues);
    const maxGluten = Math.max(...glutenValues);

    const newTarget = targetGluten + delta;
    const roundedTarget = Math.round(newTarget * 10) / 10;

    setTargetGluten(roundedTarget);
    setSavedTargetGluten(roundedTarget); // Зберігаємо локально
    localStorage.setItem("labcalc_target_gluten", roundedTarget.toString());

    // Автоматично перераховуємо відсотки під нову ціль
    const results = optimizeForTargetGluten(roundedTarget, selectedPits);

    if (
      showTopResults &&
      results.alternatives &&
      results.alternatives.length > 0
    ) {
      setTopResults(results.alternatives);
      setSelectedResultIndex(0); // Скидаємо на перший при зміні клейковини
      setPercentages(results.alternatives[0].percentages);
      setMixData(results.alternatives[0].mixData);
    } else {
      setPercentages(results.percentages || results);
      calculateMixFromPercentages(results.percentages || results);
    }
  };

  // Зміна відсотка ями (ручний режим)
  const adjustPercentageManual = (pitId, delta) => {
    const newPercentages = { ...percentages };
    const currentPerc = newPercentages[pitId] || 0;

    // Кратність 10%, діапазон 0-100%
    let newPerc = currentPerc + delta;
    newPerc = Math.max(0, Math.min(100, Math.round(newPerc / 10) * 10));

    newPercentages[pitId] = newPerc;

    setPercentages(newPercentages);
    calculateMixFromPercentages(newPercentages);
    updateTargetFromPercentages(newPercentages);
  };

  // Перемикання між автоматичним та ручним режимами
  const toggleMode = () => {
    setIsAutoMode(!isAutoMode);
  };

  // Функції для перевірки меж (автоматичний режим)
  const canDecreaseGluten = () => {
    return isAutoMode && selectedPits.length >= 2;
  };

  const canIncreaseGluten = () => {
    return isAutoMode && selectedPits.length >= 2;
  };

  // Функції для перевірки меж (ручний режим)
  const canDecreasePit = (pitId) => {
    return !isAutoMode && (percentages[pitId] || 0) > 0;
  };

  const canIncreasePit = (pitId) => {
    return !isAutoMode && (percentages[pitId] || 0) < 100;
  };

  // Перевірка на перевищення 100% в ручному режимі
  const getTotalPercentage = () => {
    return Object.values(percentages).reduce((sum, p) => sum + (p || 0), 0);
  };

  const isOverLimit = () => {
    return (
      (!isAutoMode && getTotalPercentage() > 100) ||
      (!isAutoMode && getTotalPercentage() < 100)
    );
  };

  // Перевірка відхилення клейковини в автоматичному режимі
  const getGlutenError = () => {
    if (!mixData.Kл || !targetGluten) return 0;
    return Math.abs(mixData.Kл - targetGluten);
  };

  const isGlutenErrorHigh = () => {
    return isAutoMode && getGlutenError() > 0.5;
  };

  // Основні змінні для перевірки можливостей
  const canAdjustGluten = selectedPits.length >= 2 && isAutoMode;
  const canAdjustPercentages = selectedPits.length >= 2 && !isAutoMode;

  return (
    <div className={styles.calculator}>
      {/* Заголовок з кнопками навігації */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          ←
        </button>
        <h2>LAB Calc</h2>
        <button onClick={toggleMode} className={styles.modeBtn}>
          {isAutoMode ? "🤖 AUTO" : "✋ HAND"}
        </button>
      </div>

      {/* Темна табличка керування */}
      <div className={styles.controlTable}>
        {/* Рядок клейковини */}
        <div className={styles.glutenRow}>
          <span className={styles.glutenLabel}>Кл</span>
          {isAutoMode ? (
            <>
              <button
                onClick={() => adjustGluten(-0.1)}
                className={styles.controlBtn}
                disabled={!canDecreaseGluten()}
              >
                -
              </button>
              <span
                className={`${styles.glutenValue} ${
                  isGlutenErrorHigh() ? styles.errorValue : ""
                }`}
              >
                {targetGluten?.toFixed(1) || "0.0"}%
              </span>
              <button
                onClick={() => adjustGluten(0.1)}
                className={styles.controlBtn}
                disabled={!canIncreaseGluten()}
              >
                +
              </button>
            </>
          ) : (
            <>
              <span className={styles.disabledBtn}>-</span>
              <span className={styles.glutenValue}>
                {targetGluten?.toFixed(1) || "0.0"}%
              </span>
              <span className={styles.disabledBtn}>+</span>
            </>
          )}
          <div className={styles.modeLabel}>
            {isAutoMode ? "АВТО" : "РУЧН"}
            {!isAutoMode && isOverLimit() && (
              <div className={styles.totalPercentage}>
                {getTotalPercentage()}%
              </div>
            )}
          </div>
        </div>

        {isAutoMode && selectedPits.length > 2 && (
          <div className={styles.filtersRow}>
            <div className={styles.componentFilter}>
              <label>Компоненти:</label>
              <select
                value={componentFilter}
                onChange={(e) => setComponentFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="best">Найкращий</option>
                <option value="2-comp">2-компонентні</option>
                <option value="3-comp">3-компонентні</option>
                {selectedPits.length > 3 && (
                  <option value="multi-comp">Багато-компонентні</option>
                )}
              </select>
            </div>

            <div className={styles.resultsFilter}>
              <label>Показати:</label>
              <select
                value={showTopResults ? "top10" : "best"}
                onChange={(e) => setShowTopResults(e.target.value === "top10")}
                className={styles.filterSelect}
              >
                <option value="best">Найкращий варіант</option>
                <option value="top10">Топ 10 варіантів</option>
              </select>
            </div>
          </div>
        )}

        <div className={styles.mixInfo}>
          <div className={styles.mixGrid}>
            <div className={styles.mixItem}>
              <span className={styles.mixLabel}>W:</span>
              <span className={styles.mixValue}>{mixData.W || 0}%</span>
            </div>
            <div className={styles.mixItem}>
              <span className={styles.mixLabel}>ЧП:</span>
              <span className={styles.mixValue}>{mixData.ЧП || 0}с</span>
            </div>
            <div className={styles.mixItem}>
              <span className={styles.mixLabel}>Kл:</span>
              <span className={styles.mixValue}>{mixData.Kл || 0}%</span>
            </div>
            <div className={styles.mixItem}>
              <span className={styles.mixLabel}>ВДК:</span>
              <span className={styles.mixValue}>{mixData.ВДК || 0}од.</span>
            </div>
            <div className={styles.mixItem}>
              <span className={styles.mixLabel}>m:</span>
              <span className={styles.mixValue}>{mixData.m || 0}т</span>
            </div>
          </div>
        </div>
        {/* Фільтри для автоматичного режиму */}

        {/* Рядки для кожної вибраної ями */}
        {selectedPits
          .filter((pit) => (percentages[pit.id] || 0) > 0)
          .map((pit) => (
            <div key={pit.id} className={styles.pitControlRow}>
              <span className={styles.pitId}>{pit.id}</span>
              {selectedPits.length === 1 ? (
                <span className={styles.percentageFixed}>100%</span>
              ) : isAutoMode ? (
                // Автоматичний режим - тільки відображення відсотків
                <span className={styles.percentageFixed}>
                  {percentages[pit.id] || 0}%
                </span>
              ) : (
                // Ручний режим - кнопки керування
                <>
                  <button
                    onClick={() => adjustPercentageManual(pit.id, -10)}
                    className={styles.controlBtn}
                    disabled={!canDecreasePit(pit.id)}
                  >
                    -
                  </button>
                  <span
                    className={`${styles.percentageValue} ${
                      isOverLimit() ? styles.errorValue : ""
                    }`}
                  >
                    {percentages[pit.id] || 0}%
                  </span>
                  <button
                    onClick={() => adjustPercentageManual(pit.id, 10)}
                    className={styles.controlBtn}
                    disabled={!canIncreasePit(pit.id)}
                  >
                    +
                  </button>
                </>
              )}
            </div>
          ))}
      </div>

      {/* Топ 10 результатів */}
      {isAutoMode && showTopResults && topResults.length > 0 && (
        <div className={styles.topResultsContainer}>
          <h3 className={styles.topResultsTitle}>
            Топ {Math.min(topResults.length, 10)} варіантів:
          </h3>
          {topResults.map((result, index) => (
            <div
              key={index}
              className={`${styles.topResultItem} ${
                index === selectedResultIndex ? styles.selectedResult : ""
              }`}
              onClick={() => {
                setSelectedResultIndex(index);
                setPercentages(result.percentages);
                setMixData(result.mixData);
              }}
            >
              <div className={styles.resultHeader}>
                <span className={styles.resultNumber}>#{index + 1}</span>
                <span className={styles.componentCount}>
                  {result.componentCount}-комп
                </span>
              </div>
              <div className={styles.resultData}>
                <div className={styles.resultMix}>
                  W = {result.mixData.W}% | ЧП = {result.mixData.ЧП}с | Kл ={" "}
                  {result.mixData.Kл}% | m = {result.mixData.m}т
                </div>
                <div className={styles.resultPercentages}>
                  {Object.entries(result.percentages)
                    .filter(([_, perc]) => perc > 0)
                    .map(([pitId, perc]) => `${pitId} : ${perc}%`)
                    .join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.pitsGrid}>
        {allPits.map((pit) => {
          const isSelected = selectedPits.some((p) => p.id === pit.id);

          return (
            <div key={pit.id} className={styles.pitContainer}>
              <PitCard
                pit={pit}
                isSelected={isSelected}
                onSelect={onPitSelect}
                mode="view"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calculator;

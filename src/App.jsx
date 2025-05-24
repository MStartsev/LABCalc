import React, { useState, useEffect } from "react";
import PitCard from "./components/PitCard/PitCard";
import Calculator from "./components/Calculator/Calculator";
import SelectMode from "./components/SelectMode/SelectMode";
import { useApi } from "./hooks/useApi";
import { isValidPit } from "./utils/calculations";
import { PIT_IDS, APP_MODES, DEFAULT_PIT_VALUES } from "./utils/constants";
import "./styles/variables.css";
import "./styles/globals.css";
import styles from "./styles/App.module.css";

const App = () => {
  const [pits, setPits] = useState([]);
  const [selectedPits, setSelectedPits] = useState([]);
  const [mode, setMode] = useState(APP_MODES.MAIN);
  const { loading, error, loadData, saveData } = useApi();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    const data = await loadData();

    // Завжди створюємо всі 6 ям
    const allPits = PIT_IDS.map((id) => ({
      id,
      силос: null,
      W: null,
      ЧП: null,
      Kл: null,
      ВДК: null,
      m: null,
      дата: DEFAULT_PIT_VALUES.дата(),
    }));

    // Якщо є дані з бекенду, оновлюємо відповідні ями
    if (data && data.pits && Array.isArray(data.pits)) {
      data.pits.forEach((backendPit) => {
        const index = allPits.findIndex((pit) => pit.id === backendPit.id);
        if (index !== -1) {
          allPits[index] = { ...allPits[index], ...backendPit };
        }
      });
    }

    setPits(allPits);
  };

  const handleSaveData = async (newPits) => {
    try {
      // Фільтруємо тільки заповнені ями для збереження на бекенді
      const filledPits = newPits.filter((pit) => isValidPit(pit));

      await saveData({ pits: filledPits });

      // Але локально зберігаємо всі ями (включно з порожніми)
      setPits(newPits);
    } catch (err) {
      console.error("Помилка збереження:", err);
      // Показати помилку користувачу (можна додати toast notifications)
    }
  };

  const handlePitSelect = (pit) => {
    if (!isValidPit(pit)) return;

    setSelectedPits((prev) => {
      const isSelected = prev.some((p) => p.id === pit.id);
      let newSelection;

      if (isSelected) {
        newSelection = prev.filter((p) => p.id !== pit.id);
      } else {
        newSelection = [...prev, pit];
      }

      // Автоматично переходимо в режим калькулятора при виборі ям
      // але ями залишаються видимими
      if (newSelection.length > 0) {
        setMode(APP_MODES.CALCULATOR);
      } else {
        setMode(APP_MODES.MAIN);
      }

      return newSelection;
    });
  };

  const startCalculation = () => {
    // Функція видалена - автоматичний перехід при виборі ям
  };

  const handleBackToMain = () => {
    setMode(APP_MODES.MAIN);
    setSelectedPits([]); // Очищаємо вибір при поверненні
  };

  const openSelectMode = () => {
    setMode(APP_MODES.SELECT);
  };

  if (loading && pits.length === 0) {
    return (
      <div className={styles.loading}>
        <div className="loading-spinner"></div>
        <span>Завантаження...</span>
      </div>
    );
  }

  if (mode === APP_MODES.CALCULATOR) {
    return (
      <Calculator
        selectedPits={selectedPits}
        allPits={pits}
        onPitSelect={handlePitSelect}
        onBack={handleBackToMain}
      />
    );
  }

  if (mode === APP_MODES.SELECT) {
    return (
      <SelectMode
        pits={pits}
        onBack={handleBackToMain}
        onSave={handleSaveData}
      />
    );
  }

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <h1>LAB Calc</h1>
        <button
          onClick={openSelectMode}
          className={styles.editBtn}
          aria-label="Редагувати ями"
        >
          ✏️
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.pitsGrid}>
        {pits.map((pit) => (
          <PitCard
            key={pit.id}
            pit={pit}
            isSelected={selectedPits.some((p) => p.id === pit.id)}
            onSelect={handlePitSelect}
            mode="view"
          />
        ))}
      </div>
    </div>
  );
};

export default App;

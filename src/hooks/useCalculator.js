import { useState, useEffect } from "react";
import { calculateMixture, normalizePercentages } from "../utils/calculations";

export const useCalculator = (selectedPits) => {
  const [targetGluten, setTargetGluten] = useState(null);
  const [percentages, setPercentages] = useState({});
  const [mixData, setMixData] = useState({});

  useEffect(() => {
    if (selectedPits.length === 0) return;

    if (selectedPits.length === 1) {
      // Одна яма - 100%
      const pit = selectedPits[0];
      setPercentages({ [pit.id]: 100 });
      setMixData(pit);
      setTargetGluten(parseFloat(pit.Kл));
    } else {
      initializeCalculator();
    }
  }, [selectedPits]);

  const initializeCalculator = () => {
    const glutenValues = selectedPits
      .map((pit) => parseFloat(pit.Kл))
      .filter((v) => !isNaN(v));

    if (glutenValues.length === 0) return;

    const minGluten = Math.min(...glutenValues);
    const maxGluten = Math.max(...glutenValues);
    const avgGluten = (minGluten + maxGluten) / 2;

    setTargetGluten(Math.round(avgGluten * 10) / 10);

    if (selectedPits.length === 2) {
      calculateForTwoPits(avgGluten);
    } else {
      calculateForMultiplePits(avgGluten);
    }
  };

  const calculateForTwoPits = (target) => {
    const [pit1, pit2] = selectedPits;
    const g1 = parseFloat(pit1.Kл);
    const g2 = parseFloat(pit2.Kл);

    if (g1 === g2) {
      const percs = { [pit1.id]: 50, [pit2.id]: 50 };
      setPercentages(percs);
      updateMixData(percs);
      return;
    }

    const p1 = ((target - g2) / (g1 - g2)) * 100;
    const p2 = 100 - p1;

    const percs = {
      [pit1.id]: Math.max(0, Math.min(100, Math.round(p1))),
      [pit2.id]: Math.max(0, Math.min(100, Math.round(p2))),
    };

    setPercentages(percs);
    updateMixData(percs);
  };

  const calculateForMultiplePits = (target) => {
    const lowGroup = selectedPits.filter((pit) => parseFloat(pit.Kл) < target);
    const highGroup = selectedPits.filter(
      (pit) => parseFloat(pit.Kл) >= target
    );

    const initialPercentages = {};

    // Перша яма в кожній групі отримує 10%
    if (lowGroup.length > 0) {
      initialPercentages[lowGroup[0].id] = 10;
      lowGroup.slice(1).forEach((pit) => {
        initialPercentages[pit.id] = 0;
      });
    }

    if (highGroup.length > 0) {
      initialPercentages[highGroup[0].id] = 10;
      highGroup.slice(1).forEach((pit) => {
        initialPercentages[pit.id] = 0;
      });
    }

    const normalized = normalizePercentages(initialPercentages);
    setPercentages(normalized);
    updateMixData(normalized);
  };

  const updateMixData = (percs) => {
    const mixResult = calculateMixture(selectedPits, percs);
    setMixData(mixResult);
  };

  const adjustGluten = (delta) => {
    if (selectedPits.length < 2) return;

    const glutenValues = selectedPits.map((pit) => parseFloat(pit.Kл));
    const minGluten = Math.min(...glutenValues);
    const maxGluten = Math.max(...glutenValues);

    const newTarget = Math.max(
      minGluten,
      Math.min(maxGluten, targetGluten + delta)
    );

    setTargetGluten(Math.round(newTarget * 10) / 10);

    if (selectedPits.length === 2) {
      calculateForTwoPits(newTarget);
    }
  };

  const adjustPercentage = (pitId, delta) => {
    const newPercentages = { ...percentages };
    const currentPerc = newPercentages[pitId] || 0;
    newPercentages[pitId] = Math.max(0, Math.min(100, currentPerc + delta));

    const normalized = normalizePercentages(newPercentages);
    setPercentages(normalized);
    updateMixData(normalized);
  };

  return {
    targetGluten,
    percentages,
    mixData,
    adjustGluten,
    adjustPercentage,
    canAdjustGluten: selectedPits.length >= 2,
    showPercentageControls: selectedPits.length > 2,
  };
};

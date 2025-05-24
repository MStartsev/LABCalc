import { useState, useCallback } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbyb3E1Nuc9giNSY0zuhu7hcPYGWILYoO7X8X0DWG9DTASEzfIWmKM4JxS4FwzdyGwKS/exec";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Використовуємо GET запит для завантаження даних
      const response = await fetch(API_URL, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      setError(err.message);
      console.error("Помилка завантаження даних:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...data,
        last: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      // Використовуємо GET запит з параметром data
      const params = new URLSearchParams({
        data: JSON.stringify(payload),
      });

      const response = await fetch(`${API_URL}?${params}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      console.error("Помилка збереження даних:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Альтернативний метод через JSONP (якщо потрібно)
  const loadDataJSONP = useCallback(() => {
    return new Promise((resolve, reject) => {
      const callbackName = "apiCallback_" + Date.now();
      const script = document.createElement("script");

      // Глобальна функція для обробки відповіді
      window[callbackName] = function (data) {
        resolve(data);
        delete window[callbackName];
        document.head.removeChild(script);
      };

      script.onerror = function () {
        reject(new Error("JSONP request failed"));
        delete window[callbackName];
        document.head.removeChild(script);
      };

      script.src = `${API_URL}?callback=${callbackName}`;
      document.head.appendChild(script);
    });
  }, []);

  return {
    loading,
    error,
    loadData,
    saveData,
    loadDataJSONP,
  };
};

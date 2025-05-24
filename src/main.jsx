import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Перевірка підтримки браузера
if (!window.fetch) {
  console.error("Ваш браузер не підтримує fetch API. Оновіть браузер.");
}

// Обробка помилок
window.addEventListener("error", (event) => {
  console.error("Глобальна помилка:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Необроблений промис:", event.reason);
});

// Service Worker (опціонально)
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

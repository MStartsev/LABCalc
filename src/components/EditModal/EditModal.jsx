import React, { useState, useEffect } from "react";
import styles from "./EditModal.module.css";

const EditModal = ({ pit, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    силос: 2,
    W: 15.6,
    ЧП: 360,
    Kл: 22.0,
    ВДК: 80,
    m: 10.0,
    дата: new Date().toLocaleDateString("uk-UA"),
  });

  useEffect(() => {
    if (pit && isOpen) {
      setFormData({
        силос: pit.силос || 2,
        W: pit.W || 15.6,
        ЧП: pit.ЧП || 360,
        Kл: pit.Kл || 22.0,
        ВДК: pit.ВДК || 80,
        m: pit.m || 10.0,
        дата: pit.дата || new Date().toLocaleDateString("uk-UA"),
      });
    }
  }, [pit, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const updatedPit = {
      ...pit,
      ...formData,
    };
    onSave(updatedPit);
    onClose();
  };

  const handleClear = () => {
    const clearedPit = {
      ...pit,
      силос: null,
      W: null,
      ЧП: null,
      Kл: null,
      ВДК: null,
      m: null,
    };
    onSave(clearedPit);
    onClose();
  };

  if (!isOpen || !pit) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <button onClick={onClose} className={styles.backBtn}>
            ←
          </button>
          <h3>{pit.id}</h3>
          <div></div>
        </div>

        <div className={styles.formFields}>
          <div className={styles.field}>
            <label>Силос</label>
            <select
              value={formData.силос || 2}
              onChange={(e) =>
                handleInputChange("силос", parseInt(e.target.value))
              }
              className={styles.select}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>W</label>
            <input
              type="number"
              step="0.1"
              value={formData.W || ""}
              onChange={(e) =>
                handleInputChange("W", parseFloat(e.target.value) || null)
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>ЧП</label>
            <input
              type="number"
              step="1"
              value={formData.ЧП || ""}
              onChange={(e) =>
                handleInputChange("ЧП", parseInt(e.target.value) || null)
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>Kл</label>
            <input
              type="number"
              step="0.1"
              value={formData.Kл || ""}
              onChange={(e) =>
                handleInputChange("Kл", parseFloat(e.target.value) || null)
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>ВДК</label>
            <input
              type="number"
              step="1"
              value={formData.ВДК || ""}
              onChange={(e) =>
                handleInputChange("ВДК", parseInt(e.target.value) || null)
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>m</label>
            <input
              type="number"
              step="0.1"
              value={formData.m || ""}
              onChange={(e) =>
                handleInputChange("m", parseFloat(e.target.value) || null)
              }
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label>дата</label>
            <input
              type="date"
              value={formData.дата || ""}
              onChange={(e) => handleInputChange("дата", e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button onClick={handleClear} className={styles.clearBtn}>
            Очистити
          </button>
          <button onClick={handleSave} className={styles.saveBtn}>
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;

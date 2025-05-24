import React, { useState } from "react";
import PitCard from "../PitCard/PitCard";
import EditModal from "../EditModal/EditModal";
import styles from "./SelectMode.module.css";

const SelectMode = ({ pits, onBack, onSave }) => {
  const [editingPit, setEditingPit] = useState(null);
  const [localPits, setLocalPits] = useState(pits);

  const handleSavePit = async (updatedPit) => {
    const newPits = localPits.map((p) =>
      p.id === updatedPit.id ? updatedPit : p
    );

    setLocalPits(newPits);

    // Передаємо всі ями (включно з порожніми) для локального стану
    // але в onSave буде фільтрація для бекенду
    await onSave(newPits);
  };

  const handleEditPit = (pit) => {
    setEditingPit(pit);
  };

  const handleCloseModal = () => {
    setEditingPit(null);
  };

  return (
    <div className={styles.selectMode}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          ←
        </button>
        <h2>Внести зміни</h2>
        <div></div>
      </div>

      <div className={styles.pitsGrid}>
        {localPits.map((pit) => (
          <PitCard
            key={pit.id}
            pit={pit}
            isSelected={false}
            onSelect={() => {}}
            onEdit={handleEditPit}
            mode="select"
          />
        ))}
      </div>

      <EditModal
        pit={editingPit}
        isOpen={!!editingPit}
        onClose={handleCloseModal}
        onSave={handleSavePit}
      />
    </div>
  );
};

export default SelectMode;

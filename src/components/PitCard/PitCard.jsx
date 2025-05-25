import styles from "./PitCard.module.css";

const PitCard = ({ pit, isSelected, onSelect, onEdit, mode = "view" }) => {
  const getPitColor = () => {
    if (!pit.W || !pit.Kл || pit.силос === null) return "var(--color-empty)";

    if (pit.силос === 1) return "var(--color-silo-1)";
    if (pit.силос === 2) return "var(--color-silo-2)";
    if (pit.силос === 3) {
      return parseFloat(pit.Kл) > 23
        ? "var(--color-silo-3-high)"
        : "var(--color-silo-3-low)";
    }
    return "var(--color-empty)";
  };

  const formatValue = (text, value, unit = "") => {
    if (value === null || value === undefined || value === "") return "";
    return `${text} ${value}${unit}`;
  };

  const handleClick = () => {
    if (mode === "select") {
      // В режимі редагування можна клікнути на будь-яку яму
      onEdit(pit);
    } else if (mode === "view") {
      // В режимі перегляду можна вибрати тільки заповнені ями
      if (pit.W && pit.Kл && pit.силос !== null) {
        onSelect(pit);
      }
    }
  };

  return (
    <div
      className={`${styles.pitCard} ${isSelected ? styles.selected : ""} ${
        (!pit.W || !pit.Kл || pit.силос === null) && mode === "view"
          ? styles.empty
          : ""
      }`}
      style={{ backgroundColor: getPitColor() }}
      onClick={handleClick}
    >
      <div className={styles.pitHeader}>
        <span className={styles.pitNumber}>{pit.id}</span>
        <span className={styles.pitDate}>{pit.дата}</span>
        {mode === "view" && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}} // Порожня функція
            onClick={(e) => {
              e.stopPropagation(); // Зупиняємо тільки тут
              if (pit.W && pit.Kл && pit.силос !== null) {
                onSelect(pit);
              }
            }}
            disabled={!pit.W || !pit.Kл || pit.силос === null}
            className={styles.checkbox}
          />
        )}
      </div>

      <div className={styles.pitContent}>
        <div className={styles.pitRow}>{formatValue("W = ", pit.W, "%")}</div>
        <div className={styles.pitRow}>{formatValue("ЧП = ", pit.ЧП, "с")}</div>
        <div className={styles.pitRow}>
          {formatValue("Kл = ", pit.Kл, "%")} -{" "}
          {formatValue("", pit.ВДК, "од.")}
        </div>
        <div className={styles.pitRow}>{formatValue("m = ", pit.m, "т")}</div>
      </div>

      {pit.силос && <div className={styles.pitCorner}>{pit.силос}с</div>}
    </div>
  );
};

export default PitCard;

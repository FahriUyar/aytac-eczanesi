import { useState, useRef } from "react";

/**
 * Tutar girişi — binlik nokta ekler (Türk formatı: 1.000, 10.000, 100.000)
 * Gerçek numeric değeri onValue callback ile döner.
 */
export default function CurrencyInput({
  label,
  id,
  value,
  onValueChange,
  error,
  className = "",
  ...props
}) {
  const inputRef = useRef(null);

  // Numeric değeri Türk formatına çevir: 1234567 → "1.234.567"
  const formatDisplay = (num) => {
    if (!num && num !== 0) return "";
    const parts = String(num).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decPart = parts[1];
    return decPart !== undefined ? `${intPart},${decPart}` : intPart;
  };

  // Display string'den sadece rakam ve virgülü al, numeric döndür
  const parseToNumber = (str) => {
    // Tüm noktaları kaldır (binlik ayraç), virgülü noktaya çevir (ondalık)
    const cleaned = str.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const [displayValue, setDisplayValue] = useState(() =>
    value ? formatDisplay(value) : "",
  );

  const handleChange = (e) => {
    const raw = e.target.value;

    // Sadece rakam, virgül ve noktaya izin ver
    const filtered = raw.replace(/[^0-9,]/g, "");

    // Birden fazla virgüle izin verme
    const parts = filtered.split(",");
    let sanitized = parts[0];
    if (parts.length > 1) {
      sanitized += "," + parts.slice(1).join("").slice(0, 2); // max 2 ondalık
    }

    // Binlik noktaları ekle
    const intPart = sanitized.split(",")[0].replace(/^0+(?=\d)/, "");
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decPart = sanitized.split(",")[1];
    const formatted =
      decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;

    setDisplayValue(formatted);
    onValueChange(
      parseToNumber(formatted.replace(/\./g, "").replace(",", ".")),
    );
  };

  const handleBlur = () => {
    // Blur olduğunda düzgün formatlı değer göster
    if (displayValue === "" || displayValue === "0") {
      setDisplayValue("");
      onValueChange(0);
      return;
    }
    const numeric = parseToNumber(displayValue);
    setDisplayValue(formatDisplay(String(numeric)));
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">
          ₺
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-right font-medium ${
            error ? "border-danger-500 focus:ring-danger-500" : ""
          } ${className}`}
          placeholder="0"
          {...props}
        />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  );
}

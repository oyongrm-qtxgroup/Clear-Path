import { useState, useCallback, useRef, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Strip everything except digits and a single decimal point. */
function stripToNumeric(str: string): string {
  let result = "";
  let hasDecimal = false;
  for (const ch of str) {
    if (ch >= "0" && ch <= "9") {
      result += ch;
    } else if (ch === "." && !hasDecimal) {
      result += ".";
      hasDecimal = true;
    }
  }
  return result;
}

/** Format a numeric string with commas while preserving trailing decimal / zeros. */
function formatDisplay(raw: string): string {
  if (raw === "" || raw === ".") return raw;

  const parts = raw.split(".");
  const intPart = parts[0];
  const decPart = parts[1];

  // Format integer part with commas
  const num = parseInt(intPart || "0", 10);
  const formattedInt = isNaN(num) ? "0" : formatter.format(num);

  if (decPart !== undefined) {
    // Limit to 2 decimal places
    return `${formattedInt}.${decPart.slice(0, 2)}`;
  }

  return formattedInt;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface CurrencyInputProps {
  /** The raw numeric value. */
  value: number | string;
  /** Called with the raw numeric value on change. */
  onChange: (value: number) => void;
  /** Called on blur (optional). */
  onBlur?: () => void;
  /** Additional class names for the outer wrapper. */
  className?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Whether the input is disabled. */
  disabled?: boolean;
  /** HTML id attribute. */
  id?: string;
  /** Compact mode — smaller height. */
  compact?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder = "0.00",
  disabled,
  id,
  compact,
}: CurrencyInputProps) {
  // Convert incoming value to a display string
  const toDisplay = useCallback((v: number | string): string => {
    const num = typeof v === "string" ? parseFloat(v) : v;
    if (isNaN(num) || num === 0) return "";
    return formatter.format(num);
  }, []);

  const [displayValue, setDisplayValue] = useState(() => toDisplay(value));
  const internalRef = useRef(false);

  // Sync display when value changes externally (not from our own onChange)
  useEffect(() => {
    if (internalRef.current) {
      internalRef.current = false;
      return;
    }
    setDisplayValue(toDisplay(value));
  }, [value, toDisplay]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = stripToNumeric(e.target.value);
    const formatted = formatDisplay(raw);
    setDisplayValue(formatted);

    // Parse and emit the numeric value
    const numericValue = parseFloat(raw) || 0;
    internalRef.current = true;
    onChange(numericValue);
  }

  function handleBlur() {
    // Finalize formatting on blur
    const raw = stripToNumeric(displayValue);
    const num = parseFloat(raw) || 0;
    if (num > 0) {
      setDisplayValue(formatter.format(num));
    } else {
      setDisplayValue("");
    }
    onBlur?.();
  }

  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
        ₱
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-8", compact && "h-8 text-sm", className)}
      />
    </div>
  );
}

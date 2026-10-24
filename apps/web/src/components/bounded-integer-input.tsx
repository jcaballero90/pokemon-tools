import { useEffect, useRef, useState, type FocusEventHandler, type InputHTMLAttributes } from "react";

type BoundedIntegerInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "min" | "max" | "step" | "onChange"> & {
  value: number;
  min: number;
  max: number;
  allowEmpty?: boolean;
  empty?: boolean;
  rangeHint: string;
  wholeNumberHint: string;
  clampHint?: (value: number) => string;
  onValueChange: (value: number | null) => void;
  onValidityChange?: (valid: boolean) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
};

function isIntegerInRange(value: number, min: number, max: number) {
  return Number.isSafeInteger(value) && value >= min && value <= max;
}

function draftIsValid(raw: string, allowEmpty: boolean, min: number, max: number) {
  if (raw === "") return allowEmpty;
  if (!/^-?\d+$/.test(raw)) return false;
  return isIntegerInRange(Number(raw), min, max);
}

function invalidHint(raw: string, rangeHint: string, wholeNumberHint: string) {
  if (raw === "" || !/^-?\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) return wholeNumberHint;
  return rangeHint;
}

export function BoundedIntegerInput({
  value,
  min,
  max,
  allowEmpty = false,
  empty = false,
  rangeHint,
  wholeNumberHint,
  clampHint,
  onValueChange,
  onValidityChange,
  onBlur,
  ...inputProps
}: BoundedIntegerInputProps) {
  const initialValid = isIntegerInRange(value, min, max);
  const [raw, setRaw] = useState(() => empty && allowEmpty ? "" : String(value));
  const [feedback, setFeedback] = useState(() => initialValid ? "" : invalidHint(String(value), rangeHint, wholeNumberHint));
  const focused = useRef(false);
  const lastValid = useRef<number | null>(initialValid ? value : null);
  const lastObservedValue = useRef({ value, empty });
  const onValidityChangeRef = useRef(onValidityChange);
  const lastReportedValidity = useRef<boolean | null>(null);
  onValidityChangeRef.current = onValidityChange;

  const isValid = draftIsValid(raw, allowEmpty, min, max);

  useEffect(() => {
    if (lastReportedValidity.current === isValid) return;
    lastReportedValidity.current = isValid;
    onValidityChangeRef.current?.(isValid);
  }, [isValid]);

  useEffect(() => {
    const valueChanged = !Object.is(lastObservedValue.current.value, value);
    const emptyChanged = lastObservedValue.current.empty !== empty;
    if (!valueChanged && !emptyChanged) return;
    lastObservedValue.current = { value, empty };
    if (focused.current) return;
    const nextRaw = empty && allowEmpty ? "" : String(value);
    setRaw(nextRaw);
    setFeedback(isIntegerInRange(value, min, max) ? "" : invalidHint(nextRaw, rangeHint, wholeNumberHint));
    if (isIntegerInRange(value, min, max)) lastValid.current = value;
  }, [value, empty, allowEmpty, min, max, rangeHint, wholeNumberHint]);

  function handleChange(nextRaw: string) {
    setRaw(nextRaw);
    if (nextRaw === "") {
      if (allowEmpty) {
        setFeedback("");
        onValueChange(null);
      } else {
        setFeedback("");
      }
      return;
    }

    if (!/^-?\d+$/.test(nextRaw)) {
      setFeedback(wholeNumberHint);
      return;
    }

    const parsed = Number(nextRaw);
    if (!Number.isSafeInteger(parsed)) {
      setFeedback(wholeNumberHint);
      return;
    }

    const bounded = Math.min(max, Math.max(min, parsed));
    const wasClamped = bounded !== parsed;
    lastValid.current = bounded;
    setRaw(String(bounded));
    setFeedback(wasClamped && clampHint ? clampHint(bounded) : "");
    onValueChange(bounded);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    focused.current = false;
    if (allowEmpty && raw === "" && !empty) {
      // The parent may reject clearing an override (for example, when the
      // inherited value would exceed the remaining EV budget).
      setRaw(String(value));
      setFeedback("");
    } else if (!allowEmpty && raw === "") {
      if (lastValid.current !== null) {
        setRaw(String(lastValid.current));
        setFeedback("");
        onValueChange(lastValid.current);
      } else {
        setFeedback(invalidHint(raw, rangeHint, wholeNumberHint));
      }
    } else if (!draftIsValid(raw, allowEmpty, min, max)) {
      if (lastValid.current !== null) {
        setRaw(String(lastValid.current));
        setFeedback("");
        onValueChange(lastValid.current);
      } else {
        setFeedback(wholeNumberHint);
      }
    }
    onBlur?.(event);
  }

  const errorId = inputProps["aria-describedby"];
  const feedbackId = `${inputProps.id ?? "integer"}-feedback`;
  const describedBy = [errorId, feedback ? feedbackId : null].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <input
        {...inputProps}
        type="number"
        min={min}
        max={max}
        step={1}
        inputMode="numeric"
        value={raw}
        aria-invalid={!isValid || inputProps["aria-invalid"] === true}
        aria-describedby={describedBy}
        onFocus={() => { focused.current = true; }}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
      />
      {feedback && <small className="field-feedback" id={feedbackId} role="status">{feedback}</small>}
    </>
  );
}

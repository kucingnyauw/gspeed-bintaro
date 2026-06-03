import { useState, useCallback } from "react";

/**
 * Custom hook untuk kalkulator dengan operasi matematika lanjutan.
 * @returns {Object} Calculator state dan handlers
 */
export const useCalculator = () => {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [hasCalculated, setHasCalculated] = useState(false);
  const [memory, setMemory] = useState(0);
  const [showScientific, setShowScientific] = useState(false);

  const evaluateExpression = useCallback((expr) => {
    const cleaned = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/π/g, String(Math.PI))
      .replace(/e(?![xp])/g, String(Math.E));

    const withMathFunctions = cleaned
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/\^/g, "**")
      .replace(/√/g, "Math.sqrt")
      .replace(/%/g, "/100");

    return eval(withMathFunctions);
  }, []);

  const handleNumber = useCallback(
    (num) => {
      if (hasCalculated) {
        setDisplay(num);
        setExpression("");
        setHasCalculated(false);
      } else {
        if (display === "0" && num !== "0" && num !== "00") {
          setDisplay(num);
        } else if (display === "0" && (num === "0" || num === "00")) {
          return;
        } else if (display.length >= 15) {
          return;
        } else {
          setDisplay(display + num);
        }
      }
    },
    [display, hasCalculated]
  );

  const handleOperator = useCallback(
    (op) => {
      setHasCalculated(false);
      if (expression) {
        const lastChar = expression.slice(-1);
        if (["+", "-", "×", "÷", "^"].includes(lastChar)) {
          setExpression(expression.slice(0, -1) + op);
        } else {
          setExpression(expression + display + op);
        }
      } else {
        setExpression(display + op);
      }
      setDisplay("0");
    },
    [display, expression]
  );

  const handleFunction = useCallback(
    (func) => {
      setHasCalculated(false);
      const currentNum = parseFloat(display) || 0;

      try {
        let result;
        switch (func) {
          case "sqrt":
            result = Math.sqrt(currentNum);
            break;
          case "square":
            result = Math.pow(currentNum, 2);
            break;
          case "cube":
            result = Math.pow(currentNum, 3);
            break;
          case "power":
            setExpression(expression + display + "^");
            setDisplay("0");
            return;
          case "sin":
            result = Math.sin((currentNum * Math.PI) / 180);
            break;
          case "cos":
            result = Math.cos((currentNum * Math.PI) / 180);
            break;
          case "tan":
            result = Math.tan((currentNum * Math.PI) / 180);
            break;
          case "log":
            result = Math.log10(currentNum);
            break;
          case "ln":
            result = Math.log(currentNum);
            break;
          case "factorial":
            if (currentNum < 0 || !Number.isInteger(currentNum)) {
              setDisplay("Error");
              return;
            }
            result = 1;
            for (let i = 2; i <= currentNum; i++) result *= i;
            break;
          case "percent":
            result = currentNum / 100;
            break;
          case "inverse":
            result = 1 / currentNum;
            break;
          case "abs":
            result = Math.abs(currentNum);
            break;
          case "pi":
            result = Math.PI;
            break;
          case "e":
            result = Math.E;
            break;
          default:
            return;
        }

        if (!isFinite(result)) {
          setDisplay("Error");
          setExpression("");
          setHasCalculated(true);
          return;
        }

        const formatted = Number.isInteger(result)
          ? result.toString()
          : parseFloat(result.toPrecision(12)).toString();

        setDisplay(formatted.length > 15 ? result.toExponential(8) : formatted);
        setHasCalculated(true);
      } catch {
        setDisplay("Error");
        setHasCalculated(true);
      }
    },
    [display, expression]
  );

  const handleMemory = useCallback(
    (action) => {
      const currentValue = parseFloat(display) || 0;
      switch (action) {
        case "MC":
          setMemory(0);
          break;
        case "MR":
          setDisplay(memory.toString());
          setHasCalculated(true);
          break;
        case "M+":
          setMemory(memory + currentValue);
          setHasCalculated(true);
          break;
        case "M-":
          setMemory(memory - currentValue);
          setHasCalculated(true);
          break;
      }
    },
    [display, memory]
  );

  const handleClear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setHasCalculated(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (hasCalculated) {
      handleClear();
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  }, [display, hasCalculated, handleClear]);

  const handleEquals = useCallback(() => {
    try {
      const fullExpression = expression + display;
      const result = evaluateExpression(fullExpression);

      if (!isFinite(result)) {
        setDisplay("Error");
        setExpression("");
        setHasCalculated(true);
        return;
      }

      const formatted = Number.isInteger(result)
        ? result.toString()
        : parseFloat(result.toPrecision(12)).toString();

      setDisplay(
        formatted.length > 15
          ? parseFloat(result.toExponential(8)).toString()
          : formatted
      );
      setExpression("");
      setHasCalculated(true);
    } catch {
      setDisplay("Error");
      setExpression("");
      setHasCalculated(true);
    }
  }, [expression, display, evaluateExpression]);

  const toggleScientific = useCallback(() => {
    setShowScientific((prev) => !prev);
  }, []);

  const formatDisplay = (val) => {
    if (val === "Error") return val;
    if (val.length <= 15) return val;
    return parseFloat(val).toExponential(8);
  };

  return {
    display,
    expression,
    memory,
    showScientific,
    handleNumber,
    handleOperator,
    handleFunction,
    handleMemory,
    handleClear,
    handleDelete,
    handleEquals,
    toggleScientific,
    formatDisplay,
  };
};
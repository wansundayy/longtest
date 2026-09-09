(() => {
  "use strict";

  const MAX_VALUE = 100;
  const ROMAN_TABLE = [
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  const ROMAN_VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100 };

  function intToRoman(num) {
    let n = num;
    let out = "";
    for (const [value, symbol] of ROMAN_TABLE) {
      while (n >= value) {
        out += symbol;
        n -= value;
      }
    }
    return out;
  }

  function romanToIntLoose(str) {
    let total = 0;
    for (let i = 0; i < str.length; i++) {
      const cur = ROMAN_VALUES[str[i]];
      const next = ROMAN_VALUES[str[i + 1]];
      if (next && cur < next) {
        total -= cur;
      } else {
        total += cur;
      }
    }
    return total;
  }

  function isValidRoman(str) {
    if (!str) return false;
    const value = romanToIntLoose(str);
    if (value < 1 || value > MAX_VALUE) return false;
    return intToRoman(value) === str;
  }

  const state = {
    mode: "arabic",
    currentInput: "",
    operand1: null,
    operator: null,
    resultShown: false,
  };

  const el = {
    modeArabic: document.getElementById("modeArabic"),
    modeRoman: document.getElementById("modeRoman"),
    numeralsArabic: document.getElementById("numeralsArabic"),
    numeralsRoman: document.getElementById("numeralsRoman"),
    expression: document.getElementById("expression"),
    current: document.getElementById("current"),
    message: document.getElementById("message"),
    btnClear: document.getElementById("btnClear"),
    btnBack: document.getElementById("btnBack"),
    btnEquals: document.getElementById("btnEquals"),
  };

  function formatValue(num) {
    return state.mode === "roman" ? intToRoman(num) : String(num);
  }

  function parseCurrentValue() {
    if (state.currentInput === "") return null;
    return state.mode === "roman"
      ? romanToIntLoose(state.currentInput)
      : parseInt(state.currentInput, 10);
  }

  function resetAll() {
    state.currentInput = "";
    state.operand1 = null;
    state.operator = null;
    state.resultShown = false;
    setMessage("");
    render();
  }

  function setMessage(text) {
    el.message.textContent = text || " ";
  }

  function render() {
    el.current.textContent = state.currentInput === "" ? "0" : state.currentInput;
    if (state.operand1 !== null && state.operator) {
      el.expression.textContent = `${formatValue(state.operand1)} ${state.operator}`;
    } else {
      el.expression.textContent = " ";
    }
  }

  function flashReject(button) {
    if (!button) return;
    button.classList.remove("reject");
    // force reflow so the animation can restart if triggered again quickly
    void button.offsetWidth;
    button.classList.add("reject");
  }

  function handleDigit(digit) {
    if (state.resultShown) {
      state.currentInput = "";
      state.resultShown = false;
      setMessage("");
    }
    let candidate;
    if (state.currentInput === "0") {
      candidate = digit;
    } else {
      candidate = state.currentInput + digit;
    }
    const value = parseInt(candidate, 10);
    if (candidate.length > 3 || value > MAX_VALUE) {
      return false;
    }
    state.currentInput = candidate;
    return true;
  }

  function handleLetter(letter) {
    if (state.resultShown) {
      state.currentInput = "";
      state.resultShown = false;
      setMessage("");
    }
    const candidate = state.currentInput + letter;
    if (!isValidRoman(candidate)) {
      return false;
    }
    state.currentInput = candidate;
    return true;
  }

  function compute(a, op, b) {
    switch (op) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b !== 0 && a % b === 0 ? a / b : NaN;
      default:
        return NaN;
    }
  }

  function applyPendingOperation() {
    if (state.operand1 !== null && state.operator && state.currentInput !== "") {
      const b = parseCurrentValue();
      const result = compute(state.operand1, state.operator, b);
      if (!Number.isInteger(result) || result < 1 || result > MAX_VALUE) {
        setMessage(`ผลลัพธ์ต้องเป็นจำนวนเต็มระหว่าง 1 ถึง ${MAX_VALUE}`);
        return false;
      }
      state.operand1 = result;
      return true;
    }
    return true;
  }

  function handleOperator(op) {
    if (state.currentInput === "" && state.operand1 === null) {
      return;
    }
    if (state.currentInput === "") {
      state.operator = op;
      state.resultShown = false;
      render();
      return;
    }
    if (state.operand1 === null) {
      state.operand1 = parseCurrentValue();
    } else if (!applyPendingOperation()) {
      return;
    }
    state.operator = op;
    state.currentInput = "";
    state.resultShown = false;
    render();
  }

  function handleEquals() {
    if (state.operand1 === null || !state.operator || state.currentInput === "") {
      return;
    }
    const b = parseCurrentValue();
    const result = compute(state.operand1, state.operator, b);
    if (!Number.isInteger(result) || result < 1 || result > MAX_VALUE) {
      setMessage(`ผลลัพธ์ต้องเป็นจำนวนเต็มระหว่าง 1 ถึง ${MAX_VALUE}`);
      return;
    }
    el.expression.textContent = `${formatValue(state.operand1)} ${state.operator} ${formatValue(b)} =`;
    state.currentInput = formatValue(result);
    state.operand1 = null;
    state.operator = null;
    state.resultShown = true;
    setMessage("");
    el.current.textContent = state.currentInput;
  }

  function handleBackspace() {
    if (state.resultShown) {
      resetAll();
      return;
    }
    state.currentInput = state.currentInput.slice(0, -1);
    setMessage("");
    render();
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    el.modeArabic.classList.toggle("active", mode === "arabic");
    el.modeRoman.classList.toggle("active", mode === "roman");
    el.numeralsArabic.hidden = mode !== "arabic";
    el.numeralsRoman.hidden = mode !== "roman";
    resetAll();
  }

  el.modeArabic.addEventListener("click", () => setMode("arabic"));
  el.modeRoman.addEventListener("click", () => setMode("roman"));

  el.numeralsArabic.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-digit]");
    if (!btn) return;
    const ok = handleDigit(btn.dataset.digit);
    if (!ok) {
      flashReject(btn);
      return;
    }
    render();
  });

  el.numeralsRoman.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-letter]");
    if (!btn) return;
    const ok = handleLetter(btn.dataset.letter);
    if (!ok) {
      flashReject(btn);
      return;
    }
    render();
  });

  document.querySelectorAll(".key-op").forEach((btn) => {
    btn.addEventListener("click", () => handleOperator(btn.dataset.op));
  });

  el.btnClear.addEventListener("click", resetAll);
  el.btnBack.addEventListener("click", handleBackspace);
  el.btnEquals.addEventListener("click", handleEquals);

  render();
})();

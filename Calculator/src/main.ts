import './style.css';

// select
const display = document.getElementById("display") as HTMLOutputElement;
const buttons = document.querySelectorAll<HTMLButtonElement>(
  'button'
);

const historyToggle = document.getElementById("history-toggle") as HTMLButtonElement;
const historyDrawer = document.getElementById("history-drawer") as HTMLElement;
const historyList = document.getElementById("history-list") as HTMLUListElement;

// calc state
let currentValue = "";
let previousValue = "";
let operator: string | null = null;
let lastPressedEquals = false;

// display
function updateDisplay() {
  if (operator && previousValue) {
    display.textContent = `${previousValue} ${getOperatorSymbol(operator)} ${currentValue}`;
  } else {
    display.textContent = currentValue || "0";
  }
}

function getOperatorSymbol(op: string) {
  switch (op) {
    case "add": return "+";
    case "subtract": return "-";
    case "multiply": return "×";
    case "divide": return "÷";
    default: return "";
  }
}

// history
function addToHistory(expression: string, result: string) {
  const li = document.createElement("li");
  li.textContent = `${expression} = ${result}`;
  historyList.prepend(li);
}


historyToggle.addEventListener("click", () => {
  const isOpen = historyDrawer.classList.toggle("open");
  historyToggle.setAttribute("aria-expanded", isOpen.toString());
});


historyList.addEventListener("click", (e) => {
  const target = e.target as HTMLLIElement;
  if (target && target.tagName === "LI") {
    const parts = target.textContent?.split(" = ");
    if (parts && parts[1]) {
      currentValue = parts[1];
      previousValue = "";
      operator = null;
      updateDisplay();
      historyDrawer.classList.remove("open");
      historyToggle.setAttribute("aria-expanded", "false");
    }
  }
});


function handleValue(value: string) {
  if (lastPressedEquals) {
    currentValue = "";
    previousValue = "";
    operator = null;
    lastPressedEquals = false;
  }

  if (value === "." && currentValue.includes(".")) return;
  currentValue += value;
  updateDisplay();
}

function handleAction(action: string) {
  switch (action) {
    case "clear":
      currentValue = "";
      previousValue = "";
      operator = null;
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "delete":
      currentValue = currentValue.slice(0, -1);
      updateDisplay();
      break;

    case "subtract":
      if (currentValue === "" || (operator && currentValue === "")) {
        currentValue = "-";
        updateDisplay();
        return;
      }
      handleOperator("subtract");
      break;

    case "add":
    case "multiply":
    case "divide":
      handleOperator(action);
      break;

    case "equals":
      calculate();
      lastPressedEquals = true;
      operator = null;
      break;
  }
}

function handleOperator(op: string) {
  if (lastPressedEquals) {
    previousValue = currentValue;
    currentValue = "";
    lastPressedEquals = false;
  }

  if (currentValue === "" && previousValue !== "") {
    operator = op;
    updateDisplay();
    return;
  }

  if (previousValue !== "" && currentValue !== "") {
    calculate();
    previousValue = currentValue;
  } else {
    previousValue = currentValue;
  }

  currentValue = "";
  operator = op;
  updateDisplay();
}

// calcs
function formatNumber(num: number, maxDigits: number = 12): string {
  const str = num.toString();
  return str.length > maxDigits ? str.slice(0, maxDigits) : str;
}

function calculate() {
  if (!previousValue || !currentValue || !operator) return;

  const prev = parseFloat(previousValue);
  const curr = parseFloat(currentValue);
  let result = 0;

  switch (operator) {
    case "add": result = prev + curr; break;
    case "subtract": result = prev - curr; break;
    case "multiply": result = prev * curr; break;
    case "divide": result = curr !== 0 ? prev / curr : NaN; break;
  }

  const formattedResult = formatNumber(result, 12);
  addToHistory(`${previousValue} ${getOperatorSymbol(operator)} ${currentValue}`, formattedResult);

  currentValue = formattedResult;
  previousValue = "";
  updateDisplay();
}


buttons.forEach((button) => {
  button.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("button") as HTMLButtonElement;
    if (!target) return;

    const value = target.dataset.value;
    const action = target.dataset.action;

    if (value !== undefined) handleValue(value);
    else if (action !== undefined) handleAction(action.toLowerCase());
  });
});

document.addEventListener("keydown", (e) => {
  const key = e.key;

  if ((key >= "0" && key <= "9") || key === ".") handleValue(key);
  else {
    switch (key) {
      case "+": handleAction("add"); break;
      case "-": handleAction("subtract"); break;
      case "*": handleAction("multiply"); break;
      case "/": handleAction("divide"); break;
      case "Enter":
      case "=": handleAction("equals"); break;
      case "Backspace": handleAction("delete"); break;
      case "Escape": handleAction("clear"); break;
    }
  }
});


updateDisplay();

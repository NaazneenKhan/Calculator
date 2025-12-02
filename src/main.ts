import './style.css';

const display = document.getElementById("display") as HTMLOutputElement;
const buttons = document.querySelectorAll<HTMLButtonElement>('button');
const historyToggle = document.getElementById("history-toggle") as HTMLButtonElement;
const historyDrawer = document.getElementById("history-drawer") as HTMLElement;
const historyList = document.getElementById("history-list") as HTMLUListElement;

let currentExpression = "";
let lastPressedEquals = false;
let angleMode = "deg";

function updateDisplay() {
  display.textContent = currentExpression || "0";
}
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function evaluateScientificFunction(funcName: string, value: number): number {
  switch (funcName) {
    case "sin":
      return angleMode === "deg" ? Math.sin(toRadians(value)) : Math.sin(value);
    case "cos":
      return angleMode === "deg" ? Math.cos(toRadians(value)) : Math.cos(value);
    case "tan":
      return angleMode === "deg" ? Math.tan(toRadians(value)) : Math.tan(value);
    case "asin":
      return angleMode === "deg" ? toDegrees(Math.asin(value)) : Math.asin(value);
    case "acos":
      return angleMode === "deg" ? toDegrees(Math.acos(value)) : Math.acos(value);
    case "atan":
      return angleMode === "deg" ? toDegrees(Math.atan(value)) : Math.atan(value);
    case "log":
      return Math.log10(value);
    case "ln":
      return Math.log(value);
    case "sqrt":
      return Math.sqrt(value);
    case "exp":
      return Math.exp(value);
    case "factorial":
      return factorial(value);
    case "percent":
      return value / 100;
    default:
      return value;
  }
}

function evaluateExpression(expression: string): string {
  try {
    let processedExpression = expression;
    
    processedExpression = processedExpression
      .replace(/π/g, Math.PI.toString())
      .replace(/\be\b/g, Math.E.toString())
      .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
      .replace(/(\d+(?:\.\d+)?)!/g, (_, num) => {
        const value = parseFloat(num);
        return factorial(value).toString();
      });
    
    processedExpression = processedExpression.replace(/(\d+(?:\.\d+)?)\s*\(/g, '$1*(');
    processedExpression = processedExpression.replace(/\)\s*(\d+(?:\.\d+)?)/g, ')*$1');
    processedExpression = processedExpression.replace(/\)\s*\(/g, ')*(');
    processedExpression = processedExpression.replace(/(\d+(?:\.\d+)?)\s*(π|e)/g, '$1*$2');
    processedExpression = processedExpression.replace(/(π|e)\s*(\d+(?:\.\d+)?)/g, '$1*$2');
    processedExpression = processedExpression.replace(/(\d+(?:\.\d+)?)\s*([a-z]+)/g, '$1*$2');
    
    processedExpression = processedExpression.replace(/√\(([^)]+)\)/g, (match, valueStr) => {
      const value = parseFloat(valueStr);
      if (isNaN(value)) return match;
      return Math.sqrt(value).toString();
    });
    
    const functionPattern = /([a-z]+)\(([^)]+)\)/g;
    processedExpression = processedExpression.replace(functionPattern, (match, funcName, valueStr) => {
      const value = parseFloat(valueStr);
      if (isNaN(value)) return match;
      const result = evaluateScientificFunction(funcName, value);
      return result.toString();
    });
    
    processedExpression = processedExpression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**');
    
    const result = safeEvaluate(processedExpression);
    
    return formatNumber(result, 12);
  } catch (error) {
    return "Error";
  }
}

function safeEvaluate(expression: string): number {
  const allowedChars = /^[0-9+\-*/().\s**eE]+$/;
  
  if (!allowedChars.test(expression)) {
    throw new Error("Invalid characters in expression");
  }
  
  const tokens = tokenize(expression);
  const result = parseExpression(tokens);
  
  return result;
}

function tokenize(expression: string): string[] {
  const tokens: string[] = [];
  let current = '';
  
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    
    if (char === ' ') continue;
    
    if ('+-*/()'.includes(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      
      if (char === '*' && expression[i + 1] === '*') {
        tokens.push('**');
        i++;
      } else {
        tokens.push(char);
      }
    } else {
      current += char;
    }
  }
  
  if (current) tokens.push(current);
  return tokens;
}

function parseExpression(tokens: string[]): number {
  let index = 0;
  
  function parseAddSub(): number {
    let left = parseMulDiv();
    
    while (index < tokens.length && (tokens[index] === '+' || tokens[index] === '-')) {
      const operator = tokens[index++];
      const right = parseMulDiv();
      left = operator === '+' ? left + right : left - right;
    }
    
    return left;
  }
  
  function parseMulDiv(): number {
    let left = parsePower();
    
    while (index < tokens.length && (tokens[index] === '*' || tokens[index] === '/')) {
      const operator = tokens[index++];
      const right = parsePower();
      left = operator === '*' ? left * right : left / right;
    }
    
    return left;
  }
  
  function parsePower(): number {
    let left = parseFactor();
    
    while (index < tokens.length && tokens[index] === '**') {
      index++;
      const right = parseFactor();
      left = Math.pow(left, right);
    }
    
    return left;
  }
  
  function parseFactor(): number {
    if (tokens[index] === '(') {
      index++;
      const result = parseAddSub();
      if (tokens[index] === ')') index++;
      return result;
    }
    
    if (tokens[index] === '-') {
      index++;
      return -parseFactor();
    }
    
    if (tokens[index] === '+') {
      index++;
      return parseFactor();
    }
    
    const num = parseFloat(tokens[index++]);
    if (isNaN(num)) return NaN;
    return num;
  }
  
  return parseAddSub();
}

function formatNumber(num: number, maxDigits: number = 12): string {
  if (isNaN(num)) return "NaN";
  if (!isFinite(num)) return num > 0 ? "Infinity" : "-Infinity";
  
  const str = num.toString();
  return str.length > maxDigits ? str.slice(0, maxDigits) : str;
}

function addToHistory(expression: string, result: string) {
  const li = document.createElement("li");
  li.textContent = `${expression} = ${result}`;
  historyList.prepend(li);
}
function handleValue(value: string) {
  if (lastPressedEquals) {
    currentExpression = value;
    lastPressedEquals = false;
  } else {
    currentExpression += value;
  }
  updateDisplay();
}

function handleAction(action: string) {
  const scientificActions = ["sin", "cos", "tan", "asin", "acos", "atan", 
                           "log", "ln", "sqrt", "exp", "factorial", "percent"];
  
  if (scientificActions.includes(action)) {
    handleScientificFunction(action);
    return;
  }

  switch (action) {
    case "clear":
      currentExpression = "";
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "delete":
      if (currentExpression === "NaN" || currentExpression === "Infinity" || currentExpression === "-Infinity" || currentExpression === "Error") {
        currentExpression = "";
      } else {
        currentExpression = currentExpression.slice(0, -1);
      }
      updateDisplay();
      break;

    case "pi":
      if (lastPressedEquals) {
        currentExpression = "π";
      } else {
        currentExpression += "π";
      }
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "e":
      if (lastPressedEquals) {
        currentExpression = "e";
      } else {
        currentExpression += "e";
      }
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "add":
      currentExpression += " + ";
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "subtract":
      currentExpression += " - ";
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "multiply":
      currentExpression += " × ";
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "divide":
      currentExpression += " ÷ ";
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "power":
      currentExpression += " ^ ";
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "open-paren":
      if (lastPressedEquals) {
        currentExpression = "(";
      } else {
        currentExpression += "(";
      }
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "close-paren":
      if (lastPressedEquals) {
        currentExpression = ")";
      } else {
        currentExpression += ")";
      }
      lastPressedEquals = false;
      updateDisplay();
      break;

    case "equals":
      if (currentExpression) {
        const result = evaluateExpression(currentExpression);
        addToHistory(currentExpression, result);
        currentExpression = result;
        lastPressedEquals = true;
        updateDisplay();
      }
      break;
  }
}

function handleScientificFunction(action: string) {
  if (action === "percent") {
    if (lastPressedEquals) {
      currentExpression = "%";
    } else {
      currentExpression += "%";
    }
  } else if (action === "factorial") {
    if (lastPressedEquals) {
      currentExpression = "!";
    } else {
      currentExpression += "!";
    }
  } else if (action === "sqrt") {
    if (lastPressedEquals) {
      currentExpression = "√(";
    } else {
      currentExpression += "√(";
    }
  } else {
    if (lastPressedEquals) {
      currentExpression = `${action}(`;
    } else {
      currentExpression += `${action}(`;
    }
  }
  lastPressedEquals = false;
  updateDisplay();
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
      currentExpression = parts[1];
      lastPressedEquals = true;
      updateDisplay();
      historyDrawer.classList.remove("open");
      historyToggle.setAttribute("aria-expanded", "false");
    }
  }
});

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
  
  if (["Enter", "=", "/", "*", "-", "+", "Escape"].includes(key)) {
    e.preventDefault();
  }

  if ((key >= "0" && key <= "9") || key === ".") handleValue(key);
  else {
    switch (key) {
      case "+": handleAction("add"); break;
      case "-": handleAction("subtract"); break;
      case "*": handleAction("multiply"); break;
      case "/": handleAction("divide"); break;
      case "^": handleAction("power"); break;
      case "Enter":
      case "=": handleAction("equals"); break;
      case "Backspace": handleAction("delete"); break;
      case "Delete": handleAction("delete"); break;
      case "Escape": handleAction("clear"); break;
      case "c":
      case "C": handleAction("clear"); break;
      case "(": handleAction("open-paren"); break;
      case ")": handleAction("close-paren"); break;
      case "p": handleAction("pi"); break;
      case "e": handleAction("e"); break;
    }
  }
});

updateDisplay();

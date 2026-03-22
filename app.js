import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= USERS ================= */
const users = [
  { username: "admin", password: "admin", role: "admin" },
  { username: "worker", password: "worker", role: "worker" }
];

let rules = [];
let logs = [];

/* ================= LOGIN ================= */
window.login = function () {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();

  const user = users.find(x => x.username === u && x.password === p);

  if (!user) {
    alert("Неверный логин или пароль");
    return;
  }

  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("mainDiv").style.display = "block";

  document.getElementById("userRole").textContent = user.role;
  document.getElementById("userName").textContent = user.username;

  if (user.role !== "admin") {
    document.getElementById("adminPanel").style.display = "none";
  }

  loadRules();
  loadLogs();
};

/* ================= LOGOUT ================= */
window.logout = function () {
  location.reload();
};

/* ================= RULES ================= */
function loadRules() {
  const stored = localStorage.getItem("dlpRules");

  if (stored) {
    rules = JSON.parse(stored).map(r => ({
      ...r,
      regex: new RegExp(r.regexSource, r.regexFlags || "gi")
    }));
  } else {
    rules = [
      { name: "Паспорт", regex: /[A-ZА-Я]{2}\d{7}/gi, action:"block", class:"danger", regexSource:"[A-ZА-Я]{2}\\d{7}", regexFlags:"gi" },
      { name: "Email", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, action:"block", class:"danger", regexSource:"[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}", regexFlags:"gi" },
      { name: "ИИН", regex: /\b\d{12}\b/g, action:"warning", class:"warningMark", regexSource:"\\b\\d{12}\\b", regexFlags:"g" },
      { name: "Коммерческая тайна", regex: /(секрет|конфиденциально|коммерческая тайна)/gi, action:"warning", class:"commercial", regexSource:"(секрет|конфиденциально|коммерческая тайна)", regexFlags:"gi" }
    ];
  }

  renderRules();
}

function renderRules() {
  const list = document.getElementById("ruleList");
  list.innerHTML = "";

  rules.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "rule-chip";
    div.innerHTML = `
      <span class="rule-name">${r.name}</span>
      <span class="rule-action">${r.action}</span>
      <button onclick="removeRule(${i})">×</button>
    `;
    list.appendChild(div);
  });
}

window.addRule = function () {
  const name = document.getElementById("ruleName").value;
  const regexStr = document.getElementById("ruleRegex").value;
  const action = document.getElementById("ruleAction").value;

  const regex = new RegExp(regexStr, "gi");

  rules.push({
    name,
    regex,
    action,
    class: action === "block" ? "danger" : "warningMark",
    regexSource: regexStr,
    regexFlags: "gi"
  });

  localStorage.setItem("dlpRules", JSON.stringify(rules));
  renderRules();
};

window.removeRule = function (i) {
  rules.splice(i, 1);
  localStorage.setItem("dlpRules", JSON.stringify(rules));
  renderRules();
};

/* ================= CHECK TEXT ================= */
window.checkData = function () {
  const txt = document.getElementById("text").value;

  let status = "allow";
  let highlighted = txt;

  rules.forEach(r => {
    highlighted = highlighted.replace(r.regex, m => {
      if (r.action === "block") status = "block";
      else if (r.action === "warning" && status !== "block") status = "warning";

      return `<span class="${r.class}">${m}</span>`;
    });
  });

  document.getElementById("highlight").innerHTML = highlighted;

  const res = document.getElementById("result");
  res.textContent = "Результат: " + status.toUpperCase();
  res.className = "result-badge " + status;

  addLog(status, txt);
};

/* ================= LOGS ================= */
function addLog(status, text) {
  const date = new Date().toLocaleString();

  logs.push({ status, text, date });

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${date}</td>
    <td>${status}</td>
    <td>${text.substring(0,60)}</td>
  `;

  document.getElementById("log").prepend(row);

  // FIREBASE
  addDoc(collection(db, "logs"), {
    status,
    text,
    date: new Date().toISOString()
  });
}

window.clearLog = function () {
  logs = [];
  document.getElementById("log").innerHTML = "";
};

/* ================= BACON ================= */
const alphabet = [
..."abcdefghijklmnopqrstuvwxyz",
..."абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
..."әіңғүұқөһ"
];

const baconMap = {};
alphabet.forEach((c,i)=>{
  let b = i.toString(2).padStart(6,"0");
  baconMap[c] = b.replace(/0/g,"A").replace(/1/g,"B");
});

const baconReverse = {};
Object.entries(baconMap).forEach(([k,v])=>{
  baconReverse[v]=k;
});

window.encryptBacon = function () {
  let txt = document.getElementById("text").value.toLowerCase();
  let res = "";

  for (let c of txt) {
    res += baconMap[c] ? baconMap[c] + " " : c;
  }

  document.getElementById("text").value = res.trim();
};

window.decryptBacon = function () {
  let txt = document.getElementById("text").value.toUpperCase().replace(/[^AB]/g,"");

  let buffer = "";
  let res = "";

  for (let c of txt) {
    buffer += c;

    if (buffer.length === 6) {
      res += baconReverse[buffer] || "?";
      buffer = "";
    }
  }

  document.getElementById("text").value = res;
};

/* ================= INIT ================= */
window.onload = function () {
  loadRules();
};
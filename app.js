import { 
    auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
    doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, orderBy,
    onSnapshot, deleteDoc
} from "./firebase.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUserData = null;
let rules = [];

// элементы
const loader = document.getElementById("loader");
const loginDiv = document.getElementById("loginDiv");
const mainDiv = document.getElementById("mainDiv");

// ===================== AUTH STATE =====================
onAuthStateChanged(auth, async (user) => {

    if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (userSnap.exists()) {
            currentUserData = { uid: user.uid, ...userSnap.data() };

            loginDiv.style.display = "none";
            mainDiv.style.display = "block";

            userNameDisplay.textContent = currentUserData.fio;
            userRoleDisplay.textContent = currentUserData.role;

            document.getElementById("adminPanel").style.display =
                (currentUserData.role === "admin") ? "block" : "none";

            loadLogs();
            loadRules();
        }
    } else {
        loginDiv.style.display = "block";
        mainDiv.style.display = "none";
    }

    // 🔥 убираем loader ПОСЛЕ проверки
    loader.style.display = "none";
});

// ===================== LOGIN =====================
window.login = async function() {
    const email = username.value;
    const pass = password.value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Ошибка входа: " + e.message);
    }
};

// ===================== REGISTER =====================
window.registerEmployee = async function() {
    try {
        const res = await createUserWithEmailAndPassword(auth, regEmail.value, regPass.value);

        await setDoc(doc(db, "users", res.user.uid), {
            fio: regFio.value,
            email: regEmail.value,
            role: regRole.value,
            createdAt: new Date()
        });

        alert("Сотрудник добавлен");

        regFio.value = "";
        regEmail.value = "";
        regPass.value = "";
    } catch (e) {
        alert(e.message);
    }
};

// ===================== LOGOUT =====================
window.logout = async () => {
    await signOut(auth);
};

// ===================== RULES =====================
function loadRules() {
    const rulesRef = collection(db, "rules");

    onSnapshot(rulesRef, (snapshot) => {
        rules = [];
        const list = document.getElementById("ruleList");
        if (!list) return;

        list.innerHTML = "";

        snapshot.forEach(docSnap => {
            const data = docSnap.data();

            rules.push({
                ...data,
                regex: new RegExp(data.regex, "gi")
            });

            list.innerHTML += `
                <div class="rule-chip">
                    <span class="rule-name">${data.name}</span>
                    <span class="rule-action">${data.action}</span>
                    <button onclick="deleteRule('${docSnap.id}')">✕</button>
                </div>
            `;
        });
    });
}

window.addRule = async function() {
    const name = ruleName.value;
    const regex = ruleRegex.value;
    const action = ruleAction.value;

    if (!name || !regex) return alert("Заполни поля");

    try {
        new RegExp(regex);
    } catch {
        return alert("Ошибка regex");
    }

    await addDoc(collection(db, "rules"), {
        name,
        regex,
        action,
        class: action === "block" ? "danger" : "warningMark"
    });

    ruleName.value = "";
    ruleRegex.value = "";
};

window.deleteRule = async function(id) {
    if (!confirm("Удалить правило?")) return;
    await deleteDoc(doc(db, "rules", id));
};

// ===================== DLP =====================
window.checkData = async function() {
    let txt = text.value;
    let status = "allow";
    let out = txt;

    rules.forEach(r => {
        out = out.replace(r.regex, m => {
            if (r.action === "block") status = "block";
            else if (r.action === "warning" && status !== "block") status = "warning";
            return `<span class="${r.class}">${m}</span>`;
        });
    });

    highlight.innerHTML = out;
    resultDisplay.textContent = "СТАТУС: " + status.toUpperCase();

    await addDoc(collection(db, "logs"), {
        uid: currentUserData.uid,
        userName: currentUserData.fio,
        status,
        text: txt,
        date: new Date().getTime()
    });

    loadLogs();
};

// ===================== LOGS =====================
async function loadLogs() {
    let q;

    if (currentUserData.role === "admin") {
        q = query(collection(db, "logs"), orderBy("date", "desc"));
    } else {
        q = query(collection(db, "logs"), where("uid", "==", currentUserData.uid));
    }

    const snap = await getDocs(q);
    logTableBody.innerHTML = "";

    snap.forEach(d => {
        const x = d.data();

        logTableBody.innerHTML += `
            <tr>
                <td>${new Date(x.date).toLocaleTimeString()}</td>
                <td>${x.userName}</td>
                <td><span class="status-badge status-${x.status}">${x.status}</span></td>
                <td>${x.text.slice(0, 30)}...</td>
            </tr>
        `;
    });
}

// ===================== BACON =====================
const alphabet = [..."abcdefghijklmnopqrstuvwxyz", ..."абвгдеёжзийклмнопрстуфхцчшщъыьэюя", ..."әіңғүұқөһ"];
const map = {};
alphabet.forEach((c,i) => {
    map[c] = i.toString(2).padStart(6,"0").replace(/0/g,"A").replace(/1/g,"B");
});
const rev = {};
Object.entries(map).forEach(([k,v]) => rev[v] = k);

// 🔹 Шифрование
window.encryptBacon = function(){
    const textEl = document.getElementById("text");
    let t = textEl.value.toLowerCase();
    let r = "";
    for(let c of t) r += map[c] ? map[c]+" " : c;
    textEl.value = r.trim();
};

// 🔹 Дешифрование
window.decryptBacon = function(){
    const textEl = document.getElementById("text");
    let t = textEl.value.toUpperCase().replace(/[^AB]/g,"");
    let b = "", r = "";
    for(let c of t){
        b += c;
        if(b.length === 6){
            r += rev[b] || "?";
            b = "";
        }
    }
    textEl.value = r;
};
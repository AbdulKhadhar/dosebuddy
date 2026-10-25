// DoseBuddy Client-Side Logic
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const SL = ["morning", "afternoon", "night"];

const FOOD = {
  any: "No food rule",
  before: "Before food",
  after: "After food",
  with: "With food",
  empty: "Empty stomach"
};

// Fluent, culturally natural translations
const T = {
  en: {
    code: "en-IN",
    slot: { morning: "morning", afternoon: "afternoon", night: "night" },
    say: (name, slot, meds) => `${name}, it is time for your ${slot} medicines. Please take: ${meds}.`,
    notif: (name, slot, meds) => `${name}'s ${slot} dose: ${meds}`
  },
  hi: {
    code: "hi-IN",
    slot: { morning: "सुबह", afternoon: "दोपहर", night: "रात" },
    say: (name, slot, meds) => `${name}, ${slot} की दवा लेने का समय हो गया है। कृपया लें: ${meds}।`,
    notif: (name, slot, meds) => `${name} की ${slot} की दवा: ${meds}`
  },
  ml: {
    code: "ml-IN",
    slot: { morning: "രാവിലെ", afternoon: "ഉച്ചയ്ക്ക്", night: "രാത്രി" },
    say: (name, slot, meds) => `${name}, ${slot} മരുന്ന് കഴിക്കാനുള്ള സമയമായി. കഴിക്കേണ്ട മരുന്നുകൾ: ${meds}.`,
    notif: (name, slot, meds) => `${name}ന്റെ ${slot} മരുന്ന്: ${meds}`
  }
};

const esc = s => String(s || "").replace(/[&<>"]/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
}[c]));

let meds = [];
let plan = null;

async function api(path, body) {
  const res = await fetch(path, body ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  } : {});
  return res.json();
}

// ----------------------------------------------------
// Step Wizard
// ----------------------------------------------------
function goToStep(stepNum) {
  $$(".step-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.step == stepNum);
  });
  $$(".view-step").forEach((view, index) => {
    view.classList.toggle("active", index + 1 == stepNum);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".step-btn").forEach(btn => {
  btn.addEventListener("click", () => goToStep(btn.dataset.step));
});

// ----------------------------------------------------
// Step 2: Medication Review Editor
// ----------------------------------------------------
function drawMeds() {
  const container = $("#meds-list");
  if (!meds.length) {
    container.innerHTML = '<p style="color:var(--text-muted); font-style:italic; padding:12px 0;">No medicines added yet. Go to Step 1 to paste prescription text, or click "Add Another Medicine" below.</p>';
    return;
  }

  container.innerHTML = meds.map((m, i) => `
    <div class="med-item">
      <input type="text" data-i="${i}" data-k="name" value="${esc(m.name)}" placeholder="Medicine Name (e.g. Thyronorm)" aria-label="Medicine Name">
      <input type="text" data-i="${i}" data-k="dose" value="${esc(m.dose)}" placeholder="Dose (e.g. 50 mcg)" aria-label="Dose">
      <div class="time-chips">
        ${SL.map(s => `
          <label class="time-chip-label">
            <input type="checkbox" data-i="${i}" data-s="${s}" ${m.times.includes(s) ? "checked" : ""}>
            ${s.charAt(0).toUpperCase() + s.slice(1)}
          </label>
        `).join("")}
      </div>
      <select data-i="${i}" data-k="food" aria-label="Food Rule">
        ${Object.keys(FOOD).map(f => `<option value="${f}" ${m.food == f ? "selected" : ""}>${FOOD[f]}</option>`).join("")}
      </select>
      <button class="btn btn-danger btn-sm" data-del="${i}" title="Remove item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Remove
      </button>
    </div>
  `).join("");
}

$("#meds-list").addEventListener("input", e => {
  const i = e.target.dataset.i;
  if (i == null) return;
  if (e.target.dataset.k) meds[i][e.target.dataset.k] = e.target.value;
  if (e.target.dataset.s) {
    const s = e.target.dataset.s;
    if (e.target.checked) {
      if (!meds[i].times.includes(s)) meds[i].times.push(s);
    } else {
      meds[i].times = meds[i].times.filter(x => x !== s);
    }
  }
});

$("#meds-list").addEventListener("click", e => {
  const btn = e.target.closest("[data-del]");
  if (btn && btn.dataset.del != null) {
    meds.splice(+btn.dataset.del, 1);
    drawMeds();
  }
});

$("#btn-add-med").onclick = () => {
  meds.push({ name: "", dose: "", times: ["morning"], food: "after" });
  drawMeds();
};

// ----------------------------------------------------
// Step 1: Extraction & Parsing
// ----------------------------------------------------
$("#btn-parse").onclick = async () => {
  const text = $("#txt").value.trim();
  if (!text) {
    alert("Please paste or type the prescription notes first.");
    return;
  }
  $("#src").textContent = "Analyzing notes...";
  const r = await api("/api/extract", { text });
  meds = r.meds || [];
  $("#src").textContent = meds.length ? `Analyzed with: ${r.source}` : "Could not identify medicines. You can add them manually in Step 2.";
  drawMeds();
  if (meds.length) {
    await updatePlanData();
    goToStep(2);
  }
};

$("#btn-sample").onclick = () => {
  $("#txt").value = "Thyroid tablet 50 mcg early morning on empty stomach. Metformin 500 mg after lunch. Calcium tablet after breakfast. BP tablet 5 mg at night.";
  $("#btn-parse").click();
};

$("#btn-confirm-plan").onclick = async () => {
  await updatePlanData();
  goToStep(3);
};

async function updatePlanData() {
  plan = await api("/api/plan", {
    meds,
    name: $("#who").value,
    lang: $("#lang").value
  });
  drawPlan();
}

function getTimes() {
  return [$("#t0").value, $("#t1").value, $("#t2").value];
}

function format12h(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ----------------------------------------------------
// Step 3: Daily Plan & Cards
// ----------------------------------------------------
function drawPlan() {
  if (!plan || !plan.meds) return;

  $("#card-person-name").textContent = `${plan.name || "My"}’s Daily Schedule`;

  // Warnings
  const warnBox = $("#warning-container");
  if (plan.warnings && plan.warnings.length) {
    warnBox.innerHTML = plan.warnings.map(w => `
      <div class="alert-card ${w.level}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <div>${esc(w.text)}</div>
      </div>
    `).join("");
  } else {
    warnBox.innerHTML = `
      <div class="alert-card info">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div>No timing conflicts detected in rule checks. Always confirm with your physician or pharmacist.</div>
      </div>
    `;
  }

  // Time Badges
  const times = getTimes();
  $("#badge-t0").textContent = format12h(times[0]);
  $("#badge-t1").textContent = format12h(times[1]);
  $("#badge-t2").textContent = format12h(times[2]);

  // Compartments
  const taken = getTaken();
  SL.forEach(slot => {
    const container = $("#slot-" + slot);
    const list = plan.slots[slot] || [];
    if (!list.length) {
      container.innerHTML = '<div class="empty-slot">No medications for this time</div>';
    } else {
      container.innerHTML = list.map(m => {
        const key = slot + m.name;
        const isTaken = !!taken[key];
        return `
          <div class="med-pill-card ${isTaken ? 'taken' : ''}" data-k="${esc(key)}">
            <svg class="med-pill-check" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            <div class="med-pill-name">${esc(m.name)}</div>
            <div class="med-pill-meta">
              <span>${esc(m.dose)}</span>
              ${m.food && m.food !== 'any' ? `<span class="med-pill-badge">${FOOD[m.food]}</span>` : ''}
            </div>
          </div>
        `;
      }).join("");
    }
  });

  drawProgress();
}

const dayKey = () => "taken:" + new Date().toDateString();
const getTaken = () => {
  try { return JSON.parse(localStorage.getItem(dayKey()) || "{}"); } catch { return {}; }
};
const setTaken = o => {
  try { localStorage.setItem(dayKey(), JSON.stringify(o)); } catch {}
};

function drawProgress() {
  if (!plan || !plan.slots) return;
  const taken = getTaken();
  let total = 0, done = 0;
  SL.forEach(s => {
    (plan.slots[s] || []).forEach(m => {
      total++;
      if (taken[s + m.name]) done++;
    });
  });

  const pct = total ? Math.round((done / total) * 100) : 0;
  $("#prog-fill").style.width = pct + "%";
  
  let statusText = `${done} of ${total} doses taken today`;
  if (total > 0 && done === total) {
    statusText += " · All complete for today! 🎉";
  }
  $("#prog-text").textContent = statusText;
}

// Medication pill click toggle
$("#slots-container").addEventListener("click", e => {
  const card = e.target.closest(".med-pill-card");
  if (!card) return;
  const k = card.dataset.k;
  const taken = getTaken();
  taken[k] = !taken[k];
  setTaken(taken);
  drawPlan();
});

// UI Actions
$("#btn-text-size").onclick = () => document.body.classList.toggle("big");
$("#btn-print").onclick = () => window.print();

["t0", "t1", "t2"].forEach(id => {
  $("#" + id).addEventListener("change", () => {
    if (plan) drawPlan();
  });
});
$("#lang").addEventListener("change", () => {
  if (plan) updatePlanData();
});

// WhatsApp Share
$("#btn-share-wa").onclick = async () => {
  const times = getTimes();
  const text = `*💊 ${plan.name || "My"}’s Medicine Schedule*\n\n` +
    SL.map((s, i) => {
      const slotName = s.toUpperCase() + ` (${format12h(times[i])})`;
      const medLines = (plan.slots[s] || []).map(m => `• ${m.name} ${m.dose} ${m.food !== 'any' ? '(' + FOOD[m.food] + ')' : ''}`).join("\n");
      return `*${slotName}*\n${medLines || '• No medications'}\n`;
    }).join("\n") +
    `\n_Note: Please always confirm with your doctor or pharmacist._`;

  try {
    await navigator.clipboard.writeText(text);
    const originalHtml = $("#btn-share-wa").innerHTML;
    $("#btn-share-wa").innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Copied!`;
    setTimeout(() => $("#btn-share-wa").innerHTML = originalHtml, 2500);
  } catch {
    prompt("Copy WhatsApp text below:", text);
  }
};

// ----------------------------------------------------
// System Background Notifications & Speech Synthesis
// ----------------------------------------------------
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notifications.");
    return;
  }
  const perm = await Notification.requestPermission();
  updateNotifBannerState();
  return perm;
}

function updateNotifBannerState() {
  const banner = $("#notif-banner");
  if (!("Notification" in window) || Notification.permission === "granted") {
    banner.style.display = "none";
  } else {
    banner.style.display = "flex";
  }
}

$("#btn-enable-notif").onclick = async () => {
  await requestNotificationPermission();
};

function triggerNotification(slot, medListText) {
  const L = T[$("#lang").value] || T.en;
  const title = `DoseBuddy: ${L.slot[slot].toUpperCase()} Medicine Time`;
  const body = L.notif(plan.name || "Patient", L.slot[slot], medListText);

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/icon.svg"
      });
    } catch (err) {
      console.warn("Notification error:", err);
    }
  }
}

function speak(slot) {
  if (!plan || !plan.slots[slot] || !plan.slots[slot].length) return;
  const L = T[$("#lang").value] || T.en;
  const list = plan.slots[slot].map(m => `${m.name} ${m.dose}`).join(", ");
  const phrase = L.say(plan.name || "Amma", L.slot[slot], list);

  // Spoken voice
  const u = new SpeechSynthesisUtterance(phrase);
  u.lang = L.code;
  u.rate = 0.88;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);

  // Desktop notification (even if browser is minimized)
  triggerNotification(slot, list);

  // Floating onscreen banner
  const fireEl = $("#fire");
  fireEl.style.display = "block";
  fireEl.innerHTML = `🔔 <b>${L.slot[slot].toUpperCase()} REMINDER:</b><br>${esc(list)}`;
  setTimeout(() => { fireEl.style.display = "none"; }, 10000);
}

$("#btn-speak-sample").onclick = () => {
  const s = SL.find(s => plan && plan.slots[s] && plan.slots[s].length);
  if (s) speak(s);
};

// Background Interval: Fires alerts and speech at scheduled hours
const spokenSlots = new Set();
setInterval(() => {
  if (!$("#rem").checked || !plan) return;
  const now = new Date();
  const hm = now.toTimeString().slice(0, 5);
  const day = now.toDateString();

  getTimes().forEach((timeVal, idx) => {
    const slot = SL[idx];
    const triggerKey = `${day}-${slot}-${timeVal}`;
    if (timeVal === hm && !spokenSlots.has(triggerKey)) {
      spokenSlots.add(triggerKey);
      speak(slot);
    }
  });
}, 15000);

// Initialize on Load
(async () => {
  updateNotifBannerState();
  try {
    const p = await api("/api/plan");
    if (p && p.meds && p.meds.length) {
      plan = p;
      meds = p.meds;
      $("#who").value = p.name || "Amma";
      $("#lang").value = p.lang || "en";
      drawMeds();
      drawPlan();
      goToStep(3);
    } else {
      drawMeds();
    }
  } catch {
    drawMeds();
  }
})();

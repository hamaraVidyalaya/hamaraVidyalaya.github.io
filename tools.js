/* =====================================================
   COMMON UTILITIES
===================================================== */

// Flexible Date Parser (DD-MM-YYYY | DD/Mon/YYYY etc.)
function parseFlexibleDate(input) {
  input = input.trim().replace(/\//g, "-");

  const monthMap = {
    jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
    jul:6, aug:7, sep:8, oct:9, nov:10, dec:11
  };

  const p = input.split("-");
  if (p.length !== 3) return null;

  const day = parseInt(p[0]);
  const year = parseInt(p[2]);
  let m = p[1].toLowerCase();
  let month;

  if (!isNaN(m)) {
    month = parseInt(m) - 1;
  } else {
    month = monthMap[m.substring(0,3)];
    if (month === undefined) return null;
  }

  const d = new Date(year, month, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day
  ) return null;

  return d;
}

/* ---------- Accurate Age Calculator (Y-M-D) ---------- */
function calculateAge() {
  const dobInput = document.getElementById("dob").value.trim();
  const result = document.getElementById("result");

  const dob = parseFlexibleDate(dobInput);
  if (!dob) {
    result.textContent = "कृपया सही Date Of Birth (जन्म तिथि) भरें (DD-MM-YYYY)।";
    return;
  }

  const today = new Date();

  // ❌ Future DOB check
  if (dob > today) {
    result.textContent = "Date Of Birth (जन्म तिथि) भविष्य की नहीं हो सकती।";
    return;
  }

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  // Days adjustment
  if (days < 0) {
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  // Months adjustment
  if (months < 0) {
    months += 12;
    years--;
  }

  result.textContent =
    `आपकी आयु है: ${years} वर्ष ${months} महीने ${days} दिन`;
}


/* =====================================================
   DATE DIFFERENCE
===================================================== */
function calculateDateDifference() {
  const a = parseFlexibleDate(document.getElementById("fromDate").value);
  const b = parseFlexibleDate(document.getElementById("toDate").value);

  const r1 = document.getElementById("diffResult");
  const r2 = document.getElementById("diffMonths");
  const r3 = document.getElementById("diffDays");

  if (!a || !b) {
    r1.textContent = "कृपया सही तिथियाँ भरें।";
    r2.textContent = r3.textContent = "";
    return;
  }

  let start = a, end = b;
  if (start > end) [start, end] = [end, start];

  const oneDay = 86400000;
  const totalDays = Math.floor((end - start) / oneDay);

  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();

  if (d < 0) {
    d += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    m--;
  }
  if (m < 0) {
    m += 12; y--;
  }

  r1.textContent = `अंतर: ${y} वर्ष ${m} महीने ${d} दिन`;
  r2.textContent = `कुल महीने: ${y * 12 + m}`;
  r3.textContent = `कुल दिन: ${totalDays}`;
}

/* ---------- Date Plus Days ---------- */
function calculateDatePlusDays() {
  const dateInput = document.getElementById("startDate").value;
  const days = parseInt(document.getElementById("addDays").value);
  const out = document.getElementById("plusResult");

  const start = parseFlexibleDate(dateInput);
  if (!start || isNaN(days)) {
    out.textContent = "कृपया सही तिथि और दिन भरें।";
    return;
  }

  const resultDate = new Date(start);
  resultDate.setDate(resultDate.getDate() + days);

  const d = resultDate.getDate().toString().padStart(2, "0");
  const m = (resultDate.getMonth() + 1).toString().padStart(2, "0");
  const y = resultDate.getFullYear();

  out.textContent = `New Date (तिथि) : ${d}-${m}-${y}`;
}


/* =====================================================
   IMAGE RESIZE TOOL (FINAL VERSION)
===================================================== */

const A4_LIMITS = {
  cm: { w: 21, h: 29.7 },
  mm: { w: 210, h: 297 },
  inch: { w: 8.27, h: 11.69 }
};

function resizeImageFinal() {
  const file = document.getElementById("imgInput").files[0];
  const w = parseFloat(document.getElementById("width").value);
  const h = parseFloat(document.getElementById("height").value);
  const unit = document.getElementById("unit").value;
  const dpi = parseInt(document.getElementById("dpi").value);
  const msg = document.getElementById("imgMsg");

  if (!file || !w || !h || !dpi) {
    msg.textContent = "सभी fields सही भरें।";
    return;
  }

  if (dpi < 72 || dpi > 600) {
    msg.textContent = "DPI 72 से 600 के बीच होना चाहिए।";
    return;
  }

  // A4 limit check
  if (unit !== "px") {
    if (w > A4_LIMITS[unit].w || h > A4_LIMITS[unit].h) {
      msg.textContent = "A4 size से बड़ा allowed नहीं है।";
      return;
    }
  }

  let pxW = w, pxH = h;
  if (unit !== "px") {
    const inchW = (unit === "cm") ? w / 2.54 : (unit === "mm") ? w / 25.4 : w;
    const inchH = (unit === "cm") ? h / 2.54 : (unit === "mm") ? h / 25.4 : h;
    pxW = Math.round(inchW * dpi);
    pxH = Math.round(inchH * dpi);
  }

  if (pxW > 4960 || pxH > 7016) {
    msg.textContent = "px size A4 @600DPI से बड़ा हो रहा है।";
    return;
  }

  const img = new Image();
  const reader = new FileReader();
  const canvas = document.getElementById("canvas");
  const link = document.getElementById("download");

  reader.onload = e => {
    img.onload = () => {
      const ctx = canvas.getContext("2d");

// original image size
let ow = img.width;
let oh = img.height;

// scale ratios
let scaleW = pxW / ow;
let scaleH = pxH / oh;

// smallest scale (so image stays inside limit)
let scale = Math.min(scaleW, scaleH, 1); // ⬅️ 1 = no upscale

let finalW = Math.round(ow * scale);
let finalH = Math.round(oh * scale);

canvas.width = finalW;
canvas.height = finalH;

ctx.drawImage(img, 0, 0, finalW, finalH);
      link.href = canvas.toDataURL("image/jpeg", 0.92);
      link.style.display = "inline-block";
      msg.textContent = "Image ready है।";
    };
    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

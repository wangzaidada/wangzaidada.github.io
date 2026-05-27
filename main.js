const unitConfig = {
  time: {
    name:"时间单位",
    units:[{v:"ms",n:"毫秒"},{v:"s",n:"秒"},{v:"min",n:"分钟"},{v:"h",n:"小时"},{v:"day",n:"天"}],
    factor:{ms:1,s:1000,min:60000,h:3600000,day:86400000}
  },
  length:{
    name:"长度单位",
    units:[{v:"mm",n:"毫米"},{v:"cm",n:"厘米"},{v:"m",n:"米"},{v:"km",n:"千米"},{v:"inch",n:"英寸"},{v:"ft",n:"英尺"}],
    factor:{mm:1,cm:10,m:1000,km:1000000,inch:25.4,ft:304.8}
  },
  ts:{name:"时间戳↔日期"},
  json:{name:"JSON格式化"}
};

const typeList = ["time","length","ts","json"];
let curType = "time";

const titleText = document.getElementById("titleText");
const catMenu = document.getElementById("catMenu");
const leftVal = document.getElementById("leftVal");
const rightVal = document.getElementById("rightVal");
const leftUnit = document.getElementById("leftUnit");
const rightUnit = document.getElementById("rightUnit");
const convertWrap = document.querySelector(".convert-wrap");
const tsWrap = document.getElementById("tsWrap");
const jsonWrap = document.getElementById("jsonWrap");
const jsonInput = document.getElementById("jsonInput");
const jsonOutput = document.getElementById("jsonOutput");
const formatBtn = document.getElementById("formatBtn");
const copyBtn = document.getElementById("copyBtn");
const minifyBtn = document.getElementById("minifyBtn");
const unescapeBtn = document.getElementById("unescapeBtn");
const escapeBtn = document.getElementById("escapeBtn");

function fmtDate(d) {
  const p = (n, len) => String(n).padStart(len || 2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const zhLocale = {
  days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  daysShort: ['日', '一', '二', '三', '四', '五', '六'],
  daysMin: ['日', '一', '二', '三', '四', '五', '六'],
  months: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
  monthsShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  today: '今天',
  clear: '清除',
  timeFormat: 'HH:mm:ss',
  firstDay: 1
};

const dpLeft = new AirDatepicker('#tsLeftDate', {
  timepicker: true,
  locale: zhLocale,
  selectedDates: [new Date()],
  dateFormat: fmtDate,
  navTitles: {
    days: '<i>MMMM</i> yyyy',
    months: 'yyyy',
    years: 'yyyy1 — yyyy2'
  },
  onSelect: function() { autoConvertTs(); }
});

// --- 自定义下拉框逻辑 ---
function getSelectValue(el) {
  const selected = el.querySelector(".custom-select-option.selected");
  return selected ? selected.dataset.value : "";
}

function setSelectOptions(el, options) {
  const trigger = el.querySelector(".custom-select-trigger");
  const optionsWrap = el.querySelector(".custom-select-options");
  optionsWrap.innerHTML = "";
  options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "custom-select-option" + (i === 0 ? " selected" : "");
    div.dataset.value = opt.v;
    div.textContent = opt.n;
    optionsWrap.appendChild(div);
  });
  trigger.textContent = options.length ? options[0].n : "";
}

function initCustomSelect(el, onChange) {
  const trigger = el.querySelector(".custom-select-trigger");
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllSelects(el);
    el.classList.toggle("open");
  });
  el.querySelector(".custom-select-options").addEventListener("click", (e) => {
    const opt = e.target.closest(".custom-select-option");
    if (!opt) return;
    el.querySelectorAll(".custom-select-option").forEach(o => o.classList.remove("selected"));
    opt.classList.add("selected");
    trigger.textContent = opt.textContent;
    el.classList.remove("open");
    if (onChange) onChange();
  });
}

function closeAllSelects(except) {
  document.querySelectorAll(".custom-select.open").forEach(s => {
    if (s !== except) s.classList.remove("open");
  });
}

document.addEventListener("click", () => {
  closeAllSelects();
  catMenu.classList.remove("show");
});

initCustomSelect(leftUnit, autoConvert);
initCustomSelect(rightUnit, autoConvert);
initCustomSelect(document.getElementById("tsLeftType"), toggleTsLeft);
initCustomSelect(document.getElementById("tsRightType"), autoConvertTs);

function autoConvert(){
  if(curType === "ts") return;
  const cfg = unitConfig[curType];
  const v = parseFloat(leftVal.value || 0);
  const f = getSelectValue(leftUnit);
  const t = getSelectValue(rightUnit);
  if (!f || !t) return;
  rightVal.value = (v * cfg.factor[f] / cfg.factor[t]).toFixed(8);
  rightVal.classList.remove("pop");
  void rightVal.offsetWidth;
  rightVal.classList.add("pop");
}

function autoConvertTs(){
  const lt = getSelectValue(document.getElementById("tsLeftType"));
  const rt = getSelectValue(document.getElementById("tsRightType"));
  const tsLeftNum = document.getElementById("tsLeftNum");
  const tsLeftDate = document.getElementById("tsLeftDate");
  const tsRightNum = document.getElementById("tsRightNum");
  const tsRightDate = document.getElementById("tsRightDate");

  if(lt === "timestamp"){
    let ts = Number(tsLeftNum.value || 0);
    if(ts.toString().length === 10) ts *= 1000;
    const d = new Date(ts);
    if(rt === "datetime"){
      tsRightDate.value = fmtDate(d);
      tsRightDate.classList.remove("hidden");
      tsRightNum.classList.add("hidden");
    } else {
      tsRightNum.value = d.getTime();
      tsRightNum.classList.remove("hidden");
      tsRightDate.classList.add("hidden");
    }
  }

  if(lt === "datetime"){
    const dates = dpLeft.selectedDates;
    if(!dates.length) return;
    const ts = dates[0].getTime();
    if(rt === "timestamp"){
      tsRightNum.value = ts;
      tsRightNum.classList.remove("hidden");
      tsRightDate.classList.add("hidden");
    } else {
      tsRightDate.value = fmtDate(dates[0]);
      tsRightDate.classList.remove("hidden");
      tsRightNum.classList.add("hidden");
    }
  }
}

function toggleTsLeft(){
  const t = getSelectValue(document.getElementById("tsLeftType"));
  if(t === "timestamp"){
    document.getElementById("tsLeftNum").classList.remove("hidden");
    document.getElementById("tsLeftDate").classList.add("hidden");
  } else {
    document.getElementById("tsLeftNum").classList.add("hidden");
    document.getElementById("tsLeftDate").classList.remove("hidden");
  }
  autoConvertTs();
}

let currentJSONText = "";

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderJSON(obj) {
  if (obj === null) return '<span class="json-null">null</span>';
  if (typeof obj === "boolean") return '<span class="json-bool">' + obj + '</span>';
  if (typeof obj === "number") return '<span class="json-number">' + obj + '</span>';
  if (typeof obj === "string") return '<span class="json-string">"' + escapeHTML(obj) + '"</span>';

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '<span class="json-bracket">[]</span>';
    var items = "";
    for (var i = 0; i < obj.length; i++) {
      items += '<div class="json-row">' + renderJSON(obj[i]);
      if (i < obj.length - 1) items += '<span class="json-comma">,</span>';
      items += '</div>';
    }
    return '<details open><summary><span class="json-bracket">[</span></summary><div class="json-children">' + items + '</div><div class="json-row"><span class="json-bracket">]</span></div></details>';
  }

  if (typeof obj === "object") {
    var keys = Object.keys(obj);
    if (keys.length === 0) return '<span class="json-bracket">{}</span>';
    var items = "";
    for (var i = 0; i < keys.length; i++) {
      items += '<div class="json-row"><span class="json-key">"' + escapeHTML(keys[i]) + '"</span><span class="json-colon">: </span>' + renderJSON(obj[keys[i]]);
      if (i < keys.length - 1) items += '<span class="json-comma">,</span>';
      items += '</div>';
    }
    return '<details open><summary><span class="json-bracket">{</span></summary><div class="json-children">' + items + '</div><div class="json-row"><span class="json-bracket">}</span></div></details>';
  }

  return "";
}

function formatJSON() {
  try {
    const val = jsonInput.value.trim();
    if (!val) {
      jsonOutput.innerHTML = '<div class="json-empty">请输入JSON内容</div>';
      currentJSONText = "";
      return;
    }
    const parsed = JSON.parse(val);
    currentJSONText = JSON.stringify(parsed, null, 2);
    jsonOutput.innerHTML = renderJSON(parsed);
  } catch (e) {
    jsonOutput.innerHTML = '<div class="json-error">JSON格式错误：' + escapeHTML(e.message) + '</div>';
    currentJSONText = "";
  }
}

function minifyJSON() {
  try {
    const val = jsonInput.value.trim();
    if (!val) return;
    const parsed = JSON.parse(val);
    currentJSONText = JSON.stringify(parsed);
    jsonOutput.innerHTML = '<pre style="margin:0;white-space:pre-wrap;word-break:break-all;font-family:inherit;font-size:inherit;line-height:inherit;">' + escapeHTML(currentJSONText) + '</pre>';
  } catch (e) {
    jsonOutput.innerHTML = '<div class="json-error">JSON格式错误：' + escapeHTML(e.message) + '</div>';
    currentJSONText = "";
  }
}

function copyJSON() {
  if (!currentJSONText) return;
  navigator.clipboard.writeText(currentJSONText).then(() => {
    const oldText = copyBtn.innerText;
    copyBtn.innerText = "复制成功！";
    setTimeout(() => copyBtn.innerText = oldText, 1500);
  }).catch(() => {
    const oldText = copyBtn.innerText;
    copyBtn.innerText = "复制失败";
    setTimeout(() => copyBtn.innerText = oldText, 1500);
  });
}

function unescapeOneLevel(str) {
  var out = "";
  for (var i = 0; i < str.length; i++) {
    if (str[i] === "\\" && i + 1 < str.length) {
      var next = str[i + 1];
      switch (next) {
        case "n": out += "\n"; break;
        case "t": out += "\t"; break;
        case "r": out += "\r"; break;
        case "\\": out += "\\"; break;
        case "\"": out += "\""; break;
        case "/": out += "/"; break;
        default: out += next; break;
      }
      i++;
    } else {
      out += str[i];
    }
  }
  return out;
}

function escapeJSON() {
  var val = jsonInput.value;
  if (!val) return;
  jsonInput.value = JSON.stringify(val);
  formatJSON();
}

function unescapeJSON() {
  try {
    var val = jsonInput.value.trim();
    if (!val) return;
    var parsed = JSON.parse(val);
    if (typeof parsed === "string") {
      jsonInput.value = parsed;
    } else {
      jsonInput.value = JSON.stringify(parsed, null, 2);
    }
  } catch (e) {
    jsonInput.value = unescapeOneLevel(jsonInput.value.trim());
  }
  formatJSON();
}

function initUnits(type){
  convertWrap.classList.add("hidden");
  tsWrap.classList.add("hidden");
  jsonWrap.classList.add("hidden");

  if(type === "ts"){
    tsWrap.classList.remove("hidden");
    titleText.innerText = "时间戳 ↔ 日期";
    return;
  }
  if(type === "json"){
    jsonWrap.classList.remove("hidden");
    titleText.innerText = "JSON格式化";
    return;
  }

  convertWrap.classList.remove("hidden");
  const cfg = unitConfig[type];
  const opts = cfg.units.map(u => ({v: u.v, n: u.n}));
  setSelectOptions(leftUnit, opts);
  setSelectOptions(rightUnit, opts);
  titleText.innerText = cfg.name;
}

leftVal.oninput = autoConvert;
document.getElementById("tsLeftNum").oninput = autoConvertTs;

formatBtn.onclick = formatJSON;
minifyBtn.onclick = minifyJSON;
copyBtn.onclick = copyJSON;
escapeBtn.onclick = escapeJSON;
unescapeBtn.onclick = unescapeJSON;
jsonInput.oninput = formatJSON;

titleText.onclick = (e) => {
  e.stopPropagation();
  catMenu.classList.toggle("show");
};
document.querySelectorAll(".menu-item").forEach(item => {
  item.onclick = () => {
    curType = item.dataset.type;
    initUnits(curType);
    catMenu.classList.remove("show");
  };
});
catMenu.addEventListener('click', (e) => e.stopPropagation());

document.getElementById("prevBtn").onclick = () => {
  let idx = typeList.indexOf(curType);
  idx = idx <= 0 ? typeList.length - 1 : idx - 1;
  curType = typeList[idx];
  initUnits(curType);
};
document.getElementById("nextBtn").onclick = () => {
  let idx = typeList.indexOf(curType);
  idx = idx >= typeList.length - 1 ? 0 : idx + 1;
  curType = typeList[idx];
  initUnits(curType);
};

initUnits(curType);

// --- 日夜切换 ---
document.getElementById("themeToggle").onclick = function() {
  var html = document.documentElement;
  var isDark = html.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

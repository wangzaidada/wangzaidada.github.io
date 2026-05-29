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
var isPC = window.matchMedia("(min-width: 768px)").matches;

const titleText = document.getElementById("titleText");
const catMenu = document.getElementById("catMenu");
const leftVal = document.getElementById("leftVal");
const rightVal = document.getElementById("rightVal");
const leftUnit = document.getElementById("leftUnit");
const rightUnit = document.getElementById("rightUnit");
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
  const cfg = unitConfig.time;
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

var JSON_MAX_NODES = 50000;
var JSON_AUTO_EXPAND_DEPTH = 3;

function countNodes(obj) {
  if (obj === null || typeof obj !== "object") return 1;
  var count = 1;
  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      count += countNodes(obj[i]);
      if (count > JSON_MAX_NODES) return count;
    }
  } else {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      count += countNodes(obj[keys[i]]);
      if (count > JSON_MAX_NODES) return count;
    }
  }
  return count;
}

function renderJSON(obj, depth) {
  if (depth === undefined) depth = 0;
  if (obj === null) return '<span class="json-null">null</span>';
  if (typeof obj === "boolean")
    return '<span class="json-bool">' + obj + '</span>';
  if (typeof obj === "number")
    return '<span class="json-number">' + obj + '</span>';
  if (typeof obj === "string")
    return '<span class="json-string">"' + escapeHTML(obj) + '"</span>';

  var open = depth < JSON_AUTO_EXPAND_DEPTH ? " open" : "";

  if (Array.isArray(obj)) {
    if (obj.length === 0)
      return '<span class="json-bracket">[]</span>';
    var items = "";
    for (var i = 0; i < obj.length; i++) {
      items += '<div class="json-row">' + renderJSON(obj[i], depth + 1);
      if (i < obj.length - 1)
        items += '<span class="json-comma">,</span>';
      items += '</div>';
    }
    return '<details' + open + '><summary><span class="json-bracket">[</span><span class="json-hint"> ' + obj.length + ' items </span></summary><div class="json-children">' + items + '</div><div class="json-row"><span class="json-bracket">]</span></div></details>';
  }

  if (typeof obj === "object") {
    var keys = Object.keys(obj);
    if (keys.length === 0)
      return '<span class="json-bracket">{}</span>';
    var items = "";
    for (var i = 0; i < keys.length; i++) {
      items += '<div class="json-row"><span class="json-key">"' + escapeHTML(keys[i]) + '"</span><span class="json-colon">: </span>' + renderJSON(obj[keys[i]], depth + 1);
      if (i < keys.length - 1)
        items += '<span class="json-comma">,</span>';
      items += '</div>';
    }
    return '<details' + open + '><summary><span class="json-bracket">{</span><span class="json-hint"> ' + keys.length + ' keys </span></summary><div class="json-children">' + items + '</div><div class="json-row"><span class="json-bracket">}</span></div></details>';
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
    var nodes = countNodes(parsed);
    if (nodes > JSON_MAX_NODES) {
      jsonOutput.innerHTML = '<div class="json-error">JSON节点数超过' + JSON_MAX_NODES + '，仅显示纯文本以避免浏览器卡顿</div><pre style="margin:8px 0 0;white-space:pre-wrap;word-break:break-all;font-family:inherit;font-size:inherit;line-height:inherit;max-height:500px;overflow:auto;">' + escapeHTML(currentJSONText.slice(0, 200000)) + (currentJSONText.length > 200000 ? '\n... (已截断)' : '') + '</pre>';
      return;
    }
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
  if (isPC) return;
  document.getElementById("section-time").classList.add("hidden");
  document.getElementById("section-length").classList.add("hidden");
  document.getElementById("section-ts").classList.add("hidden");
  document.getElementById("section-json").classList.add("hidden");

  if(type === "ts"){
    document.getElementById("section-ts").classList.remove("hidden");
    titleText.innerText = "时间戳 ↔ 日期";
    return;
  }
  if(type === "json"){
    document.getElementById("section-json").classList.remove("hidden");
    titleText.innerText = "JSON格式化";
    return;
  }
  if(type === "length"){
    document.getElementById("section-length").classList.remove("hidden");
    titleText.innerText = "长度单位";
    var lengthOpts2 = unitConfig.length.units.map(function(u) { return {v: u.v, n: u.n}; });
    setSelectOptions(leftUnit2, lengthOpts2);
    setSelectOptions(rightUnit2, lengthOpts2);
    return;
  }

  document.getElementById("section-time").classList.remove("hidden");
  var cfg = unitConfig[type];
  var timeOpts2 = cfg.units.map(function(u) { return {v: u.v, n: u.n}; });
  setSelectOptions(leftUnit, timeOpts2);
  setSelectOptions(rightUnit, timeOpts2);
  titleText.innerText = cfg.name;
}

leftVal.oninput = autoConvert;
document.getElementById("tsLeftNum").oninput = autoConvertTs;

formatBtn.onclick = formatJSON;
minifyBtn.onclick = minifyJSON;
copyBtn.onclick = copyJSON;
escapeBtn.onclick = escapeJSON;
unescapeBtn.onclick = unescapeJSON;
var _jsonDebounceTimer = null;
jsonInput.oninput = function() {
  clearTimeout(_jsonDebounceTimer);
  _jsonDebounceTimer = setTimeout(formatJSON, 300);
};

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
function toggleTheme() {
  var html = document.documentElement;
  var isDark = html.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}
document.getElementById("themeToggle").onclick = toggleTheme;
var sidebarThemeBtn = document.getElementById("sidebarThemeToggle");
if (sidebarThemeBtn) sidebarThemeBtn.onclick = toggleTheme;

// --- PC端：长度单位独立转换器 ---
var leftVal2 = document.getElementById("leftVal2");
var rightVal2 = document.getElementById("rightVal2");
var leftUnit2 = document.getElementById("leftUnit2");
var rightUnit2 = document.getElementById("rightUnit2");

function autoConvertLength() {
  var cfg = unitConfig.length;
  var v = parseFloat(leftVal2.value || 0);
  var f = getSelectValue(leftUnit2);
  var t = getSelectValue(rightUnit2);
  if (!f || !t) return;
  rightVal2.value = (v * cfg.factor[f] / cfg.factor[t]).toFixed(8);
  rightVal2.classList.remove("pop");
  void rightVal2.offsetWidth;
  rightVal2.classList.add("pop");
}

if (leftUnit2 && rightUnit2) {
  initCustomSelect(leftUnit2, autoConvertLength);
  initCustomSelect(rightUnit2, autoConvertLength);
  leftVal2.oninput = autoConvertLength;
  var lengthOpts = unitConfig.length.units.map(function(u) { return {v: u.v, n: u.n}; });
  setSelectOptions(leftUnit2, lengthOpts);
  setSelectOptions(rightUnit2, lengthOpts);
}

// --- PC端布局逻辑 ---

function initPC() {
  var timeOpts = unitConfig.time.units.map(function(u) { return {v: u.v, n: u.n}; });
  setSelectOptions(leftUnit, timeOpts);
  setSelectOptions(rightUnit, timeOpts);
}

if (isPC) {
  initPC();
}

// 侧边栏导航
var sidebarItems = document.querySelectorAll(".sidebar-item");
sidebarItems.forEach(function(item) {
  item.onclick = function() {
    var sectionId = item.dataset.section;
    var section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    sidebarItems.forEach(function(s) { s.classList.remove("active"); });
    item.classList.add("active");
  };
});

// 滚动高亮
var mainContent = document.getElementById("mainContent");
if (mainContent && isPC) {
  var sections = document.querySelectorAll(".tool-section");
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        sidebarItems.forEach(function(s) {
          s.classList.toggle("active", s.dataset.section === id);
        });
      }
    });
  }, { root: mainContent, threshold: 0.3 });
  sections.forEach(function(s) { observer.observe(s); });
}

// 响应式切换
window.matchMedia("(min-width: 768px)").addEventListener("change", function(e) {
  isPC = e.matches;
  if (e.matches) {
    document.querySelectorAll(".tool-section").forEach(function(s) {
      s.classList.remove("hidden");
    });
    initPC();
  } else {
    initUnits(curType);
  }
});

// 侧边栏自动收缩
var sidebar = document.getElementById("sidebar");
var sidebarCollapseTimer = null;
var SIDEBAR_COLLAPSE_DELAY = 500;

if (sidebar && isPC) {
  sidebarCollapseTimer = setTimeout(function() {
    sidebar.classList.add("collapsed");
  }, SIDEBAR_COLLAPSE_DELAY);

  sidebar.addEventListener("mouseenter", function() {
    clearTimeout(sidebarCollapseTimer);
    sidebar.classList.remove("collapsed");
  });
  sidebar.addEventListener("mouseleave", function() {
    sidebarCollapseTimer = setTimeout(function() {
      sidebar.classList.add("collapsed");
    }, SIDEBAR_COLLAPSE_DELAY);
  });
}

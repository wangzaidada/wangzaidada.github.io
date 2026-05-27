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

const monthNames = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];

function addMonthPicker(fp) {
  const monthEl = fp.calendarContainer.querySelector(".flatpickr-current-month .cur-month");
  if (!monthEl) return;
  monthEl.style.cursor = "pointer";

  const grid = document.createElement("div");
  grid.className = "month-picker-grid";
  grid.style.display = "none";
  monthNames.forEach((name, i) => {
    const cell = document.createElement("div");
    cell.className = "month-picker-cell";
    cell.textContent = name;
    cell.addEventListener("click", (e) => {
      e.stopPropagation();
      fp.changeMonth(i - fp.currentMonth, false);
      grid.style.display = "none";
    });
    grid.appendChild(cell);
  });
  fp.calendarContainer.querySelector(".flatpickr-months").appendChild(grid);

  monthEl.addEventListener("click", (e) => {
    e.stopPropagation();
    grid.style.display = grid.style.display === "none" ? "grid" : "none";
  });

  fp.calendarContainer.addEventListener("click", () => {
    grid.style.display = "none";
  });
}

const fpConfig = {
  enableTime: true,
  time_24hr: true,
  dateFormat: "Y-m-d H:i:S",
  locale: "zh",
  monthSelectorType: "static",
  onReady: function(_, __, fp) { addMonthPicker(fp); },
  onChange: function() { autoConvertTs(); }
};

const fpLeft = flatpickr("#tsLeftDate", fpConfig);

const fpRight = flatpickr("#tsRightDate", {
  ...fpConfig,
  clickOpens: false,
  onChange: undefined
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
}

function autoConvertTs(){
  const lt = getSelectValue(document.getElementById("tsLeftType"));
  const rt = getSelectValue(document.getElementById("tsRightType"));

  if(lt === "timestamp"){
    let ts = parseInt(document.getElementById("tsLeftNum").value || 0);
    if(ts.toString().length === 10) ts *= 1000;
    const d = new Date(ts);
    if(rt === "datetime"){
      fpRight.setDate(d, false);
      document.getElementById("tsRightDate").classList.remove("hidden");
      document.getElementById("tsRightNum").classList.add("hidden");
    } else {
      document.getElementById("tsRightNum").value = d.getTime();
      document.getElementById("tsRightNum").classList.remove("hidden");
      document.getElementById("tsRightDate").classList.add("hidden");
    }
  }

  if(lt === "datetime"){
    const dates = fpLeft.selectedDates;
    if(!dates.length) return;
    const ts = dates[0].getTime();
    if(rt === "timestamp"){
      document.getElementById("tsRightNum").value = ts;
      document.getElementById("tsRightNum").classList.remove("hidden");
      document.getElementById("tsRightDate").classList.add("hidden");
    } else {
      fpRight.setDate(dates[0], false);
      document.getElementById("tsRightDate").classList.remove("hidden");
      document.getElementById("tsRightNum").classList.add("hidden");
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

function formatJSON() {
  try {
    const val = jsonInput.value.trim();
    if (!val) {
      jsonOutput.value = "请输入JSON内容";
      return;
    }
    const parsed = JSON.parse(val);
    jsonOutput.value = JSON.stringify(parsed, null, 2);
  } catch (e) {
    jsonOutput.value = `JSON格式错误：\n${e.message}`;
  }
}

function minifyJSON() {
  try {
    const val = jsonInput.value.trim();
    if (!val) return;
    const parsed = JSON.parse(val);
    jsonOutput.value = JSON.stringify(parsed);
  } catch (e) {
    jsonOutput.value = `JSON格式错误：\n${e.message}`;
  }
}

function copyJSON() {
  if (!jsonOutput.value) return;
  navigator.clipboard.writeText(jsonOutput.value).then(() => {
    const oldText = copyBtn.innerText;
    copyBtn.innerText = "复制成功！";
    setTimeout(() => copyBtn.innerText = oldText, 1500);
  });
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

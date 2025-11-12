// result.js (module)
import { foodPlans } from "./data.js";

document.addEventListener("DOMContentLoaded", () => {
  const gender = localStorage.getItem("gender");
  const age = localStorage.getItem("age");
  const weight = parseFloat(localStorage.getItem("weight") || 0);
  const height = localStorage.getItem("height");
  const goal = localStorage.getItem("goal");
  const bmr = parseFloat(localStorage.getItem("bmr") || 0);
  const tdeeBase = parseFloat(localStorage.getItem("tdeeBase") || 0);
  const tdeeFinal = parseFloat(localStorage.getItem("tdeeFinal") || 0);
  const proteinNeed = parseFloat(localStorage.getItem("proteinNeed") || 0);

  const personalInfo = document.getElementById("personalInfo");
  const goalResult = document.getElementById("goalResult");
  const tdeeOriginal = document.getElementById("tdeeOriginal");
  const tdeeResult = document.getElementById("tdeeResult");
  const proteinResult = document.getElementById("proteinResult");
  const distBoxes = document.getElementById("distBoxes");
  const exampleText = document.getElementById("exampleText");
  const foodTableBody = document.getElementById("foodTableBody");
  const foodTableContainer = document.getElementById("foodTableContainer");
  const combineToggle = document.getElementById("combineToggle");

  if (!gender || !tdeeBase || !tdeeFinal) {
    foodTableContainer.innerHTML = "<p>ไม่พบข้อมูลการคำนวณ โปรดย้อนกลับไปกรอกใหม่</p>";
    return;
  }

  personalInfo.textContent = `อายุ ${age} ปี • น้ำหนัก ${weight} กก. • ส่วนสูง ${height} ซม.`;
  goalResult.textContent = `เป้าหมายของคุณ: ${goal === 'maintain' ? 'คงน้ำหนัก' : (goal === 'lose' ? 'ลดน้ำหนัก' : 'เพิ่มน้ำหนัก')}`;
  tdeeOriginal.textContent = `TDEE (ก่อนปรับเป้าหมาย): ${Math.round(tdeeBase)} kcal`;
  tdeeResult.textContent = `พลังงานตามเป้าหมาย: ${Math.round(tdeeFinal)} kcal`;
  proteinResult.textContent = `ปริมาณโปรตีนที่แนะนำ: ${proteinNeed} กรัม / วัน`;

  // หาแผนอาหารที่ตรงกับ tdeeFinal และ proteinNeed
  const matchPlan = foodPlans.find(p =>
    tdeeFinal >= p.energyRange[0] &&
    tdeeFinal <= p.energyRange[1] &&
    proteinNeed >= p.proteinRange[0] &&
    proteinNeed <= p.proteinRange[1]
  );

  if (!matchPlan) {
    // ไม่มีข้อมูล
    foodTableContainer.innerHTML = `
      <p style="text-align:center;color:#666;padding:1rem;">
        ❗ ระบบยังไม่มีฐานข้อมูลนี้ โปรดติดตามในอนาคต
      </p>
    `;
    return;
  }

  // แสดง caloric distribution จากแผน (ตรงข้อนี้ data.js มี carbPercent/proteinPercent/fatPercent)
  distBoxes.innerHTML = `
    <div class="dist-box">คาร์โบไฮเดรต<br><strong>${matchPlan.carbPercent}%</strong></div>
    <div class="dist-box">โปรตีน<br><strong>${matchPlan.proteinPercent}%</strong></div>
    <div class="dist-box">ไขมัน<br><strong>${matchPlan.fatPercent}%</strong></div>
  `;

  // ข้อความตัวอย่างสัดส่วน (ดึงจาก matchPlan.kcalActual / proteinActual)
  exampleText.textContent = `ตัวอย่างสัดส่วนอาหารที่ให้พลังงาน ${matchPlan.kcalActual} kcal และโปรตีน ${matchPlan.proteinActual} g`;

  // ฟังก์ชันช่วย: ลบรายการ total = 0
  function normalizePortions(portions){
    return portions.filter(it => it.total && Number(it.total) !== 0)
                   .map(it => ({...it, total: Number(it.total)}));
  }

  let normalPortions = normalizePortions(matchPlan.portions);

  // สร้างมุมมองปกติ (แยกหมวดตามที่มี)
  function computeMeals(portions){
    // return array with breakfast/lunch/dinner based on rules: simple equal split -> round to .0 or .5
    // helper for splitting number into 3 parts with increments of 0.5
    function splitIntoThree(n){
      // n may be float. We convert to units of 0.5 (i.e., multiply by 2), split integer roughly
      const units = Math.round(n * 2); // units of 0.5
      const base = Math.floor(units / 3);
      let rem = units - base*3;
      // distribute remainder so that the larger parts go to breakfast/mid/dinner per your rule:
      // if rem==1 => give to lunch (middle) (as user wanted)
      // if rem==2 => give to breakfast & lunch
      let parts = [base, base, base];
      if (rem === 1) parts[1] += 1;
      if (rem === 2){ parts[0] +=1; parts[1] +=1; }
      // convert back to values (units/2)
      return parts.map(u => (u/2));
    }

    return portions.map(p => {
      const [b,l,d] = splitIntoThree(p.total);
      return {...p, breakfast:b, lunch:l, dinner:d};
    });
  }

  let renderedCombined = false;
  function renderTable(portions, combineMeat=false){
    // clear
    foodTableBody.innerHTML = "";
    // if combineMeat, combine all "เนื้อสัตว์" and "ถั่ว" into one row labeled "เนื้อสัตว์ (รวม)"
    let working = JSON.parse(JSON.stringify(portions));
    if (combineMeat){
      const meatKeys = ["เนื้อสัตว์","ถั่ว"];
      const meat = working.filter(r => meatKeys.some(k => r.type.includes(k)));
      const others = working.filter(r => !meatKeys.some(k => r.type.includes(k)));
      if (meat.length>0){
        const totalMeat = meat.reduce((s,x)=>s + Number(x.total),0);
        others.unshift({
          type:"เนื้อสัตว์ (รวม)",
          total: totalMeat
        });
      }
      working = others;
    }

    // compute meals
    const withMeals = computeMeals(working);

    withMeals.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td style="text-align:left">${row.type}</td>
        <td>${row.total}</td>
        <td>${row.breakfast % 1 === 0 ? row.breakfast.toFixed(0) : row.breakfast.toFixed(1)}</td>
        <td>${row.lunch % 1 === 0 ? row.lunch.toFixed(0) : row.lunch.toFixed(1)}</td>
        <td>${row.dinner % 1 === 0 ? row.dinner.toFixed(0) : row.dinner.toFixed(1)}</td>
      `;
      foodTableBody.appendChild(tr);
    });
  }

  // initial render: normal
  renderTable(normalPortions, false);

  // toggle combine when click text
  combineToggle.addEventListener("click", () => {
    renderedCombined = !renderedCombined;
    combineToggle.textContent = renderedCombined ? "แยกโปรตีน" : "รวมโปรตีน";
    renderTable(normalPortions, renderedCombined);
  });
});

import { foodPlans } from "./data.js";

window.addEventListener("DOMContentLoaded", () => {
  const goal = localStorage.getItem("goal");
  const tdee = parseFloat(localStorage.getItem("tdee"));
  const protein = parseFloat(localStorage.getItem("protein"));
  
  const goalResult = document.getElementById("goalResult");
  const tdeeResult = document.getElementById("tdeeResult");
  const foodTable = document.getElementById("foodTable");
  const container = document.getElementById("foodTableContainer");
  const toggleBtn = document.getElementById("toggleTableView");

  if (!goal || !tdee || !protein) {
    container.innerHTML = "<p>ไม่พบข้อมูลการคำนวณ โปรดย้อนกลับไปกรอกใหม่</p>";
    return;
  }

  goalResult.textContent = `เป้าหมายของคุณ: ${goal}`;
  tdeeResult.textContent = `พลังงานที่ใช้ต่อวัน (TDEE): ${tdee.toFixed(2)} kcal`;

  const matchPlan = foodPlans.find(plan =>
    tdee >= plan.energyRange[0] &&
    tdee <= plan.energyRange[1] &&
    protein >= plan.proteinRange[0] &&
    protein <= plan.proteinRange[1]
  );

  if (!matchPlan) {
    container.innerHTML = `
      <p style="color:#666; text-align:center; padding:1rem;">
        ❗ ระบบยังไม่มีฐานข้อมูลนี้ โปรดติดตามในอนาคต
      </p>
    `;
    return;
  }

  // 🧾 ฟังก์ชันแสดงตาราง
  function renderTable(portions) {
    foodTable.innerHTML = `
      <tr>
        <th>หมวดอาหาร</th>
        <th>รวมทั้งหมด (ส่วนแลกเปลี่ยน)</th>
        <th>3 มื้อ</th>
        <th>2 มื้อ</th>
      </tr>
    `;
    portions.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.type}</td>
        <td>${item.total}</td>
        <td>${item.meal3}</td>
        <td>${item.meal2}</td>
      `;
      foodTable.appendChild(row);
    });
  }

  // 🥦 ตารางแบบ “แยกหมวดปกติ”
  const normalPortions = matchPlan.portions.map(p => ({
    ...p,
    meal3: (p.total / 3).toFixed(1),
    meal2: (p.total / 2).toFixed(1)
  }));

  // 🍗 ตารางแบบ “รวมเนื้อสัตว์ + ถั่ว”
  const meatGroup = matchPlan.portions.filter(p =>
    p.type.includes("เนื้อสัตว์") || p.type.includes("ถั่ว")
  );
  const otherGroups = matchPlan.portions.filter(p =>
    !p.type.includes("เนื้อสัตว์") && !p.type.includes("ถั่ว")
  );

  let combinedPortions = [];
  if (meatGroup.length > 0) {
    const totalMeat = meatGroup.reduce((sum, p) => sum + p.total, 0);
    combinedPortions.push({
      type: "เนื้อสัตว์ (รวม)",
      total: totalMeat,
      meal3: (totalMeat / 3).toFixed(1),
      meal2: (totalMeat / 2).toFixed(1)
    });
  }
  combinedPortions = combinedPortions.concat(
    otherGroups.map(p => ({
      ...p,
      meal3: (p.total / 3).toFixed(1),
      meal2: (p.total / 2).toFixed(1)
    }))
  );

  // 🌈 เริ่มต้นด้วยตารางแบบปกติ
  let isCombined = false;
  renderTable(normalPortions);

  // 🔁 ปุ่มสลับตาราง
  toggleBtn.addEventListener("click", () => {
    isCombined = !isCombined;
    renderTable(isCombined ? combinedPortions : normalPortions);
    toggleBtn.textContent = isCombined
      ? "🔁 กลับไปมุมมองแยกหมวด"
      : "🔁 สลับมุมมองตาราง (รวมเนื้อสัตว์)";
  });
});

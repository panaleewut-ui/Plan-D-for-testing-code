document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("userForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const gender = document.getElementById("gender").value;
    const age = parseFloat(document.getElementById("age").value);
    const weight = parseFloat(document.getElementById("weight").value);
    const height = parseFloat(document.getElementById("height").value);
    const activity = parseFloat(document.getElementById("activity").value);
    const goal = document.getElementById("goal").value;

    // ✅ สูตรคำนวณ BMR
    let bmr;
    if (gender === "male") {
      bmr = 66.5 + (13.8 * weight) + (5 * height) - (6.8 * age);
    } else {
      bmr = 655.1 + (9.6 * weight) + (1.9 * height) - (4.7 * age);
    }

    // ✅ คำนวณ TDEE
    let tdee = bmr * activity;

    // ✅ ปรับตามเป้าหมาย
    if (goal === "lose") {
      tdee -= 500;
    } else if (goal === "gain") {
      tdee += 500;
    }

    // ✅ โปรตีน (1 กรัม/กก.)
    const protein = weight * 1.0;

    // ✅ เก็บข้อมูลใน localStorage
    localStorage.setItem("gender", gender);
    localStorage.setItem("age", age);
    localStorage.setItem("weight", weight);
    localStorage.setItem("height", height);
    localStorage.setItem("activity", activity);
    localStorage.setItem("goal", goal);
    localStorage.setItem("tdee", tdee);
    localStorage.setItem("protein", protein);

    // ✅ ไปหน้าแสดงผล
    window.location.href = "result.html";
  });
});

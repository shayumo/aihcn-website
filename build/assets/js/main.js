/* AIHCN · 智衡 — 前端脚本 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 像素 A 渲染 ---------- */
  var A_PATTERN = [
    "..XXX..",
    ".XX.XX.",
    "X.X.X.X",
    "XXXXXXX",
    "X.....X",
    "X.....X",
  ];
  var ACCENT_ROW = 3; // 朱砂横杠

  function renderPixelA(container) {
    var rows = A_PATTERN.length;
    var cols = A_PATTERN[0].length;
    container.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (A_PATTERN[r][c] !== "X") continue;
        var cell = document.createElement("i");
        cell.className = "cell" + (r === ACCENT_ROW ? " accent" : "");
        cell.setAttribute("data-row", r);
        container.appendChild(cell);
      }
    }
    if (prefersReduced) {
      container.querySelectorAll(".cell").forEach(function (el) {
        el.classList.add("lit");
      });
    } else {
      container.querySelectorAll(".cell").forEach(function (el) {
        var row = parseInt(el.getAttribute("data-row"), 10);
        setTimeout(function () { el.classList.add("lit"); }, 260 + row * 130);
      });
    }
  }
  document.querySelectorAll(".pixel-a").forEach(renderPixelA);

  /* ---------- 移动端导航 ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- 滚动显现 ---------- */
  if (!prefersReduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 表单提交 ---------- */
  function bindForm(form) {
    if (!form) return;
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (form.querySelector("[name=company_website]") && form.querySelector("[name=company_website]").value) {
        return; // 蜜罐字段有值，视为机器人
      }
      var endpoint = form.getAttribute("data-endpoint");
      var payload = {};
      form.querySelectorAll("[name]").forEach(function (field) {
        if (field.name && field.value && field.name !== "company_website") {
          payload[field.name] = field.value;
        }
      });
      if (!payload.email) {
        showStatus(status, "请填写邮箱，方便我们回复你。", false);
        return;
      }
      status.className = "form-status";
      status.textContent = "提交中…";
      status.style.display = "block";
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.ok) {
            showStatus(status, data.message || "已收到，我们会尽快回复你。", true);
            form.reset();
          } else {
            showStatus(status, data.error || "提交失败，请稍后再试。", false);
          }
        })
        .catch(function () {
          showStatus(
            status,
            "当前处于本地预览，提交服务未连接。正式上线后此表单将直接送达我们。你也可以直接发邮件到 hello@aihcn.com。",
            false
          );
        });
    });
  }
  function showStatus(el, msg, ok) {
    el.textContent = msg;
    el.className = "form-status " + (ok ? "ok" : "err");
    el.style.display = "block";
  }
  bindForm(document.querySelector("#contact-form"));
  bindForm(document.querySelector("#newsletter-form"));

  /* ---------- 页脚年份 ---------- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();

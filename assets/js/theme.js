(function() {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  function setTheme(theme) {
    var isDark = theme === "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");

    var moon = document.getElementById("icon-moon");
    var sun = document.getElementById("icon-sun");
    if (moon) moon.style.display = isDark ? "none" : "block";
    if (sun) sun.style.display = isDark ? "block" : "none";
  }

  btn.addEventListener("click", function() {
    var current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  });

  setTheme(document.documentElement.getAttribute("data-theme") || "dark");
})();

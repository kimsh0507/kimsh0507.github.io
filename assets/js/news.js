function toggleNews() {
  var hidden = document.querySelectorAll(".news-hidden");
  var btn = document.getElementById("news-toggle");
  if (!btn) return;

  var isExpanded = btn.dataset.expanded === "true";
  hidden.forEach(function (el) {
    el.style.display = isExpanded ? "none" : "grid";
  });
  btn.dataset.expanded = isExpanded ? "false" : "true";
  btn.textContent = isExpanded ? "Show more (" + hidden.length + " more)" : "Show less";
}

document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("news-toggle");
  if (btn) btn.addEventListener("click", toggleNews);
});

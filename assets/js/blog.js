function filterBlog(category) {
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    var isActive = btn.dataset.filter === category;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".blog-card").forEach(function (card) {
    card.style.display = card.dataset.category === category ? "block" : "none";
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBlog(btn.dataset.filter);
    });
  });
  filterBlog("research");
});

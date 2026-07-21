(function () {
  document.querySelectorAll("[data-menu-toggle]").forEach(function (button) {
    var target = document.getElementById(button.getAttribute("aria-controls"));
    if (!target) return;

    button.addEventListener("click", function () {
      var isOpen = target.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".fade-in").forEach(function (el) {
      el.classList.add("visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0 }
  );

  document.querySelectorAll(".fade-in").forEach(function (el) {
    observer.observe(el);
  });
})();

(function () {
  var post = document.querySelector("[data-bilingual-post]");
  if (!post) return;

  var buttons = post.querySelectorAll("[data-post-language-button]");
  var localizedContent = post.querySelectorAll("[data-post-language-copy], [data-post-language-panel]");
  var supportedLanguages = ["en", "ko"];

  function storedLanguage() {
    try {
      return localStorage.getItem("post-language");
    } catch (error) {
      return null;
    }
  }

  function rememberLanguage(language) {
    try {
      localStorage.setItem("post-language", language);
    } catch (error) {
      // The language switch still works when storage is unavailable.
    }
  }

  function setLanguage(language, shouldRemember) {
    if (supportedLanguages.indexOf(language) === -1) language = "en";

    buttons.forEach(function (button) {
      var isActive = button.dataset.postLanguageButton === language;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    localizedContent.forEach(function (element) {
      var elementLanguage = element.dataset.postLanguageCopy || element.dataset.postLanguagePanel;
      element.hidden = elementLanguage !== language;
    });

    post.dataset.activeLanguage = language;
    document.documentElement.lang = language;
    if (shouldRemember) rememberLanguage(language);
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      setLanguage(button.dataset.postLanguageButton, true);
    });
  });

  setLanguage(storedLanguage() || post.dataset.defaultLanguage || "en", false);
})();

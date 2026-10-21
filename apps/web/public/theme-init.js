(() => {
  const root = globalThis.document.documentElement;
  let preference = null;

  try {
    const saved = globalThis.localStorage.getItem("pokemon-tools:theme");
    if (saved === "light" || saved === "dark") preference = saved;
  } catch {
    // Theme selection still works for this visit when browser storage is blocked.
  }

  let theme = preference;
  if (theme === null) {
    try {
      theme = globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      theme = "light";
    }
  }

  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeColor = globalThis.document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === "dark" ? "#101827" : "#f5f7f8";
})();

const lightTheme = {
  surface: "#f4f9fb",
  primary: "#2f80ed",
  primaryContainer: "#d7e7ff",
  secondary: "#0b1f28",
  tertiary: "#6ee7c8",
  error: "#e35757",
  onSurface: "#0b1f28",
  onSurfaceVariant: "#4b5f6a",
};

const darkTheme = {
  surface: "#0b1419",
  primary: "#7cb3ff",
  primaryContainer: "#133a6f",
  secondary: "#d6e4ea",
  tertiary: "#7ce9d1",
  error: "#ff9a9a",
  onSurface: "#e8f0f5",
  onSurfaceVariant: "#b6c7d1",
};

export const detectDarkMode = () => {
  if (typeof localStorage !== "undefined") {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) return savedMode === "true";
  }
  // Default to light mode for Crystalline Editorial aesthetic
  return false;
};

export const toggleDarkMode = () => {
  const isDark = !detectDarkMode();
  localStorage.setItem("darkMode", String(isDark));
  applyTheme(isDark ? darkTheme : lightTheme);
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export const applyTheme = (themeInput) => {
  if (typeof document === "undefined") return;

  const isDark = detectDarkMode();
  const baseTheme = isDark ? darkTheme : lightTheme;
  const theme = { ...baseTheme, ...themeInput };
  const root = document.documentElement;

  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-container", theme.primaryContainer);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--tertiary", theme.tertiary);
  root.style.setProperty("--error", theme.error);
  root.style.setProperty("--on-surface", theme.onSurface);
  root.style.setProperty("--on-surface-variant", theme.onSurfaceVariant);

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export const getStoredTheme = () => {
  try {
    const raw = localStorage.getItem("tenantTheme");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Unable to parse stored theme", err);
    return null;
  }
};

export const persistTheme = (theme) => {
  if (!theme) return;
  localStorage.setItem("tenantTheme", JSON.stringify(theme));
  applyTheme(theme);
};

export const clearStoredTheme = () => {
  localStorage.removeItem("tenantTheme");
  applyTheme({});
};

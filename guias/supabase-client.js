/* Pantanal Bento public Supabase client. The key below is intentionally public. */
(() => {
  const SUPABASE_URL = "https://zkwcogcwaqktyqblosxw.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprd2NvZ2N3YXFrdHlxYmxvc3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDA3MTksImV4cCI6MjA5OTAxNjcxOX0.OVHitiYbb0LDpoxedYZWcN2ljihbHwQPo-Xf6Pf1D4A";

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const safeUrl = (value = "") => {
    if (!value) return "";
    try {
      const parsed = new URL(value, window.location.origin);
      return ["http:", "https:", "mailto:"].includes(parsed.protocol)
        ? parsed.href
        : "";
    } catch {
      return "";
    }
  };

  const safeImageUrl = (value = "") => {
    if (!value) return "";
    try {
      const parsed = new URL(value, window.location.origin);
      return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
    } catch {
      return "";
    }
  };

  const normalizeWhatsapp = (value = "") => String(value).replace(/\D/g, "");

  window.PantanalBento = {
    client,
    escapeHtml,
    normalizeWhatsapp,
    safeImageUrl,
    safeUrl,
    supabaseUrl: SUPABASE_URL,
  };
})();


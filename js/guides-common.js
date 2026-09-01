(function () {
  "use strict";

  const config = window.PANTANAL_SUPABASE;
  if (!config || !window.supabase) {
    console.error("Configuração do Supabase indisponível.");
    return;
  }

  const db = window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const STATUS = {
    pending: { label: "Aguardando verificação", className: "status-pending" },
    approved: { label: "Aprovado", className: "status-approved" },
    rejected: { label: "Não aprovado", className: "status-rejected" },
    suspended: { label: "Suspenso", className: "status-suspended" }
  };

  const OPTIONS = Object.freeze({
    languages: ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano"],
    regions: ["Poconé", "Transpantaneira", "Porto Jofre", "Pantanal Norte", "Cuiabá", "Chapada dos Guimarães"],
    specialties: ["Observação de aves", "Onça-pintada", "Safári fotográfico", "Fotografia", "Fauna", "Flora", "Pesca", "História e cultura", "Trekking", "Expedições", "Transpantaneira", "Porto Jofre", "Pantanal Norte"]
  });

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
  }

  function asArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (!value) return [];
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (_) {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  }

  function slugify(value) {
    return String(value || "guia")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "guia";
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function safeUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function displayName(guide) {
    return guide.nome_profissional || guide.nome || "Guia do Pantanal";
  }

  function initials(value) {
    return String(value || "GP").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function statusInfo(status) {
    return STATUS[status] || STATUS.pending;
  }

  function statusPill(status) {
    const info = statusInfo(status);
    return `<span class="status-pill ${info.className}">${escapeHTML(info.label)}</span>`;
  }

  function setMessage(target, text, type = "info") {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    if (!element) return;
    element.textContent = text || "";
    element.className = `message message-${type}${text ? " is-visible" : ""}`;
  }

  function checkedValues(form, name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
  }

  function setCheckedValues(form, name, values) {
    const selected = new Set(asArray(values));
    form.querySelectorAll(`input[name="${name}"]`).forEach((input) => { input.checked = selected.has(input.value); });
  }

  function guidePath(slug) {
    return `/guias/${encodeURIComponent(slug)}`;
  }

  function currentGuideSlug() {
    const fromQuery = new URLSearchParams(location.search).get("slug");
    if (fromQuery) return slugify(fromQuery);
    const parts = location.pathname.split("/").filter(Boolean);
    const reserved = new Set(["cadastro", "login", "painel", "perfil"]);
    if (parts[0] === "guias" && parts[1] && !reserved.has(parts[1])) return slugify(parts[1]);
    return "";
  }

  function fileExtension(file) {
    const fromName = file.name.split(".").pop();
    if (fromName && fromName.length <= 5) return fromName.toLowerCase();
    return (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  }

  async function uploadImage(file, userId, prefix) {
    if (!file) return "";
    if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Cada imagem pode ter no máximo 8 MB.");

    const path = `${userId}/${prefix}-${Date.now()}-${crypto.randomUUID()}.${fileExtension(file)}`;
    const { error } = await db.storage.from("guide-media").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = db.storage.from("guide-media").getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  function localNext(defaultPath = "/guias/painel/") {
    const next = new URLSearchParams(location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : defaultPath;
  }

  async function requireSession(redirect = true) {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    if (!data.session && redirect) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace(`/guias/login/?next=${next}`);
      return null;
    }
    return data.session;
  }

  function debounce(fn, wait = 180) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  function renderOptions(root = document) {
    root.querySelectorAll("[data-options]").forEach((container) => {
      const name = container.dataset.options;
      const values = OPTIONS[name] || [];
      container.innerHTML = values.map((value) => `<label class="check-option"><input type="checkbox" name="${escapeHTML(name)}" value="${escapeHTML(value)}"><span>${escapeHTML(value)}</span></label>`).join("");
    });
  }

  window.PantanalGuides = Object.freeze({
    db,
    escapeHTML,
    asArray,
    slugify,
    normalizePhone,
    safeUrl,
    displayName,
    initials,
    statusInfo,
    statusPill,
    setMessage,
    checkedValues,
    setCheckedValues,
    guidePath,
    currentGuideSlug,
    uploadImage,
    localNext,
    requireSession,
    debounce,
    OPTIONS,
    renderOptions
  });
})();

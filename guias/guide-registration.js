(() => {
  const { client, normalizeWhatsapp } = window.PantanalBento;
  const { languages, regions, specialties, renderCheckboxes, selectedValues } = window.GuideOptions;
  const gate = document.querySelector("#registration-gate");
  const form = document.querySelector("#registration-form");
  const notice = document.querySelector("#registration-notice");
  let session;

  const showNotice = (message, type = "success") => {
    notice.className = `notice notice-${type}`;
    notice.textContent = message;
  };

  const validateImage = (file) => {
    if (!file) throw new Error("Selecione as fotos obrigatórias.");
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error("Use imagens JPG, PNG ou WebP.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Cada imagem deve ter no máximo 8 MB.");
  };

  const uploadImage = async (file, kind) => {
    validateImage(file);
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const path = `${session.user.id}/${kind}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from("guide-media").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    return client.storage.from("guide-media").getPublicUrl(path).data.publicUrl;
  };

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.textContent = "Enviando cadastro…";

    try {
      const data = new FormData(form);
      const selectedLanguages = selectedValues(form, "idiomas");
      const selectedRegions = selectedValues(form, "regioes");
      const selectedSpecialties = selectedValues(form, "especialidades");
      if (!selectedLanguages.length) throw new Error("Selecione pelo menos um idioma.");
      if (!selectedRegions.length) throw new Error("Selecione pelo menos uma região de atuação.");

      const profileFile = form.foto_perfil.files[0];
      const coverFile = form.foto_capa.files[0];
      validateImage(profileFile);
      validateImage(coverFile);

      const [profileUrl, coverUrl] = await Promise.all([
        uploadImage(profileFile, "perfil"),
        uploadImage(coverFile, "capa"),
      ]);

      const payload = {
        user_id: session.user.id,
        nome: String(data.get("nome") || "").trim(),
        nome_profissional: String(data.get("nome_profissional") || "").trim() || null,
        email: String(data.get("email") || "").trim() || session.user.email,
        whatsapp: normalizeWhatsapp(data.get("whatsapp")),
        instagram: String(data.get("instagram") || "").trim() || null,
        facebook: String(data.get("facebook") || "").trim() || null,
        site: String(data.get("site") || "").trim() || null,
        bio: String(data.get("bio") || "").trim(),
        cadastur_numero: String(data.get("cadastur_numero") || "").trim(),
        idiomas: selectedLanguages,
        regioes: selectedRegions,
        especialidades: selectedSpecialties,
        foto_perfil: profileUrl,
        foto_capa: coverUrl,
        status: "pending",
        cadastur_verificado: false,
      };

      const { data: guide, error } = await client.from("guides").insert(payload).select("id").single();
      if (error) throw error;

      const galleryFiles = Array.from(form.galeria.files || []);
      const galleryRows = [];
      for (let index = 0; index < galleryFiles.length; index += 1) {
        const imageUrl = await uploadImage(galleryFiles[index], "galeria");
        galleryRows.push({ guide_id: guide.id, image_url: imageUrl, position: index });
      }
      if (galleryRows.length) {
        const { error: galleryError } = await client.from("guide_gallery").insert(galleryRows);
        if (galleryError) console.error(galleryError);
      }

      location.assign("/guias/painel/?submitted=1");
    } catch (error) {
      console.error(error);
      showNotice(error.message || "Não foi possível enviar seu cadastro.", "error");
      button.disabled = false;
      button.textContent = "Enviar para verificação";
    }
  });

  async function init() {
    const response = await client.auth.getSession();
    session = response.data.session;
    if (!session) {
      gate.classList.remove("hidden");
      return;
    }

    const { data: existing } = await client.from("guides").select("id").eq("user_id", session.user.id).maybeSingle();
    if (existing) return location.replace("/guias/painel/");

    renderCheckboxes(document.querySelector("#language-options"), "idiomas", languages);
    renderCheckboxes(document.querySelector("#region-options"), "regioes", regions);
    renderCheckboxes(document.querySelector("#specialty-options"), "especialidades", specialties);
    form.classList.remove("hidden");
  }

  init();
})();


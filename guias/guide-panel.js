(() => {
  const { client, escapeHtml, normalizeWhatsapp } = window.PantanalBento;
  const { languages, regions, specialties, renderCheckboxes, selectedValues } = window.GuideOptions;
  const shell = document.querySelector("#panel-shell");
  const form = document.querySelector("#profile-form");
  const notice = document.querySelector("#panel-notice");
  const gallery = document.querySelector("#panel-gallery");
  let session;
  let guide;

  const statusLabels = {
    pending: "Aguardando verificação",
    approved: "Perfil aprovado e público",
    rejected: "Cadastro não aprovado",
    suspended: "Perfil suspenso",
  };

  const showNotice = (message, type = "success") => {
    notice.className = `notice notice-${type}`;
    notice.textContent = message;
  };

  const validateImage = (file) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error("Use imagens JPG, PNG ou WebP.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Cada imagem deve ter no máximo 8 MB.");
  };

  const uploadImage = async (file, kind) => {
    validateImage(file);
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const path = `${session.user.id}/${kind}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from("guide-media").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return client.storage.from("guide-media").getPublicUrl(path).data.publicUrl;
  };

  const fill = (name, value = "") => {
    const input = form.elements[name];
    if (input) input.value = value || "";
  };

  const renderStatus = () => {
    const pill = document.querySelector("#guide-status");
    pill.className = `status-pill status-${guide.status}`;
    pill.textContent = statusLabels[guide.status] || guide.status;
    const profileLink = document.querySelector("#public-profile-link");
    profileLink.classList.toggle("hidden", guide.status !== "approved");
    profileLink.href = `/guias/perfil/?slug=${encodeURIComponent(guide.slug)}`;
  };

  const renderGallery = async () => {
    const { data, error } = await client.from("guide_gallery").select("id,image_url,caption,position").eq("guide_id", guide.id).order("position");
    if (error || !data?.length) {
      gallery.innerHTML = '<div class="empty-state">Sua galeria ainda não possui fotos.</div>';
      return;
    }
    gallery.innerHTML = data.map((item) => `
      <figure class="gallery-item">
        <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.caption || "Foto da galeria")}">
        <button class="button button-danger button-small gallery-remove" type="button" data-gallery-id="${item.id}" data-image-url="${escapeHtml(item.image_url)}" aria-label="Remover foto">×</button>
      </figure>`).join("");
  };

  gallery.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-gallery-id]");
    if (!button || !confirm("Remover esta foto da galeria?")) return;
    const { error } = await client.from("guide_gallery").delete().eq("id", button.dataset.galleryId);
    if (error) return showNotice(error.message, "error");
    const marker = "/storage/v1/object/public/guide-media/";
    const path = decodeURIComponent(button.dataset.imageUrl.split(marker)[1] || "");
    if (path) await client.storage.from("guide-media").remove([path]);
    renderGallery();
  });

  document.querySelector("#gallery-upload-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = Array.from(event.currentTarget.elements.gallery.files || []);
    if (!files.length) return;
    const button = event.currentTarget.querySelector("button");
    button.disabled = true;
    try {
      const rows = [];
      for (let index = 0; index < files.length; index += 1) {
        rows.push({ guide_id: guide.id, image_url: await uploadImage(files[index], "galeria"), position: Date.now() + index });
      }
      const { error } = await client.from("guide_gallery").insert(rows);
      if (error) throw error;
      event.currentTarget.reset();
      showNotice("Galeria atualizada.");
      renderGallery();
    } catch (error) {
      showNotice(error.message, "error");
    } finally {
      button.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.textContent = "Salvando…";
    try {
      const data = new FormData(form);
      const payload = {
        nome: String(data.get("nome") || "").trim(),
        nome_profissional: String(data.get("nome_profissional") || "").trim() || null,
        email: String(data.get("email") || "").trim(),
        whatsapp: normalizeWhatsapp(data.get("whatsapp")),
        instagram: String(data.get("instagram") || "").trim() || null,
        facebook: String(data.get("facebook") || "").trim() || null,
        site: String(data.get("site") || "").trim() || null,
        bio: String(data.get("bio") || "").trim(),
        cadastur_numero: String(data.get("cadastur_numero") || "").trim(),
        idiomas: selectedValues(form, "idiomas"),
        regioes: selectedValues(form, "regioes"),
        especialidades: selectedValues(form, "especialidades"),
      };

      if (form.foto_perfil.files[0]) payload.foto_perfil = await uploadImage(form.foto_perfil.files[0], "perfil");
      if (form.foto_capa.files[0]) payload.foto_capa = await uploadImage(form.foto_capa.files[0], "capa");

      const cadasturChanged = payload.cadastur_numero !== guide.cadastur_numero;
      const { data: updated, error } = await client.from("guides").update(payload).eq("id", guide.id).select("*").single();
      if (error) throw error;
      guide = updated;
      renderStatus();
      showNotice(cadasturChanged
        ? "Perfil salvo. Como o Cadastur mudou, o cadastro voltou para verificação."
        : "Perfil atualizado com sucesso.");
    } catch (error) {
      console.error(error);
      showNotice(error.message || "Não foi possível salvar.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Salvar alterações";
    }
  });

  document.querySelector("#panel-sign-out")?.addEventListener("click", async () => {
    await client.auth.signOut();
    location.assign("/guias/login/");
  });

  async function init() {
    const response = await client.auth.getSession();
    session = response.data.session;
    if (!session) return location.replace("/guias/login/?next=/guias/painel/");

    const { data, error } = await client.from("guides").select("*").eq("user_id", session.user.id).maybeSingle();
    if (error) return showNotice(error.message, "error");
    if (!data) return location.replace("/guias/cadastro/");
    guide = data;

    renderCheckboxes(document.querySelector("#panel-language-options"), "idiomas", languages, guide.idiomas || []);
    renderCheckboxes(document.querySelector("#panel-region-options"), "regioes", regions, guide.regioes || []);
    renderCheckboxes(document.querySelector("#panel-specialty-options"), "especialidades", specialties, guide.especialidades || []);
    ["nome", "nome_profissional", "email", "whatsapp", "instagram", "facebook", "site", "bio", "cadastur_numero"].forEach((name) => fill(name, guide[name]));
    if (guide.foto_perfil) {
      document.querySelector("#current-profile-image").src = guide.foto_perfil;
      document.querySelector("#current-profile-image").classList.remove("hidden");
    }
    if (guide.foto_capa) {
      document.querySelector("#current-cover-image").src = guide.foto_capa;
      document.querySelector("#current-cover-image").classList.remove("hidden");
    }
    renderStatus();
    await renderGallery();
    shell.classList.remove("hidden");
    if (new URLSearchParams(location.search).get("submitted") === "1") showNotice("Cadastro enviado. Agora ele aguarda verificação administrativa.");
  }

  init();
})();


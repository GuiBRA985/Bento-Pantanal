(async function () {
  "use strict";
  const P = window.PantanalGuides;
  const session = await P.requireSession();
  if (!session) return;
  const loading = document.querySelector("#admin-loading");
  const denied = document.querySelector("#admin-denied");
  const area = document.querySelector("#admin-area");
  const list = document.querySelector("#admin-list");
  const dialog = document.querySelector("#guide-dialog");
  const search = document.querySelector("#admin-search");
  const statusFilter = document.querySelector("#admin-status-filter");
  let guides = [];
  let currentGuide = null;

  function dateLabel(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }

  function avatarMarkup(guide) {
    const name = P.displayName(guide);
    const photo = P.safeUrl(guide.foto_perfil);
    return `<div class="avatar">${photo ? `<img src="${P.escapeHTML(photo)}" alt="">` : P.escapeHTML(P.initials(name))}</div>`;
  }

  function renderStats() {
    const labels = [
      ["pending", "Pendentes"], ["approved", "Aprovados"], ["rejected", "Não aprovados"], ["suspended", "Suspensos"]
    ];
    document.querySelector("#admin-stats").innerHTML = labels.map(([status, label]) => `<div class="stat-card"><strong>${guides.filter((guide) => guide.status === status).length}</strong><span>${label}</span></div>`).join("");
  }

  function renderList() {
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    const filtered = guides.filter((guide) => {
      const haystack = [guide.nome, guide.nome_profissional, guide.cadastur_numero, guide.whatsapp, guide.instagram].join(" ").toLocaleLowerCase("pt-BR");
      return (!query || haystack.includes(query)) && (!statusFilter.value || guide.status === statusFilter.value);
    });
    list.innerHTML = filtered.length ? filtered.map((guide) => `
      <article class="admin-guide">
        ${avatarMarkup(guide)}
        <div><h3>${P.escapeHTML(P.displayName(guide))}</h3><p>${P.escapeHTML(guide.nome || "")}</p><p>Cadastrado em ${P.escapeHTML(dateLabel(guide.created_at))}</p></div>
        <div class="admin-guide-meta">${P.statusPill(guide.status)} ${guide.vip ? '<span class="verified-badge vip-badge">★ VIP</span>' : ""}<p style="margin-top:7px">Cadastur: ${P.escapeHTML(guide.cadastur_numero || "Não informado")}</p></div>
        <div class="admin-actions"><button class="button button-small button-outline" type="button" data-open-guide="${P.escapeHTML(guide.id)}">Ver cadastro</button>${guide.status === "pending" ? `<button class="button button-small" type="button" data-quick-approve="${P.escapeHTML(guide.id)}">Aprovar</button>` : ""}</div>
      </article>`).join("") : '<div class="empty-state"><strong>Nenhum cadastro encontrado.</strong>Altere a busca ou o filtro de status.</div>';
  }

  function findGuide(id) { return guides.find((guide) => String(guide.id) === String(id)); }

  function openGuide(guide) {
    currentGuide = guide;
    document.querySelector("#dialog-id").value = guide.id;
    document.querySelector("#dialog-name").textContent = P.displayName(guide);
    document.querySelector("#dialog-full-name").value = guide.nome || "";
    document.querySelector("#dialog-professional-name").value = guide.nome_profissional || "";
    document.querySelector("#dialog-cadastur").value = guide.cadastur_numero || "";
    document.querySelector("#dialog-whatsapp").value = guide.whatsapp || "";
    document.querySelector("#dialog-instagram").value = guide.instagram || "";
    document.querySelector("#dialog-email").value = guide.email || "";
    document.querySelector("#dialog-personal-domain").value = guide.personal_domain || "";
    document.querySelector("#dialog-login-email").value = "";
    document.querySelector("#dialog-vip").checked = Boolean(guide.vip);
    document.querySelector("#dialog-expedition-leader").checked = Boolean(guide.expedition_leader);
    document.querySelector("#dialog-profile-image").value = "";
    document.querySelector("#dialog-cover-image").value = "";
    document.querySelector("#dialog-bio").value = guide.bio || "";
    document.querySelector("#dialog-tags").textContent = [
      `Idiomas: ${P.asArray(guide.idiomas).join(", ") || "—"}`,
      `Regiões: ${P.asArray(guide.regioes).join(", ") || "—"}`,
      `Especialidades: ${P.asArray(guide.especialidades).join(", ") || "—"}`
    ].join(" | ");
    document.querySelector("#dialog-status").innerHTML = `${P.statusPill(guide.status)} ${guide.cadastur_verificado ? '<span class="verified-badge">✓ Cadastur verificado</span>' : ""}`;
    document.querySelector("#dialog-created").textContent = `Cadastro: ${dateLabel(guide.created_at)} · Atualização: ${dateLabel(guide.updated_at)}`;
    P.setMessage("#dialog-message", "");
    if (!dialog.open) dialog.showModal();
  }

  async function loadGuides() {
    P.setMessage("#admin-message", "Carregando cadastros...");
    const { data, error } = await P.db.from("guides").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    guides = data || [];
    renderStats();
    renderList();
    P.setMessage("#admin-message", "");
  }

  async function changeStatus(guide, action) {
    const changes = {
      approve: { status: "approved", cadastur_verificado: true, cadastur_status: "verificado" },
      reject: { status: "rejected", cadastur_verificado: false, cadastur_status: "rejeitado" },
      suspend: { status: "suspended" },
      reactivate: { status: "approved", cadastur_verificado: true, cadastur_status: "verificado" }
    }[action];
    if (!guide || !changes) return;
    if (action === "approve" && !confirm(`Confirma que conferiu o Cadastur de ${P.displayName(guide)}?`)) return;
    const { error } = await P.db.from("guides").update(changes).eq("id", guide.id);
    if (error) throw error;
    await loadGuides();
    currentGuide = findGuide(guide.id);
    if (dialog.open && currentGuide) openGuide(currentGuide);
    P.setMessage("#admin-message", "Status atualizado com sucesso.", "success");
  }

  try {
    const { data: isAdmin, error } = await P.db.rpc("is_admin");
    if (error) throw error;
    if (!isAdmin) {
      loading.classList.add("hidden");
      denied.classList.remove("hidden");
      return;
    }
    await loadGuides();
    loading.classList.add("hidden");
    area.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    loading.textContent = "Não foi possível conferir o acesso. Verifique a configuração do banco de dados.";
    return;
  }

  list.addEventListener("click", async (event) => {
    const openButton = event.target.closest("[data-open-guide]");
    if (openButton) openGuide(findGuide(openButton.dataset.openGuide));
    const approveButton = event.target.closest("[data-quick-approve]");
    if (approveButton) {
      try { await changeStatus(findGuide(approveButton.dataset.quickApprove), "approve"); }
      catch (error) { P.setMessage("#admin-message", error.message, "error"); }
    }
  });

  document.querySelector("#admin-edit-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentGuide) return;
    const saveButton = event.submitter;
    saveButton.disabled = true;
    P.setMessage("#dialog-message", "Salvando perfil e imagens...");
    try {
      const payload = {
      nome: document.querySelector("#dialog-full-name").value.trim(),
      nome_profissional: document.querySelector("#dialog-professional-name").value.trim() || null,
      cadastur_numero: document.querySelector("#dialog-cadastur").value.trim(),
      whatsapp: P.normalizePhone(document.querySelector("#dialog-whatsapp").value),
      instagram: document.querySelector("#dialog-instagram").value.trim() || null,
      email: document.querySelector("#dialog-email").value.trim() || null,
      bio: document.querySelector("#dialog-bio").value.trim(),
      personal_domain: document.querySelector("#dialog-personal-domain").value.trim() || null,
      vip: document.querySelector("#dialog-vip").checked,
      expedition_leader: document.querySelector("#dialog-expedition-leader").checked
      };
      const profileFile = document.querySelector("#dialog-profile-image").files[0];
      const coverFile = document.querySelector("#dialog-cover-image").files[0];
      if (profileFile) payload.foto_perfil = (await P.uploadImage(profileFile, session.user.id, `admin-${currentGuide.slug}-perfil`)).url;
      if (coverFile) payload.foto_capa = (await P.uploadImage(coverFile, session.user.id, `admin-${currentGuide.slug}-capa`)).url;
      const { error } = await P.db.from("guides").update(payload).eq("id", currentGuide.id);
      if (error) throw error;
      const loginEmail = document.querySelector("#dialog-login-email").value.trim();
      if (loginEmail) {
        const { error: linkError } = await P.db.rpc("assign_guide_login", { target_guide_id: currentGuide.id, login_email: loginEmail });
        if (linkError) throw new Error(`Dados salvos, mas a conta não foi vinculada: ${linkError.message}`);
      }
      await loadGuides();
      currentGuide = findGuide(currentGuide.id);
      P.setMessage("#dialog-message", "Perfil, fotos e acessos salvos.", "success");
    } catch (error) {
      P.setMessage("#dialog-message", error.message || "Não foi possível salvar o perfil.", "error");
    } finally {
      saveButton.disabled = false;
    }
  });

  dialog.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-admin-action]");
    if (!actionButton || !currentGuide) return;
    actionButton.disabled = true;
    try { await changeStatus(currentGuide, actionButton.dataset.adminAction); }
    catch (error) { P.setMessage("#dialog-message", error.message || "Não foi possível atualizar.", "error"); }
    finally { actionButton.disabled = false; }
  });

  document.querySelector("#dialog-close").addEventListener("click", () => dialog.close());
  document.querySelector("#admin-refresh").addEventListener("click", loadGuides);
  search.addEventListener("input", P.debounce(renderList));
  statusFilter.addEventListener("change", renderList);
  document.querySelector("#admin-signout").addEventListener("click", async () => { await P.db.auth.signOut(); location.replace("/guias/login/?next=/admin/guias/"); });
})();

(() => {
  const { client, escapeHtml, normalizeWhatsapp } = window.PantanalBento;
  const list = document.querySelector("#admin-guide-list");
  const notice = document.querySelector("#admin-notice");
  const filters = document.querySelector("#admin-filters");
  let session;
  let guides = [];

  const labels = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado", suspended: "Suspenso" };
  const showNotice = (message, type = "success") => {
    notice.className = `notice notice-${type}`;
    notice.textContent = message;
  };

  const reviewButton = (guide, status, label, verified = false, className = "") => `
    <button class="button button-small ${className}" type="button" data-review-id="${guide.id}" data-status="${status}" data-verified="${verified}">${label}</button>`;

  const actions = (guide) => {
    const buttons = [];
    if (guide.status === "pending") {
      buttons.push(reviewButton(guide, "approved", "Aprovar e verificar", true, "button-gold"));
      buttons.push(reviewButton(guide, "rejected", "Rejeitar", false, "button-danger"));
    }
    if (guide.status === "approved") buttons.push(reviewButton(guide, "suspended", "Suspender", false, "button-danger"));
    if (guide.status === "rejected") buttons.push(reviewButton(guide, "pending", "Reabrir análise", false));
    if (guide.status === "suspended") buttons.push(reviewButton(guide, "approved", "Reativar", true, "button-gold"));
    buttons.push(`<button class="button button-small button-danger" type="button" data-delete-id="${guide.id}">Excluir</button>`);
    return buttons.join("");
  };

  const card = (guide) => `
    <article class="surface admin-card">
      <div class="status-row">
        <div><span class="status-pill status-${guide.status}">${escapeHtml(labels[guide.status] || guide.status)}</span><h2 style="margin:10px 0 0">${escapeHtml(guide.nome_profissional || guide.nome)}</h2></div>
        <span class="results-count">${new Date(guide.criado_em).toLocaleDateString("pt-BR")}</span>
      </div>
      <dl class="admin-meta">
        <dt>Nome completo</dt><dd>${escapeHtml(guide.nome)}</dd>
        <dt>Cadastur</dt><dd>${escapeHtml(guide.cadastur_numero || "Não informado")}</dd>
        <dt>WhatsApp</dt><dd>${escapeHtml(guide.whatsapp || "Não informado")}</dd>
        <dt>Instagram</dt><dd>${escapeHtml(guide.instagram || "Não informado")}</dd>
        <dt>Regiões</dt><dd>${escapeHtml((guide.regioes || []).join(", ") || "Não informadas")}</dd>
      </dl>
      <div class="admin-actions">${actions(guide)}</div>
      <details class="admin-edit">
        <summary>Ver e editar cadastro</summary>
        <form class="form-grid" data-edit-guide="${guide.id}" style="margin-top:16px">
          <div class="form-grid two-columns">
            <div class="field"><label>Nome</label><input name="nome" value="${escapeHtml(guide.nome)}" required></div>
            <div class="field"><label>Nome profissional</label><input name="nome_profissional" value="${escapeHtml(guide.nome_profissional || "")}"></div>
            <div class="field"><label>WhatsApp</label><input name="whatsapp" value="${escapeHtml(guide.whatsapp || "")}"></div>
            <div class="field"><label>Cadastur</label><input name="cadastur_numero" value="${escapeHtml(guide.cadastur_numero || "")}" required></div>
          </div>
          <div class="field"><label>Biografia</label><textarea name="bio">${escapeHtml(guide.bio || "")}</textarea></div>
          <button class="button button-small" type="submit">Salvar correções</button>
        </form>
      </details>
    </article>`;

  const render = () => {
    const data = new FormData(filters);
    const query = String(data.get("search") || "").toLocaleLowerCase("pt-BR");
    const status = String(data.get("status") || "");
    const filtered = guides.filter((guide) => (
      (!status || guide.status === status)
      && (!query || [guide.nome, guide.nome_profissional, guide.cadastur_numero].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(query))
    ));
    document.querySelector("#admin-results-count").textContent = `${filtered.length} cadastro${filtered.length === 1 ? "" : "s"}`;
    list.innerHTML = filtered.length ? filtered.map(card).join("") : '<div class="empty-state">Nenhum cadastro nesta seleção.</div>';
  };

  const loadGuides = async () => {
    const { data, error } = await client.from("guides").select("*").order("criado_em", { ascending: false });
    if (error) return showNotice(error.message, "error");
    guides = (data || []).sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1));
    render();
  };

  filters.addEventListener("input", render);
  filters.addEventListener("change", render);

  list.addEventListener("click", async (event) => {
    const review = event.target.closest("[data-review-id]");
    if (review) {
      review.disabled = true;
      const verified = review.dataset.verified === "true";
      const { error } = await client.from("guides").update({
        status: review.dataset.status,
        cadastur_verificado: verified,
        cadastur_status: verified ? "verificado" : "aguardando_validacao",
      }).eq("id", review.dataset.reviewId);
      if (error) showNotice(error.message, "error");
      else showNotice("Situação do guia atualizada.");
      await loadGuides();
      return;
    }

    const remove = event.target.closest("[data-delete-id]");
    if (remove && confirm("Excluir definitivamente este cadastro? Esta ação não pode ser desfeita.")) {
      remove.disabled = true;
      const { error } = await client.from("guides").delete().eq("id", remove.dataset.deleteId);
      if (error) showNotice(error.message, "error");
      else showNotice("Cadastro excluído.");
      await loadGuides();
    }
  });

  list.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-edit-guide]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      nome: String(data.get("nome") || "").trim(),
      nome_profissional: String(data.get("nome_profissional") || "").trim() || null,
      whatsapp: normalizeWhatsapp(data.get("whatsapp")),
      cadastur_numero: String(data.get("cadastur_numero") || "").trim(),
      bio: String(data.get("bio") || "").trim(),
    };
    const button = form.querySelector("button");
    button.disabled = true;
    const { error } = await client.from("guides").update(payload).eq("id", form.dataset.editGuide);
    if (error) showNotice(error.message, "error");
    else showNotice("Cadastro corrigido. Alterações no Cadastur exigem nova aprovação.");
    await loadGuides();
  });

  document.querySelector("#admin-sign-out")?.addEventListener("click", async () => {
    await client.auth.signOut();
    location.assign("/guias/login/?next=/admin/guias/");
  });

  async function init() {
    const response = await client.auth.getSession();
    session = response.data.session;
    if (!session) return location.replace("/guias/login/?next=/admin/guias/");
    const { data: admin, error } = await client.from("admin_users").select("user_id").eq("user_id", session.user.id).maybeSingle();
    if (error || !admin) {
      document.querySelector("#admin-shell").classList.remove("hidden");
      list.innerHTML = '<div class="empty-state"><strong>Acesso restrito.</strong><br>Esta conta não é administradora da Rede de Guias.</div>';
      filters.classList.add("hidden");
      return;
    }
    document.querySelector("#admin-shell").classList.remove("hidden");
    loadGuides();
  }

  init();
})();


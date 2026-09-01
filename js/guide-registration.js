(async function () {
  "use strict";
  const P = window.PantanalGuides;
  P.renderOptions();
  const authPanel = document.querySelector("#registration-auth");
  const area = document.querySelector("#registration-area");
  const authForm = document.querySelector("#registration-auth-form");
  const form = document.querySelector("#guide-registration-form");
  const submit = document.querySelector("#registration-submit");
  let session = null;

  async function revealForSession(activeSession) {
    session = activeSession;
    if (!session) {
      authPanel.classList.remove("hidden");
      area.classList.add("hidden");
      return;
    }
    const { data: existing, error } = await P.db.from("guides").select("id").eq("user_id", session.user.id).maybeSingle();
    if (!error && existing) {
      location.replace("/guias/painel/");
      return;
    }
    authPanel.classList.add("hidden");
    area.classList.remove("hidden");
    document.querySelector("#professional-email").value = session.user.email || "";
  }

  const { data } = await P.db.auth.getSession();
  await revealForSession(data.session);
  P.db.auth.onAuthStateChange((_event, activeSession) => { revealForSession(activeSession); });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = authForm.querySelector("button[type=submit]");
    button.disabled = true;
    P.setMessage("#registration-auth-message", "Criando sua conta...");
    const email = document.querySelector("#account-email").value.trim();
    const password = document.querySelector("#account-password").value;
    try {
      const { data: signup, error } = await P.db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/guias/cadastro/` }
      });
      if (error) throw error;
      if (signup.session) await revealForSession(signup.session);
      else P.setMessage("#registration-auth-message", "Conta criada. Confirme o e-mail recebido e volte a esta página para concluir o perfil.", "success");
    } catch (error) {
      P.setMessage("#registration-auth-message", error.message || "Não foi possível criar a conta.", "error");
    } finally {
      button.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!session) return;
    const languages = P.checkedValues(form, "languages");
    const regions = P.checkedValues(form, "regions");
    if (!languages.length || !regions.length) {
      P.setMessage("#registration-message", "Escolha pelo menos um idioma e uma região de atuação.", "error");
      return;
    }
    submit.disabled = true;
    P.setMessage("#registration-message", "Enviando fotos e preparando seu perfil...");
    try {
      const [profileUpload, coverUpload] = await Promise.all([
        P.uploadImage(document.querySelector("#profile-image").files[0], session.user.id, "perfil"),
        P.uploadImage(document.querySelector("#cover-image").files[0], session.user.id, "capa")
      ]);
      const fullName = form.nome.value.trim();
      const payload = {
        user_id: session.user.id,
        slug: P.slugify(fullName),
        nome: fullName,
        nome_profissional: form.nome_profissional.value.trim() || null,
        bio: form.bio.value.trim(),
        foto_perfil: profileUpload.url,
        foto_capa: coverUpload.url,
        cadastur_numero: form.cadastur_numero.value.trim(),
        cadastur_verificado: false,
        cadastur_status: "aguardando validação",
        whatsapp: P.normalizePhone(form.whatsapp.value),
        email: form.email.value.trim() || session.user.email,
        instagram: form.instagram.value.trim() || null,
        facebook: form.facebook.value.trim() || null,
        site: form.site.value.trim() || null,
        idiomas: languages,
        regioes: regions,
        especialidades: P.checkedValues(form, "specialties"),
        status: "pending"
      };

      let result = await P.db.from("guides").insert(payload).select("id").single();
      if (result.error?.code === "23505") {
        payload.slug = `${payload.slug}-${session.user.id.slice(0, 6)}`;
        result = await P.db.from("guides").insert(payload).select("id").single();
      }
      if (result.error) throw result.error;
      P.setMessage("#registration-message", "Cadastro enviado. Seu perfil está aguardando a conferência do administrador.", "success");
      setTimeout(() => location.replace("/guias/painel/"), 1100);
    } catch (error) {
      console.error(error);
      P.setMessage("#registration-message", error.message || "Não foi possível enviar o cadastro.", "error");
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector("#registration-signout").addEventListener("click", async () => {
    await P.db.auth.signOut();
    location.replace("/guias/login/");
  });
})();

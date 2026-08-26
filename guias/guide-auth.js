(() => {
  const { client, escapeHtml } = window.PantanalBento;
  const loginForm = document.querySelector("#login-form");
  const signupForm = document.querySelector("#signup-form");
  const recoveryForm = document.querySelector("#recovery-form");
  const passwordForm = document.querySelector("#new-password-form");
  const notice = document.querySelector("#auth-notice");
  const sessionBox = document.querySelector("#active-session");
  const tabs = document.querySelectorAll("[data-auth-tab]");

  const showNotice = (message, type = "success") => {
    notice.className = `notice notice-${type}`;
    notice.textContent = message;
  };

  const setBusy = (form, busy) => {
    const button = form?.querySelector("button[type='submit']");
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? "Aguarde…" : button.dataset.label;
  };

  const nextUrl = () => {
    const candidate = new URLSearchParams(location.search).get("next");
    return candidate?.startsWith("/") ? candidate : "/guias/painel/";
  };

  const activateTab = (name) => {
    tabs.forEach((button) => button.setAttribute("aria-selected", String(button.dataset.authTab === name)));
    document.querySelectorAll("[data-auth-panel]").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.authPanel !== name);
    });
    notice.classList.add("hidden");
  };

  tabs.forEach((button) => button.addEventListener("click", () => activateTab(button.dataset.authTab)));

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setBusy(loginForm, true);
    const form = new FormData(loginForm);
    const { error } = await client.auth.signInWithPassword({
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
    });
    setBusy(loginForm, false);

    if (error) return showNotice("Não foi possível entrar. Confira o e-mail e a senha.", "error");
    location.assign(nextUrl());
  });

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setBusy(signupForm, true);
    const form = new FormData(signupForm);
    const password = String(form.get("password") || "");
    if (password.length < 8) {
      setBusy(signupForm, false);
      return showNotice("Use uma senha com pelo menos 8 caracteres.", "error");
    }

    const { data, error } = await client.auth.signUp({
      email: String(form.get("email") || "").trim(),
      password,
      options: { emailRedirectTo: `${location.origin}/guias/cadastro/` },
    });
    setBusy(signupForm, false);

    if (error) return showNotice(error.message, "error");
    if (data.session) return location.assign("/guias/cadastro/");
    showNotice("Conta criada. Confirme o e-mail recebido e volte para concluir seu cadastro.");
  });

  recoveryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setBusy(recoveryForm, true);
    const form = new FormData(recoveryForm);
    const { error } = await client.auth.resetPasswordForEmail(String(form.get("email") || "").trim(), {
      redirectTo: `${location.origin}/guias/login/?recovery=1`,
    });
    setBusy(recoveryForm, false);
    showNotice(error ? error.message : "Enviamos o link de recuperação para seu e-mail.", error ? "error" : "success");
  });

  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setBusy(passwordForm, true);
    const password = String(new FormData(passwordForm).get("password") || "");
    const { error } = await client.auth.updateUser({ password });
    setBusy(passwordForm, false);
    showNotice(error ? error.message : "Senha atualizada. Você já pode acessar sua área.", error ? "error" : "success");
  });

  document.querySelector("#google-login")?.addEventListener("click", async () => {
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}${nextUrl()}` },
    });
    if (error) showNotice("O acesso com Google ainda não está disponível.", "error");
  });

  client.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") activateTab("new-password");
  });

  async function init() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      if (new URLSearchParams(location.search).get("recovery") === "1") activateTab("new-password");
      return;
    }

    sessionBox?.classList.remove("hidden");
    if (sessionBox) {
      sessionBox.innerHTML = `<strong>Sessão ativa</strong><p>${escapeHtml(session.user.email || "Conta autenticada")}</p>
        <div class="form-actions"><a class="button button-small" href="${nextUrl()}">Continuar</a>
        <button class="button button-small button-outline" id="sign-out" type="button">Sair</button></div>`;
      sessionBox.querySelector("#sign-out").addEventListener("click", async () => {
        await client.auth.signOut();
        location.reload();
      });
    }
  }

  init();
})();


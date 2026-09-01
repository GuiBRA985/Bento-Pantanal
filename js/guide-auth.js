(async function () {
  "use strict";
  const P = window.PantanalGuides;
  const form = document.querySelector("#auth-form");
  const submit = document.querySelector("#auth-submit");
  const password = document.querySelector("#password");
  const emailField = document.querySelector("#email");
  const recoveryHint = /type=recovery/.test(location.hash);
  let mode = recoveryHint ? "recovery" : "login";

  function showRecoveryMode() {
    mode = "recovery";
    document.querySelector(".auth-tabs").classList.add("hidden");
    emailField.closest(".field").classList.add("hidden");
    emailField.required = false;
    password.autocomplete = "new-password";
    submit.textContent = "Definir nova senha";
    document.querySelector("#forgot-password").classList.add("hidden");
    document.querySelector(".separator").classList.add("hidden");
    document.querySelector("#google-login").classList.add("hidden");
    P.setMessage("#auth-message", "Digite sua nova senha.");
  }

  if (recoveryHint) showRecoveryMode();

  const { data } = await P.db.auth.getSession();
  if (data.session && mode !== "recovery") {
    location.replace(P.localNext());
    return;
  }

  document.querySelectorAll("[data-auth-mode]").forEach((tab) => {
    tab.addEventListener("click", () => {
      mode = tab.dataset.authMode;
      document.querySelectorAll("[data-auth-mode]").forEach((item) => item.classList.toggle("is-active", item === tab));
      submit.textContent = mode === "login" ? "Entrar" : "Criar conta";
      password.autocomplete = mode === "login" ? "current-password" : "new-password";
      document.querySelector("#forgot-password").classList.toggle("hidden", mode !== "login");
      P.setMessage("#auth-message", "");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    P.setMessage("#auth-message", mode === "login" ? "Entrando..." : "Criando sua conta...");
    const email = document.querySelector("#email").value.trim();
    const userPassword = password.value;
    try {
      if (mode === "login") {
        const { error } = await P.db.auth.signInWithPassword({ email, password: userPassword });
        if (error) throw error;
        location.replace(P.localNext());
      } else if (mode === "signup") {
        const redirectTo = `${location.origin}/guias/login/?next=${encodeURIComponent("/guias/cadastro/")}`;
        const { data: signup, error } = await P.db.auth.signUp({ email, password: userPassword, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        if (signup.session) location.replace("/guias/cadastro/");
        else P.setMessage("#auth-message", "Conta criada. Confirme o e-mail recebido e depois entre para concluir seu perfil.", "success");
      } else {
        const { error } = await P.db.auth.updateUser({ password: userPassword });
        if (error) throw error;
        P.setMessage("#auth-message", "Senha atualizada. Abrindo seu painel...", "success");
        setTimeout(() => location.replace("/guias/painel/"), 800);
      }
    } catch (error) {
      console.error(error);
      P.setMessage("#auth-message", error.message || "Não foi possível concluir o acesso.", "error");
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelector("#forgot-password").addEventListener("click", async () => {
    const email = document.querySelector("#email").value.trim();
    if (!email) return P.setMessage("#auth-message", "Informe seu e-mail primeiro.", "error");
    const { error } = await P.db.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/guias/login/` });
    P.setMessage("#auth-message", error ? error.message : "Enviamos as instruções de recuperação para o seu e-mail.", error ? "error" : "success");
  });

  document.querySelector("#google-login").addEventListener("click", async () => {
    const next = P.localNext();
    const redirectTo = `${location.origin}/guias/login/?next=${encodeURIComponent(next)}`;
    const { error } = await P.db.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) P.setMessage("#auth-message", error.message, "error");
  });

  P.db.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") showRecoveryMode();
  });
})();

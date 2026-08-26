(() => {
  const options = {
    languages: ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano"],
    regions: ["Poconé", "Transpantaneira", "Porto Jofre", "Pantanal Norte", "Cuiabá", "Chapada dos Guimarães"],
    specialties: [
      "Observação de aves", "Onça-pintada", "Safári fotográfico", "Fotografia",
      "Fauna", "Flora", "Pesca", "História e cultura", "Trekking", "Expedições",
      "Transpantaneira", "Porto Jofre", "Pantanal Norte",
    ],
  };

  const renderCheckboxes = (container, name, items, selected = []) => {
    if (!container) return;
    container.innerHTML = items.map((item) => `
      <label class="checkbox-option">
        <input type="checkbox" name="${name}" value="${item}" ${selected.includes(item) ? "checked" : ""}>
        <span>${item}</span>
      </label>`).join("");
  };

  const selectedValues = (form, name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`))
    .map((input) => input.value);

  const slugify = (value = "") => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  window.GuideOptions = { ...options, renderCheckboxes, selectedValues, slugify };
})();


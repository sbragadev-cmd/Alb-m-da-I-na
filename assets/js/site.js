(() => {
  "use strict";
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const state = { photos: [], current: [], currentIndex: 0, config: null };

  async function readConfig() {
    const response = await fetch("./data/album.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Configuração indisponível");
    return response.json();
  }

  function setupIntro() {
    const intro = $("#intro");
    if (!intro) return;
    const variants = ["bloom", "rise", "soft", "flip", "type"];
    const previous = sessionStorage.getItem("iuna-last-intro");
    const choices = variants.filter(x => x !== previous);
    const variant = choices[Math.floor(Math.random() * choices.length)];
    sessionStorage.setItem("iuna-last-intro", variant);
    intro.classList.add(`intro--${variant}`);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      intro.classList.add("is-leaving");
      window.setTimeout(() => intro.remove(), 900);
    };
    $("#skipIntro")?.addEventListener("click", finish);
    intro.addEventListener("click", event => {
      if (event.target === intro) finish();
    });
    window.setTimeout(finish, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 300 : 2600);
  }

  function setupNav() {
    const toggle = $("#navToggle");
    const nav = $("#nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      const opening = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", opening);
      toggle.setAttribute("aria-expanded", String(opening));
    });
    $$("a", nav).forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  function textElement(tag, cls, content) {
    const node = document.createElement(tag);
    node.className = cls;
    node.textContent = content;
    return node;
  }

  function publicPhoto(photo) {
    // Somente links HTTPS e caminhos relativos dentro do projeto.
    const source = String(photo.src || photo.url || "").trim();
    if (!(source.startsWith("./") || source.startsWith("assets/") || source.startsWith("https://"))) return false;
    return photo.published === true && !photo.hidden;
  }

  function createPhotoCard(photo, collection) {
    const article = document.createElement("article");
    article.className = "photo-card";
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Ampliar foto: ${photo.title || "Lembrança da Iúna"}`);
    const img = document.createElement("img");
    img.src = photo.src || photo.url;
    img.alt = photo.alt || photo.title || "Lembrança da Iúna";
    img.loading = "lazy";
    img.decoding = "async";
    button.append(img, textElement("span", "photo-card__label", photo.title || "Lembrança especial"));
    button.addEventListener("click", () => {
      state.current = collection;
      state.currentIndex = collection.indexOf(photo);
      displayLightbox();
      $("#lightbox")?.showModal();
    });
    article.append(button);
    return article;
  }

  function createPlaceholder(index) {
    const placeholder = document.createElement("div");
    placeholder.className = "photo-placeholder";
    placeholder.append(
      textElement("span", "photo-placeholder__symbol", index ? "♡" : "✿"),
      textElement("strong", "", index ? "Momentos especiais" : "Memórias da Iúna"),
      textElement("p", "", "Este espaço receberá nossas fotografias.")
    );
    return placeholder;
  }

  function renderAlbums() {
    $$("[data-album]").forEach(container => {
      const album = container.dataset.album;
      const photos = state.photos.filter(p => p.album === album);
      const fragment = document.createDocumentFragment();
      const isFullPage = document.body.dataset.page === "album";
      const display = isFullPage ? photos : photos.slice(0, 2);
      display.forEach(p => fragment.append(createPhotoCard(p, photos)));
      if (!isFullPage) {
        for (let i = display.length; i < 2; i++) fragment.append(createPlaceholder(i));
      } else {
        const count = document.getElementById("photoCount");
        if (count) count.textContent = photos.length === 1 ? "1 fotografia publicada" : `${photos.length} fotografias publicadas`;
        if (!photos.length) fragment.append(textElement("p", "album-empty", "Ainda não há fotos publicadas neste álbum."));
      }
      container.replaceChildren(fragment);
    });
  }

  function displayLightbox() {
    const photo = state.current[state.currentIndex];
    if (!photo) return;
    $("#lightboxImg").src = photo.src || photo.url;
    $("#lightboxImg").alt = photo.alt || photo.title || "Foto";
    $("#lightboxTitle").textContent = photo.title || "Lembrança da Iúna";
    $("#lightboxCaption").textContent = photo.caption || "";
    $$("[data-step]").forEach(button => button.hidden = state.current.length < 2);
  }

  function setupLightbox() {
    const dialog = $("#lightbox");
    if (!dialog) return;
    $("[data-close]", dialog).addEventListener("click", () => dialog.close());
    $$("[data-step]", dialog).forEach(button => button.addEventListener("click", () => {
      state.currentIndex = (state.currentIndex + Number(button.dataset.step) + state.current.length) % state.current.length;
      displayLightbox();
    }));
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    document.addEventListener("keydown", event => {
      if (!dialog.open || state.current.length < 2) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        state.currentIndex = (state.currentIndex + (event.key === "ArrowRight" ? 1 : -1) + state.current.length) % state.current.length;
        displayLightbox();
      }
    });
  }

  function createCountdown(dateString) {
    const status = $("#countStatus");
    if (!status) return;
    const date = dateString && /^\d{4}-\d{2}-\d{2}$/.test(dateString) ? new Date(dateString + "T12:00:00-03:00") : null;
    if (!date || Number.isNaN(date.getTime())) {
      status.textContent = "Em breve vamos compartilhar a previsão de chegada da Iúna. ♡";
      return;
    }
    const dateLabel = new Intl.DateTimeFormat("pt-BR", {day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo"}).format(date);
    let intervalId;
    const update = () => {
      const remaining = Math.max(0, date.getTime() - Date.now());
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      [["days",days],["hours",hours],["minutes",minutes],["seconds",seconds]].forEach(([id,value]) => {
        $("#" + id).textContent = String(value).padStart(2, "0");
      });
      status.textContent = remaining ? `Previsão de chegada: ${dateLabel} ♡` : "Chegou o dia tão esperado! Bem-vinda, Iúna! ♡";
      if (!remaining && intervalId) clearInterval(intervalId);
    };
    update();
    intervalId = window.setInterval(update, 1000);
  }

  function mountUploadForm(url) {
    const container = document.getElementById("uploadEmbed");
    if (!container) return;
    const endpoint = String(url || "").trim();
    if (!endpoint.startsWith("https://script.google.com/macros/s/") || !endpoint.endsWith("/exec")) {
      container.textContent = "O formulário de envio ainda não foi conectado.";
      return;
    }
    const frame = document.createElement("iframe");
    frame.src = endpoint;
    frame.title = "Enviar fotografias para o Álbum da Iúna";
    frame.loading = "lazy";
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.style.cssText = "display:block;width:100%;height:1050px;border:0;background:#faf6fc";
    container.replaceChildren(frame);
  }

  function loadApprovedPhotos(endpoint) {
    const url = String(endpoint || "").trim();
    if (!url.startsWith("https://script.google.com/macros/s/") || !url.endsWith("/exec")) return;
    const callbackName = "iunaReceiveGallery_" + Date.now();
    const tag = document.createElement("script");
    const timeout = window.setTimeout(() => {
      tag.remove();
      delete window[callbackName];
      console.warn("[IÚNA] Sem resposta do catálogo público Google. Verifique doGet(action=gallery).");
    }, 15000);
    window[callbackName] = data => {
      clearTimeout(timeout);
      const incoming = Array.isArray(data?.photos) ? data.photos.filter(publicPhoto) : [];
      const existing = new Set(state.photos.map(photo => photo.id || photo.src || photo.url));
      for (const photo of incoming) {
        const key = photo.id || photo.src || photo.url;
        if (!existing.has(key)) {
          state.photos.push(photo);
          existing.add(key);
        }
      }
      renderAlbums();
      tag.remove();
      delete window[callbackName];
    };
    tag.onerror = () => {
      clearTimeout(timeout);
      console.warn("[IÚNA] Não foi possível buscar fotografias aprovadas no Apps Script.");
      tag.remove();
      delete window[callbackName];
    };
    tag.src = url + "?action=gallery&callback=" + encodeURIComponent(callbackName);
    document.head.append(tag);
  }

  function setupBirthCountdown() {
    const labelDays = document.getElementById("introDays");
    if (!labelDays) return;
    const target = Date.parse("2026-11-24T00:00:00-03:00");
    const floating = document.getElementById("floatingCount");
    const pad = n => String(n).padStart(2, "0");
    function update() {
      const remaining = Math.max(0, target - Date.now());
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      labelDays.textContent = remaining ? String(days) : "♡";
      document.getElementById("introRest").textContent = remaining
        ? "dias · " + pad(hours) + "h " + pad(minutes) + "min " + pad(seconds) + "s"
        : "Bem-vinda, Iúna! ♡";
      document.getElementById("floatingDays").textContent = remaining
        ? days + (days === 1 ? " dia" : " dias")
        : "Bem-vinda! ♡";
      document.getElementById("floatingRest").textContent = remaining
        ? pad(hours) + "h " + pad(minutes) + "min"
        : "24/11/2026";
    }
    update();
    window.setInterval(update, 1000);
    const intro = document.getElementById("intro");
    const showFloating = () => {
      if (floating) floating.hidden = false;
    };
    if (!intro) {
      showFloating();
    } else {
      intro.addEventListener("transitionend", event => {
        if (event.propertyName === "opacity" && intro.classList.contains("is-leaving")) showFloating();
      });
      document.getElementById("skipIntro")?.addEventListener("click", () => {
        window.setTimeout(showFloating, 800);
      });
      window.setTimeout(showFloating, 3900);
    }
  }

  async function init() {
    setupIntro();
    setupBirthCountdown();
    setupNav();
    if (document.body.dataset.page === "album") {
      const names = {ultrassons:"Ultrassons",cha:"Chá de fraldas",familia:"Nossa família",amigos:"Amigos",eventos:"Eventos"};
      const key = new URLSearchParams(location.search).get("album");
      const album = Object.prototype.hasOwnProperty.call(names,key) ? key : "familia";
      const grid = document.getElementById("fullAlbum");
      if (grid) grid.dataset.album = album;
      const title = document.getElementById("albumTitle");
      if (title) title.textContent = names[album];
      document.title = names[album] + " · Álbum da Iúna";
      document.querySelectorAll("[data-album-link]").forEach(link => {
        link.setAttribute("aria-current", link.dataset.albumLink === album ? "page" : "false");
      });
    }
    setupLightbox();
    try {
      state.config = await readConfig();
      state.photos = Array.isArray(state.config.photos) ? state.config.photos.filter(publicPhoto) : [];
    } catch (error) {
      console.warn("[IÚNA] Não foi possível ler o catálogo de fotos:", error);
    }
    renderAlbums();
    mountUploadForm(state.config?.appsScriptUrl);
    loadApprovedPhotos(state.config?.appsScriptUrl);
    createCountdown(state.config?.expectedBirthDate);
  }
  init();
})();
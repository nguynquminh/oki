const PageTransition = (() => {
  "use strict";

  const CFG = {
    triggerAttr: "data-pt-link",
    overlayId: "pt-overlay",
    sessionKey: "pt_navigating",
    leaveDuration: 480,
    enterDuration: 700,
    redirectDelay: 40,
    hearts: [
      { emoji: "💖", x: "8%", size: 1.1, speed: 1.0 },
      { emoji: "💗", x: "19%", size: 0.9, speed: 1.3 },
      { emoji: "💕", x: "33%", size: 1.3, speed: 0.8 },
      { emoji: "❤️", x: "48%", size: 0.8, speed: 1.5 },
      { emoji: "🩷", x: "61%", size: 1.0, speed: 1.1 },
      { emoji: "💘", x: "74%", size: 1.2, speed: 0.9 },
      { emoji: "💝", x: "85%", size: 0.9, speed: 1.4 },
      { emoji: "💖", x: "93%", size: 1.1, speed: 1.0 },
    ],
  };

  const supports = {
    viewTransitionAPI: "startViewTransition" in document,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
  };

  function buildOverlay() {
    if (document.getElementById(CFG.overlayId)) return;

    const heartsHTML = CFG.hearts
      .map(
        (h, i) => `
      <span
        class="pt-heart"
        aria-hidden="true"
        style="
          left: ${h.x};
          font-size: ${h.size}rem;
          --i: ${i};
          --rnd: ${(Math.sin(i * 7.3) + 1) / 2};
        "
      >${h.emoji}</span>
    `,
      )
      .join("");

    const overlay = document.createElement("div");
    overlay.id = CFG.overlayId;
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-atomic", "true");
    overlay.setAttribute("aria-label", "Đang chuyển trang, vui lòng chờ...");

    overlay.innerHTML = `
      <div class="pt-overlay-bg"></div>
      <div class="pt-overlay-hearts" aria-hidden="true">
        ${heartsHTML}
      </div>
      <div class="pt-overlay-logo" aria-hidden="true">
        <span class="pt-logo-text">Lovelyn</span>
        <span class="pt-logo-heart">♥</span>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  const overlay = () => document.getElementById(CFG.overlayId);
  const setBodyPt = (val) => {
    if (val === null) {
      delete document.body.dataset.pt;
    } else {
      document.body.dataset.pt = val;
    }
  };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const raf2 = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

  async function playLeave() {
    if (supports.reducedMotion) {
      overlay()?.classList.add("is-in");
      await delay(150);
      return;
    }

    setBodyPt("leaving");

    await delay(60);
    overlay()?.classList.add("is-in");

    await delay(CFG.leaveDuration - 60);
  }

  async function playEnter() {
    const ov = overlay();
    if (!ov) return;

    if (supports.reducedMotion) {
      setBodyPt(null);
      ov.classList.remove("is-visible", "is-in");
      ov.classList.add("is-out");
      await delay(200);
      ov.classList.remove("is-out");
      return;
    }

    setBodyPt("will-enter");
    ov.classList.add("is-visible");

    await new Promise((resolve) => raf2(resolve));

    ov.classList.remove("is-visible", "is-in");
    ov.classList.add("is-out");

    setBodyPt("entering");

    await delay(CFG.enterDuration);
    setBodyPt(null);
    ov.classList.remove("is-out");
  }

  async function navigateTo(url) {
    try {
      sessionStorage.setItem(CFG.sessionKey, "1");
    } catch {}

    if (supports.viewTransitionAPI) {
      let vtDone = false;

      const vt = document.startViewTransition(async () => {
        await playLeave();
        await delay(CFG.redirectDelay);
        vtDone = true;
        window.location.href = url;
      });

      vt.finished.catch(() => {
        if (!vtDone) window.location.href = url;
      });
    } else {
      await playLeave();
      await delay(CFG.redirectDelay);
      window.location.href = url;
    }
  }

  function handleClick(e) {
    const el = e.currentTarget;
    const href = el.href || el.dataset.href || el.getAttribute("href");

    if (!href) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }

    const isExternal = url.hostname !== window.location.hostname;
    const isAnchor =
      url.href === window.location.href.split("#")[0] + (url.hash || "");

    if (isExternal || (url.hash && isAnchor)) return;

    e.preventDefault();
    navigateTo(url.href);
  }

  function bindLinks() {
    document
      .querySelectorAll(`[${CFG.triggerAttr}]`)
      .forEach((el) => el.addEventListener("click", handleClick));

    document.addEventListener("click", (e) => {
      const el = e.target.closest(`[${CFG.triggerAttr}]`);
      if (el && !el.__ptBound) handleClick.call(el, e);
    });
  }

  async function playFirstLoad() {
    setBodyPt("first-load");
    await new Promise((resolve) => raf2(resolve));
    setBodyPt("first-entered");
    await delay(600);
    setBodyPt(null);
  }

  function init() {
    buildOverlay();
    bindLinks();

    let fromTransition = false;
    try {
      fromTransition = sessionStorage.getItem(CFG.sessionKey) === "1";
      if (fromTransition) sessionStorage.removeItem(CFG.sessionKey);
    } catch {}

    if (fromTransition) {
      playEnter();
    } else {
      playFirstLoad();
    }
  }

  return {
    init,
    navigateTo,
    supports,
  };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", PageTransition.init);
} else {
  PageTransition.init();
}

(function () {
  "use strict";

  // ---------- Remember the chosen language (used by the root page redirect) ----------
  function saveLang(code) {
    try { localStorage.setItem("lang", code); } catch (e) { /* storage blocked — ignore */ }
  }
  document.querySelectorAll("[data-lang-link]").forEach(function (a) {
    a.addEventListener("click", function () { saveLang(a.dataset.langLink); });
  });

  // ---------- Header: background after scrolling, mobile menu ----------
  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector("[data-menu-toggle]");

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // ---------- Video players: load only on click ----------
  function playerUrl(provider, id) {
    if (provider === "youtube") {
      return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0&playsinline=1";
    }
    return "https://player.vimeo.com/video/" + encodeURIComponent(id) + "?autoplay=1&dnt=1&title=0&byline=0&portrait=0";
  }

  function makeIframe(provider, id, title) {
    var iframe = document.createElement("iframe");
    iframe.src = playerUrl(provider, id);
    iframe.title = title || "";
    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
    iframe.allowFullscreen = true;
    return iframe;
  }

  document.querySelectorAll(".embed").forEach(function (el) {
    var btn = el.querySelector(".embed__play");
    if (!btn || !el.dataset.videoId) return;
    btn.addEventListener("click", function () {
      var iframe = makeIframe(el.dataset.provider, el.dataset.videoId, el.dataset.title);
      el.appendChild(iframe);
      btn.remove();
      iframe.focus();
    });
  });

  // ---------- Fullscreen video player (showreel + Video section) ----------
  var dialog = document.getElementById("reel-dialog");
  var frame = dialog && dialog.querySelector("[data-reel-frame]");
  var opener = null;

  function openVideo(provider, id, title, from) {
    if (!dialog || !id) return;
    opener = from;
    frame.innerHTML = "";
    frame.appendChild(makeIframe(provider, id, title));
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }
  function closeReel() {
    if (dialog.open) dialog.close();
  }

  if (dialog) {
    document.querySelectorAll("[data-open-reel]").forEach(function (b) {
      b.addEventListener("click", function () {
        openVideo(dialog.dataset.provider, dialog.dataset.videoId, dialog.getAttribute("aria-label"), b);
      });
    });
    document.querySelectorAll("[data-play-video]").forEach(function (b) {
      b.addEventListener("click", function () {
        openVideo(b.dataset.provider, b.dataset.videoId, b.dataset.title, b);
      });
    });
    dialog.querySelector("[data-close-reel]").addEventListener("click", closeReel);
    // Click outside the video closes the player
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) closeReel();
    });
    // Esc closes natively; always stop playback and return focus
    dialog.addEventListener("close", function () {
      frame.innerHTML = "";
      if (opener) opener.focus();
    });
  }

  // ---------- Photo gallery: "show more" + lightbox ----------
  var grid = document.querySelector("[data-photo-grid]");
  var moreBtn = document.querySelector("[data-photo-more]");
  if (grid && moreBtn) {
    moreBtn.addEventListener("click", function () {
      grid.classList.remove("is-collapsed");
      moreBtn.parentNode.remove();
      var firstExtra = grid.querySelector(".is-extra a");
      if (firstExtra) firstExtra.focus();
    });
  }

  var lb = document.getElementById("lightbox");
  var photos = Array.prototype.slice.call(document.querySelectorAll("[data-photo]"));
  if (lb && photos.length) {
    var lbImg = document.createElement("img");
    lbImg.className = "lightbox__img";
    var lbCap = lb.querySelector("[data-lb-caption]");
    var lbCount = lb.querySelector("[data-lb-counter]");
    var current = 0;
    var lbOpener = null;

    function show(i) {
      current = (i + photos.length) % photos.length;
      var a = photos[current];
      lbImg.removeAttribute("srcset");
      lbImg.src = a.getAttribute("href");
      if (a.dataset.srcset) {
        lbImg.sizes = "92vw";
        lbImg.srcset = a.dataset.srcset;
      }
      lbImg.alt = a.dataset.alt || "";
      if (!lbImg.parentNode) lb.querySelector(".lightbox__figure").prepend(lbImg);
      lbCap.textContent = a.dataset.caption || "";
      lbCount.textContent = current + 1 + " / " + photos.length;
    }

    photos.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        if (typeof lb.showModal !== "function") return; // old browser: just open the image
        e.preventDefault();
        lbOpener = a;
        show(i);
        lb.showModal();
      });
    });
    lb.querySelector("[data-lb-prev]").addEventListener("click", function () { show(current - 1); });
    lb.querySelector("[data-lb-next]").addEventListener("click", function () { show(current + 1); });
    lb.querySelector("[data-lb-close]").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.classList.contains("lightbox__figure")) lb.close();
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
    lb.addEventListener("close", function () {
      if (lbOpener) lbOpener.focus();
    });

    // Swipe left / right on phones
    var touchX = null;
    lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  // ---------- Viewfinder timecode (24 fps) and optional hero loop ----------
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tc = document.querySelector("[data-timecode]");
  if (tc && !reduceMotion) {
    var start = performance.now();
    var heroVisible = true;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var tick = function (now) {
      if (heroVisible) {
        var frames = Math.floor(((now - start) / 1000) * 24);
        var s = Math.floor(frames / 24);
        tc.textContent = pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(frames % 24);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }).observe(tc);
    }
  }
  var heroVideo = document.querySelector("[data-hero-video]");
  if (heroVideo && reduceMotion) heroVideo.pause();

  // ---------- Subtle reveal on scroll ----------
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();

/* ==========================================================================
   NETHMI HOTEL & BANQUET — main.js
   All page behaviour lives here, section by section.
   ========================================================================== */
(function () {
  "use strict";

  /* QA helper: open the site with ?still to freeze films and sliders */
  var STILL = new URLSearchParams(window.location.search).has("still");

  /* ---------- 1. Loader — white screen, fades out after ~2.6s ---------- */
  var loader = document.getElementById("loader");
  document.body.style.overflow = "hidden";
  setTimeout(function () { loader.classList.add("is-leaving"); }, 2600);
  setTimeout(function () {
    loader.classList.add("is-gone");
    document.body.style.overflow = "";
  }, 3300);

  /* ---------- 2. Navigation bar — solidifies once you scroll ---------- */
  var nav = document.getElementById("nav");
  function onScrollNav() {
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------- 3. Full-screen menu ---------- */
  var menu = document.getElementById("menu");

  function openMenu() {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  document.getElementById("menuOpen").addEventListener("click", openMenu);
  document.getElementById("menuClose").addEventListener("click", closeMenu);
  menu.querySelectorAll(".menu-links a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  /* ---------- 4. Hero — slow parallax drift ---------- */
  var heroImg = document.getElementById("heroImg");
  var raf = 0;
  window.addEventListener("scroll", function () {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      var y = Math.min(window.scrollY, window.innerHeight);
      heroImg.style.transform = "translateY(" + y * 0.18 + "px) scale(1.02)";
    });
  }, { passive: true });

  /* ---------- 5. Scroll reveals ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

  document.querySelectorAll(".reveal, .img-reveal").forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- 6. Video panels ----------
     Each film starts playing only when its section scrolls into view,
     pauses when it leaves, and has two small buttons: play/pause + mute. */
  document.querySelectorAll("[data-video]").forEach(function (panel) {
    var video = panel.querySelector("video");
    var playBtn = panel.querySelector(".vp-play");
    var muteBtn = panel.querySelector(".vp-mute");
    var userPaused = false; // remembers a deliberate pause

    video.addEventListener("play", function () {
      panel.classList.add("is-playing");
      playBtn.setAttribute("aria-label", "Pause video");
    });
    video.addEventListener("pause", function () {
      panel.classList.remove("is-playing");
      playBtn.setAttribute("aria-label", "Play video");
    });

    /* autoplay only while visible */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (STILL) return;
        if (entry.isIntersecting) {
          if (!userPaused) video.play().catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35 });
    io.observe(panel);

    playBtn.addEventListener("click", function () {
      if (video.paused) {
        userPaused = false;
        video.play().catch(function () {});
      } else {
        userPaused = true;
        video.pause();
      }
    });

    muteBtn.addEventListener("click", function () {
      video.muted = !video.muted;
      panel.classList.toggle("is-muted", video.muted);
      muteBtn.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
    });
  });

  /* ---------- 7. Rooms slider — slow auto-advance, dots only ---------- */
  var roomSlides = document.querySelectorAll("#roomsSlider .room-slide");
  var roomDots = document.querySelectorAll("#roomsDots .dot");
  var roomIndex = 0;
  var roomTimer = null;
  var ROOM_MS = 7500;

  function showRoom(i) {
    roomIndex = i;
    roomSlides.forEach(function (slide, n) {
      slide.classList.toggle("is-active", n === i);
    });
    roomDots.forEach(function (dot, n) {
      dot.classList.toggle("is-active", n === i);
    });
  }
  function startRooms() {
    clearInterval(roomTimer);
    if (STILL) return;
    roomTimer = setInterval(function () {
      showRoom((roomIndex + 1) % roomSlides.length);
    }, ROOM_MS);
  }
  roomDots.forEach(function (dot, n) {
    dot.addEventListener("click", function () {
      showRoom(n);
      startRooms();
    });
  });
  startRooms();

  /* ---------- 8. Gallery slider — centred, auto-advancing ---------- */
  var gallerySlider = document.getElementById("gallerySlider");
  var galleryTrack = document.getElementById("galleryTrack");
  var gallerySlides = galleryTrack.querySelectorAll(".g-slide");
  var galleryDotsBox = document.getElementById("galleryDots");
  var galleryIndex = 0;
  var galleryTimer = null;
  var galleryPaused = false;
  var GALLERY_MS = 4600;

  /* build one dot per photo */
  gallerySlides.forEach(function (_, n) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", "Go to photo " + (n + 1));
    dot.addEventListener("click", function () { showGallery(n); });
    galleryDotsBox.appendChild(dot);
  });
  var galleryDots = galleryDotsBox.querySelectorAll(".dot");

  function showGallery(i) {
    galleryIndex = i;
    galleryTrack.style.transform =
      "translateX(calc(50% - var(--sw) / 2 - " + i + " * var(--sw)))";
    gallerySlides.forEach(function (slide, n) {
      slide.classList.toggle("is-active", n === i);
    });
    galleryDots.forEach(function (dot, n) {
      dot.classList.toggle("is-active", n === i);
    });
  }
  gallerySlides.forEach(function (slide, n) {
    slide.addEventListener("click", function () { showGallery(n); });
  });
  gallerySlider.addEventListener("mouseenter", function () { galleryPaused = true; });
  gallerySlider.addEventListener("mouseleave", function () { galleryPaused = false; });

  function startGallery() {
    if (STILL) return;
    galleryTimer = setInterval(function () {
      if (!galleryPaused) showGallery((galleryIndex + 1) % gallerySlides.length);
    }, GALLERY_MS);
  }
  showGallery(0);
  startGallery();

  /* ---------- 9. Amenities — expanding panels ---------- */
  var amPanels = document.querySelectorAll("#amGallery .am-panel");
  amPanels.forEach(function (panel) {
    function activate() {
      amPanels.forEach(function (p) { p.classList.toggle("is-active", p === panel); });
    }
    panel.addEventListener("mouseenter", activate);
    panel.addEventListener("focus", activate);
    panel.addEventListener("click", activate);
  });

  /* ---------- 10. Guest stories — animated testimonials ---------- */
  var TESTIMONIALS = [
    {
      name: "Sachini & Prabath",
      role: "Married at Nethmi · April 2024",
      quote: "From the first meeting to the last dance, everything was handled with such care. Our families still talk about the food — and the photographs look like a film."
    },
    {
      name: "Buwanesh & Kalpani",
      role: "Wedding Reception · June 2024",
      quote: "The hall took our breath away, and the staff treated every one of our guests like their own family. We did not worry about a single thing all day."
    },
    {
      name: "Suraj & Nilanthi",
      role: "Homecoming Celebration",
      quote: "Every corner of this place is made for photographs. Golden light, white stairs, quiet gardens — our album feels unreal to us even now."
    },
    {
      name: "Manoj & Waruni",
      role: "Weekend Stay",
      quote: "We came for one evening and stayed the whole weekend. Calm, spotless rooms and slow mornings by the pool we did not want to end."
    },
    {
      name: "Dilini Perera",
      role: "Family Getaway",
      quote: "Divulapitiya's best-kept secret. Peaceful, beautifully kept, and the evening buffet alone is worth the drive from Colombo."
    }
  ];

  var tImgs = document.querySelectorAll(".t-img");
  var tName = document.getElementById("tName");
  var tRole = document.getElementById("tRole");
  var tQuote = document.getElementById("tQuote");
  var tIndex = 0;
  var tTimer = null;
  var T_MS = 7000;

  function showTestimonial(i) {
    tIndex = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
    var t = TESTIMONIALS[tIndex];

    tImgs.forEach(function (img, n) {
      img.classList.toggle("is-active", n === tIndex);
      img.classList.toggle("is-behind", n !== tIndex);
    });

    tName.textContent = t.name;
    tRole.textContent = t.role;

    /* rebuild the quote word by word so each word blurs in */
    tQuote.classList.remove("is-shown");
    tQuote.innerHTML = "";
    t.quote.split(" ").forEach(function (word, n) {
      var span = document.createElement("span");
      span.textContent = word + " ";
      span.style.setProperty("--wd", n * 20 + "ms");
      tQuote.appendChild(span);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { tQuote.classList.add("is-shown"); });
    });
  }
  function startTestimonials() {
    clearInterval(tTimer);
    if (STILL) return;
    tTimer = setInterval(function () { showTestimonial(tIndex + 1); }, T_MS);
  }
  document.getElementById("tPrev").addEventListener("click", function () {
    showTestimonial(tIndex - 1); startTestimonials();
  });
  document.getElementById("tNext").addEventListener("click", function () {
    showTestimonial(tIndex + 1); startTestimonials();
  });
  showTestimonial(0);
  startTestimonials();

  /* ---------- 11. Footer subscribe ---------- */
  var subscribeForm = document.getElementById("subscribeForm");
  subscribeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    subscribeForm.hidden = true;
    document.getElementById("subscribeThanks").hidden = false;
  });

})();

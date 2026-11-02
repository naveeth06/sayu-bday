/* =========================================================
   A scroll-led album for the photographs and videos in ASSETS.
   ========================================================= */

(function () {
  "use strict";

  var App = window.App;
  if (!App) return;

  var directions = [
    { x: -18, y: 0 },
    { x: 0, y: 16 },
    { x: 18, y: 0 },
    { x: 0, y: -16 }
  ];

  function mediaKind(file) {
    return /\.(mp4|webm)$/i.test(file) ? "video" : "image";
  }

  function makeMemory(memory, index, total) {
    var article = document.createElement("article");
    article.className = "memory" + (index % 2 ? " memory--reverse" : "");
    article.setAttribute("aria-label", "Memory " + (index + 1) + " of " + total);
    article.setAttribute("aria-hidden", index === 0 ? "false" : "true");

    var figure = document.createElement("figure");
    figure.className = "memory-media";

    var src = "ASSETS/" + encodeURIComponent(memory.file);
    var kind = mediaKind(memory.file);
    var media;

    if (kind === "video") {
      media = document.createElement("video");
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = "none";
      media.setAttribute("aria-label", memory.alt);
      media.dataset.memoryVideo = "";
      media.src = src;
    } else {
      media = document.createElement("img");
      media.src = src;
      media.alt = memory.alt;
      media.loading = index === 0 ? "eager" : "lazy";
      media.decoding = "async";
    }

    figure.appendChild(media);

    var imageNote = document.createElement("figcaption");
    imageNote.className = "memory-photo-note";
    imageNote.textContent = kind === "video" ? "A moment, moving still" : "A moment, kept close";
    figure.appendChild(imageNote);

    var copy = document.createElement("div");
    copy.className = "memory-copy";

    var eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Memory " + (index + 1) + " · " + (kind === "video" ? " " : " ");

    var heading = document.createElement("h2");
    heading.className = "memory-title";
    heading.textContent = memory.title;

    var message = document.createElement("p");
    message.className = "memory-message";
    message.textContent = memory.message;

    var ornament = document.createElement("span");
    ornament.className = "memory-ornament";
    ornament.setAttribute("aria-hidden", "true");
    ornament.textContent = "✦";

    copy.appendChild(eyebrow);
    copy.appendChild(heading);
    copy.appendChild(message);
    copy.appendChild(ornament);
    article.appendChild(figure);
    article.appendChild(copy);

    return article;
  }

  function init() {
    var section = App.qs("[data-memories]");
    if (!section) return;

    var stage = App.qs("[data-memory-stage]", section);
    var status = App.qs("[data-memory-status]", section);
    var memories = Array.isArray(window.MEMORIES) ? window.MEMORIES : [];

    if (!stage || !memories.length) {
      if (status) status.textContent = "Add memories to js/memories-config.js to fill this album.";
      return;
    }

    var items = memories.map(function (memory, index) {
      return makeMemory(memory, index, memories.length);
    });

    items.forEach(function (item) {
      stage.appendChild(item);
    });

    if (!App.motion || !window.gsap || !window.ScrollTrigger) {
      section.classList.add("memories-static");
      items.forEach(function (item) {
        item.setAttribute("aria-hidden", "false");
        var video = item.querySelector("[data-memory-video]");
        if (video) {
          video.controls = true;
          video.preload = "metadata";
        }
      });
      if (status) status.textContent = memories.length + " memories in this album.";
      return;
    }

    section.classList.add("memories-enhanced");

    var gsap = window.gsap;
    var current = -1;
    var cycle = 1.5;
    var transition = 0.62;

    function currentIndex(trigger) {
      var time = trigger && trigger.animation
        ? trigger.animation.time()
        : 0;
      return Math.min(
        memories.length - 1,
        Math.floor((time + transition / 2) / cycle)
      );
    }

    var timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: function () {
          return "+=" + Math.max(window.innerHeight * 1.35, 760) * memories.length;
        },
        pin: stage,
        pinSpacing: true,
        scrub: 1.25,
        invalidateOnRefresh: true,
        onUpdate: function (trigger) {
          setCurrent(currentIndex(trigger));
        },
        onRefresh: function (trigger) {
          setCurrent(currentIndex(trigger));
        }
      }
    });

    gsap.set(items, {
      autoAlpha: 0,
      pointerEvents: "none"
    });
    gsap.set(items[0], { autoAlpha: 1, pointerEvents: "auto" });
    gsap.set(items.slice(1).map(function (item) {
      return item.querySelector(".memory-media");
    }), {
      xPercent: function (index) {
        return directions[(index + 1) % directions.length].x;
      },
      yPercent: function (index) {
        return directions[(index + 1) % directions.length].y;
      },
      scale: 1.045,
      filter: "blur(9px)"
    });
    gsap.set(items.slice(1).map(function (item) {
      return item.querySelector(".memory-copy");
    }), { y: 22, autoAlpha: 0 });

    gsap.set(items[0].querySelector(".memory-copy"), { y: 0, autoAlpha: 1 });

    items.slice(1).forEach(function (item, offset) {
      var index = offset + 1;
      var previous = items[index - 1];
      var direction = directions[index % directions.length];
      var position = (index - 1) * cycle + cycle - transition;
      var previousDirection = directions[(index - 1) % directions.length];

      timeline.to(previous.querySelector(".memory-media"), {
        xPercent: previousDirection.x * -1,
        yPercent: previousDirection.y * -1,
        scale: 0.96,
        autoAlpha: 0,
        filter: "blur(7px)",
        duration: transition,
        ease: "power1.inOut"
      }, position);

      timeline.to(previous.querySelector(".memory-copy"), {
        y: -14,
        autoAlpha: 0,
        duration: transition * 0.7,
        ease: "power1.in"
      }, position);

      timeline.fromTo(item, {
        autoAlpha: 1
      }, {
        autoAlpha: 1,
        pointerEvents: "auto",
        duration: transition,
        ease: "none"
      }, position);

      timeline.fromTo(item.querySelector(".memory-media"), {
        xPercent: direction.x,
        yPercent: direction.y,
        scale: 1.045,
        autoAlpha: 0,
        filter: "blur(9px)"
      }, {
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        autoAlpha: 1,
        filter: "blur(0px)",
        duration: transition,
        ease: "power1.out"
      }, position);

      timeline.fromTo(item.querySelector(".memory-copy"), {
        y: 22,
        autoAlpha: 0
      }, {
        y: 0,
        autoAlpha: 1,
        duration: transition * 0.8,
        ease: "power1.out"
      }, position + 0.08);
    });

    function setCurrent(index) {
      if (index === current) return;
      current = index;

      items.forEach(function (item, itemIndex) {
        item.setAttribute("aria-hidden", itemIndex === index ? "false" : "true");
        var video = item.querySelector("[data-memory-video]");
        if (!video) return;

        if (itemIndex === index) {
          var playback = video.play();
          if (playback && typeof playback.catch === "function") {
            playback.catch(function (error) {
              if (error.name === "AbortError") return;
              video.controls = true;
              console.warn("Memory video autoplay was unavailable; playback controls are shown.", error);
            });
          }
        } else {
          video.pause();
        }
      });

      if (status) status.textContent = "Memory " + (index + 1) + " of " + memories.length;
    }

    function refresh() {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }

    items.forEach(function (item) {
      item.querySelectorAll("img, video").forEach(function (media) {
        media.addEventListener("loadedmetadata", refresh, { once: true });
        media.addEventListener("load", refresh, { once: true });
      });
    });

    setCurrent(0);
    refresh();
  }

  App.memories = { init: init };
})();

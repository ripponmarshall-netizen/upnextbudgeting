// Runs before first paint (a classic script in <head>; the CSP blocks inline
// scripts). Applies the saved theme so light-theme users don't see a dark
// flash, and drives the splash hand-off: the logo draws itself in while the
// app loads, then the logo and title fly up into the header (FLIP: measure
// both, animate the difference) while the page drops in beneath them.
(function () {
  var root = document.documentElement;
  var themeMeta = document.querySelector("meta[name='theme-color']");
  try {
    var saved = JSON.parse(localStorage.getItem("upnextbudgeting:v1") || "{}") || {};
    var pref = (saved.settings && saved.settings.theme) || "system";
    if (pref === "pastel") pref = "light";
    var theme = pref === "light" || pref === "dark"
      ? pref
      : window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#faf9f7" : "#161513");
  } catch (e) {}

  var start = Date.now();
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // A quick-add launch (home-screen shortcut) skips the show.
  var quick = /[?&]add=/.test(location.search);
  root.classList.add("un-booting", "un-intro");
  window.upnextBooting = true;

  var later = function (fn, ms) {
    setTimeout(fn, reduce ? Math.min(ms, 300) : ms);
  };
  var lifted = function () {
    window.upnextBooting = false;
    root.classList.remove("un-booting");
    window.dispatchEvent(new Event("upnext-lifted"));
  };
  var finish = function (el) {
    root.classList.remove("un-handoff");
    if (window.upnextBooting) lifted();
    if (el) el.remove();
    // The intro entrance has played; later screens rise as usual.
    later(function () {
      root.classList.remove("un-intro");
    }, 1400);
  };
  var rect = function (n) {
    var r = n && n.getBoundingClientRect();
    return r && r.width > 0 && r.height > 0 ? r : null;
  };

  var fadeOut = function (el) {
    el.classList.add("is-leaving");
    el.setAttribute("aria-hidden", "true");
    lifted();
    later(function () {
      finish(el);
    }, 450);
  };

  var flyHome = function (el) {
    var brand = el.querySelector(".splash-brand");
    var title = el.querySelector(".splash-title");
    var toLogo = document.querySelector("[data-splash-target=logo]");
    var toTitle = document.querySelector("[data-splash-target=title]");
    var a = rect(brand);
    var b = rect(toLogo);
    if (reduce || !a || !b || !brand.animate) return fadeOut(el);
    var ms = 680;
    var ease = "cubic-bezier(0.45, 0, 0.15, 1)";
    var s = b.width / a.width;
    var dx = b.left + b.width / 2 - (a.left + a.width / 2);
    var dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var svg = brand.querySelector("svg");
    var radius = parseFloat(getComputedStyle(toLogo).borderTopLeftRadius) || 0;
    root.classList.add("un-handoff");
    el.classList.add("is-flying");
    el.setAttribute("aria-hidden", "true");
    var flight = brand.animate(
      [{ transform: "none" }, { transform: "translate(" + dx + "px, " + dy + "px) scale(" + s + ")" }],
      { duration: ms, easing: ease, fill: "forwards" }
    );
    if (svg) {
      svg.animate(
        [{ borderRadius: getComputedStyle(svg).borderTopLeftRadius }, { borderRadius: radius / s + "px", boxShadow: "none" }],
        { duration: ms, easing: ease, fill: "forwards" }
      );
    }
    var c = rect(title);
    var d = rect(toTitle);
    if (c && d) {
      // The header title is left-aligned and may be a little smaller, so pin
      // the left edge.
      var ts = parseFloat(getComputedStyle(toTitle).fontSize) / parseFloat(getComputedStyle(title).fontSize);
      title.animate(
        [
          { transform: "none" },
          { transform: "translate(" + (d.left - c.left) + "px, " + (d.top + d.height / 2 - (c.top + c.height / 2)) + "px) scale(" + ts + ")" }
        ],
        { duration: ms, easing: ease, fill: "forwards" }
      );
    } else {
      title.style.opacity = "0";
    }
    // Let the page start falling in once the logo is most of the way up.
    setTimeout(lifted, ms * 0.55);
    // Swap to the real header logo on the flight's last frame; the timer is
    // the backstop.
    var landed = false;
    var land = function () {
      if (landed) return;
      landed = true;
      finish(el);
      toLogo.classList.add("landed");
    };
    flight.onfinish = land;
    setTimeout(land, ms + 250);
  };

  // Called by app.js once the first screen has rendered.
  window.upnextSplashDone = function () {
    window.upnextSplashDone = function () {};
    clearTimeout(slow);
    var el = document.getElementById("splash");
    if (!el) return finish(null);
    if (quick) return fadeOut(el);
    // Let the logo finish drawing on a fast load.
    var left = reduce ? 0 : Math.max(0, 950 - (Date.now() - start));
    setTimeout(function () {
      flyHome(el);
    }, left);
  };

  var slow = setTimeout(function () {
    var sub = document.getElementById("splashSub");
    if (sub) sub.textContent = "Still loading… check your connection";
  }, 8000);
})();

/* =========================================================
   Birthday gate
   Loaded synchronously in <head> so the surprise never flashes.
   Unlocks at local midnight on November 4 (and stays unlocked).
   Preview escape hatch: add ?preview to any page.
   ========================================================= */

(function () {
  "use strict";

  var BIRTHDAY = { month: 11, day: 4 };

  function unlockMoment(now) {
    return new Date(now.getFullYear(), BIRTHDAY.month - 1, BIRTHDAY.day, 0, 0, 0, 0);
  }

  var now = new Date();
  var target = unlockMoment(now);
  var open = now.getTime() >= target.getTime();
  var stored = false;

  try {
    stored = window.localStorage.getItem("bday-unlocked-v2") === "1";
  } catch (error) {
    // stored = false;
  }

  if (stored) open = true;

  window.BDAY_LOCK = {
    birthday: BIRTHDAY,
    target: target.getTime(),
    open: open
  };

  if (open) {
    try {
      window.localStorage.setItem("bday-unlocked-v2", "1");
    } catch (error) {
      /* storage can be unavailable, the date check still works */
    }
    return;
  }

  /* Owner preview is explicit and applies only to this URL. */
  var preview = /[?&]preview(?:[=&]|$)/.test(window.location.search);
  if (preview) return;

  /* never redirect the lock screen into itself */
  if (/lock\.html?$/i.test(window.location.pathname)) return;

  window.location.replace("lock.html");
})();

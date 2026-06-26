/* =====================================================================
   app.js — Tala's Study Corner (garden edition)
   Main view = a garden (plant + to-do signboard + basket).
   Everything else lives in the slide-out drawer.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.STUDY_CORNER_CONFIG;
  var Store = window.TSC.Store, Sync = window.TSC.Sync, todayKey = window.TSC.todayKey, uid = window.TSC.uid;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fill = function (t) { return (t || "").replace(/\{nick\}/g, CFG.names.nickname).replace(/\{name\}/g, CFG.names.primary); };

  function weekStart(d) { var x = new Date(d || new Date()); var day = (x.getDay() + 6) % 7; x.setHours(0,0,0,0); x.setDate(x.getDate()-day); return x; }
  function fmtDur(min) { var h = Math.floor(min/60), m = min%60; return (h ? h+"h " : "") + (m || !h ? m+"m" : ""); }
  function timeAgo(ts) { var s = Math.floor((Date.now()-ts)/1000); if (s<60) return "just now"; if (s<3600) return Math.floor(s/60)+"m ago"; if (s<86400) return Math.floor(s/3600)+"h ago"; return Math.floor(s/86400)+"d ago"; }

  /* ================= Greeting + quote (drawer head) ================= */
  function initGreeting() {
    var h = new Date().getHours(), key;
    if (h < 5) key = "night"; else if (h < 12) key = "morning";
    else if (h < 17) key = "afternoon"; else if (h < 21) key = "evening"; else key = "night";
    $("#greeting").textContent = fill(CFG.greetings[key]);
    var qEl = $("#quote"), qi = Math.floor(Math.random() * CFG.quotes.length);
    function setQuote(an) { var t = fill(CFG.quotes[qi]); if (!an) { qEl.textContent = t; return; }
      qEl.classList.add("is-fading"); setTimeout(function () { qEl.textContent = t; qEl.classList.remove("is-fading"); }, 480); }
    setQuote(false);
    setInterval(function () { qi = (qi + 1 + Math.floor(Math.random()*(CFG.quotes.length-1))) % CFG.quotes.length; setQuote(true); }, 30000);
  }

  /* ================= Drawer + accordion ================= */
  function initDrawer() {
    var d = $("#drawer");
    function open() { d.hidden = false; requestAnimationFrame(function () { d.classList.add("is-open"); }); }
    function close() { d.classList.remove("is-open"); setTimeout(function () { d.hidden = true; }, 360); }
    $("#menuTrigger").addEventListener("click", open);
    $("#drawerClose").addEventListener("click", close);
    $("#drawerScrim").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !d.hidden && $("#basketModal").hidden && $("#breatheOverlay").hidden) close();
    });
    $$(".tool__head").forEach(function (head) {
      head.addEventListener("click", function () {
        var tool = head.parentElement, wasOpen = tool.classList.contains("is-open");
        $$(".tool").forEach(function (t) { t.classList.remove("is-open"); });
        if (!wasOpen) {
          tool.classList.add("is-open");
          var name = tool.getAttribute("data-tool");
          if (name === "weekly") { Chart.render(); Recap.render(); }
          else if (name === "streak") Streak.render();
        }
      });
    });
  }

  /* ================= Theme + backgrounds ================= */
  function toggleTheme() {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next); Store.set("pref:theme", next); applyBackground();
  }
  function initTheme() {
    var saved = Store.get("pref:theme", null);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    $("#themeToggle").addEventListener("click", toggleTheme);
    var sun = $("#sunToggle");
    if (sun) sun.addEventListener("click", toggleTheme);
  }
  function initBackgrounds() {
    var wrap = $("#bgSwitch"); wrap.innerHTML = "";
    CFG.backgrounds.forEach(function (bg, i) {
      var dot = document.createElement("button");
      dot.className = "bg-dot"; dot.title = bg.name; dot.style.background = bg.light;
      dot.addEventListener("click", function () {
        Store.set("pref:bg", i); applyBackground();
        $$(".bg-dot").forEach(function (x) { x.classList.remove("is-on"); }); dot.classList.add("is-on");
      });
      wrap.appendChild(dot);
    });
    applyBackground();
    var idx = Store.get("pref:bg", 0); if ($$(".bg-dot")[idx]) $$(".bg-dot")[idx].classList.add("is-on");
  }
  function applyBackground() {
    var bg = CFG.backgrounds[Store.get("pref:bg", 0)] || CFG.backgrounds[0];
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    document.body.style.setProperty("--scene", dark ? bg.dark : bg.light);
  }

  /* ================= Toast + cues + celebration ================= */
  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.hidden = false; t.classList.add("is-in"); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-in"); setTimeout(function () { t.hidden = true; }, 350); }, 3200);
  }
  function chime() {
    try {
      var ac = new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99].forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        var t0 = ac.currentTime + i*0.16; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.12, t0+0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t0+0.5); o.start(t0); o.stop(t0+0.55);
      });
    } catch (e) {}
  }
  function celebrate() {
    for (var i = 0; i < 18; i++) {
      var c = document.createElement("span"); c.className = "confetti";
      c.style.left = (38 + Math.random()*24) + "%";
      c.style.background = ["#7fc69b", "#ef9ab1", "#f6d186", "#b8a7e0", "#9ed0e6"][i % 5];
      c.style.animationDelay = (Math.random()*0.25) + "s"; c.style.transform = "translateX(" + (Math.random()*240-120) + "px)";
      document.body.appendChild(c); setTimeout(function (el) { return function () { el.remove(); }; }(c), 1700);
    }
  }
  function milestone(msg) { celebrate(); chime(); toast(msg); }

  /* ================= Pomodoro + intention + reflection ================= */
  var sittingMinutes = 0;
  var Pomo = (function () {
    var R = 96, CIRC = 2*Math.PI*R, ringFill = $("#ringFill");
    var state = { mode: "work", running: false, remaining: 0, total: 0, round: 1,
      work: CFG.pomodoro.workMinutes, brk: CFG.pomodoro.shortBreakMinutes };
    var tick, sessionIntention = "";
    function load() {
      state.work = Store.get("pomo:work", CFG.pomodoro.workMinutes);
      state.brk = Store.get("pomo:brk", CFG.pomodoro.shortBreakMinutes);
      $("#lenWork").value = state.work; $("#lenBreak").value = state.brk; setMode("work");
    }
    function minutesFor(m) { return m === "work" ? state.work : m === "long" ? CFG.pomodoro.longBreakMinutes : state.brk; }
    function setMode(m) {
      state.mode = m; state.total = minutesFor(m)*60; state.remaining = state.total;
      $("#pomoMode").textContent = m === "work" ? "Work" : (m === "long" ? "Long break" : "Break");
      document.body.classList.toggle("is-break", m !== "work"); render();
    }
    function render() {
      var mm = Math.floor(state.remaining/60), ss = state.remaining%60;
      $("#pomoTime").textContent = String(mm).padStart(2,"0") + ":" + String(ss).padStart(2,"0");
      $("#pomoRound").textContent = "Round " + state.round;
      ringFill.style.strokeDasharray = CIRC;
      ringFill.style.strokeDashoffset = CIRC * (1 - (state.total ? state.remaining/state.total : 1));
      $("#pomoStart").textContent = state.running ? "Pause" : "Start";
    }
    function start() {
      if (state.running) { pause(); return; }
      if (state.mode === "work") sessionIntention = $("#intentionInput").value.trim();
      state.running = true; render();
      tick = setInterval(function () { state.remaining--; if (state.remaining <= 0) complete(); render(); }, 1000);
    }
    function pause() { state.running = false; clearInterval(tick); render(); }
    function reset() { pause(); setMode(state.mode); }
    function complete() {
      pause();
      if (state.mode === "work") {
        Stats.logSession(state.work); chime(); toast("Nice work, " + CFG.names.nickname + " — take a breath. 🌸"); celebrate();
        EatReminder.add(state.work); showReflection(sessionIntention);
        $("#intentionInput").value = ""; sessionIntention = "";
        var nl = state.round % CFG.pomodoro.roundsBeforeLongBreak === 0; state.round++; setMode(nl ? "long" : "break");
      } else { chime(); toast("Break's over — ready when you are. 🌿"); setMode("work"); }
    }
    function skip() { if (state.mode === "work") { state.round++; setMode("break"); } else setMode("work"); }
    function saveLengths() {
      state.work = Math.max(1, parseInt($("#lenWork").value, 10) || state.work);
      state.brk = Math.max(1, parseInt($("#lenBreak").value, 10) || state.brk);
      Store.set("pomo:work", state.work); Store.set("pomo:brk", state.brk); if (!state.running) setMode(state.mode);
    }
    function isMidSession() { return state.running && state.mode === "work"; }
    function init() {
      load();
      $("#pomoStart").addEventListener("click", start); $("#pomoReset").addEventListener("click", reset); $("#pomoSkip").addEventListener("click", skip);
      $("#lenWork").addEventListener("change", saveLengths); $("#lenBreak").addEventListener("change", saveLengths);
    }
    return { init: init, isMidSession: isMidSession };
  })();

  function showReflection(intention) {
    var panel = $("#reflectPanel"), ie = $("#reflectIntention");
    if (intention) { ie.textContent = "You set out to: “" + intention + "”"; ie.hidden = false; } else { ie.textContent = ""; ie.hidden = true; }
    panel.hidden = false; panel.classList.add("is-in");
  }
  function initReflection() {
    var panel = $("#reflectPanel");
    function close() { panel.classList.remove("is-in"); setTimeout(function () { panel.hidden = true; }, 320); }
    $$("[data-reflect]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        var log = Store.get("reflect:log", []); log.push({ at: Date.now(), how: b.getAttribute("data-reflect") });
        Store.set("reflect:log", log.slice(-200)); close();
      });
    });
    $("#reflectClose").addEventListener("click", close);
  }

  var EatReminder = (function () {
    var next = 120;
    function show() { var n = $("#eatNudge"); n.hidden = false; n.classList.add("is-in"); }
    function add(min) { sittingMinutes += min; while (sittingMinutes >= next) { show(); next += 120; } }
    function init() {
      $("#eatNudgeText").textContent = "Have you eaten something, " + CFG.names.nickname + "? 🍓";
      $("#eatNudgeClose").addEventListener("click", function () { var n = $("#eatNudge"); n.classList.remove("is-in"); setTimeout(function () { n.hidden = true; }, 320); });
    }
    return { add: add, init: init };
  })();

  /* ================= Stats / Streak / Chart / Recap ================= */
  var Stats = (function () {
    function logSession(min) {
      var k = todayKey(), day = Store.get("stats:day:" + k, { minutes: 0, sessions: 0, tasks: 0 });
      day.minutes += min; day.sessions += 1; Store.set("stats:day:" + k, day);
      Store.set("stats:totalMinutes", Store.get("stats:totalMinutes", 0) + min);
      Stats.markStreak(); render(); Streak.render(); Chart.render(); Recap.render();
    }
    function logTask() { var k = todayKey(), day = Store.get("stats:day:" + k, { minutes: 0, sessions: 0, tasks: 0 });
      day.tasks = (day.tasks || 0) + 1; Store.set("stats:day:" + k, day); Recap.render(); }
    function markStreak() { var days = Store.get("streak:days", []), k = todayKey(); if (days.indexOf(k) === -1) { days.push(k); Store.set("streak:days", days); } }
    function render() {
      var day = Store.get("stats:day:" + todayKey(), { minutes: 0, sessions: 0 });
      $("#statToday").textContent = day.minutes + "m"; $("#statSessions").textContent = day.sessions;
      var th = Store.get("stats:totalMinutes", 0)/60; $("#statTotal").textContent = (th >= 10 ? Math.round(th) : th.toFixed(1)) + "h";
    }
    return { logSession: logSession, logTask: logTask, markStreak: markStreak, render: render };
  })();

  var Streak = (function () {
    function daySet() { var s = {}; Store.get("streak:days", []).forEach(function (d) { s[d] = true; }); return s; }
    function current() { var set = daySet(), n = 0, d = new Date(); while (set[todayKey(d)]) { n++; d.setDate(d.getDate()-1); } return n; }
    function render() {
      var grid = $("#streakGrid"); if (!grid) return; grid.innerHTML = "";
      var set = daySet(), today = new Date();
      for (var i = 18*7-1; i >= 0; i--) {
        var d = new Date(today); d.setDate(today.getDate()-i);
        var dot = document.createElement("span");
        dot.className = "streak-dot" + (set[todayKey(d)] ? " is-on" : ""); dot.title = todayKey(d); dot.style.animationDelay = (i*4) + "ms"; grid.appendChild(dot);
      }
      var cur = current(), best = Store.get("streak:longest", 0); if (cur > best) { best = cur; Store.set("streak:longest", best); }
      $("#streakCurrent").textContent = cur; $("#streakNow").textContent = cur; $("#streakBest").textContent = best;
    }
    return { render: render, current: current };
  })();

  var Chart = (function () {
    function weekKey(d) { return todayKey(weekStart(d)); }
    function render() {
      var bars = $("#chartBars"); if (!bars) return; bars.innerHTML = "";
      var weeks = [], today = new Date();
      for (var w = 5; w >= 0; w--) {
        var ref = new Date(today); ref.setDate(today.getDate()-w*7); var wk = weekKey(ref), total = 0;
        for (var i = 0; i < 7; i++) { var d = new Date(wk); d.setDate(d.getDate()+i); var day = Store.get("stats:day:" + todayKey(d), null); if (day) total += day.minutes; }
        weeks.push(total);
      }
      var max = Math.max.apply(null, weeks.concat([1]));
      weeks.forEach(function (val, i) {
        var col = document.createElement("div"); col.className = "chart-col";
        var bar = document.createElement("div"); bar.className = "chart-bar"; bar.style.height = "0%";
        setTimeout(function () { bar.style.height = Math.max(4, (val/max)*100) + "%"; }, 120 + i*80);
        bar.title = val + " min";
        var lbl = document.createElement("small"); lbl.textContent = i === weeks.length-1 ? "now" : "-" + (weeks.length-1-i) + "w";
        col.appendChild(bar); col.appendChild(lbl); bars.appendChild(col);
      });
      var last = weeks[weeks.length-1], prev = weeks[weeks.length-2] || 0, t = $("#chartTrend");
      if (last === 0 && prev === 0) t.textContent = "Your weeks fill in as you study. 🌱";
      else if (last >= prev) t.textContent = "You studied more this week than last 🌱";
      else t.textContent = "A lighter week — and that's perfectly okay. 🍃";
    }
    return { render: render };
  })();

  var Recap = (function () {
    function render() {
      var start = weekStart(), min = 0, sess = 0, tasks = 0;
      for (var i = 0; i < 7; i++) { var d = new Date(start); d.setDate(start.getDate()+i); var day = Store.get("stats:day:" + todayKey(d), null); if (day) { min += day.minutes; sess += day.sessions; tasks += (day.tasks || 0); } }
      var wins = Store.get("wins", []).filter(function (w) { return w.createdAt >= start.getTime(); }).length;
      var el = $("#recapText"); if (!el) return;
      if (!min && !tasks && !wins) { el.textContent = "This week is a fresh page, " + CFG.names.nickname + " — it'll fill with good things."; return; }
      var parts = []; if (min) parts.push("focused for " + fmtDur(min)); if (tasks) parts.push("finished " + tasks + (tasks === 1 ? " task" : " tasks")); if (wins) parts.push("logged " + wins + (wins === 1 ? " win" : " wins"));
      var s = parts.length > 1 ? parts.slice(0,-1).join(", ") + ", and " + parts[parts.length-1] : parts[0];
      el.textContent = "This week, you " + s + ".";
    }
    return { render: render };
  })();

  /* ================= Plant (grows from tasks; gently decays over time) =====
     Progress goes up by 1 per completed task. Every 24h it loses 2 tasks of
     progress, but never below the floor (a small sprout — never a bare stick,
     never dead). A flower appears from the 3rd task and keeps growing. */
  var Plant = (function () {
    var MAX = 20, DAY = 86400000, lastLevel = -1;
    var msgs = ["A little sprout, full of potential 🌱", "Finding its feet 🌿", "Growing nicely 🌿",
      "First bloom — look at you 🌸", "Blossoming 🌷", "Flowering beautifully 🌸", "Flourishing 🌻",
      "Bursting with blooms 🌺", "Reaching for the sun ☀️", "Tall and thriving 🌿", "A proper little plant 🌳",
      "Standing proud 🌟", "Lush and lovely 🌸", "Your garden is thriving ✨", "In glorious full bloom 🌻"];

    function decay() {
      var now = Date.now(), last = Store.get("plant:lastDecay", null);
      if (last === null) { Store.set("plant:lastDecay", now); return; }
      var periods = Math.floor((now - last) / DAY);
      if (periods > 0) {
        Store.set("plant:progress", Math.max(0, Store.get("plant:progress", 0) - 2 * periods));
        Store.set("plant:lastDecay", last + periods * DAY);
      }
    }
    function doneTasks() { return Store.get("todos", []).filter(function (t) { return t.done; }).length; }
    // never bloom beyond what's actually been completed; decay can pull it lower
    function level() { return Math.min(MAX, Store.get("plant:progress", 0), doneTasks()); }
    function addProgress() { decay(); Store.set("plant:progress", Store.get("plant:progress", 0) + 1); render(); }

    function leaf(x, y, dir, scale) {
      var rx = 19 * scale, ry = 10 * scale, rot = dir * 28;
      return '<g transform="rotate(' + rot + ' ' + x + ' ' + y + ')">' +
        '<ellipse class="pl-leaf" cx="' + x + '" cy="' + y + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '"/>' +
        '<line class="pl-vein" x1="' + (x - rx * 0.78).toFixed(1) + '" y1="' + y + '" x2="' + (x + rx * 0.78).toFixed(1) + '" y2="' + y + '"/></g>';
    }
    function flower(cx, cy, scale) {
      var pr = 11 * scale, s = '<g class="pl-flower">';
      for (var k = 0; k < 6; k++) {
        var a = k * Math.PI / 3, px = cx + Math.cos(a) * pr, py = cy + Math.sin(a) * pr;
        s += '<ellipse cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" rx="' + (9 * scale).toFixed(1) +
          '" ry="' + (6 * scale).toFixed(1) + '" transform="rotate(' + (a * 180 / Math.PI).toFixed(0) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')"/>';
      }
      return s + '<circle class="pl-flower-core" cx="' + cx + '" cy="' + cy + '" r="' + (7 * scale).toFixed(1) + '"/></g>';
    }
    function svg(lvl) {
      var W = 220, H = 330, cx = 110, base = 304;
      var stemTop = base - (40 + lvl * 12); // scaled so 20 levels fit the canvas
      var sway = lvl % 2 ? 12 : -12;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="plant-svg">';
      s += '<path class="pl-stem" d="M' + cx + ' ' + base + ' C' + (cx - 14) + ' ' + (base - 50) + ' ' + (cx + sway) + ' ' + ((base + stemTop) / 2) + ' ' + cx + ' ' + stemTop + '"/>';
      var n = 3 + lvl; // always leafy — never a bare stick
      for (var i = 0; i < n; i++) {
        var t = (i + 1) / (n + 1), y = base - 14 - (base - 14 - stemTop) * t, dir = i % 2 ? 1 : -1;
        s += leaf(cx + dir * 18, y, dir, 1.0);
      }
      if (lvl >= 3) s += flower(cx, stemTop - 2, Math.min(1 + (lvl - 3) * 0.17, 3.5));
      else s += '<circle class="pl-bud" cx="' + cx + '" cy="' + (stemTop - 1) + '" r="6"/>';
      return s + "</svg>";
    }
    function render() {
      decay();
      var lvl = level(), el = $("#plant"); if (!el) return;
      el.innerHTML = svg(lvl); $("#plantMsg").textContent = msgs[Math.min(lvl, msgs.length - 1)];
      if (lastLevel !== -1 && lvl > lastLevel) { el.classList.remove("is-grown"); void el.offsetWidth; el.classList.add("is-grown"); }
      lastLevel = lvl;
    }
    return { render: render, addProgress: addProgress, level: level };
  })();

  /* ================= To-do (on the signboard) ================= */
  function initTodo() {
    var list = $("#todoList");
    function get() { return Store.get("todos", []); }
    function save(t) { Store.set("todos", t); }
    function render() {
      list.innerHTML = "";
      get().forEach(function (t) {
        var li = document.createElement("li"); li.className = "todo" + (t.done ? " is-done" : "");
        var cb = document.createElement("button"); cb.className = "check"; cb.setAttribute("aria-label", "toggle");
        cb.addEventListener("click", function () {
          var items = get(), it = items.find(function (x) { return x.id === t.id; });
          it.done = !it.done; save(items); if (it.done) { Stats.logTask(); Plant.addProgress(); } render();
        });
        var span = document.createElement("span"); span.className = "todo__text"; span.textContent = t.text;
        var del = document.createElement("button"); del.className = "x"; del.textContent = "✕";
        del.addEventListener("click", function () { li.classList.add("is-leaving"); setTimeout(function () { save(get().filter(function (x) { return x.id !== t.id; })); render(); }, 220); });
        li.appendChild(cb); li.appendChild(span); li.appendChild(del); list.appendChild(li);
      });
      $("#todoCount").textContent = get().filter(function (x) { return !x.done; }).length;
      Plant.render();
    }
    $("#todoForm").addEventListener("submit", function (e) {
      e.preventDefault(); var v = $("#todoInput").value.trim(); if (!v) return;
      var items = get(); items.push({ id: uid(), text: v, done: false }); save(items); $("#todoInput").value = ""; render();
    });
    render();
  }

  /* ================= Notes ================= */
  function initNotes() {
    var pad = $("#notesPad"), badge = $("#notesSaved"), timer;
    pad.value = Store.get("notes:pad", "");
    pad.addEventListener("input", function () { badge.textContent = "saving…"; clearTimeout(timer); timer = setTimeout(function () { Store.set("notes:pad", pad.value); badge.textContent = "saved"; }, 400); });
  }

  /* ================= Wins ================= */
  function initWins() {
    var list = $("#winsList"), MAX_PINS = 3;
    function get() { return Store.get("wins", []); }
    function save(w) { Store.set("wins", w); }
    function pinnedCount() { return get().filter(function (w) { return w.pinned; }).length; }
    function sorted() { return get().slice().sort(function (a, b) { if (!!b.pinned !== !!a.pinned) return (b.pinned?1:0)-(a.pinned?1:0); return b.createdAt-a.createdAt; }); }
    function render() {
      list.innerHTML = ""; var all = sorted(); $("#winsCount").textContent = all.length;
      if (!all.length) { var e = document.createElement("p"); e.className = "muted small"; e.textContent = "Big or small — celebrate what made you proud. 🌟"; list.appendChild(e); return; }
      all.forEach(function (w) {
        var li = document.createElement("li"); li.className = "win" + (w.pinned ? " is-pinned" : "");
        var star = document.createElement("button"); star.className = "win__star"; star.textContent = w.pinned ? "★" : "☆"; star.title = w.pinned ? "unpin" : "pin to top";
        star.addEventListener("click", function () { var items = get(), it = items.find(function (x) { return x.id === w.id; });
          if (!it.pinned && pinnedCount() >= MAX_PINS) { toast("You can pin up to 3 favorites 🌟"); return; } it.pinned = !it.pinned; save(items); render(); });
        var span = document.createElement("span"); span.className = "win__text"; span.textContent = w.text;
        var del = document.createElement("button"); del.className = "x"; del.textContent = "✕";
        del.addEventListener("click", function () { li.classList.add("is-leaving"); setTimeout(function () { save(get().filter(function (x) { return x.id !== w.id; })); render(); }, 220); });
        li.appendChild(star); li.appendChild(span); li.appendChild(del); list.appendChild(li);
      });
    }
    $("#winsForm").addEventListener("submit", function (e) {
      e.preventDefault(); var v = $("#winsInput").value.trim(); if (!v) return;
      var items = get(); items.push({ id: uid(), text: v, pinned: false, createdAt: Date.now() }); save(items); $("#winsInput").value = ""; render(); Recap.render();
      var n = items.length; if (n === 1) milestone("Your first win logged — here's to many more 🌟"); else if (n % 5 === 0) milestone(n + " wins and counting, " + CFG.names.nickname + "! ✨");
    });
    render();
  }

  /* ================= Countdown ================= */
  function initCountdown() {
    function render() {
      var c = Store.get("countdown", null), view = $("#countdownView"), form = $("#cdForm");
      if (!c) { view.hidden = true; form.hidden = false; return; } view.hidden = false; form.hidden = true;
      var today = new Date(); today.setHours(0,0,0,0);
      var days = Math.ceil((new Date(c.date + "T00:00:00") - today)/86400000);
      $("#cdLabel").textContent = c.label; $("#cdDays").textContent = days >= 0 ? days : 0; $("#cdDays").nextElementSibling.textContent = days === 1 ? "day" : "days";
      if (days < 0) { $("#cdDays").textContent = "✓"; $("#cdDays").nextElementSibling.textContent = "done"; }
    }
    $("#cdForm").addEventListener("submit", function (e) { e.preventDefault(); var l = $("#cdLabelIn").value.trim(), dt = $("#cdDateIn").value; if (!l || !dt) return; Store.set("countdown", { label: l, date: dt }); render(); });
    $("#cdClear").addEventListener("click", function () { Store.remove("countdown"); render(); });
    render();
  }

  /* ================= Mood (drawer) ================= */
  function initMood() {
    var chip = $("#moodChip");
    function todays() { return Store.get("mood:" + todayKey(), null); }
    function paint() { chip.textContent = todays() || "—"; }
    $$("#moodPopover [data-mood]").forEach(function (b) {
      b.addEventListener("click", function () { Store.set("mood:" + todayKey(), b.getAttribute("data-mood")); paint(); toast("Noted — thanks for checking in 💛"); });
    });
    paint();
    if (!todays()) setTimeout(function () { toast("How are you feeling today? Open the menu → Mood 🌈"); }, 2500);
  }

  /* ================= Why anchor (drawer) ================= */
  function initWhy() {
    var bar = $("#whyBar"), label = $("#whyText"), PH = "Tap to set your “why” — the reason behind all this 💭";
    function render() { var v = Store.get("why", ""); label.textContent = v || PH; bar.classList.toggle("is-empty", !v); }
    function edit() {
      if ($(".anchor__input", bar)) return;
      var input = document.createElement("input"); input.className = "anchor__input"; input.type = "text";
      input.value = Store.get("why", ""); input.placeholder = "Why are you studying? (your anchor)"; input.maxLength = 120;
      label.replaceWith(input); input.focus();
      function done() { Store.set("why", input.value.trim()); input.replaceWith(label); render(); }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); input.blur(); } });
      input.addEventListener("blur", done);
    }
    bar.addEventListener("click", function (e) { if (e.target.tagName !== "INPUT") edit(); });
    render();
  }

  /* ================= Breathing ================= */
  function initBreathing() {
    var overlay = $("#breatheOverlay"), text = $("#breatheText"), timer, phases = ["Breathe in…", "Hold…", "Breathe out…", "Hold…"];
    function open() { overlay.hidden = false; overlay.classList.add("is-in"); var i = 0; text.textContent = phases[0]; timer = setInterval(function () { i = (i+1) % phases.length; text.textContent = phases[i]; }, 4000); }
    function close() { clearInterval(timer); overlay.classList.remove("is-in"); setTimeout(function () { overlay.hidden = true; }, 320); }
    $("#breatheBtn").addEventListener("click", open);
    $("#breatheClose").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !overlay.hidden) close(); });
  }

  /* ================= §5 Notes basket + live bird delivery ================= */
  var NoteFeed = (function () {
    var WINDOW = 86400000, known = {}, lastNotes = [];
    function readSet() { var s = {}; Store.get("notes:readIds", []).forEach(function (id) { s[id] = 1; }); return s; }
    function markRead(ids) { var s = readSet(); ids.forEach(function (id) { s[id] = 1; }); Store.set("notes:readIds", Object.keys(s)); }
    function unread(notes) { var s = readSet(); return notes.filter(function (n) { return !s[n.id]; }).length; }
    function badge(notes) {
      var c = unread(notes), b = $("#basketBadge");
      if (c > 0) { b.hidden = false; b.textContent = c; $("#basket").classList.add("has-unread"); }
      else { b.hidden = true; $("#basket").classList.remove("has-unread"); }
    }
    function flyBird() { var bird = $("#deliveryBird"); bird.hidden = false; bird.classList.remove("is-flying"); void bird.offsetWidth; bird.classList.add("is-flying"); setTimeout(function () { bird.hidden = true; }, 3500); }
    function showBanner() { var bn = $("#noteBanner"); bn.hidden = false; bn.classList.add("is-in"); clearTimeout(window.__bnT); window.__bnT = setTimeout(function () { bn.classList.remove("is-in"); setTimeout(function () { bn.hidden = true; }, 350); }, 7000); }
    function onArrive() { flyBird(); chime(); showBanner(); }
    function renderModal(notes) {
      notes = (notes || []).slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
      var now = Date.now(), cur = notes.filter(function (n) { return now - n.createdAt < WINDOW; }), arch = notes.filter(function (n) { return now - n.createdAt >= WINDOW; });
      var c = $("#basketCurrent");
      if (!cur.length) c.innerHTML = '<p class="from-empty">No new notes right now — your earlier notes are below. 💌</p>';
      else { c.innerHTML = cur.map(function () { return '<div class="basket-note"><p></p><time></time></div>'; }).join("");
        var nodes = $$(".basket-note", c); cur.forEach(function (n, i) { $("p", nodes[i]).textContent = n.text; $("time", nodes[i]).textContent = timeAgo(n.createdAt); }); }
      var a = $("#basketArchive"); a.innerHTML = arch.length ? "" : '<p class="from-empty">Nothing in the archive yet.</p>';
      arch.forEach(function (n) { var d = document.createElement("div"); d.className = "archive-item"; d.innerHTML = "<p></p><time></time>"; $("p", d).textContent = n.text; $("time", d).textContent = new Date(n.createdAt).toLocaleString(); a.appendChild(d); });
    }
    function openBasket() { renderModal(lastNotes); $("#basketModal").hidden = false; markRead(lastNotes.map(function (n) { return n.id; })); badge(lastNotes); $("#noteBanner").hidden = true; }
    function refresh(initial) {
      Sync.fetchNotes().then(function (notes) {
        notes = notes || [];
        var fresh = notes.filter(function (n) { return !known[n.id]; });
        notes.forEach(function (n) { known[n.id] = 1; });
        lastNotes = notes;
        if (!initial && fresh.length) onArrive();
        badge(notes);
        if (!$("#basketModal").hidden) renderModal(notes);
      });
    }
    function init() {
      $("#basket").addEventListener("click", openBasket);
      $("#noteBannerOpen").addEventListener("click", openBasket);
      $("#basketClose").addEventListener("click", function () { $("#basketModal").hidden = true; });
      $("#basketModal").addEventListener("click", function (e) { if (e.target === $("#basketModal")) $("#basketModal").hidden = true; });
      refresh(true);
      var sec = (CFG.cloud && CFG.cloud.pollSeconds) || 8;
      setInterval(function () { refresh(false); }, Math.max(3, sec) * 1000);
      window.addEventListener("storage", function (e) { if (e.key === "tsc:from:notes") refresh(false); });
    }
    return { init: init };
  })();

  /* ================= §6 Consent ================= */
  function initConsent() {
    var banner = $("#consentBanner"), stateEl = $("#consentState"), chip = $("#privacyChip"), current = Store.get("share:consent", null);
    function paint() {
      if (current === "yes") stateEl.textContent = "Currently: he can see your activity. You can change this anytime.";
      else if (current === "no") stateEl.textContent = "Currently: private — nothing is shared.";
      else stateEl.textContent = "";
    }
    function openBanner() { banner.hidden = false; banner.classList.remove("is-out"); }
    function dismiss() { banner.classList.add("is-out"); setTimeout(function () { banner.hidden = true; }, 380); }
    openBanner(); paint();
    $$("[data-consent]", banner).forEach(function (btn) {
      btn.addEventListener("click", function () {
        current = btn.getAttribute("data-consent"); Store.set("share:consent", current);
        var log = Store.get("share:consentLog", []); log.push({ at: Date.now(), state: current }); Store.set("share:consentLog", log);
        paint(); startActivityPush(); dismiss();
      });
    });
    if (chip) chip.addEventListener("click", openBanner);
    startActivityPush();
  }
  function startActivityPush() {
    if (window.__tscPush) clearInterval(window.__tscPush);
    function snap() {
      var consent = Store.get("share:consent", null);
      Sync.pushActivity({
        online: true, lastSeen: Date.now(), midPomodoro: Pomo.isMidSession(),
        todosOpen: Store.get("todos", []).filter(function (t) { return !t.done; }).length,
        todos: Store.get("todos", []),
        notes: Store.get("notes:pad", ""),
        plant: Plant.level(),
      }, consent);
    }
    snap(); window.__tscPush = setInterval(snap, 20000);
  }

  /* ================= Boot ================= */
  var booted = false;
  document.addEventListener("DOMContentLoaded", function () {
    if (booted) return; booted = true;
    initGreeting(); initDrawer(); initTheme(); initBackgrounds();
    initMood();
    Pomo.init(); initReflection(); initBreathing(); EatReminder.init();
    Stats.markStreak(); Stats.render(); Streak.render();
    initTodo(); initNotes(); initCountdown();
    Plant.render(); setInterval(Plant.render, 1800000);
    NoteFeed.init();
    initConsent();
  });
})();

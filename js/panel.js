/* =====================================================================
   panel.js — the private panel (panel.html)
   §5 write notes to her · §6 view her consent-gated activity.

   LOCAL PREVIEW: reads/writes the same browser's localStorage as her
   dashboard. Cross-device viewing needs the CloudSyncProvider swap in
   store.js — see README. The consent model is honored either way:
   nothing about her activity is shown unless her current answer is "yes".
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.STUDY_CORNER_CONFIG;
  var Store = window.TSC.Store, Sync = window.TSC.Sync, todayKey = window.TSC.todayKey, uid = window.TSC.uid;
  var $ = function (s) { return document.querySelector(s); };

  // mirror her theme preference for a consistent look
  var theme = Store.get("pref:theme", null);
  if (theme) document.documentElement.setAttribute("data-theme", theme);

  function weekStart(d) {
    var x = new Date(d || new Date()); var day = (x.getDay() + 6) % 7;
    x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x;
  }
  function fmtDur(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? h + "h " : "") + (m || !h ? m + "m" : "");
  }
  function ago(ts) {
    if (!ts) return "—";
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  }

  /* ---------- consent timeline (for §6 gap-honoring) ---------- */
  // returns true if her sharing was "yes" at any moment within [start,end)
  function sharingActiveDuring(start, end) {
    var log = Store.get("share:consentLog", []);
    if (!log.length) return false;
    var state = null;
    // state entering the window
    for (var i = 0; i < log.length; i++) { if (log[i].at <= start) state = log[i].state; }
    if (state === "yes") return true;
    // any "yes" event inside the window
    for (var j = 0; j < log.length; j++) {
      if (log[j].at >= start && log[j].at < end && log[j].state === "yes") return true;
    }
    return false;
  }

  /* ---------- §6 activity ---------- */
  function renderActivity() {
    var consent = Store.get("share:consent", null);
    var badge = $("#consentBadge");
    badge.textContent = consent === "yes" ? "Sharing on" : "Private";
    badge.className = "badge-consent " + (consent === "yes" ? "badge-yes" : "badge-no");

    var body = $("#activityBody"), prog = $("#progressBody");

    if (consent !== "yes") {
      body.innerHTML = '<div class="private-note"><div class="big">🔒</div>' +
        '<p>She’s chosen to keep things private right now.</p>' +
        '<p class="muted2">Nothing about her activity is shown while sharing is off — by design.</p></div>';
      prog.innerHTML = '<p class="muted2">Progress only covers weeks she had sharing on. Right now that’s paused.</p>';
      return;
    }

    var snap = Store.get("share:lastSnapshot", null);
    var data = snap && snap.data ? snap.data : {};
    var lastSeen = data.lastSeen || (snap && snap.at) || null;
    var online = lastSeen && (Date.now() - lastSeen < 70000); // her dashboard pings ~every 20s

    var rows = "";
    rows += kv("Status", (online ? '<span class="dot-live"></span>On the dashboard'
                                  : '<span class="dot-off"></span>Away'));
    rows += kv("Last seen", ago(lastSeen));
    rows += kv("Focus session", data.midPomodoro ? "In a Pomodoro right now 🍃" : "Not mid-session");
    rows += kv("Open tasks", (data.todosOpen != null ? data.todosOpen : "—"));
    body.innerHTML = rows;

    // her tasks (read-only)
    var todos = Store.get("todos", []);
    var notes = Store.get("notes:pad", "");
    var extra = '<h2 style="margin-top:20px;">Her tasks</h2>';
    if (todos.length) {
      extra += '<ul class="ro-list">' + todos.map(function (t) {
        return '<li class="' + (t.done ? "done" : "") + '">' + esc(t.text) + "</li>";
      }).join("") + "</ul>";
    } else extra += '<p class="muted2">No tasks listed.</p>';
    extra += '<h2 style="margin-top:20px;">Her notes</h2>';
    extra += notes.trim() ? '<div class="ro-pad">' + esc(notes) + "</div>"
                          : '<p class="muted2">Her scratchpad is empty.</p>';
    extra += '<h2 style="margin-top:20px;">Listening</h2>';
    extra += '<p class="muted2">Recent-tracks history needs the Spotify Web API via cloud sync — ' +
             'not available in this local preview (the free-tier embed can’t expose track data).</p>';
    body.insertAdjacentHTML("beforeend", extra);

    renderProgress();
  }

  function renderProgress() {
    var prog = $("#progressBody");
    var rows = "", today = new Date();
    for (var w = 5; w >= 0; w--) {
      var ws = weekStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - w * 7));
      var wEnd = new Date(ws); wEnd.setDate(ws.getDate() + 7);
      var label = (w === 0 ? "This week" : w + "w ago");
      if (!sharingActiveDuring(ws.getTime(), wEnd.getTime())) {
        rows += '<tr class="wk-gap"><td>' + label + '</td><td colspan="3">— sharing off —</td></tr>';
        continue;
      }
      var min = 0, sess = 0, tasks = 0;
      for (var i = 0; i < 7; i++) {
        var d = new Date(ws); d.setDate(ws.getDate() + i);
        var day = Store.get("stats:day:" + todayKey(d), null);
        if (day) { min += day.minutes; sess += day.sessions; tasks += (day.tasks || 0); }
      }
      rows += "<tr><td>" + label + "</td><td>" + fmtDur(min) + "</td><td>" + sess + "</td><td>" + tasks + "</td></tr>";
    }
    prog.innerHTML = '<table class="wk-table"><thead><tr><th>Week</th><th>Focus</th><th>Sessions</th><th>Tasks</th></tr></thead>' +
      "<tbody>" + rows + "</tbody></table>" +
      '<p class="muted2" style="margin-top:10px;">Weeks she kept private show as gaps — never estimated or filled in.</p>';
  }

  /* ---------- §5 notes to her ---------- */
  function renderSent() {
    Sync.fetchNotes().then(function (notes) {
      notes = (notes || []).slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
      var box = $("#sentNotes");
      if (!notes.length) { box.innerHTML = '<p class="muted2">No notes sent yet.</p>'; return; }
      box.innerHTML = "";
      notes.forEach(function (n) {
        var el = document.createElement("div"); el.className = "sent-note";
        el.innerHTML = '<div style="flex:1"><p></p><time></time></div><button class="x" title="delete">✕</button>';
        el.querySelector("p").textContent = n.text;
        var fresh = Date.now() - n.createdAt < 86400000;
        el.querySelector("time").textContent = new Date(n.createdAt).toLocaleString() + (fresh ? " · showing to her now" : " · in her archive");
        el.querySelector(".x").addEventListener("click", function () { Sync.deleteNote(n.id).then(renderSent); });
        box.appendChild(el);
      });
    });
  }
  function initNotes() {
    var btn = $("#noteSend");
    btn.addEventListener("click", function () {
      var v = $("#noteInput").value.trim(); if (!v) return;
      btn.disabled = true;
      Sync.postNote({ id: uid(), text: v, createdAt: Date.now() }).then(function () {
        $("#noteInput").value = ""; btn.disabled = false; renderSent();
      });
    });
  }

  function kv(k, v) { return '<div class="kv"><span class="kv__k">' + k + '</span><span class="kv__v">' + v + "</span></div>"; }
  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------- boot + optional passcode gate ---------- */
  function open() {
    $("#gate").hidden = true; $("#panelMain").hidden = false;
    renderActivity(); renderSent(); initNotes();
    // keep the live view fresh
    setInterval(renderActivity, 15000);
  }
  function boot() {
    var pass = CFG.panel && CFG.panel.passcode;
    if (!pass) { open(); return; }
    var gate = $("#gate"); gate.hidden = false;
    function tryOpen() {
      if ($("#gateInput").value === pass) open();
      else { $("#gateErr").hidden = false; }
    }
    $("#gateBtn").addEventListener("click", tryOpen);
    $("#gateInput").addEventListener("keydown", function (e) { if (e.key === "Enter") tryOpen(); });
  }
  var booted = false;
  document.addEventListener("DOMContentLoaded", function () { if (booted) return; booted = true; boot(); });
})();

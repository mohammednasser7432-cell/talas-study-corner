/* =====================================================================
   store.js — the data layer.

   LOCAL data (her study tools): timers, to-dos, notes, plant, stats… —
   always in this browser's localStorage. Hers, on her device.

   SHARED data (§5 notes-from-him, §6 activity): routed through `Sync`, a
   small provider interface, so the cloud lives in ONE place.

   Two providers ship here:
   - LocalSyncProvider  — same-browser only (notes live in localStorage).
   - RestSyncProvider   — a Firebase-Realtime-Database-style REST endpoint,
                          enabling true cross-device live note delivery.

   The active provider is chosen from config.cloud.notesUrl below.
   ===================================================================== */

(function () {
  "use strict";

  var PREFIX = "tsc:";

  var Store = {
    get: function (key, fallback) {
      try { var raw = localStorage.getItem(PREFIX + key); return raw === null ? fallback : JSON.parse(raw); }
      catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {}
    },
    remove: function (key) { localStorage.removeItem(PREFIX + key); },
  };

  /* ---------- Local provider (same browser) ---------- */
  function LocalSyncProvider() {}
  LocalSyncProvider.prototype.isRemote = false;
  LocalSyncProvider.prototype.fetchNotes = function () {
    return Promise.resolve(Store.get("from:notes", []));
  };
  LocalSyncProvider.prototype.postNote = function (note) {
    var notes = Store.get("from:notes", []); notes.push(note); Store.set("from:notes", notes);
    return Promise.resolve({ ok: true });
  };
  LocalSyncProvider.prototype.deleteNote = function (id) {
    Store.set("from:notes", Store.get("from:notes", []).filter(function (n) { return n.id !== id; }));
    return Promise.resolve({ ok: true });
  };
  LocalSyncProvider.prototype.pushActivity = function (snapshot, consent) {
    Store.set("share:consent", consent);
    if (consent !== "yes") { Store.set("share:lastSnapshot", null); return Promise.resolve({ ok: true }); }
    Store.set("share:lastSnapshot", { at: Date.now(), data: snapshot });
    return Promise.resolve({ ok: true });
  };
  LocalSyncProvider.prototype.fetchActivity = function () {
    var snap = Store.get("share:lastSnapshot", null);
    return Promise.resolve({
      consent: Store.get("share:consent", null),
      at: snap ? snap.at : null,
      data: snap ? snap.data : null,
    });
  };

  /* ---------- Cloud provider (Firebase RTDB REST, no SDK) ---------- */
  function RestSyncProvider(baseUrl) { this.base = baseUrl.replace(/\/+$/, ""); }
  RestSyncProvider.prototype.isRemote = true;
  RestSyncProvider.prototype._notes = function () { return this.base + "/notes.json"; };
  RestSyncProvider.prototype.fetchNotes = function () {
    return fetch(this._notes())
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return [];
        if (Array.isArray(data)) return data.filter(Boolean);
        // Firebase keys the collection by push-id — flatten to a list.
        return Object.keys(data).map(function (k) {
          return Object.assign({ id: data[k].id || k, _key: k }, data[k]);
        });
      })
      .catch(function () { return []; });
  };
  RestSyncProvider.prototype.postNote = function (note) {
    return fetch(this._notes(), { method: "POST", body: JSON.stringify(note) })
      .then(function (r) { return { ok: r.ok }; })
      .catch(function () { return { ok: false }; });
  };
  RestSyncProvider.prototype.deleteNote = function (id) {
    var self = this;
    // find the push-key for this id, then DELETE it
    return this.fetchNotes().then(function (notes) {
      var hit = notes.filter(function (n) { return n.id === id; })[0];
      if (!hit || !hit._key) return { ok: false };
      return fetch(self.base + "/notes/" + hit._key + ".json", { method: "DELETE" })
        .then(function (r) { return { ok: r.ok }; });
    }).catch(function () { return { ok: false }; });
  };
  RestSyncProvider.prototype.pushActivity = function (snapshot, consent) {
    // Always write so cross-device viewers can see her current consent choice.
    // When consent isn't "yes", we deliberately omit the snapshot data itself —
    // nothing about her activity should be visible while sharing is off.
    var payload = { at: Date.now(), consent: consent, data: consent === "yes" ? snapshot : null };
    return fetch(this.base + "/activity.json", { method: "PUT", body: JSON.stringify(payload) })
      .then(function (r) { return { ok: r.ok }; })
      .catch(function () { return { ok: false }; });
  };
  RestSyncProvider.prototype.fetchActivity = function () {
    return fetch(this.base + "/activity.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  };

  /* ---------- Choose the active provider ---------- */
  var cfg = (window.STUDY_CORNER_CONFIG && window.STUDY_CORNER_CONFIG.cloud) || {};
  var Sync = (cfg.notesUrl && cfg.notesUrl.trim())
    ? new RestSyncProvider(cfg.notesUrl.trim())
    : new LocalSyncProvider();

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  window.TSC = { Store: Store, Sync: Sync, todayKey: todayKey, uid: uid };
})();

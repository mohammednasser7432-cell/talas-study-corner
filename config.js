/* =====================================================================
   Tala's Study Corner — personalization
   This is the ONE file you edit to make the dashboard yours.
   Everything below is safe to change. No coding needed — just text.
   ===================================================================== */

window.STUDY_CORNER_CONFIG = {

  // Her names — used in greetings and the rotating banner.
  names: {
    primary: "Tala",
    nickname: "Tala",
  },

  // The rotating encouragement banner (a new one each visit).
  // Use {name} or {nick} and they'll be filled in. Keep them warm. 🌱
  quotes: [
    "You don't have to do it all today, {nick} — just the next small thing. 🌸",
    "Proud of you for showing up, {name}. That's the hard part. 💛",
    "Tiny steps still move you forward, {nick}. 🐢",
    "Whatever this study session holds, you've got it. 🌿",
    "Breathe. Focus. You're more capable than you feel right now, {name}. ✨",
    "One page, one card, one Pomodoro at a time, {nick}. 🍃",
    "Your future self is already thanking you, {name}. 🌟",
    "Rest is part of the work too. Be gentle with yourself, {nick}. ☁️",
    "You always figure it out, even when it feels impossible. 💪",
    "The A7la and lovely always — now go be brilliant, {nick}. 🌷",
  ],

  // Time-of-day greetings. {nick}/{name} get filled in.
  greetings: {
    morning:   "Good morning, {nick} 🌸",
    afternoon: "Good afternoon, {name} ☀️",
    evening:   "Good evening, {nick} 🌙",
    night:     "Studying late, {nick}? I'm proud of you 🌌",
  },

  // Pomodoro defaults (minutes). She can change these in the UI too.
  pomodoro: {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    roundsBeforeLongBreak: 4,
  },

  // Calming backgrounds she can switch between (CSS gradients / colors).
  // 'name' shows in the switcher. First one is the default.
  backgrounds: [
    { name: "Meadow",      light: "linear-gradient(160deg,#eef7e8 0%,#dfeedb 55%,#e9f3e6 100%)", dark: "linear-gradient(160deg,#16241a 0%,#13211b 60%,#101a15 100%)" },
    { name: "Blossom",     light: "linear-gradient(160deg,#fbeef1 0%,#f5e1ea 55%,#f0ece6 100%)", dark: "linear-gradient(160deg,#241a20 0%,#1f1722 60%,#171320 100%)" },
    { name: "Wisteria",    light: "linear-gradient(160deg,#f1ecfa 0%,#e7e1f4 55%,#ecf1ea 100%)", dark: "linear-gradient(160deg,#1d1a2c 0%,#18162c 60%,#13191b 100%)" },
    { name: "Golden hour", light: "linear-gradient(160deg,#fdf4e3 0%,#f6ead2 55%,#eef0db 100%)", dark: "linear-gradient(160deg,#251f17 0%,#201b14 60%,#161a12 100%)" },
    { name: "Herb mist",   light: "linear-gradient(160deg,#edf4ee 0%,#e2ede6 55%,#ecf2ea 100%)", dark: "linear-gradient(160deg,#15201b 0%,#131c19 60%,#101714 100%)" },
  ],

  // Your private panel (panel.html) — §5 note-writing + §6 activity view.
  // Set a passcode to gate it (client-side only, not real security — just a
  // soft lock for a personal gift). Leave "" for no gate.
  panel: {
    passcode: "",
  },

  // Live note delivery across devices. Paste a Firebase Realtime Database URL
  // here (e.g. "https://your-project-default-rtdb.firebaseio.com") and notes
  // you post from panel.html will fly into her basket live, on any device.
  // Leave "" to run same-browser only (works across tabs, not across devices).
  // Setup steps are in the README.
  cloud: {
    notesUrl: "https://talas-study-corner-default-rtdb.firebaseio.com",
    pollSeconds: 8,
  },
};

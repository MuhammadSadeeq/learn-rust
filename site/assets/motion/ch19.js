/* Chapter 19 motion explainers: the Waiter and blocking calls.
   The scene has no code panel on purpose. Its examples need tokio, and the
   snippet checker has no crates, so the code is shown in the chapter's own
   blocks next to it (check: "skip" would label the panel "error skip"). */
(window.OX_MOTION = window.OX_MOTION || []).push({
  id: "ch19-blocking",
  title: "One Waiter, one blocked thread",
  w: 640,
  h: 300,
  actors: [
    { id: "waiter", cast: "waiter", x: 110, y: 170, size: 110, label: "Waiter" },
    { id: "hRack", text: "rack", x: 330, y: 22 },
    { id: "hPark", text: "parked", x: 500, y: 22 },
    { id: "tA", prop: "ticket", opts: { label: "A" }, x: 330, y: 70, size: 96, hidden: true },
    { id: "tB", prop: "ticket", opts: { label: "B" }, x: 330, y: 150, size: 96, hidden: true },
    { id: "tC", prop: "ticket", opts: { label: "C" }, x: 330, y: 230, size: 96, hidden: true },
    { id: "bA", prop: "bell", x: 590, y: 70, size: 48, hidden: true },
    { id: "bB", prop: "bell", x: 590, y: 150, size: 48, hidden: true },
    { id: "bC", prop: "bell", x: 590, y: 230, size: 48, hidden: true },
  ],
  beats: [
    {
      say: "<p>The Waiter has three orders in the rack. Each order is a task, and a task may wait on a timer, a socket or a database.</p>",
      do: [
        ["pop", "tA", 0],
        ["pop", "tB", 200],
        ["pop", "tC", 400],
        ["pose", "waiter", "talk", 1200, 600],
      ],
    },
    {
      say: "<p>The Waiter takes ticket A and starts it. A reaches an <code>.await</code> and has to wait for its timer, so A is parked.</p>",
      do: [
        ["move", "tA", { x: 215, y: 150 }, 500],
        ["move", "tA", { x: 500, y: 70 }, 500, 700],
        ["cls", "tA", "is-waiting", true, 1200],
      ],
    },
    {
      say: "<p>Ticket B does the same. It reaches an <code>.await</code>, so the Waiter is free to take the next order.</p>",
      do: [
        ["move", "tB", { x: 215, y: 150 }, 500],
        ["move", "tB", { x: 500, y: 150 }, 500, 700],
        ["cls", "tB", "is-waiting", true, 1200],
      ],
    },
    {
      say: "<p>Ticket C parks too. Every order is waiting now, so the Waiter has nothing to do.</p>",
      do: [
        ["move", "tC", { x: 215, y: 150 }, 500],
        ["move", "tC", { x: 500, y: 230 }, 500, 700],
        ["cls", "tC", "is-waiting", true, 1200],
        ["pose", "waiter", "think", 1400, 500],
      ],
    },
    {
      say: "<p>The timer for A fires and bell A rings. The Waiter goes back to ticket A, finishes it, and sends it out.</p>",
      do: [
        ["pop", "bA", 0],
        ["pulse", "bA", 0],
        ["shake", "bA", 300],
        ["move", "tA", { x: 215, y: 150 }, 500, 900],
        ["cls", "tA", "is-waiting", false, 900],
        ["hide", "tA", 1700],
        ["hide", "bA", 1900],
      ],
    },
    {
      say: "<p>Ticket B now calls <code>std::thread::sleep</code> instead of <code>.await</code>. It blocks the whole thread, so the Waiter stands frozen holding B, and bell C rings unanswered.</p>",
      ask: {
        q: "While ticket B runs std::thread::sleep, can the Waiter answer bell C?",
        choices: [
          "Yes, between B's sleep and C's bell",
          "No, the Waiter stays frozen on B until the sleep ends",
        ],
        answer: 1,
        explain: "The sleep blocks the thread. The Waiter cannot look at any other bell until it returns.",
      },
      do: [
        ["move", "tB", { x: 215, y: 150 }, 500],
        ["cls", "tB", "is-waiting", false, 400],
        ["pose", "waiter", "sleep", 0, 700],
        ["label", "waiter", "frozen in thread::sleep", 700],
        ["pop", "bC", 900],
        ["pulse", "bC", 1000],
        ["shake", "bC", 1200],
      ],
    },
    {
      say: "<p>With <code>tokio::time::sleep(...).await</code>, B parks instead. The Waiter answers bell C at once, then comes back to B when B's timer fires.</p>",
      do: [
        ["label", "waiter", "Waiter", 0],
        ["pose", "waiter", "talk", 900, 0],
        ["move", "tB", { x: 500, y: 150 }, 500, 0],
        ["cls", "tB", "is-waiting", true, 600],
        ["move", "tC", { x: 215, y: 150 }, 500, 900],
        ["cls", "tC", "is-waiting", false, 900],
        ["hide", "tC", 1800],
        ["hide", "bC", 1900],
        ["pop", "bB", 2400],
        ["pulse", "bB", 2400],
        ["shake", "bB", 2500],
        ["move", "tB", { x: 215, y: 150 }, 500, 2900],
        ["cls", "tB", "is-waiting", false, 2900],
        ["hide", "tB", 3700],
        ["hide", "bB", 3800],
      ],
    },
  ],
});

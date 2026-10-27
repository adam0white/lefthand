# The Left Hand

A builder carries help through a snowy village over three nights. Reach Idris and Samira before dawn. Decide what to say when a neighbour sees you.

Done for this slice means a complete three-night run with win and loss, replayable exports, exact green CI, a verified Workers deployment, independent Codex review and a central listing ready for coordinator deployment. The coordinator accepts lab readiness; the owner accepts the game after the panel and retest. No panel result is claimed by deployment.

## Goal and stakes

One delivery each night. The door is direct but lit. A labelled envelope in the well's covered delivery box reaches the named family through Danyal. The goal is aid reaching the family on at least two nights. Three deliveries is a stronger ending. Exposure changes Idris's pride, Samira's trust and later talk; it never cancels delivered help. Missing the dawn deadline or letting Yusuf become too cold can lose a delivery. Cold, exhaustion and household hunger are host rules. Every cold rescue removes 6 seconds from later nights and leaves Yusuf owing the neighbours the work they missed. Received aid remains received. No child dies. This slice does not need Yusuf's death either: someone brings him home.

A finite time window, two routes, lighting, seed-varied witness routines and one recovery choice per night create decisions with costs. A delivery produces a witness contact. A lowered lantern at the covered well box can leave the witness seeing Yusuf empty-handed; light reveals the envelope, at the well or the door. Waiting at home produces no invented sighting. The player sees a reaction immediately. Danyal reports exactly what he saw; Tariq adds his explanation, labelled as his guess. Recovery can explain the errand, keep quiet, or ask the neighbour not to tell (panel fix cycle below). Explaining names the recipients, consumes 3 seconds of the displayed dawn window and builds witness trust that saves the normal 3-second collection delay. Each exposed night adds 3 seconds to later well collection while Samira arranges a private handoff. Keeping quiet costs no conversation time. Against Danyal it preserves privacy; against Tariq his guess still becomes village talk, but not lost trust (fairness pass below). Morning gives one plain line per person; Yusuf's line names the route, the lantern at the drop, who saw him and his reply. Later nights retain social consequences.

## Coordinator rulings (2026-10-26)

1. Aid reaching the family is success. Exposure changes worldly relationships, never divine acceptance. No spoiled gift language.
2. Cut child death. The original week-of-hunger premise is unsupported. Cold and hunger remain explicitly host rules.
3. Three complete nights, one delivery each, door and well options, unavoidable witness, recovery choice, visible reactions and seed-varied routines. This follows Opus on repeated deliveries and Astra on brevity; neither a seven-night wait nor one isolated night tests cumulative suspicion.
4. JavaScript owns every grid fact. Godot draws the exact host lit-cell array, not an independent PointLight2D boundary. Each draw returns submitted cells; the host measures mismatch count and comparison count. A separate real-browser PNG check compares sampled floor colors against the same lit flags, with explicit actor, roof and label exclusions. This is a deliberate loss of smooth shadows for fair readable edges.
5. Witness memories use HF saw percepts with actorId/placeId, once per contact. No per-tick glimpsePerson calls. Sleep waking uses the existing HF salience threshold. HF lacks spatial light perception and inference from testimony to giver identity; requests target always-on HF 4.x, no opt-in or legacy continuation.
6. Concealed charity research in HF precedes any sourced screen wording. Qur'an 2:271 praises open giving too. The seven-shaded saying is Yusuf's understanding. No ruling or divine accounting is computed.
7. First release is a hello scene using compressed wasm and static asset headers. Actual edge execution failed for the pure-static gzip header approach: browsers still received compressed bytes after transport decoding. A Worker maps the wasm URL to opaque gzip storage and uses encodeBody: manual, preventing another compression layer. The fallback hello build610a5d4 executed at the edge in real Chromium and WebKit. Chromium cold load at360×690 with180KB/s,562.5ms latency and4×CPU throttling reached its first submitted frame in61.25seconds; WebKit unthrottled took1.72seconds. These are shared-machine browser observations, not physical-device benchmarks. The wasm starts at page load while plain DOM evening choices enter the same log. Throttled phone cold-load time is a finding, not a gate.
8. Morning remains one plain line per person.
9. CI installs and caches Godot 4.7.2 plus matching web templates, then lint, strict typecheck, tests, export/build and Chromium on Linux and WebKit on macOS at 360x690 and 1280x800. Linux WebKit reports a same-image framebuffer blit error with the stock template; this remains an explicitly unresolved platform limit. No console errors are filtered in the supported CI jobs. Deploy only the exact green commit. Report setup time and pain points.

## Technology and ownership

Godot 4.7.2 Compatibility single-threaded web renderer, TypeScript 7.0.2 strict with noUncheckedIndexedAccess, HF exactly 3.2.0, Node 26.12.0, pnpm 12.14.0 without hoisting. Godot holds only a drawing projection. Host fixed 10 Hz ticks and stamped input log own movement, light, weather, time and full HF Persons and RNGs. The state hash includes these. Replaying includes evening and recovery choices. The owner wants Godot learnings; this is sufficient reason to choose it. The spike did not prove deployed gzip packaging or physical phone performance. Brain consultation found no index at ~/code/brain/promoted/index.md.

HF owns actors: decisions, witness memory, belief reception, relationship effects and waking. Game rules own space, cold, deadlines and delivery. No HF implementation is copied into the game. The immutable lab-client 0.4.15 artifact supplies default-on recording, the first-visit notice and feedback with I'm stopping / I'm confused. Tools and exports require ?lab=1.

## Cast

Canonical Yusuf (34), Idris (41), Samira (29), Danyal (52, Christian well keeper), Tariq (16). Maryam and Zehra may be mentioned but are not simulated foreground people in this slice. Idris's broken leg and the household's thin winter store are dated episode fiction, not permanent canonical outcomes. Registry additions record possible outcomes without selecting one.

## Phone layout

A full-width Godot village sits between a short spoken line and thumb-sized directional controls. Evening and morning use plain DOM with no dashboard. Keyboard arrows/WASD, lantern and action match touch controls. Desktop adds map space rather than panels. Menus pause play. Hidden tabs pause play.

## Deferred

- Iteration 2 (2026-10-26) resolves the overlapping person/well labels, unmarked door, ambiguous lantern, timer drift, duplicate/stale text and mixed clock units. The lantern starts lit and names its state and action. All visible durations use the dawn clock seconds.

- Linux WebKit framebuffer presentation: investigate 2026-11-03 with the retained bounded blit diagnostic; Godot4.7.2 stock-template errors remain unresolved. macOS WebKit is the Safari-oriented CI platform, consistent with [Playwright guidance](https://playwright.dev/docs/browsers#webkit).

- Smooth light with polygon-shared visibility: 2026-11-10; first measure the grid presentation.
- Footprints, weather erasing tracks and go-betweens: 2026-11-14; keep this run bounded.
- Physical iOS/Android load and memory test: 2026-11-21; browser emulation is not a physical device result.
- HF 4.0 port: coordinated with all new games; review 2026-11-03.
- Same-tester retest 2026-10-27 ([playtest](games/lefthand-playtest-2026-10-27.md)), target 2026-11-10:
  - Draw the well delivery marker. The route says "Stand beside the marked delivery tile", but only the door is marked.
  - Reduce stuck moves by the houses east of Home.
  - Start Tariq farther from Home, or show where he is looking.
  - Fix the "Danyal" label over "Well" and the desktop arrow buttons at the fold.
  - Stop Danyal saying "I saw your envelope" when he is the collector.
- Lab-panel round `retests-1027b` (2026-10-27, build `6c34992`). ([playtest](games/lefthand-playtest-2026-10-27-panel.md)). Needs a fix cycle and a same-tester retest. Numbers come from the central F sequence; F-1621 to F-1625 are the earlier retest asks above.
  - F-1621: partly done in the panel fix cycle. The teal tiles show the well, the door label is hidden on a well night, and the text says "Stand on a highlighted tile". Still open: a well drawing that reads as a delivery box. Target 2026-11-03.
  - F-1622: reduce stuck moves on the door row. Target 2026-11-10.
  - F-1623: start Tariq and Danyal farther from Home, and vary where they meet Yusuf. Target 2026-11-03.
  - F-1624: keep the arrows and Explain/Keep quiet above the fold at 1280x800, and stop the phone arrows moving when the text grows. Target 2026-11-03.
  - F-1625: stop Danyal saying "I saw your envelope" when he is the collector. Target 2026-11-10.
  - F-1626 (blocking): **fixed in the panel fix cycle.** Yusuf has a white ring and a white "You" label; no neighbour uses white.
  - F-1627 (blocking): **fixed in the panel fix cycle.** Yusuf's morning line names the route, the lantern at the drop, who saw him and his reply. Samira always says she knows a door giver. Danyal says when he collected from the well box. Each neighbour who saw nothing names his own round. When trust drops, Idris's and Samira's lines name the cause.
  - F-1628 (blocking): **fixed in the panel fix cycle.** Each failure names its cause ("Danyal needed 4 more seconds", "You were 3 steps from the door", or the cold). The status line counts down the collection against dawn, and the well label shows the countdown on the map. The ending names the nights.
  - F-1629 (blocking): **fixed in the panel fix cycle.** The tiles that count (the marker and the four tiles directly beside it) are drawn in teal, then Home after delivery. A corner-to-corner try says it does not count.
  - F-1630 (blocking): **fixed in the panel fix cycle.** A warmth bar sits beside the lantern button all night. Its line says what lit and hidden cost, and warns from 12 hidden seconds onward. The evening and night-start text say an empty bar means being carried home. Leila's "numb hands slow movement" is not a rule and is not claimed.
  - F-1631 (blocking): **fixed in the panel fix cycle.** A third honest reply, "Ask him not to tell", has its own morning consequence (rules below).
  - F-1632: hold-to-walk or tap-to-go on touch (unreproduced timing). Target 2026-11-10.
  - F-1633: greyed arrows with "Answer first" while a question is open. Target 2026-11-10.
  - F-1634: Return home works from any tile or says where to go. Target 2026-11-10.
  - F-1635: show what missing home before dawn costs. Target 2026-11-10.
  - F-1636: fix contradicting copy (Tariq on no-delivery mornings, "Samira receives" on the well route, evening-3 "3 seconds"). Target 2026-11-10.
  - F-1637: split Rosa's two long sentences. Target 2026-11-10.
  - F-1638: separate Explain and Keep quiet. Target 2026-11-10.
- Owner panel and same-tester retest: coordinator after lab round readiness; review 2026-11-03.

## Iteration 2 endings

At least two received envelopes still meet the aid goal. Private deliveries preserve Idris’s choice of whom to tell and Samira’s trust. Repeated exposure produces an explicit lost-trust ending and longer later well handoffs; the door remains immediate, and Samira always knows the giver (the fairness pass below made an unseen door handoff private to the household). Rescues produce an explicit exhaustion/owed-work ending and shorter later nights. The ending reports both exposure and rescue when both occur. HF receives the privacy harm and coordination events; host rules set delays and deadlines. No HF source changes.

## Fairness pass endings (2026-10-27)

Live play showed one ending for nearly every human-speed run: trust lost, with Tariq the witness in 12 of 14 sightings. Three rule changes:

- Tariq's lane walk no longer ends at the tile outside Yusuf's home. Most nights he walks east along the bottom lane; about one night in three he walks north up the middle lane. The seeded routine offset picks the lane, so a run cannot teach one safe route.
- Tariq's guess alone is village talk, not lost trust. Keeping quiet now matters against Tariq: Idris worries, the neighbours repeat a guess nobody can confirm, and two such nights give the ending "the village is guessing". Trust is lost only when Yusuf names the family or a neighbour sees him leave the envelope.
- The door has a worldly upside. A door handoff with no neighbour seeing Yusuf leave the envelope is known only to the household: Idris can thank him quietly. Two such nights give the ending "they know it was you". The door stays farther and colder to reach than the well, and Samira always knows the giver.

Endings now: the help reached them (private), they know it was you, the village is guessing, trust was lost, Yusuf needs care, the household needs more help.

## Panel fix cycle (2026-10-27)

This cycle fixes the six blocking asks from the lab-panel round (F-1626 to F-1631). It keeps the fairness pass rules and the difficulty.

**Third reply: "Ask him not to tell".** Yusuf names nobody and tells no lie. He asks the neighbour to keep what he saw to himself.
- It costs 1 second of the dawn clock.
- The first time, that neighbour promises. He tells nobody that morning. The night is neither exposure nor village talk, even if he saw Yusuf leave the envelope or Tariq had a guess.
- The promise holds only once. If the same neighbour sees Yusuf on a later night, he tells people whatever Yusuf says. That night is exposure, and asking again is refused.
- Every night has a witness, so asking on night 1 or 2 is a bet that the other neighbour sees you next time. Asking on night 3 costs only the second. The ending says the neighbour still knows Yusuf has a secret.
- Each neighbour is an HF person. The request reaches him as a `told` percept ("discretion-request"), and no morning account is told to the family.

**Headless check (20 seeds per cell, the time is per tile, `claude-builds/lefthand-panel-fixes/speed.ts`).**
- The four existing policies give the same endings before and after: careful sheltered 20/20/17 (+3 talked) at 400/600/900 ms, careless exposed 60/60, cold rescued 60/60.
- Always asking is not dominant. Careful-ask is exposed in 20, 17 and 7 runs of 20 at 400/600/900 ms. Careless-ask is exposed in 60 of 60 runs at human speed.

**Schema.** State is `left-hand@3` and runs are `left-hand-run@3`: new state fields and a new reply. Exports from this build replay exactly. `@2` exports from 6c34992 and earlier are refused as "Incompatible run" (start fresh). This follows the 4.0 direction and the e6849df precedent.

**Lab artifacts.** Client 0.4.15 is vendored. Kit 0.5.17 is not: The Left Hand has never depended on the kit. Its recording notice sits in the page flow and never covers a control. 818c352 fixed the kit's notice covering controls, so that fix does not apply here.

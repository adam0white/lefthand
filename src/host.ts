import {
  type Affordance,
  tick as advancePerson,
  createPerson,
  decide,
  FRAMEWORK_VERSION,
  type Person,
  perceive,
  relationshipWith,
} from "@adam0white/human-framework";

export const TICK_HZ = 10;
export const WIDTH = 15,
  HEIGHT = 18,
  NIGHT_LIMIT = 600;
export type Command =
  | { type: "plan"; route: "door" | "well" }
  | { type: "move"; dx: number; dy: number }
  | { type: "lantern" }
  | { type: "act" }
  | { type: "recover"; choice: "explain" | "keepquiet" }
  | { type: "next" }
  | { type: "wait" };
type Point = { x: number; y: number };
type Actor = Point & {
  id: string;
  reaction: string;
  routine: string;
  lantern: boolean;
};
type Input = { tick: number; command: Command };
type Witness = {
  id: string;
  place: string;
  fact: string;
  explanation: string;
  recovered: null | "explain" | "keepquiet";
  sight: "carrying" | "empty-handed" | "leaving";
};
export type State = {
  schema: "left-hand@1";
  engine: string;
  seed: number;
  rng: number;
  tick: number;
  nightTick: number;
  hasMoved: boolean;
  exposureNights: number;
  directHandoffTonight: boolean;
  rescues: number;
  ending: "" | "sheltered" | "exposed" | "rescued" | "unsupported";
  conversationTicksRemaining: number;
  night: number;
  phase: "evening" | "night" | "morning" | "ended";
  route: "door" | "well";
  player: Point & { lantern: boolean };
  people: Person[];
  actors: Actor[];
  witness: Witness | null;
  recoveryPending: boolean;
  delivered: number;
  deliveredTonight: boolean;
  envelopePlaced: boolean;
  wellPendingTick: number | null;
  assistedWell: boolean;
  cold: number;
  outcome: string;
  status: string;
  morningLines: { id: string; name: string; line: string }[];
  history: {
    night: number;
    delivered: boolean;
    witness: Witness | null;
    exposed: boolean;
    rescued: boolean;
    lines: State["morningLines"];
    reason: string;
  }[];
  inputs: Input[];
  routineOffset: number;
};
export type Run = {
  schema: "left-hand-run@1";
  engine: string;
  seed: number;
  ticks: number;
  inputs: Input[];
  finalHash: string;
  state: State;
};
const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));
function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error("Invalid host state");
  return value;
}
const HOME = { x: 7, y: 15 },
  DOOR = { x: 11, y: 3 },
  WELL = { x: 4, y: 7 };
const CAST = [
  ["yusuf", "Yusuf", 34],
  ["idris", "Idris", 41],
  ["samira", "Samira", 29],
  ["danyal", "Danyal", 52],
  ["tariq", "Tariq", 16],
] as const;
const STARTS = [
  HOME,
  { x: 12, y: 3 },
  { x: 10, y: 3 },
  { x: 4, y: 8 },
  { x: 8, y: 14 },
];
function random(s: State): number {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function isWall(x: number, y: number): boolean {
  if (x <= 0 || y <= 0 || x >= WIDTH - 1 || y >= HEIGHT - 1) return true;
  return (
    ((x >= 1 && x <= 3) || (x >= 10 && x <= 13)) &&
    ((y >= 1 && y <= 2) || (y >= 10 && y <= 12))
  );
}
function los(a: Point, b: Point): boolean {
  let x = a.x,
    y = a.y;
  const dx = Math.abs(b.x - x),
    dy = -Math.abs(b.y - y),
    sx = x < b.x ? 1 : -1,
    sy = y < b.y ? 1 : -1;
  let e = dx + dy;
  while (x !== b.x || y !== b.y) {
    const e2 = 2 * e;
    if (e2 >= dy) {
      e += dy;
      x += sx;
    }
    if (e2 <= dx) {
      e += dx;
      y += sy;
    }
    if (isWall(x, y)) return false;
  }
  return true;
}
function distance(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function lit(s: State, p: Point): boolean {
  if (isWall(p.x, p.y)) return false;
  const lamps = [WELL, DOOR, { x: 7, y: 14 }];
  if (s.player.lantern) lamps.push(s.player);
  lamps.push(...s.actors.filter((a) => a.lantern));
  return lamps.some((l) => distance(l, p) <= 3 && los(l, p));
}
export function createGame(seed = 1): State {
  seed >>>= 0;
  const people = CAST.map(([id, name, age], i) =>
    createPerson({
      id,
      name,
      seed: (seed + i * 997) >>> 0,
      now: 1200,
      bornAt: 1200 - age * 525600,
      sex: id === "samira" ? "female" : "male",
      traits: id === "danyal" ? { honesty: 0.9 } : {},
      body: { satiety: 0.8, hydration: 0.8, sleepPressure: 0.15 },
      enable:
        id === "samira"
          ? { doze: { posture: "reclined", stimulation: 0.1 } }
          : {},
      voices: [
        { voiceId: "yusuf", trust: 0.75 },
        { voiceId: "danyal", trust: 0.9 },
        { voiceId: "tariq", trust: 0.6 },
      ],
    }),
  );
  const s: State = {
    schema: "left-hand@1",
    engine: FRAMEWORK_VERSION,
    seed,
    rng: seed,
    tick: 0,
    nightTick: 0,
    hasMoved: false,
    exposureNights: 0,
    directHandoffTonight: false,
    rescues: 0,
    ending: "",
    conversationTicksRemaining: 0,
    night: 1,
    phase: "evening",
    route: "door",
    player: { ...HOME, lantern: true },
    people,
    actors: CAST.map(([id], i) => ({
      id,
      ...required(STARTS[i]),
      reaction: "",
      routine: "at home",
      lantern: id === "danyal" || id === "tariq",
    })),
    witness: null,
    recoveryPending: false,
    delivered: 0,
    deliveredTonight: false,
    envelopePlaced: false,
    wellPendingTick: null,
    assistedWell: false,
    cold: 0,
    outcome: "",
    status:
      "Prepare one envelope for Idris and Samira. Choose their door or the well box.",
    morningLines: [],
    history: [],
    inputs: [],
    routineOffset: 0,
  };
  return s;
}
/** True when an earlier explanation left a trusting neighbour who shortens collection. */
function neighbourAssists(s: State): boolean {
  return s.history.some(
    (h) =>
      h.delivered &&
      h.witness?.recovered === "explain" &&
      relationshipWith(
        required(s.people.find((p) => p.id === h.witness?.id)),
        "yusuf",
      ).trust > 0.5,
  );
}
/** Dawn-clock seconds the well collection will take on the coming night. */
export function upcomingWellSeconds(s: State): number {
  return ((neighbourAssists(s) ? 0 : 30) + s.exposureNights * 30) / 10;
}
function chooseRoutines(s: State) {
  s.routineOffset = Math.floor(random(s) * 80);
  for (const a of s.actors) {
    const p = required(s.people.find((p) => p.id === a.id));
    const offers: Affordance[] = [
      {
        id: "well",
        action: "check-well",
        label: "check the well on the evening round",
        duration: 1,
        effort: 0.1,
        advertises: { competence: 0.4 },
      },
      {
        id: "lane",
        action: "walk-lane",
        label: "walk the lane before bed",
        duration: 1,
        effort: 0.05,
        advertises: { leisure: 0.3 },
      },
    ];
    const choice = decide(p, offers);
    a.routine =
      choice.chosenAffordanceId === "well"
        ? "checking the well"
        : "walking the lane";
  }
}
function startNight(s: State) {
  s.phase = "night";
  s.nightTick = 0;
  s.hasMoved = false;
  s.player = { ...HOME, lantern: true };
  s.cold = 0;
  s.deliveredTonight = false;
  s.directHandoffTonight = false;
  s.envelopePlaced = false;
  s.wellPendingTick = null;
  s.assistedWell = neighbourAssists(s);
  s.witness = null;
  s.recoveryPending = false;
  s.morningLines = [];
  s.actors.forEach((a, i) => {
    Object.assign(a, STARTS[i]);
    a.reaction = "";
  });
  const samira = required(s.people[2]);
  if (samira.body.doze) {
    samira.body.doze.since = samira.now;
    samira.body.asleep = true;
  }
  chooseRoutines(s);
  s.status = `Night ${s.night}: ${s.route === "door" ? "the family door is the longer walk. Samira takes the envelope at once, so she sees who brought it" : `the well box is closer. Danyal, who keeps the well, collects the envelope ${wellDelay(s) / 10} seconds after you leave it${s.assistedWell ? " (your earlier explanation already saves 3 seconds)" : ""}${s.exposureNights ? ", longer now because Samira waits to meet him alone" : ""}`}. Return home after delivery.${s.night === 1 ? " If any light reaches you (your lantern, a lamp or a neighbour’s lantern), a nearby neighbour can see you. Hiding your lantern helps you stay unseen, but the cold builds." : ""}${s.rescues ? ` Your rescue left you exhausted: tonight you have ${nightLimit(s) / 10} seconds before you must rest.` : ""}`;
}
function placeName(s: State): string {
  return distance(s.player, WELL) <= 1
    ? "well"
    : distance(s.player, DOOR) <= 1
      ? "family door"
      : "lane";
}
function encounter(
  s: State,
  visibleId?: string,
  sight: Witness["sight"] = s.envelopePlaced ? "empty-handed" : "carrying",
) {
  if (s.witness) return;
  // A neighbour comes around the corner once each night. This authored encounter
  // is unavoidable; ordinary light and LOS determine the rest of the visible map.
  const id =
    visibleId ??
    ((s.seed + s.night + s.routineOffset) % 2 ? "danyal" : "tariq");
  const a = required(s.actors.find((a) => a.id === id));
  const p = required(s.people.find((p) => p.id === id));
  const adjacent = required(
    [
      { x: s.player.x + 1, y: s.player.y },
      { x: s.player.x - 1, y: s.player.y },
      { x: s.player.x, y: s.player.y + 1 },
      { x: s.player.x, y: s.player.y - 1 },
    ].find((t) => !isWall(t.x, t.y)),
  );
  if (!visibleId) {
    Object.assign(a, adjacent);
    a.lantern = true;
  }
  const place = placeName(s),
    fact = `I saw Yusuf ${sight === "leaving" ? "leave an envelope" : sight === "carrying" ? "carrying an envelope" : "empty-handed"} at the ${place}.`;
  const explanation =
    id === "tariq" && sight !== "empty-handed"
      ? "I think Yusuf is helping Idris and Samira."
      : "";
  s.witness = { id, place, fact, explanation, recovered: null, sight };
  s.recoveryPending = true;
  perceive(p, [
    {
      at: p.now,
      channel: "saw",
      kind: "envelope-sighting",
      actorId: "yusuf",
      placeId: place,
      near: true,
      salience: 1,
      summary: fact,
      claims: [
        {
          prop: `night-${s.night}:yusuf-at-${place.replaceAll(" ", "-")}`,
          value: true,
          confidence: 1,
        },
      ],
    },
  ]);
  a.reaction =
    id === "danyal"
      ? sight === "empty-handed"
        ? "Danyal raises his lantern. “I saw you on the lane.”"
        : "Danyal raises his lantern. “I saw your envelope.”"
      : sight === "empty-handed"
        ? "Tariq turns. “Out late, Yusuf?”"
        : "Tariq turns. “Is that for Idris?”";
  s.status = `${a.reaction} Explain or keep quiet. The dawn clock waits for your reply.`;
}
function recover(s: State, choice: "explain" | "keepquiet") {
  if (!s.recoveryPending || !s.witness) return;
  s.witness.recovered = choice;
  s.recoveryPending = false;
  const p = required(s.people.find((p) => p.id === s.witness?.id));
  if (choice === "explain") {
    // Subsequent fixed ticks run the same cold, collection and dawn rules.
    s.conversationTicksRemaining = 30;
    const summary =
      "The envelope is for Idris and Samira. Please deliver it if you find it, and let them choose what to say.";
    perceive(p, [
      {
        at: p.now,
        channel: "told",
        kind: "delivery-explanation",
        actorId: "yusuf",
        targetId: p.id,
        near: true,
        salience: 0.9,
        summary,
      },
      {
        at: p.now,
        channel: "social",
        kind: "shared-work",
        actorId: "yusuf",
        targetId: p.id,
        near: true,
        valence: 0.8,
        salience: 1,
        summary:
          "Yusuf and I agree how to get this labelled envelope to the household. I will help coordinate the delivery.",
      },
    ]);
    s.witness.explanation =
      "Yusuf told me the envelope was for Idris and Samira; he asked for discretion.";
  }
  s.status =
    choice === "explain"
      ? "You spend 3 seconds naming Idris and Samira and agreeing how to help them. Your neighbour will help, but the family’s need is now named."
      : s.witness.explanation
        ? "You keep quiet. Tariq will still tell people his own guess."
        : "You keep quiet. Your neighbour will tell only what he saw.";
}
function wellDelay(s: State) {
  return (s.assistedWell ? 0 : 30) + s.exposureNights * 30;
}
function nightLimit(s: State) {
  return NIGHT_LIMIT - s.rescues * 60;
}
function morning(s: State, reason: string, rescued = false) {
  if (s.recoveryPending)
    throw new Error("Morning requires a resolved encounter");
  // A scheduled handoff is not receipt. The delivery window has closed.
  s.wellPendingTick = null;
  s.conversationTicksRemaining = 0;
  const w = s.witness;
  const exposed =
    s.directHandoffTonight ||
    (!!w &&
      (w.recovered === "explain" || w.sight === "leaving" || !!w.explanation));
  if (exposed) s.exposureNights++;
  if (rescued) s.rescues++;
  const report = w
    ? w.fact +
      (w.explanation
        ? ` ${w.explanation}`
        : " I cannot say who the envelope was for.")
    : "I did not see Yusuf last night.";
  for (const id of ["idris", "samira"]) {
    const p = required(s.people.find((p) => p.id === id));
    perceive(p, [
      {
        at: p.now,
        channel: "told",
        kind: "morning-account",
        actorId: w?.id ?? "danyal",
        targetId: id,
        salience: 0.9,
        summary: report,
      },
    ]);
    if (exposed)
      perceive(p, [
        {
          at: p.now,
          channel: "social",
          kind: "harm",
          actorId: "yusuf",
          targetId: id,
          near: true,
          valence: -0.8,
          salience: 1,
          summary:
            id === "idris"
              ? "The village is discussing our need. I wanted to choose whom to tell."
              : "Yusuf let our household become village talk. I need a more private handoff next time.",
        },
      ]);
    if (s.deliveredTonight && w?.recovered === "explain")
      perceive(p, [
        {
          at: p.now,
          channel: "told",
          kind: "gift",
          actorId: "yusuf",
          targetId: id,
          valence: 0.7,
          salience: 1,
          summary:
            "The envelope Yusuf arranged reached our household. We know whom to thank.",
          claims: [{ prop: "gift-giver:yusuf", value: true, confidence: 0.9 }],
        },
      ]);
  }
  s.morningLines = CAST.map(([id, name]) => ({
    id,
    name,
    line:
      id === "yusuf"
        ? reason
        : id === "idris"
          ? s.deliveredTonight
            ? exposed
              ? s.exposureNights >= 2
                ? "The help is ours, but everyone discusses our need now. I will not discuss it with Yusuf."
                : "I accept the help, but I wanted to choose who knew we needed it."
              : "The envelope reached our household. We will use it for food and fuel."
            : "No envelope reached us last night. We still need food and fuel."
          : id === "samira"
            ? s.deliveredTonight
              ? exposed
                ? "The help reached us. I trust Yusuf less with our privacy; next time Danyal must wait until I can meet him alone."
                : "I brought the envelope inside. Our need has stayed private."
              : "We managed this morning. We need help before the next one."
            : id === w?.id
              ? report
              : exposed
                ? "People are talking about Yusuf helping Idris and Samira."
                : s.deliveredTonight
                  ? "I did not see the delivery; I cannot name the giver."
                  : "I did not see Yusuf last night.",
  }));
  s.history.push({
    night: s.night,
    delivered: s.deliveredTonight,
    witness: copy(w),
    exposed,
    rescued,
    lines: copy(s.morningLines),
    reason,
  });
  s.phase = "morning";
  s.status = reason;
}
function receiveAid(s: State) {
  if (s.deliveredTonight) return;
  s.deliveredTonight = true;
  // Samira sees Yusuf at her own door even if a neighbour saw him earlier.
  s.directHandoffTonight = s.route === "door";
  if (s.directHandoffTonight)
    perceive(required(s.people[2]), [
      {
        at: required(s.people[2]).now,
        channel: "saw",
        kind: "door-handoff",
        actorId: "yusuf",
        targetId: "samira",
        placeId: "family-home",
        salience: 1,
        summary: "Yusuf handed our envelope to me at our door.",
        claims: [{ prop: "gift-giver:yusuf", value: true, confidence: 1 }],
      },
    ]);
  s.delivered++;
  s.wellPendingTick = null;
  const p = required(s.people[2]);
  // The host authors the audible knock. HF owns waking at its existing salience gate.
  perceive(p, [
    {
      at: p.now,
      channel: "heard",
      kind: "knock",
      actorId: s.route === "door" ? "yusuf" : "danyal",
      targetId: p.id,
      near: true,
      salience: 0.9,
      summary:
        s.route === "door"
          ? "A knock announces an envelope at the door."
          : "The well keeper knocks and hands over the labelled envelope.",
    },
  ]);
  perceive(p, [
    {
      at: p.now,
      channel: "saw",
      kind: "gift-received",
      targetId: "samira",
      placeId: "family-home",
      salience: 1,
      summary:
        "An envelope addressed to Idris and Samira reached the household.",
      claims: [
        { prop: `night-${s.night}:aid-received`, value: true, confidence: 1 },
      ],
    },
  ]);
  s.status =
    "Samira receives the envelope. The help remains theirs. Return home.";
}
function deliver(s: State) {
  if (s.envelopePlaced) {
    s.status = s.deliveredTonight
      ? "Tonight’s envelope is delivered. Return to your home."
      : distance(s.player, HOME) <= 1
        ? "You are home. Danyal has not collected the envelope yet; wait for him, then go inside."
        : "Danyal is on his way to collect the envelope. You may start walking home.";
    return;
  }
  const target = s.route === "door" ? DOOR : WELL;
  if (distance(s.player, target) > 1) {
    s.status =
      "Stand beside the marked delivery tile, then leave the envelope.";
    return;
  }
  s.envelopePlaced = true;
  if (s.route === "well" && wellDelay(s) > 0) {
    s.wellPendingTick = s.nightTick + wellDelay(s);
    s.status = `The envelope is in the well box. Danyal collects it in ${wellDelay(s) / 10} seconds${s.exposureNights ? ", once Samira can meet him alone" : ""}. You may start walking home.`;
  } else receiveAid(s);
  if (!s.witness)
    encounter(
      s,
      undefined,
      s.player.lantern || s.route === "door" ? "leaving" : "empty-handed",
    );
}
function normalized(c: Command): Command {
  if (c.type === "move") {
    if (
      !Number.isInteger(c.dx) ||
      !Number.isInteger(c.dy) ||
      Math.abs(c.dx) + Math.abs(c.dy) !== 1
    )
      throw new Error("Move must be one cardinal tile");
    return { type: "move", dx: c.dx, dy: c.dy };
  }
  if (c.type === "plan" && !["door", "well"].includes(c.route))
    throw new Error("Unknown route");
  if (c.type === "recover" && !["explain", "keepquiet"].includes(c.choice))
    throw new Error("Unknown recovery");
  if (
    !["move", "plan", "recover", "lantern", "act", "next", "wait"].includes(
      c.type,
    )
  )
    throw new Error("Unknown command");
  return copy(c);
}
/** Mutates and returns the authoritative state. One call is one fixed 10 Hz tick.
 * One tick advances one game second (HF time is measured in minutes).
 */
export function step(s: State, command?: Command): State {
  const conversing = s.conversationTicksRemaining > 0;
  if (command) {
    command = normalized(command);
    s.inputs.push({ tick: s.tick, command });
  }
  if (command?.type === "plan" && s.phase === "evening") {
    s.route = command.route;
    startNight(s);
  } else if (command?.type === "next" && s.phase === "morning") {
    if (s.night === 3) {
      s.phase = "ended";
      s.outcome =
        s.delivered >= 2
          ? "The household has food and fuel: your help reached them on at least two nights."
          : "The household received too little help. They need another source of support.";
      s.ending =
        s.delivered < 2
          ? "unsupported"
          : s.rescues
            ? "rescued"
            : s.exposureNights >= 2
              ? "exposed"
              : "sheltered";
      s.outcome +=
        s.exposureNights >= 2
          ? " Repeated exposure made their need village talk. Idris keeps his distance; Samira no longer trusts Yusuf with a private delivery. Future help must be arranged with them directly."
          : s.exposureNights
            ? " One night became village talk. Idris wanted to choose who knew; Samira now asks Danyal to wait until she can meet him alone."
            : " Their need stayed private. Idris keeps his dignity; Samira trusts the quiet arrangement.";
      s.outcome += s.rescues
        ? ` Yusuf needed ${s.rescues === 1 ? "one rescue" : `${s.rescues} rescues`}. He remains exhausted and owes the neighbours the work they missed bringing him home; he cannot keep making these walks alone.`
        : " Yusuf needed no rescue.";
      s.status = s.outcome;
    } else {
      s.night++;
      s.phase = "evening";
      s.status =
        "Prepare the next envelope. Choose their door or the well box.";
    }
  } else if (s.phase === "night" && command && !conversing) {
    if (command.type === "recover") recover(s, command.choice);
    else if (!s.recoveryPending) {
      if (command.type === "move") {
        const p = { x: s.player.x + command.dx, y: s.player.y + command.dy };
        if (!isWall(p.x, p.y)) {
          Object.assign(s.player, p);
          s.hasMoved = true;
        }
      }
      if (command.type === "lantern") s.player.lantern = !s.player.lantern;
      if (command.type === "act") {
        if (s.deliveredTonight && distance(s.player, HOME) <= 1)
          morning(s, "You returned home. The household keeps the help.");
        else deliver(s);
      }
    }
  }
  s.tick++;
  const now = 1200 + s.tick / 60;
  for (const p of s.people) advancePerson(p, now);
  required(s.actors[0]).x = s.player.x;
  required(s.actors[0]).y = s.player.y;
  if (s.phase === "night") {
    if (conversing) s.conversationTicksRemaining--;
    if (!s.recoveryPending) s.nightTick++;
    if (!s.recoveryPending && (s.nightTick + s.routineOffset) % 20 === 0) {
      for (const a of s.actors.filter(
        (a) => a.id === "danyal" || a.id === "tariq",
      )) {
        if (a.id === s.witness?.id) continue;
        const outward =
          Math.floor((s.nightTick + s.routineOffset) / 100) % 2 === 0;
        const target = outward
          ? a.routine === "checking the well"
            ? WELL
            : { x: 7, y: 13 }
          : required(STARTS[CAST.findIndex(([id]) => id === a.id)]);
        const candidates = [
          { x: a.x + Math.sign(target.x - a.x), y: a.y },
          { x: a.x, y: a.y + Math.sign(target.y - a.y) },
        ];
        const next = candidates.find(
          (p) => !isWall(p.x, p.y) && distance(p, target) < distance(a, target),
        );
        if (next) Object.assign(a, next);
      }
    }
    if (!s.recoveryPending)
      s.cold += s.player.lantern ? -Math.min(s.cold, 2) : 1;
    if (s.wellPendingTick !== null && s.nightTick >= s.wellPendingTick)
      receiveAid(s);
    if (!s.witness && s.hasMoved && s.nightTick >= 10 && s.player.y < 13) {
      const visible = s.actors.find(
        (a) =>
          (a.id === "danyal" || a.id === "tariq") &&
          distance(a, s.player) <= 4 &&
          lit(s, s.player) &&
          los(a, s.player),
      );
      if (visible) encounter(s, visible.id);
    }
    // Only a real sighting or a delivery can trigger a witness; never invent an envelope at home.
    if (!s.recoveryPending && s.cold >= 420)
      morning(
        s,
        `The cold forced you to seek shelter. A neighbour missed work to bring you home. You owe that work, and exhaustion shortens later nights.${s.deliveredTonight ? " Tonight’s envelope stays with the household." : s.envelopePlaced ? " The envelope in the well box never reached them." : ""}`,
        true,
      );
    else if (!s.recoveryPending && s.nightTick >= nightLimit(s))
      morning(
        s,
        s.deliveredTonight
          ? "Dawn came before you reached home. Tonight’s envelope stays with the household."
          : "Dawn came before any envelope reached Idris and Samira.",
      );
  }
  return s;
}
export function projection(s: State) {
  return {
    width: WIDTH,
    height: HEIGHT,
    tick: s.tick,
    nightTick: s.nightTick,
    nightLimit: nightLimit(s),
    exposureNights: s.exposureNights,
    rescues: s.rescues,
    ending: s.ending,
    night: s.night,
    phase: s.phase,
    route: s.route,
    player: copy(s.player),
    landmarks: [
      { name: "Yusuf’s home", ...HOME, kind: "home" },
      { name: "Idris and Samira", ...DOOR, kind: "door" },
      { name: "Labelled well box", ...WELL, kind: "well" },
    ],
    tiles: Array.from({ length: WIDTH * HEIGHT }, (_, i) => {
      const x = i % WIDTH,
        y = Math.floor(i / WIDTH);
      return {
        x,
        y,
        wall: isWall(x, y),
        lit: lit(s, { x, y }),
        playerLit:
          s.player.lantern &&
          !isWall(x, y) &&
          distance(s.player, { x, y }) <= 3 &&
          los(s.player, { x, y }),
        label:
          x === DOOR.x && y === DOOR.y
            ? "door"
            : x === WELL.x && y === WELL.y
              ? "well"
              : x === HOME.x && y === HOME.y
                ? "home"
                : "",
      };
    }),
    people: s.actors
      .filter((a) => a.id !== "yusuf")
      .map((a) => ({
        ...copy(a),
        name: required(s.people.find((p) => p.id === a.id)).name,
        awake: !required(s.people.find((p) => p.id === a.id)).body.asleep,
      })),
    status: s.status,
    recoveryPending: s.recoveryPending,
    conversationTicksRemaining: s.conversationTicksRemaining,
    witness: s.witness ? { id: s.witness.id, fact: s.witness.fact } : null,
    morningLines: copy(s.morningLines),
    delivered: s.delivered,
    deliveredTonight: s.deliveredTonight,
    deliveryPending: s.wellPendingTick !== null,
    handoffRemaining:
      s.wellPendingTick === null
        ? 0
        : Math.max(0, s.wellPendingTick - s.nightTick),
    assistedWell: s.assistedWell,
    coldWarning:
      s.phase !== "night"
        ? ""
        : s.cold >= 360
          ? "You are shaking from cold. Raise the lantern or head home before you need rescue."
          : s.cold >= 240
            ? "Your hands are numb. Raise the lantern to recover warmth."
            : "",
    outcome: s.outcome,
    home: HOME,
    door: DOOR,
    well: WELL,
  };
}
function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  return (
    "{" +
    Object.keys(v)
      .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`,
      )
      .join(",") +
    "}"
  );
}
/** Full authoritative state, including HF Persons, all RNG, history and inputs. */
export function hash(s: State): string {
  const t = stable(s);
  let a = 2166136261,
    b = 0x9e3779b9;
  for (let i = 0; i < t.length; i++) {
    a = Math.imul(a ^ t.charCodeAt(i), 16777619);
    b = Math.imul(b ^ t.charCodeAt(i), 2246822519);
  }
  return (
    (a >>> 0).toString(16).padStart(8, "0") +
    (b >>> 0).toString(16).padStart(8, "0")
  );
}
export function exportRun(s: State): Run {
  return copy({
    schema: "left-hand-run@1",
    engine: s.engine,
    seed: s.seed,
    ticks: s.tick,
    inputs: s.inputs,
    finalHash: hash(s),
    state: s,
  });
}
export function replayRun(run: Run): State {
  if (
    run.schema !== "left-hand-run@1" ||
    run.engine !== FRAMEWORK_VERSION ||
    !Number.isSafeInteger(run.ticks) ||
    run.ticks < 0
  )
    throw new Error("Incompatible run");
  const s = createGame(run.seed);
  let cursor = 0;
  for (let t = 0; t < run.ticks; t++) {
    const e = run.inputs[cursor];
    if (e && e.tick < t) throw new Error("Invalid input order");
    step(s, e?.tick === t ? required(run.inputs[cursor++]).command : undefined);
  }
  if (
    cursor !== run.inputs.length ||
    hash(s) !== run.finalHash ||
    hash(run.state) !== run.finalHash
  )
    throw new Error("Replay hash mismatch");
  return s;
}

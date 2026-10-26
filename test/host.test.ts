import { describe, expect, test } from "vitest";
import {
  type Command,
  createGame,
  exportRun,
  hash,
  isWall,
  projection,
  replayRun,
  type State,
  step,
} from "../src/host";

function command(s: State, c: Command) {
  step(s, c);
  if (s.recoveryPending) step(s, { type: "recover", choice: "explain" });
  while (s.conversationTicksRemaining > 0) step(s);
  if (c.type === "act")
    while (s.wellPendingTick !== null) {
      step(s);
      if (s.recoveryPending) step(s, { type: "recover", choice: "explain" });
    }
}
function walk(s: State, x: number, y: number) {
  // BFS uses the same public tile geometry the renderer draws.
  const start = `${s.player.x},${s.player.y}`,
    goal = `${x},${y}`;
  const queue = [start],
    from = new Map<string, { key: string; dx: number; dy: number }>();
  for (let i = 0; i < queue.length && !from.has(goal); i++) {
    const key = queue[i] ?? "",
      [px, py] = key.split(",").map(Number) as [number, number];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const next = `${px + dx},${py + dy}`;
      if (next !== start && !from.has(next) && !isWall(px + dx, py + dy)) {
        from.set(next, { key, dx, dy });
        queue.push(next);
      }
    }
  }
  const path: Command[] = [];
  let key = goal;
  while (key !== start) {
    const p = from.get(key);
    if (!p) throw Error("Unreachable tile");
    path.unshift({ type: "move", dx: p.dx, dy: p.dy });
    key = p.key;
  }
  for (const c of path) command(s, c);
}

describe("authoritative host", () => {
  test("explaining spends thirty fixed game ticks while quiet resumes immediately", () => {
    const explained = createGame(13);
    step(explained, { type: "plan", route: "door" });
    walk(explained, 11, 3);
    step(explained, { type: "act" });
    const quiet: State = JSON.parse(JSON.stringify(explained));
    step(explained, { type: "recover", choice: "explain" });
    step(quiet, { type: "recover", choice: "keepquiet" });
    expect(explained.nightTick).toBe(quiet.nightTick);
    expect(explained.conversationTicksRemaining).toBe(30);
    expect(quiet.conversationTicksRemaining).toBe(0);
    const before = { ...explained.player },
      started = explained.nightTick;
    step(explained, { type: "move", dx: 0, dy: -1 });
    expect(explained.player).toEqual(before);
    const restored: State = JSON.parse(JSON.stringify(explained));
    for (let i = 0; i < 29; i++) {
      step(explained);
      step(restored);
    }
    expect(explained.conversationTicksRemaining).toBe(0);
    expect(explained.nightTick - started).toBe(30);
    expect(hash(restored)).toBe(hash(explained));
    expect(hash(replayRun(exportRun(explained)))).toBe(hash(explained));
  });

  test("near dawn quiet can deliver while explaining reaches dawn before the action", () => {
    const base = createGame(13);
    command(base, { type: "plan", route: "door" });
    walk(base, 11, 3);
    step(base, { type: "act" });
    base.delivered = 0;
    base.deliveredTonight = false;
    base.envelopePlaced = false;
    // Isolate the boundary at an unresolved encounter beside the door.
    base.nightTick = 580;
    const explained: State = JSON.parse(JSON.stringify(base));
    const quiet: State = JSON.parse(JSON.stringify(base));
    step(explained, { type: "recover", choice: "explain" });
    step(quiet, { type: "recover", choice: "keepquiet" });
    step(quiet, { type: "act" });
    while (explained.phase === "night") step(explained, { type: "act" });
    expect(explained.nightTick).toBe(600);
    expect(explained.delivered).toBe(0);
    expect(explained.conversationTicksRemaining).toBe(0);
    expect(quiet.delivered).toBe(1);
  });

  test("aid received before either recovery remains delivered through its time cost", () => {
    for (const choice of ["explain", "keepquiet"] as const) {
      const s = createGame(13);
      command(s, { type: "plan", route: "door" });
      walk(s, 11, 3);
      step(s, { type: "act" });
      expect(s.deliveredTonight).toBe(true);
      step(s, { type: "recover", choice });
      for (let i = 0; i < 30; i++) step(s);
      expect(s.deliveredTonight).toBe(true);
      expect(s.delivered).toBe(1);
      expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
    }
  });

  test("cold rescue cancels a pending well handoff without awarding aid", () => {
    const s = createGame(13);
    command(s, { type: "plan", route: "well" });
    walk(s, 4, 7);
    step(s, { type: "lantern" });
    while (s.cold < 399) {
      if (s.recoveryPending) step(s, { type: "recover", choice: "keepquiet" });
      else step(s);
    }
    step(s, { type: "act" });
    expect(s.wellPendingTick).not.toBeNull();
    while (s.phase === "night") step(s);
    expect(s.status).toContain("cold");
    expect(s.delivered).toBe(0);
    expect(s.wellPendingTick).toBeNull();
    expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
  });

  test("three missed nights produce the loss ending and deterministic replay", () => {
    const s = createGame(7);
    for (let night = 1; night <= 3; night++) {
      step(s, { type: "plan", route: "door" });
      while (s.phase === "night") {
        if (s.recoveryPending)
          step(s, { type: "recover", choice: "keepquiet" });
        else step(s);
      }
      step(s, { type: "next" });
    }
    expect(s.phase).toBe("ended");
    expect(s.history).toHaveLength(3);
    expect(s.outcome).toContain("too little help");
    expect(s.people.every((p) => p.body.alive)).toBe(true);
    expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
  });

  test("a well envelope awaiting collection at dawn does not count as aid received", () => {
    const s = createGame(13);
    command(s, { type: "plan", route: "well" });
    walk(s, 4, 7);
    while (s.nightTick < 599) {
      if (s.recoveryPending) step(s, { type: "recover", choice: "keepquiet" });
      else step(s);
    }
    step(s, { type: "act" });
    expect(s.phase).toBe("morning");
    expect(s.deliveredTonight).toBe(false);
    expect(s.delivered).toBe(0);
    expect(s.wellPendingTick).toBeNull();
    expect(s.morningLines.find((p) => p.id === "samira")?.line).toContain(
      "need help",
    );
    expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
  });

  test("a lit unavoidable encounter waits for recovery before cold or dawn can end the night", () => {
    const s = createGame(13);
    step(s, { type: "plan", route: "door" });
    step(s, { type: "lantern" });
    walk(s, 11, 3);
    step(s, { type: "act" });
    const nightTick = s.nightTick,
      cold = s.cold,
      fact = s.witness?.fact;
    const view = projection(s);
    expect(view.people.find((a) => a.id === s.witness?.id)?.lantern).toBe(true);
    expect(
      view.tiles.find((t) => t.x === s.player.x && t.y === s.player.y)?.lit,
    ).toBe(true);
    for (let i = 0; i < 650; i++) step(s);
    expect(s.phase).toBe("night");
    expect(s.nightTick).toBe(nightTick);
    expect(s.cold).toBe(cold);
    step(s, { type: "recover", choice: "keepquiet" });
    while (s.cold < 240) step(s);
    expect(projection(s).coldWarning).toContain("numb");
    while (s.phase === "night") step(s);
    expect(s.status).toContain("cold");
    expect(s.witness?.fact).toBe(fact);
    expect(s.witness?.recovered).toBe("keepquiet");
    expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
  });

  test("public delivery changes HF relationships and delays the next well handoff", () => {
    const explained = createGame(13);
    command(explained, { type: "plan", route: "door" });
    walk(explained, 11, 3);
    expect(explained.witness).toBeNull();
    const quiet: State = JSON.parse(JSON.stringify(explained));
    for (const [s, choice] of [
      [explained, "explain"],
      [quiet, "keepquiet"],
    ] as const) {
      step(s, { type: "act" });
      expect(s.witness?.sight).toBe("leaving");
      expect(s.witness?.fact).toBe(
        "I saw Yusuf leave an envelope at the family door.",
      );
      command(s, { type: "recover", choice });
      walk(s, 7, 15);
      expect(s.witness?.place).toBe("family door");
      command(s, { type: "act" });
      command(s, { type: "next" });
      command(s, { type: "plan", route: "well" });
      walk(s, 4, 7);
      step(s, { type: "act" });
    }
    const trust = (s: State, id: string) =>
      s.people
        .find((p) => p.id === id)
        ?.social.relationships.find((r) => r.otherId === "yusuf")?.trust ?? 0.5;
    const witnessId = explained.history[0]?.witness?.id ?? "";
    expect(trust(explained, witnessId)).toBeGreaterThan(
      trust(quiet, witnessId),
    );
    expect(trust(explained, "samira")).toBeLessThan(0.5);
    expect(explained.exposureNights).toBe(1);
    expect(explained.assistedWell).toBe(true);
    expect(explained.deliveredTonight).toBe(false);
    expect(quiet.assistedWell).toBe(false);
    expect(quiet.deliveredTonight).toBe(false);
    expect(projection(quiet).handoffRemaining).toBeGreaterThan(0);
    if (quiet.recoveryPending)
      step(quiet, { type: "recover", choice: "keepquiet" });
    while (!quiet.deliveredTonight) step(quiet);
    expect(quiet.delivered).toBe(explained.delivered + 1);
    expect(hash(replayRun(exportRun(explained)))).toBe(hash(explained));
  });
  test("two deliveries meet the primary goal even when the third night misses dawn", () => {
    const s = createGame(4);
    for (let night = 1; night <= 3; night++) {
      command(s, { type: "plan", route: "well" });
      if (night < 3) {
        walk(s, 4, 7);
        command(s, { type: "act" });
        walk(s, 7, 15);
        command(s, { type: "act" });
      } else {
        while (s.phase === "night") {
          if (s.recoveryPending)
            command(s, { type: "recover", choice: "keepquiet" });
          else step(s);
        }
      }
      command(s, { type: "next" });
    }
    expect(s.delivered).toBe(2);
    expect(s.phase).toBe("ended");
    expect(s.outcome).toContain("at least two");
  });
  test("three nights deliver once per night; exposure preserves aid; both destinations reach family", () => {
    const s = createGame(13);
    for (let n = 1; n <= 3; n++) {
      const route = n === 2 ? "well" : "door";
      command(s, { type: "plan", route });
      walk(s, route === "door" ? 11 : 4, route === "door" ? 3 : 7);
      command(s, { type: "act" });
      expect(s.delivered).toBe(n);
      expect(s.people.find((p) => p.id === "samira")?.body.asleep).toBe(false);
      command(s, { type: "act" });
      expect(s.delivered).toBe(n);
      expect(s.witness).not.toBeNull();
      walk(s, 7, 15);
      command(s, { type: "act" });
      expect(s.phase).toBe("morning");
      expect(s.morningLines).toHaveLength(5);
      command(s, { type: "next" });
    }
    expect(s.phase).toBe("ended");
    expect(s.outcome).toContain("at least two");
    expect(s.history).toHaveLength(3);
    expect(s.people.every((p) => p.body.alive)).toBe(true);
    const log = exportRun(s),
      replay = replayRun(log);
    expect(hash(log.state)).toBe(hash(s));
    expect(hash(replay)).toBe(hash(s));
    // A restored whole state includes HF Persons and RNG, and can continue identically.
    const restored: State = JSON.parse(JSON.stringify(s));
    step(s, { type: "wait" });
    step(restored, { type: "wait" });
    expect(hash(restored)).toBe(hash(s));
    expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
  });

  test("active-night replay and JSON continuation retain people, RNG and authored witness facts", () => {
    const s = createGame(13);
    command(s, { type: "plan", route: "door" });
    walk(s, 11, 3);
    step(s, { type: "act" });
    for (let i = 0; i < 130; i++) step(s, { type: "wait" });
    expect(s.recoveryPending).toBe(true);
    expect(projection(s).people.some((p) => p.reaction.length > 0)).toBe(true);
    expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
    const restored: State = JSON.parse(JSON.stringify(s));
    for (const c of [
      { type: "recover", choice: "keepquiet" },
      { type: "lantern" },
      { type: "move", dx: 0, dy: -1 },
      { type: "wait" },
    ] as Command[]) {
      step(s, c);
      step(restored, c);
    }
    expect(hash(restored)).toBe(hash(s));
    const before = hash(s);
    const person = restored.people[0];
    if (!person) throw Error("Missing player");
    person.rng.a++;
    expect(hash(restored)).not.toBe(before);
    const fact = s.witness?.fact;
    for (let i = 0; i < 20; i++) step(s);
    expect(s.witness?.fact).toBe(fact);
  });

  test("dawn and cold end the night safely, and a missed night does not end the three-night game", () => {
    const s = createGame(7);
    command(s, { type: "plan", route: "door" });
    for (let i = 0; i < 600 && s.phase === "night"; i++) {
      if (s.recoveryPending) step(s, { type: "recover", choice: "keepquiet" });
      else step(s);
    }
    expect(s.phase).toBe("morning");
    expect(s.status).toContain("Dawn");
    expect(s.delivered).toBe(0);
    command(s, { type: "next" });
    command(s, { type: "plan", route: "well" });
    command(s, { type: "lantern" });
    for (let i = 0; i < 500 && s.phase === "night"; i++) {
      if (s.recoveryPending) step(s, { type: "recover", choice: "keepquiet" });
      else step(s);
    }
    expect(s.phase).toBe("morning");
    expect(s.status).toContain("cold");
    expect(s.people.every((p) => p.body.alive)).toBe(true);
  });

  test("seed varies routines and projection geometry agrees with movement", () => {
    const a = createGame(1),
      b = createGame(2);
    step(a, { type: "plan", route: "door" });
    step(b, { type: "plan", route: "door" });
    expect(a.routineOffset).not.toBe(b.routineOffset);
    const view = projection(a);
    expect(view.tiles).toHaveLength(270);
    expect(
      view.tiles
        .filter((t) => t.label)
        .map((t) => t.label)
        .sort(),
    ).toEqual(["door", "home", "well"]);
    expect(() => step(a, { type: "move", dx: 1, dy: 1 })).toThrow();
    a.player = { x: 1, y: 3, lantern: true };
    step(a, { type: "move", dx: 0, dy: -1 });
    expect(a.player.y).toBe(3);
  });
});

describe("iteration two consequences", () => {
  test("waiting at home never invents a sighting before the first move", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const s = createGame(seed);
      step(s, { type: "plan", route: "well" });
      for (let i = 0; i < 150; i++) step(s);
      expect(s.witness).toBeNull();
      expect(s.recoveryPending).toBe(false);
      step(s, { type: "move", dx: 0, dy: -1 });
      expect(s.witness).toBeNull();
      expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
    }
  });
  test("a rescue leaves a shorter next night and no stale cold warning", () => {
    const s = createGame(13);
    command(s, { type: "plan", route: "well" });
    command(s, { type: "lantern" });
    for (let i = 0; i < 1000 && s.phase === "night"; i++) {
      if (s.recoveryPending) step(s, { type: "recover", choice: "keepquiet" });
      else step(s);
    }
    expect(projection(s).coldWarning).toBe("");
    command(s, { type: "next" });
    command(s, { type: "plan", route: "well" });
    expect(projection(s).nightLimit).toBe(540);
    expect(s.status).toContain("rescue");
    expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
  });
});

test("a prior quiet witness cannot hide a later direct door handoff", async () => {
  const { shortestPath } = await import("../scripts/policies");
  const s = createGame(1);
  const quiet = () => {
    if (s.recoveryPending) step(s, { type: "recover", choice: "keepquiet" });
  };
  const travel = (target: { x: number; y: number }) => {
    for (const c of shortestPath(s, target)) {
      quiet();
      step(s, c);
    }
  };
  step(s, { type: "plan", route: "door" });
  travel({ x: 4, y: 7 });
  for (let i = 0; i < 30 && !s.witness; i++) step(s);
  quiet();
  expect(s.witness?.id).toBe("danyal");
  expect(s.witness?.sight).toBe("carrying");
  travel({ x: 11, y: 3 });
  step(s, { type: "act" });
  quiet();
  travel({ x: 7, y: 15 });
  step(s, { type: "act" });
  expect(s.delivered).toBe(1);
  expect(s.exposureNights).toBe(1);
  expect(s.morningLines.find((p) => p.id === "samira")?.line).toContain(
    "trust Yusuf less",
  );
  expect(hash(replayRun(exportRun(s)))).toBe(hash(s));
});

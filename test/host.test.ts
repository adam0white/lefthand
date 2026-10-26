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
    const s = createGame(91);
    command(s, { type: "plan", route: "well" });
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

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  draw,
  pass,
  startTalk,
  finish,
  restore,
  rollover,
  dateKey,
  remaining,
  randomIndex,
  themes,
} from "../src/core.ts";
test("30 themes are unique; every theme appears once; exhaustion is a no-op", () => {
  let s = fresh("2026-10-10");
  const found = [];
  for (let i = 0; i < 30; i++) {
    s = draw(s);
    found.push(s.active!.theme);
    s = pass(s);
  }
  assert.equal(new Set(found).size, 30);
  assert.equal(remaining(s).length, 0);
  assert.equal(draw(s), s);
  assert.equal(themes.length, 30);
});
test("passing consumes the topic and restoring preserves selected/talk state", () => {
  let s = draw(fresh("2026-10-10"), () => 0);
  const first = s.active!.theme;
  s = pass(s);
  s = draw(s, () => 0);
  assert.notEqual(s.active!.theme, first);
  assert.deepEqual(restore(JSON.stringify(s), "2026-10-10").state, s);
  s = startTalk(s);
  assert.deepEqual(restore(JSON.stringify(s), "2026-10-10").state, s);
});
test("finish is idempotent and rejects stale session IDs", () => {
  let s = startTalk(draw(fresh("2026-10-10")));
  const id = s.active!.id;
  assert.equal(finish(s, "wrong"), s);
  s = finish(s, id);
  assert.equal(s.records.length, 1);
  assert.equal(finish(s, id), s);
  const next = startTalk(draw(s));
  assert.equal(finish(next, id), next);
});
test("a new day resets only the draw state, keeping historical records", () => {
  let s = startTalk(draw(fresh("2026-10-10")));
  s = finish(s, s.active!.id);
  s = draw(s);
  const tomorrow = rollover(s, "2026-10-11");
  assert.equal(tomorrow.used.length, 0);
  assert.equal(tomorrow.active, null);
  assert.deepEqual(tomorrow.records, s.records);
  assert.equal(
    restore(JSON.stringify(s), "2026-10-11").state.records.length,
    1,
  );
});
test("local date is padded, handles month/year boundaries", () => {
  assert.equal(dateKey(new Date(2026, 0, 2, 0, 1)), "2026-01-02");
  assert.equal(dateKey(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
});
test("malformed or invalid schemas recover safely", () => {
  for (const value of [
    "{",
    "null",
    "{}",
    JSON.stringify({ ...fresh(), version: 2 }),
    JSON.stringify({ ...fresh(), used: [0, 0] }),
    JSON.stringify({ ...fresh(), day: "2026-02-31" }),
    JSON.stringify({
      ...fresh(),
      active: { id: "x", theme: 3, phase: "talk" },
    }),
    JSON.stringify({
      ...fresh(),
      records: [{ id: "a", theme: 50, date: "2026-01-01" }],
    }),
  ]) {
    const r = restore(value);
    assert.equal(r.recovered, true);
    assert.deepEqual(r.state, fresh());
  }
  assert.equal(restore(null).recovered, false);
});
test("random indices always stay within pool bounds", () => {
  for (let n = 1; n <= 30; n++)
    for (let i = 0; i < 100; i++) {
      const x = randomIndex(n);
      assert.ok(x >= 0 && x < n);
    }
  assert.throws(() => randomIndex(0));
});
test("draw cannot overwrite a selected session", () => {
  const s = draw(fresh());
  assert.equal(draw(s), s);
  assert.equal(finish(s, s.active!.id), s);
});

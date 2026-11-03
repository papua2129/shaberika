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
  restart,
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
test("used cards and unfinished sessions survive day/month/year changes", () => {
  let s = startTalk(draw(fresh("2026-10-10"), () => 0));
  s = finish(s, s.active!.id);
  s = draw(s, () => 0);
  const tomorrow = rollover(s, "2026-10-11");
  assert.deepEqual(tomorrow.used, s.used);
  assert.deepEqual(tomorrow.active, s.active);
  assert.deepEqual(tomorrow.records, s.records);
  const newYear = restore(JSON.stringify(s), "2027-01-01").state;
  assert.deepEqual(newYear.used, s.used);
  assert.deepEqual(newYear.active, s.active);
  assert.deepEqual(newYear.records, s.records);
  assert.ok(!remaining(newYear).includes(s.used[0]));
  assert.ok(!remaining(newYear).includes(s.used[1]));
});
test("saved used cards survive reloads across calendar boundaries", () => {
  let s = fresh("2026-10-11");
  s = pass(draw(s, () => 0));
  s = pass(draw(s, () => 0));
  const restored = restore(JSON.stringify(s), "2027-01-02").state;
  assert.deepEqual(restored.used, s.used);
  assert.equal(remaining(restored).length, 28);
});
test("only an explicit restart enables a new deck, without deleting records", () => {
  let s = startTalk(draw(fresh("2026-10-10")));
  s = finish(s, s.active!.id);
  s = restart(s, "2026-10-12");
  assert.deepEqual(s.used, []);
  assert.equal(s.active, null);
  assert.equal(s.records.length, 1);
  assert.equal(s.day, "2026-10-12");
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

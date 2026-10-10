export const themes = [
  "好きな食べ物は？",
  "好きなお菓子は？",
  "好きなゲームは？",
  "好きな季節は？",
  "好きな動物は？",
  "好きな給食は？",
  "最近笑ったことは？",
  "最近うれしかったことは？",
  "最近ハマっていることは？",
  "最近食べておいしかったものは？",
  "最近びっくりしたことは？",
  "最近楽しみにしていることは？",
  "空を飛べたらどこに行く？",
  "100万円もらったら？",
  "動物になれるなら何になる？",
  "透明人間になれたら？",
  "無人島に1つ持っていくなら？",
  "1日だけ大人になれたら？",
  "好きな学校行事は？",
  "好きな休み時間の遊びは？",
  "学校で好きな場所は？",
  "給食で復活してほしいメニューは？",
  "学校に新しく作りたいものは？",
  "友達とやってみたいことは？",
  "自分の得意なことは？",
  "朝起きて最初にすることは？",
  "休日は何をしている？",
  "今、楽しみにしていることは？",
  "ちょっと苦手な食べ物は？",
  "これから挑戦したいことは？",
];
export const categories = [
  "好きなもの",
  "最近のこと",
  "もしも",
  "学校・友達",
  "自分のこと",
];
export const KEY = "shaberika-v1";
export interface Session {
  id: string;
  theme: number;
  phase: "selected" | "talk";
}
export interface RecordEntry {
  id: string;
  theme: number;
  date: string;
}
export interface State {
  version: 1;
  day: string;
  used: number[];
  active: Session | null;
  records: RecordEntry[];
}
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fresh = (day = dateKey()): State => ({
  version: 1,
  day,
  used: [],
  active: null,
  records: [],
});
export function rollover(s: State, day = dateKey()): State {
  return s.day === day ? s : { ...s, day, used: [], active: null };
}
const validTheme = (v: unknown): v is number =>
  Number.isInteger(v) && Number(v) >= 0 && Number(v) < 30;
const validDate = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  dateKey(new Date(`${v}T12:00:00`)) === v;
export function restore(
  raw: string | null,
  day = dateKey(),
): { state: State; recovered: boolean } {
  if (!raw) return { state: fresh(day), recovered: false };
  try {
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !validDate(s.day) ||
      !Array.isArray(s.used) ||
      !s.used.every(validTheme) ||
      new Set(s.used).size !== s.used.length ||
      !Array.isArray(s.records)
    )
      throw Error();
    const ids = new Set<string>();
    for (const r of s.records) {
      if (
        !r ||
        typeof r.id !== "string" ||
        !r.id ||
        ids.has(r.id) ||
        !validTheme(r.theme) ||
        !validDate(r.date)
      )
        throw Error();
      ids.add(r.id);
    }
    if (
      s.active !== null &&
      (!s.active ||
        typeof s.active.id !== "string" ||
        !s.active.id ||
        !validTheme(s.active.theme) ||
        !s.used.includes(s.active.theme) ||
        !["selected", "talk"].includes(s.active.phase) ||
        ids.has(s.active.id))
    )
      throw Error();
    return { state: rollover(s, day), recovered: false };
  } catch {
    return { state: fresh(day), recovered: true };
  }
}
// Rejection sampling avoids modulo bias for every remaining pool size.
export function randomIndex(n: number): number {
  if (n < 1) throw Error("Empty pool");
  const limit = Math.floor(4294967296 / n) * n;
  const a = new Uint32Array(1);
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return a[0] % n;
}
export const remaining = (s: State) =>
  themes.map((_, i) => i).filter((i) => !s.used.includes(i));
export function draw(s: State, pick = randomIndex): State {
  if (s.active) return s;
  const pool = remaining(s);
  if (!pool.length) return s;
  const theme = pool[pick(pool.length)];
  return {
    ...s,
    used: [...s.used, theme],
    active: { id: crypto.randomUUID(), theme, phase: "selected" },
  };
}
export function startTalk(s: State): State {
  return s.active ? { ...s, active: { ...s.active, phase: "talk" } } : s;
}
export function pass(s: State): State {
  return { ...s, active: null };
}
export function finish(s: State, id: string): State {
  if (!s.active || s.active.id !== id || s.active.phase !== "talk") return s;
  const record = { id, theme: s.active.theme, date: s.day };
  return {
    ...s,
    active: null,
    records: s.records.some((r) => r.id === id)
      ? s.records
      : [...s.records, record],
  };
}

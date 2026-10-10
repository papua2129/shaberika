import "./style.css";
import {
  themes,
  categories,
  KEY,
  dateKey,
  fresh,
  restore,
  rollover,
  remaining,
  draw,
  startTalk,
  pass,
  finish,
  type State,
} from "./core";
const app = document.querySelector<HTMLDivElement>("#app")!;
let notice = "";
let state: State;
try {
  const loaded = restore(localStorage.getItem(KEY));
  state = loaded.state;
  if (loaded.recovered)
    notice =
      "保存データを読み取れなかったため、新しく始められる状態にしました。";
} catch {
  state = fresh();
  notice = "このブラウザでは保存できません。画面を閉じると記録が消えます。";
}
let spinning = false;
let spinTimer: number | undefined;
let paused = false;
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let moving = !motionQuery.matches;
let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDay = dateKey();
const hints = [
  ["受け止める", "なるほど！"],
  ["くわしく聞く", "たとえば？"],
  ["気持ちを聞く", "そのとき、どんな気持ちだった？"],
  ["自分との接点", "ぼくも同じ！"],
  ["理由を聞く", "どんなところが好き？"],
  ["確かめる", "つまり、〇〇ってこと？"],
  ["広げる", "もし〇〇だったら？"],
  ["比べる・つなげる", "それって〇〇と似ている？"],
  ["受け止める", "それは楽しそう！"],
  ["自分との接点", "私はちょっと違うな"],
  ["くわしく聞く", "もう少し教えて！"],
  ["理由を聞く", "どうしてそう思ったの？"],
  ["受け止める", "そうなんだ！"],
  ["受け止める", "それは大変だったね"],
  ["くわしく聞く", "どんな感じ？"],
  ["比べる・つなげる", "〇〇と比べるとどう？"],
  ["広げる", "ほかには？"],
  ["自分との接点", "似たことがあったよ"],
];
const glass =
  '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="27" cy="26" r="18" stroke="currentColor" stroke-width="3"/><path d="m40 40 16 16" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M17 26a10 10 0 0 1 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    notice =
      "保存できませんでした。この画面を閉じると、今回の進み具合が失われることがあります。";
  }
}
function stopSpin() {
  clearInterval(spinTimer);
  spinning = false;
}
function checkDay() {
  const next = rollover(state);
  if (next !== state) {
    state = next;
    stopSpin();
    paused = false;
    notice = "日付が変わりました。今日の30テーマを新しく用意しました。";
    save();
    return true;
  }
  return false;
}
function route() {
  return location.hash.slice(1) || "home";
}
function go(page: string) {
  stopSpin();
  if (route() === page) render();
  else location.hash = page;
}
function button(label: string, action: string, cls = "secondary") {
  return `<button class="${cls}" data-action="${action}">${label}</button>`;
}
function masthead() {
  return `<header><a class="brand" href="#home">${glass}<span>シャベリカ<small>ことばの探偵事務所</small></span></a><nav aria-label="メインメニュー"><a href="#home" ${route() === "home" ? 'aria-current="page"' : ""}>ホーム</a><a href="#records" ${route() === "records" ? 'aria-current="page"' : ""}>記録を見る</a><a href="#help" ${route() === "help" ? 'aria-current="page"' : ""}>使い方</a></nav><div class="today">今日の発見 <strong>${state.used.length}<span> / 30</span></strong></div></header>`;
}
function home() {
  return `<section class="home"><div class="hero-copy"><p class="eyebrow">SHABERIKA DETECTIVE OFFICE</p><p class="small-title">友達の「まだ知らない」を、見つけよう。</p><h1>シャベリカ<span class="title-dot">.</span></h1><h2 class="catch">聞いて、聴いて、訊いて</h2><p class="intro">ひとつの話題から、広がる会話。<br>耳をすませば、友達の新しい一面が見えてくる。</p><div class="hero-actions">${button(state.active ? "つづきからはじめる" : "はじめる　→", "begin", "primary")}<a class="text-link" href="#help">はじめての方へ ↗</a></div><p class="fine">小学4年生から ・ 2〜6人 ・ 勝ち負けなし</p></div><div class="desk-art" aria-hidden="true"><div class="orbit"></div><div class="folder"><div class="folder-tab">TALK FILES</div><p class="file-no">SHABERIKA / 030</p><div class="file-rule"></div><h3>友達のこと、<br>もっと知りたい。</h3><p>会話の手がかりは、<br>きっとすぐそばに。</p><div class="seal">S</div></div><div class="note"><span>今日の手がかり</span><p>「たとえば？」から<br>はじまる発見。</p><div class="note-lines"></div></div><div class="big-glass">${glass}</div><span class="art-caption">EVERY CONVERSATION IS A DISCOVERY.</span></div></section><section class="steps" aria-label="活動の流れ"><article><span>01</span><div><h3>話題を見つける</h3><p>ルーレットで、今日のテーマを。</p></div></article><article><span>02</span><div><h3>じっくり聴く</h3><p>ことばのヒントで、会話をつなごう。</p></div></article><article><span>03</span><div><h3>発見をふり返る</h3><p>みんなで話した記録が残るよ。</p></div></article></section>`;
}
function complete() {
  return `<section class="center completion"><p class="eyebrow">TODAY'S FILE — COMPLETE</p><div class="completion-icon">${glass}</div><h1>今日の30テーマを<br>すべて見つけたね。</h1><p>話したテーマも、パスしたテーマも。<br>また明日、新しい気持ちで話してみよう。</p><div class="actions"><a class="primary" href="#records">今日の記録を見る</a><a class="secondary" href="#home">ホームへ</a></div></section>`;
}
function roulette() {
  if (!state.active && state.used.length === 30) return complete();
  const t = state.active?.theme;
  return `<section class="roulette center"><p class="eyebrow">STEP 01 / FIND A TOPIC</p><h1>今日の話題を見つけよう</h1><p>話しにくいテーマは、パスしてもだいじょうぶ。</p><div class="topic-card ${t !== undefined ? "chosen" : ""}"><div class="card-corner">TALK FILE</div><p class="category" id="category">${t === undefined ? "30の話題から、ひとつの発見" : categories[Math.floor(t / 6)]}</p><div id="topic" class="topic" ${!spinning ? 'aria-live="polite"' : ""}>${t === undefined ? (spinning ? "どんな話題が出るかな？" : "何を話そう？") : themes[t]}</div><div class="card-bottom"><span>SHABERIKA</span><span>残り ${remaining(state).length} テーマ</span></div></div><div class="actions">${t !== undefined ? button("対話スタート　→", "talk", "primary") + button("パスする", "pass") : button(spinning ? "ストップ" : "スタート", spinning ? "stop" : "spin", "primary")}</div><p class="fine">${t !== undefined ? "選ばれたテーマは、今日もう一度出ることはありません。" : "「スタート」で動かして、「ストップ」で決めよう。"}</p></section>`;
}
function talk() {
  if (!state.active) {
    go("roulette");
    return "";
  }
  const offset = (state.active.theme % 3) * 6;
  return `<section class="talk ${paused ? "paused" : ""} ${moving ? "moving" : ""}"><div class="talk-heading"><p class="eyebrow">STEP 02 / LISTEN & DISCOVER</p><span class="tag">${categories[Math.floor(state.active.theme / 6)]}</span><h1>${themes[state.active.theme]}</h1><p>${paused ? "ひと休み中。準備ができたら再開しよう。" : "ひとりずつ話して、友達のことばに耳をすませよう。"}</p></div><div class="hint-field" aria-label="会話をつなぐヒント">${Array.from(
    { length: 6 },
    (_, i) => {
      const h = hints[(offset + i) % hints.length];
      return `<div class="hint hint-${i}"><small>${h[0]}</small><strong>${h[1]}</strong></div>`;
    },
  ).join(
    "",
  )}</div><div class="talk-controls"><div>${button(paused ? "再開" : "一時停止", "pause")}${button(moving ? "動きを止める" : "動かす", "motion")}</div>${button("対話を終える　✓", "finish", "primary")}</div></section>`;
}
function records() {
  const list = state.records.filter((r) => r.date === selectedDay);
  const count = (day: string) =>
    state.records.filter((r) => r.date === day).length;
  const first = month.getDay();
  const total = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const max = Math.max(
    1,
    ...Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return count(dateKey(d));
    }),
  );
  return `<section class="records"><div class="page-heading"><div><p class="eyebrow">YOUR DISCOVERY NOTEBOOK</p><h1>対話の記録</h1><p>話した時間が、みんなの足あとになる。</p></div><div class="total"><strong>${state.records.length}</strong> 回の対話</div></div>${!state.records.length ? '<div class="empty">まだ記録はありません。最初の対話を終えると、ここにテーマが残ります。 <a href="#roulette">話題を見つける →</a></div>' : ""}<div class="record-grid"><section class="paper"><div class="calendar-header">${button("‹", "prev-month")}<h2>${month.getFullYear()}年 ${month.getMonth() + 1}月</h2>${button("›", "next-month")}</div><div class="calendar"><div class="weekdays">${"日月火水木金土"
    .split("")
    .map((x) => `<span>${x}</span>`)
    .join(
      "",
    )}</div><div class="days">${"<span></span>".repeat(first)}${Array.from(
    { length: total },
    (_, i) => {
      const key = dateKey(
        new Date(month.getFullYear(), month.getMonth(), i + 1),
      );
      return `<button class="day ${count(key) ? "has-record" : ""} ${key === selectedDay ? "selected" : ""}" data-day="${key}" aria-label="${key}、${count(key)}回" aria-pressed="${key === selectedDay}">${i + 1}<small>${count(key) ? count(key) + "回" : "·"}</small></button>`;
    },
  ).join(
    "",
  )}</div></div><p class="fine">● 対話した日　／　日付を押すと記録が見られるよ</p></section><section class="paper daily"><p class="eyebrow">DAILY FILE</p><h2>${selectedDay.replaceAll("-", " / ")}<span class="count">${list.length}回</span></h2>${list.length ? `<ul class="theme-list">${list.map((r) => `<li><span>${categories[Math.floor(r.theme / 6)]}</span>${themes[r.theme]}</li>`).join("")}</ul>` : '<div class="empty-day">この日の対話記録は、まだありません。<br><small>パスしたテーマは記録に含まれません。</small></div>'}</section></div><div class="record-grid"><section class="paper"><h2>最近7日間の足あと</h2><div class="chart" role="img" aria-label="最近7日間の日別対話回数">${Array.from(
    { length: 7 },
    (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const n = count(dateKey(d));
      return `<div class="bar-column"><strong>${n}回</strong><div class="bar-track"><div class="bar" style="height:${(n / max) * 100}%"></div></div><span>${d.getMonth() + 1}/${d.getDate()}</span></div>`;
    },
  ).join(
    "",
  )}</div></section><section class="paper"><h2>テーマごとの記録</h2><details><summary>30テーマの実施回数を見る</summary><ul class="theme-counts">${themes.map((t, i) => `<li>${t}<strong>${state.records.filter((r) => r.theme === i).length}回</strong></li>`).join("")}</ul></details><p class="storage-note">記録はこの端末・ブラウザだけに保存されます。<br>ほかの端末とは同期されず、ブラウザのデータを消すと失われます。</p>${button("保存データをすべて消す", "delete", "danger")}</section></div></section>`;
}
function help() {
  return `<section class="help"><p class="eyebrow">WELCOME TO OUR OFFICE</p><h1>シャベリカの使い方</h1><p class="lead">話すのが得意でも、ちょっと苦手でも。<br>ここでは、みんなが「ことばの探偵」です。</p><div class="help-grid"><article class="paper"><span class="step-number">01</span><h2>2〜6人で集まろう</h2><p>同じ画面を見ながら使います。名前の入力やログインはいりません。得点も勝ち負けもありません。</p></article><article class="paper"><span class="step-number">02</span><h2>テーマを決めよう</h2><p>「スタート」→「ストップ」で話題が決まります。話しにくいときはパスでOK。選ばれた話題は、今日もう出てきません。</p></article><article class="paper"><span class="step-number">03</span><h2>聴いて、つなげよう</h2><p>まずはひとりの話を最後まで。ヒントを使って、受け止めたり、聞き返したりしてみましょう。全員が話す必要はありません。</p></article><article class="paper"><span class="step-number">04</span><h2>発見をふり返ろう</h2><p>「対話を終える」を押すとテーマが記録されます。友達の話した内容や名前は保存されません。次のテーマへ進んでみよう。</p></article></div><section class="paper"><h2>先生・おうちの方へ</h2><p>対話中は「一時停止」でヒントの動きを一時停止できます。「動きを止める」でも静止表示にできます。端末の「視差効果を減らす」設定にも対応しています。</p><p>同日の抽選状況と過去の記録は、このブラウザ内のlocalStorageに保存します。端末・ブラウザ間の同期はありません。ブラウザデータの削除やプライベートモードの終了により失われる場合があります。日付は端末の時計に従います。同時操作による競合を避けるため、1つのタブで使用してください。</p><p>マイク・カメラ・Cookie・アクセス解析は使用しません。アプリが個人情報や会話を送信することはありません。</p></section><a href="#roulette" class="primary">はじめる　→</a></section>`;
}
function render() {
  checkDay();
  const page = route();
  app.innerHTML =
    masthead() +
    `<main id="main">${notice ? `<div class="notice" role="status">${notice}</div>` : ""}${page === "roulette" ? roulette() : page === "talk" ? talk() : page === "records" ? records() : page === "help" ? help() : home()}</main><footer><span>SHABERIKA</span><p>正解よりも、発見を。今日も、いい対話を。</p><span>聞いて、聴いて、訊いて</span></footer>`;
  document
    .querySelector<HTMLButtonElement>('[data-action="prev-month"]')
    ?.setAttribute("aria-label", "前の月");
  document
    .querySelector<HTMLButtonElement>('[data-action="next-month"]')
    ?.setAttribute("aria-label", "次の月");
}
app.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>(
    "[data-action],[data-day]",
  );
  if (!el) return;
  if (checkDay()) {
    go("roulette");
    return;
  }
  if (el.dataset.day) {
    selectedDay = el.dataset.day;
    render();
    return;
  }
  const action = el.dataset.action;
  if (action === "begin") {
    go(state.active?.phase === "talk" ? "talk" : "roulette");
    return;
  }
  if (
    action === "spin" &&
    !spinning &&
    !state.active &&
    remaining(state).length
  ) {
    spinning = true;
    render();
    const pool = remaining(state);
    let index = 0;
    spinTimer = window.setInterval(() => {
      const node = document.getElementById("topic");
      if (node)
        node.textContent = motionQuery.matches
          ? "話題を選んでいます…"
          : themes[pool[index++ % pool.length]];
    }, 160);
    document.querySelector<HTMLButtonElement>('[data-action="stop"]')?.focus();
    return;
  }
  if (action === "stop" && spinning) {
    stopSpin();
    state = draw(state);
    save();
    render();
    document.querySelector<HTMLButtonElement>('[data-action="talk"]')?.focus();
    return;
  }
  if (action === "talk" && state.active) {
    state = startTalk(state);
    paused = false;
    save();
    go("talk");
    return;
  }
  if (action === "pass") {
    state = pass(state);
    save();
    render();
    return;
  }
  if (action === "finish" && state.active) {
    state = finish(state, state.active.id);
    save();
    go("roulette");
    return;
  }
  if (action === "pause") {
    paused = !paused;
    render();
    document.querySelector<HTMLButtonElement>('[data-action="pause"]')?.focus();
    return;
  }
  if (action === "motion") {
    moving = !moving;
    render();
    document
      .querySelector<HTMLButtonElement>('[data-action="motion"]')
      ?.focus();
    return;
  }
  if (action === "prev-month" || action === "next-month") {
    month = new Date(
      month.getFullYear(),
      month.getMonth() + (action === "prev-month" ? -1 : 1),
      1,
    );
    render();
    document
      .querySelector<HTMLButtonElement>(`[data-action="${action}"]`)
      ?.focus();
    return;
  }
  if (action === "delete") {
    const dialog = document.createElement("dialog");
    dialog.innerHTML =
      '<h2>記録をすべて消しますか？</h2><p>これまでの記録と今日の進み具合が消えます。<br>この操作は元に戻せません。</p><form method="dialog"><button value="cancel" autofocus>キャンセル</button><button value="delete" class="danger">すべて消す</button></form>';
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      if (dialog.returnValue === "delete") {
        state = fresh();
        notice = "保存データを消去しました。";
        save();
        render();
      }
      dialog.remove();
    });
    dialog.showModal();
  }
});
window.addEventListener("hashchange", () => {
  stopSpin();
  paused = false;
  render();
  window.scrollTo(0, 0);
  const h = document.querySelector<HTMLElement>("h1");
  if (h) {
    h.tabIndex = -1;
    h.focus();
  }
});
window.addEventListener("storage", (e) => {
  if (e.key === KEY) {
    state = restore(e.newValue).state;
    stopSpin();
    render();
  }
});
motionQuery.addEventListener("change", (e) => {
  moving = !e.matches;
  render();
});
setInterval(() => {
  if (checkDay()) {
    go("roulette");
  }
}, 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && checkDay()) go("roulette");
});
save();
render();

async (page) => {
  const results = [];
  const check = (ok, label) => {
    if (!ok) throw Error(label);
    results.push(label);
  };
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173/#records");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  check(
    (await page
      .getByText("まだ記録はありません。", { exact: false })
      .count()) === 1,
    "empty records",
  );
  await page.goto("http://127.0.0.1:5173/#roulette");
  await page.getByRole("button", { name: "スタート", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "対話スタート", exact: false })
    .waitFor();
  const first = await page.locator("#topic").innerText();
  await page.reload();
  check(
    (await page.locator("#topic").innerText()) === first,
    "selected topic restored",
  );
  await page
    .getByRole("button", { name: "対話スタート", exact: false })
    .focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "一時停止", exact: true }).focus();
  await page.keyboard.press("Enter");
  check(
    (await page
      .locator(".hint")
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState)) === "paused",
    "pause freezes animation",
  );
  await page.keyboard.press("Enter");
  check(
    (await page
      .locator(".hint")
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState)) === "running",
    "resume animation",
  );
  await page.getByRole("button", { name: "動きを止める", exact: true }).click();
  check(
    (await page
      .locator(".hint")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName)) === "none",
    "motion stopped",
  );
  await page.getByRole("button", { name: "動かす", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  check(
    (await page
      .locator(".hint")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName)) === "none",
    "reduced motion respected on reload",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [1280, 720],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "talk fits " + width,
    );
    const boxes = await page.locator(".hint").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, r: r.right, b: r.bottom };
      }),
    );
    check(
      boxes.every((a, i) =>
        boxes.every(
          (b, j) =>
            i === j || a.r <= b.x || b.r <= a.x || a.b <= b.y || b.b <= a.y,
        ),
      ),
      "hints do not overlap " + width,
    );
    await page.screenshot({
      path: `output/playwright/talk-${width}.png`,
      fullPage: true,
    });
  }
  await page
    .getByRole("button", { name: "対話を終える", exact: false })
    .focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  let s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("shaberika-v1")),
  );
  check(s.records.length === 1, "finish recorded once with keyboard");
  await page.goto("http://127.0.0.1:5173/#records");
  check(
    (await page.locator(".theme-list li").count()) === 1,
    "completed record visible",
  );
  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "records fit " + width,
    );
    await page.screenshot({
      path: `output/playwright/records-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "保存データをすべて消す" }).click();
  check(await page.locator("dialog").isVisible(), "delete confirmation");
  await page.getByRole("button", { name: "キャンセル" }).click();
  check(
    (await page.locator(".theme-list li").count()) === 1,
    "cancel keeps records",
  );
  await page.goto("http://127.0.0.1:5173/#roulette");
  if (await page.getByRole("button", { name: "ストップ", exact: true }).count())
    await page.getByRole("button", { name: "ストップ", exact: true }).click();
  s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("shaberika-v1")),
  );
  for (let i = s.used.length; i < 30; i++) {
    if (await page.getByRole("button", { name: "パスする" }).count())
      await page.getByRole("button", { name: "パスする" }).click();
    await page.getByRole("button", { name: "スタート", exact: true }).click();
    await page.getByRole("button", { name: "ストップ", exact: true }).click();
  }
  await page.getByRole("button", { name: "パスする" }).click();
  check(
    (await page.getByRole("heading", { name: /今日の30テーマを/ }).count()) ===
      1,
    "30-topic completion",
  );
  s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("shaberika-v1")),
  );
  check(new Set(s.used).size === 30, "all topics unique in UI");
  await page.reload();
  check(
    (await page
      .getByRole("button", { name: "スタート", exact: true })
      .count()) === 0,
    "exhaustion survives reload",
  );
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("shaberika-v1"));
    s.day = "2026-01-01";
    localStorage.setItem("shaberika-v1", JSON.stringify(s));
  });
  await page.reload();
  s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("shaberika-v1")),
  );
  check(
    s.used.length === 0 && s.records.length === 1,
    "day rollover retains history",
  );
  await page.evaluate(() => localStorage.setItem("shaberika-v1", "broken"));
  await page.reload();
  check(
    (await page.getByRole("status").count()) === 1,
    "corrupt storage recovered",
  );
  await page.goto("http://127.0.0.1:5173/#home");
  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "home fits " + width,
    );
    await page.screenshot({
      path: `output/playwright/home-${width}.png`,
      fullPage: true,
    });
  }
  check(errors.length === 0, "no page exceptions");
  return results;
}

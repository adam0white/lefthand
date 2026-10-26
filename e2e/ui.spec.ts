import { expect, test } from "@playwright/test";

// Exercise DOM and host scheduling without starting a Godot renderer.
test("controls, clock, pause menu and desktop evening fit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "doNotTrack", { value: "1" });
    localStorage.setItem("lefthand-notice-v1", "1");
  });
  await page.route("**/engine.json", (route) =>
    route.fulfill({
      json: { executable: "stub", script: "/stub-engine.js", pack: "stub" },
    }),
  );
  await page.route("**/stub-engine.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.Engine = class { async startGame() { window.HFBridge.ready(); } };",
    }),
  );
  await page.clock.install();
  await page.goto("/?lab=1");
  await expect(page.locator("#loading")).toBeHidden();
  if ((page.viewportSize()?.width ?? 0) > 480) {
    const bottom = await page
      .locator(".village")
      .evaluate((node) => node.getBoundingClientRect().bottom);
    expect(bottom).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
  }
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  await page.locator("#route-door").click();
  await page.clock.runFor(100);
  await expect(page.locator("#lantern")).toHaveText("Lantern lit · hide (L)");
  await page.locator("#lantern").click();
  await page.clock.runFor(100);
  await expect(page.locator("#lantern")).toHaveText(
    "Lantern hidden · light (L)",
  );
  const before = await page.evaluate(
    () => window.Lefthand.snapshot().nightTick,
  );
  // Uneven callback times must retain fractional tick time instead of losing it.
  for (let i = 0; i < 80; i++) await page.clock.fastForward(115);
  const after = await page.evaluate(() => window.Lefthand.snapshot().nightTick);
  expect(after - before).toBeGreaterThanOrEqual(91);
  expect(after - before).toBeLessThanOrEqual(93);
  await page.locator("#menu-open").click();
  await expect(page.locator("#menu")).toHaveCSS(
    "background-color",
    "rgb(16, 28, 41)",
  );
  const paused = await page.evaluate(
    () => window.Lefthand.snapshot().nightTick,
  );
  await page.clock.runFor(2000);
  expect(await page.evaluate(() => window.Lefthand.snapshot().nightTick)).toBe(
    paused,
  );
  await page.locator("#menu-close").click();
  const scroll = await page.evaluate(() => scrollY);
  await page.keyboard.press("ArrowDown");
  await page.clock.runFor(100);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
});

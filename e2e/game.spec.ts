import { expect, test } from "@playwright/test";

test("the Godot village draws at both sizes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("The village is ready.", {
    timeout: 110000,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

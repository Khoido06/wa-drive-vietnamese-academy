import { test, expect } from "@playwright/test";

test.describe("WA Drive — smoke tests", () => {
  test("home page loads with Vietnamese title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Học Lái Xe WA/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("navigation cards are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Bắt đầu học|Tiếp tục học/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Hỏi thầy giáo/i).first()).toBeVisible();
  });

  test("tutor page loads", async ({ page }) => {
    await page.goto("/tutor");
    await expect(page.getByRole("heading", { name: /Hỏi thầy giáo/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /^Hỏi$/i })).toBeVisible();
  });

  test("learn page loads", async ({ page }) => {
    await page.goto("/learn");
    await expect(page.getByRole("heading", { name: /Học bài/i })).toBeVisible({
      timeout: 20_000,
    });
  });
});

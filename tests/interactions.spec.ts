import { test, expect } from "@playwright/test";

test.describe("interactions", () => {
  test("mobile menu opens, traps and closes on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.locator("[data-menu-open]");
    await expect(toggle).toBeVisible();
    await toggle.click();
    const menu = page.locator("[data-mobile-menu]");
    await expect(menu).toBeVisible();
    await expect(menu.locator("a", { hasText: "About" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("before/after slider responds to keyboard", async ({ page }) => {
    await page.goto("/projects/");
    const handle = page.locator("[data-ba-handle]").first();
    await handle.scrollIntoViewIfNeeded();
    await handle.focus();
    const before = await handle.getAttribute("aria-valuenow");
    await handle.press("ArrowRight");
    await handle.press("ArrowRight");
    const after = await handle.getAttribute("aria-valuenow");
    expect(Number(after)).toBeGreaterThan(Number(before));
  });

  test("before/after slider moves on pointer drag", async ({ page }) => {
    await page.goto("/projects/");
    const ba = page.locator("[data-ba]").first();
    await ba.scrollIntoViewIfNeeded();
    const box = (await ba.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.up();
    const now = await ba.locator("[data-ba-handle]").getAttribute("aria-valuenow");
    expect(Number(now)).toBeLessThan(45);
  });

  test("FAQ accordion is single-open", async ({ page }) => {
    await page.goto("/pricing/");
    const items = page.locator("[data-faq] details");
    await expect(items.first()).toHaveAttribute("open", "");
    await items.nth(1).locator("summary").click();
    await expect(items.nth(1)).toHaveAttribute("open", "");
    await expect(items.first()).not.toHaveAttribute("open", "");
  });

  test("contact form validates and shows preview-mode via api", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "preview", message: "Preview mode." }) });
    });
    await page.goto("/contact/");
    await page.locator("[data-submit]").click();
    await expect(page.locator('[data-error-for="firstName"]')).toBeVisible();

    await page.fill("#firstName", "Test");
    await page.fill("#lastName", "User");
    await page.fill("#email", "not-an-email");
    await page.fill("#message", "Hello there, I'd like a quote.");
    await page.locator("[data-submit]").click();
    await expect(page.locator('[data-error-for="email"]')).toBeVisible();

    await page.fill("#email", "test@example.com");
    await page.locator("[data-submit]").click();
    await expect(page.locator("[data-status]")).toContainText(/Preview mode/i);
  });

  test("handoff document loads, is noindex, and switches tabs", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));

    const resp = await page.goto("/handoff/", { waitUntil: "load" });
    expect(resp?.status()).toBe(200);
    await expect(page).toHaveTitle(/Website Handoff/);
    await expect(page.locator("h1")).toHaveCount(1);
    // An internal client document must never be indexable, on any deployment.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    // The requested-updates tab is the point of the page — it must be reachable.
    await expect(page.locator("#panel-updates")).toBeHidden();
    await page.locator("#tab-updates").click();
    await expect(page.locator("#panel-updates")).toBeVisible();
    await expect(page.locator("#panel-changed")).toBeHidden();
    await expect(page.locator("#panel-updates")).toContainText(/Relevant services/);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "horizontal overflow on /handoff/").toBeLessThanOrEqual(2);
    expect(errors, "console errors on /handoff/").toEqual([]);
  });

  test("video modal opens and closes", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-video-open]").first().click();
    const modal = page.locator("[data-video-modal]");
    await expect(modal).toBeVisible();
    await expect(modal.locator("iframe")).toHaveAttribute("src", /youtube\.com\/embed\/pY_lOt_Yogk/);
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });
});

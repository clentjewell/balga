import { test, expect } from "@playwright/test";

const routes = [
  { path: "/", title: /Balga Designs/ },
  { path: "/about/", title: /About/ },
  { path: "/services/", title: /Services/ },
  { path: "/projects/", title: /Projects/ },
  { path: "/pricing/", title: /Pricing/ },
  { path: "/balga-blog/", title: /Blog/ },
  { path: "/contact/", title: /Contact/ },
  { path: "/what-are-native-gardens/", title: /Native Gardens/ },
  { path: "/why-designing-and-planning-are-crucial-for-successful-landscaping/", title: /Designing and Planning/ },
  { path: "/balga-meaning-purpose/", title: /Balga Meaning/ },
];

for (const r of routes) {
  test(`route ${r.path} loads clean`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));

    const resp = await page.goto(r.path, { waitUntil: "load" });
    expect(resp?.status(), `status for ${r.path}`).toBe(200);
    await expect(page).toHaveTitle(r.title);

    // exactly one h1, header + footer present
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("header.site-header")).toBeVisible();
    await expect(page.locator("footer.site-footer")).toBeVisible();

    // no broken images
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src)
    );
    expect(broken, `broken images on ${r.path}`).toEqual([]);

    // no horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${r.path}`).toBeLessThanOrEqual(2);

    expect(errors, `console errors on ${r.path}`).toEqual([]);
  });
}

test("custom 404 page renders", async ({ page }) => {
  const resp = await page.goto("/this-route-does-not-exist-xyz/", { waitUntil: "load" });
  // astro preview serves 404.html with 404 status
  expect(resp?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/grown here|not/i);
});

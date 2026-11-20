import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('location search shows a real live AQI value', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('City name').fill('Delhi');
  await page.getByRole('button', { name: 'Check air' }).click();
  await expect(page.getByRole('status')).toContainText('Showing live data for Delhi');
  const badge = page.locator('[aria-label^="Air quality index"]').first();
  await expect(badge).toBeVisible();
  const label = await badge.getAttribute('aria-label');
  expect(label).toMatch(/Air quality index \d+, (Good|Moderate|Unhealthy for Sensitive Groups|Unhealthy|Very Unhealthy|Hazardous)/);
});

test('personalised routine is generated from live data', async ({ page }) => {
  test.skip(!process.env.OPENROUTER_API_KEY, 'requires OPENROUTER_API_KEY for a real LLM call');
  await page.goto('/plan');
  const section = page.getByRole('heading', { name: 'Low-emission daily routine' }).locator('..');
  await expect(section.getByText(/Personalised language by/)).toBeVisible({ timeout: 60_000 });
  await expect(section.locator('ol li').first()).toBeVisible();
});

for (const path of ['/', '/plan', '/profile']) {
  test(`WCAG 2.1 AA scan: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

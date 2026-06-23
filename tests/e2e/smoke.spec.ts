import { expect, test } from "@playwright/test";

test("agent can sign in, create ticket, and resolve it", async ({ page, request }) => {
  await request.post("/api/seed");

  await page.goto("/signin");

  await page.getByLabel("Email").fill("ada@xenfi.dev");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" }).first()).toBeVisible();

  await page.getByRole("button", { name: "New ticket" }).click();

  const suffix = Date.now();
  await page.getByLabel("Title").fill(`E2E smoke ${suffix}`);
  await page
    .getByLabel("Description")
    .fill("Ticket created from Playwright smoke test.");

  await page.getByRole("button", { name: "Create ticket" }).click();
  await expect(page).toHaveURL(/\/tickets\//);

  await page.getByRole("button", { name: "Status" }).click();
  await page.getByRole("menuitem", { name: "Resolved" }).click();

  await expect(page.getByText("Resolved").first()).toBeVisible();
});

const { test, expect } = require("@playwright/test");
const fs = require("node:fs");

const profile = `---
type: northstar-profile
version: 1
id: personal
title: Personal
---

## Tasks

\`\`\`yaml
- id: first
  title: First important task
  status: open
  importance: important
  dueDate: 2026-09-10
  canvas:
    x: 66
    y: 24
- id: second
  title: Second important task
  status: open
  importance: important
  dueDate: 2026-09-10
  canvas:
    x: 66
    y: 24
- id: unplaced
  title: Task without a saved position
  status: open
  importance: less-important
  dueDate: 2026-10-10
\`\`\`

## Notes

\`\`\`text
Position test
\`\`\`
`;

async function positions(page) {
  return page.locator(".lite-task").evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.dataset.task,
      x: node.style.getPropertyValue("--x"),
      y: node.style.getPropertyValue("--y"),
    })).sort((a, b) => a.id.localeCompare(b.id)),
  );
}

test("download then re-import keeps rendered task positions stable", async ({ page }) => {
  await page.goto("/");
  await page.locator("#markdown-file").setInputFiles({
    name: "personal.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(profile),
  });
  await expect(page.getByText("First important task")).toBeVisible();
  const before = await positions(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByLabel("Save current Markdown workspace").click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const saved = fs.readFileSync(path, "utf8");
  expect(saved).not.toMatch(/id: "unplaced"[\s\S]*?canvas:/);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Open your NorthStar Markdown" })).toBeVisible();
  await page.locator("#markdown-file").setInputFiles(path);
  await expect(page.getByText("First important task")).toBeVisible();
  expect(await positions(page)).toEqual(before);
});

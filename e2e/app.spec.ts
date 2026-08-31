import { expect, test, type Page } from '@playwright/test'

async function startTimer(page: Page, title: string, digits: string) {
  await page.getByLabel('Timer title').fill(title)
  await page.getByLabel('Duration').click()
  await page.getByLabel('Duration').pressSequentially(digits, { delay: 30 })
  await page.getByRole('button', { name: 'Start', exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('starts a timer and shows it counting down', async ({ page }) => {
  await startTimer(page, 'Tea', '500')
  const card = page.getByRole('listitem', { name: /Tea/ })
  await expect(card).toBeVisible()
  await expect(card.getByText('00:05:00')).toBeVisible()
  await expect(card.getByText(/00:04:5\d/)).toBeVisible({ timeout: 3000 })
})

test('tab title tracks the soonest timer', async ({ page }) => {
  await startTimer(page, 'A', '300')
  await startTimer(page, 'B', '500')
  await expect(page).toHaveTitle(/00:03:0\d — Dope Countdowns/)
})

test('pause freezes, resume continues', async ({ page }) => {
  await startTimer(page, 'Tea', '500')
  const card = page.getByRole('listitem', { name: /Tea/ })
  await card.getByRole('button', { name: 'Pause' }).click()
  const frozen = await card.getByText(/00:0[45]:\d\d/).textContent()
  await page.waitForTimeout(1500)
  await expect(card.getByText(frozen!)).toBeVisible()

  await card.getByRole('button', { name: 'Resume' }).click()
  await expect(card.getByRole('button', { name: 'Pause' })).toBeVisible()
})

test('duplicate creates an independent running copy', async ({ page }) => {
  await startTimer(page, 'Tea', '500')
  await page.getByRole('button', { name: 'Duplicate timer' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(2)
})

test('delete removes the timer', async ({ page }) => {
  await startTimer(page, 'Tea', '500')
  await page.getByRole('button', { name: 'Delete timer' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('timer persists and finishes across a reload', async ({ page }) => {
  await startTimer(page, 'Tea', '2')
  await page.reload()
  const card = page.getByRole('listitem', { name: /Tea/ })
  await expect(card).toBeVisible()
  await expect(card.getByText("Time's up")).toBeVisible({ timeout: 10_000 })
  await expect(card.getByText('00:00:00')).toBeVisible()
})

test('suggests frequently started durations as quick start chips', async ({ page }) => {
  await startTimer(page, 'Coffee', '500')
  await page.getByRole('button', { name: 'Delete timer' }).click()
  await startTimer(page, 'Coffee', '500')
  await page.getByRole('button', { name: 'Delete timer' }).click()

  const chip = page.getByRole('button', { name: 'Start Coffee for 00:05:00' })
  await expect(chip).toBeVisible()
  await chip.click()
  await expect(page.getByRole('listitem', { name: /Coffee/ })).toBeVisible()
})

test('sound settings dialog opens and persists a choice', async ({ page }) => {
  await page.getByRole('button', { name: 'Sound settings' }).click()
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'alarm' }).click()
  await page.keyboard.press('Escape')
  await page.reload()
  await page.getByRole('button', { name: 'Sound settings' }).click()
  await expect(page.getByRole('combobox')).toContainText('alarm')
})

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
  await expect(page).toHaveTitle(/A · 00:03:0\d/)
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

test('run again replaces the finished timer with a fresh running one', async ({ page }) => {
  await page.getByLabel('Delete when finished').click()
  await startTimer(page, 'Tea', '2')
  const card = page.getByRole('listitem', { name: /Tea/ })
  await expect(card.getByText("Time's up")).toBeVisible({ timeout: 10_000 })
  await card.getByRole('button', { name: 'Run again' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(card.getByRole('button', { name: 'Pause' })).toBeVisible()
})

test('delete removes the timer', async ({ page }) => {
  await startTimer(page, 'Tea', '500')
  await page.getByRole('button', { name: 'Delete timer' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('auto-delete timer finishes and is removed across a reload', async ({ page }) => {
  await startTimer(page, 'Tea', '2')
  await page.reload()
  const card = page.getByRole('listitem', { name: /Tea/ })
  await expect(card).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0, { timeout: 10_000 })
  await expect(page.getByText('No timers yet')).toBeVisible()
})

test('favourite timers section starts a new countdown', async ({ page }) => {
  await page.getByRole('button', { name: 'Mark as favourite' }).click()
  await startTimer(page, 'Coffee', '500')
  await page.getByRole('button', { name: 'Delete timer' }).click()

  const chip = page.getByRole('button', { name: 'Start Coffee for 00:05:00' })
  await expect(chip).toBeVisible()
  await chip.click()
  await expect(page.getByRole('listitem', { name: /Coffee/ })).toBeVisible()
})

test('blocks creating a second timer with the same title', async ({ page }) => {
  await startTimer(page, 'Tea', '500')
  await page.getByLabel('Timer title').fill('tea')
  await page.getByLabel('Duration').pressSequentially('2', { delay: 30 })
  await expect(page.getByRole('alert')).toHaveText('A timer with this title already exists')
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeDisabled()
})

test('removing a favourite chip deletes it from favourites', async ({ page }) => {
  await page.getByRole('button', { name: 'Mark as favourite' }).click()
  await startTimer(page, 'Coffee', '500')
  await page.getByRole('button', { name: 'Delete timer' }).click()

  await page.getByRole('button', { name: 'Remove Coffee for 00:05:00 from favourites' }).click()
  await expect(page.getByRole('button', { name: 'Start Coffee for 00:05:00' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /Favourite timers/ })).toBeHidden()
})

test('favourite chip timers are kept when finished', async ({ page }) => {
  await page.getByRole('button', { name: 'Mark as favourite' }).click()
  await startTimer(page, 'Tea', '2')
  await page.getByRole('button', { name: 'Delete timer' }).click()

  await page.getByRole('button', { name: 'Start Tea for 00:00:02' }).click()
  const card = page.getByRole('listitem', { name: /Tea/ })
  await expect(card.getByText("Time's up")).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('listitem')).toHaveCount(1)
})

test('blocks creating a timer with a favourite title', async ({ page }) => {
  await page.getByRole('button', { name: 'Mark as favourite' }).click()
  await startTimer(page, 'Coffee', '500')
  await page.getByRole('button', { name: 'Delete timer' }).click()

  await page.getByLabel('Timer title').fill('coffee')
  await page.getByLabel('Duration').pressSequentially('2', { delay: 30 })
  await expect(page.getByRole('alert')).toHaveText('A timer with this title already exists')
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeDisabled()
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

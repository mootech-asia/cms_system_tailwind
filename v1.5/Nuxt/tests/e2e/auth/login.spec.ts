import { test, expect } from '@playwright/test'

// TODO: 之後如有設定 baseURL，可將此改為相對路徑 '/'
const HOME_URL = 'http://localhost:3000/'

test.describe('Auth / Home Login Modal', () => {
  test('open login modal from home navbar', async ({ page }) => {
    // 1. 進到首頁
    await page.goto(HOME_URL)

    // 2. 點擊右上角 Login 按鈕 (Navbar.vue 中的 button[name="login"])
    await page.locator('button[name="login"]').first().click()

    // 3. 確認登入彈窗有打開
    // Login.vue 中的 h2 標題會是 Login（依 i18n 顯示）
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()

    // 4. 確認表單欄位存在（依 Login.vue 中的 id）
    await expect(page.locator('#login-username')).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()
    await expect(page.locator('#login-remember')).toBeVisible()

    // 5. 輸入帳號與密碼
    await page.fill('#login-username', 'sosuketest2')
    await page.fill('#login-password', 'sosuketest2')

    // 6. 等待 Cloudflare 驗證完成（約 3 秒，視實際情況可再調整）
    await page.waitForTimeout(3000)

    // 7. 點擊彈窗內的 Login 送出按鈕
    // 對應 Login.vue 中 form 內的 submit button
    await page.locator('form').getByRole('button', { name: /login/i }).click()

    // 8. 簡單驗證：登入視窗關閉（Login 標題消失）
    await expect(page.getByRole('heading', { name: /login/i })).not.toBeVisible()
  })
})

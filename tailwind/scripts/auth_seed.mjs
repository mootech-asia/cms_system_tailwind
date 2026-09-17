// 會員限定頁在未登入時會被 site.js 的 initAuthGuard 導回 index.html
// （見 v4/site/assets/js/site.js 的 MEMBER_PAGES/isLoggedIn），直接
// page.goto() 這些頁面會被導向首頁，導致 pixelmatch 比對的其實是兩份
// index.html。測試前要先在該來源(origin)注入登入用的 localStorage。
//
// 目前只有 v4 有這個登入導向機制（v1.5 沒有），v5/v6 若比照 v4 做法，
// 到時候把對應的 MEMBER_PAGES/AUTH_KEY 加進 SEEDS 即可。
const SEEDS = {
  v4: {
    authKey: 'cms-v4-auth',
    authValue: { name: 'meqomcao', balance: '₩1,000,000,000', points: '0.00' },
    memberPages: ['account.html', 'deposit.html', 'withdrawal.html', 'betting-record.html',
      'deposit-record.html', 'withdrawal-record.html', 'withdrawal-detail.html', 'account-record.html',
      'profit-loss.html', 'personal-info.html', 'security.html', 'change-password.html'],
  },
};

// 在瀏覽器 context 建立的頁面上，於任何頁面腳本執行前寫入 localStorage
// （addInitScript 對之後該 context 內每一次導覽都有效）。
export async function seedAuthIfNeeded(ctx, version, pageName) {
  const seed = SEEDS[version];
  if (!seed) return;
  let bare = pageName.split('?')[0];
  if (!bare.includes('.html')) bare += '.html';
  if (!seed.memberPages.includes(bare)) return;
  await ctx.addInitScript(
    ([key, value]) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
    [seed.authKey, seed.authValue]
  );
}

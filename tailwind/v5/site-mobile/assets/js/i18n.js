// CMS_Frontend_v5 — 語系切換（vanilla，無框架、無 build）。
// 涵蓋範圍:導覽/頁尾/共用彈窗與各頁面獨有內容(會員中心表單/表格/彈窗訊息等)。
//   - 靜態 HTML 文字:加 data-i18n="key" 由 applyLocale() 掃描替換 textContent;
//     含內嵌標籤(如 <em>)的文字用 data-i18n-html 替換 innerHTML;
//     input placeholder 用 data-i18n-placeholder;aria-label 用 data-i18n-aria。
//   - site.js 動態產生的區塊(header-auth／手機選單／登入註冊彈窗／客服彈窗／
//     會員中心各頁清單與提示訊息):直接呼叫 window.CMS_I18N.t(key) 取字串,
//     渲染時就是當前語系;需要在語系切換後重新渲染的區塊要另外掛
//     cms-v5:locale-changed 監聽(見 site.js)。
(function () {
  'use strict';

  var LOCALE_KEY = 'cms-v5:locale';
  var DEFAULT_LOCALE = 'en'; // 尚未存過偏好時的預設語系,比照 v1.5/v2/v3/v4 統一為英文
  var LOCALES = [
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'English' },
    { id: 'ko', label: '한국어' },
    { id: 'th', label: 'ไทย' },
  ];

  /* 設計後台(studio)可關閉部分語言,不讓玩家在前台切換到;跟 studio.js
     共用同一把 localStorage key,同源即可跨資料夾讀取。中文預設對玩家
     隱藏(比照 v2/v3/v4 既有作法),可在 studio 重新勾選開啟;未設定或
     設定內容無效時落回這份預設清單。 */
  var STUDIO_LOCALES_KEY = 'cms-v5-studio-locales';
  function allLocaleIds() { return LOCALES.map(function (l) { return l.id; }); }
  var DEFAULT_VISIBLE_LOCALE_IDS = allLocaleIds().filter(function (id) { return id !== 'zh'; });
  /* studio 在 iframe 即時預覽時(尚未按「套用到本站」)會直接呼叫
     window.CMS_I18N.setVisibleLocales(list) 帶入草稿值,這裡先暫存起來;
     沒有暫存值時(一般訪客直接開頁面、或 studio 尚未互動過)才落回讀
     localStorage。 */
  var studioVisibleLocalesOverride = null;
  function visibleLocaleIds() {
    var known = allLocaleIds();
    if (Array.isArray(studioVisibleLocalesOverride)) {
      var overridden = studioVisibleLocalesOverride.filter(function (id) { return known.indexOf(id) !== -1; });
      return overridden.length ? overridden : DEFAULT_VISIBLE_LOCALE_IDS;
    }
    var raw;
    try { raw = JSON.parse(localStorage.getItem(STUDIO_LOCALES_KEY)); } catch (e) { raw = null; }
    if (!Array.isArray(raw) || !raw.length) return DEFAULT_VISIBLE_LOCALE_IDS;
    var filtered = raw.filter(function (id) { return known.indexOf(id) !== -1; });
    return filtered.length ? filtered : DEFAULT_VISIBLE_LOCALE_IDS;
  }
  /* studio 呼叫:更新草稿可見語言清單並立即重繪選單/目前語系(見
     applyLocale 內對 [data-lang-option] 的 hidden 判斷)。 */
  function setVisibleLocales(ids) {
    studioVisibleLocalesOverride = Array.isArray(ids) ? ids : null;
    applyLocale();
  }

  var STRINGS = {
    'nav.lobby': { zh: '大廳', en: 'Lobby', ko: '로비', th: 'ล็อบบี้' },
    'nav.slots': { zh: '老虎機', en: 'Slots', ko: '슬롯', th: 'สล็อต' },
    'nav.live': { zh: '真人娛樂', en: 'Live Casino', ko: '라이브 카지노', th: 'คาสิโนสด' },
    'nav.electronic': { zh: '電子遊戲', en: 'Electronic Games', ko: '전자 게임', th: 'เกมอิเล็กทรอนิกส์' },
    'nav.fish': { zh: '捕魚達人', en: 'Fishing Master', ko: '낚시의 달인', th: 'เซียนยิงปลา' },
    'nav.sport': { zh: '體育', en: 'Sports', ko: '스포츠', th: 'กีฬา' },
    'nav.promotion': { zh: '優惠活動', en: 'Promotions', ko: '프로모션', th: 'โปรโมชั่น' },
    'nav.deposit': { zh: '儲值', en: 'Deposit', ko: '충전', th: 'เติมเงิน' },
    'nav.member': { zh: '會員', en: 'Account', ko: '계정', th: 'บัญชี' },
    'nav.menu': { zh: '選單', en: 'Menu', ko: '메뉴', th: 'เมนู' },

    'sidebar.myAccount': { zh: '我的帳戶', en: 'My Account', ko: '내 계정', th: 'บัญชีของฉัน' },
    'sidebar.overview': { zh: '帳戶總覽', en: 'Account Overview', ko: '계정 개요', th: 'ภาพรวมบัญชี' },
    'sidebar.withdrawal': { zh: '提款', en: 'Withdrawal', ko: '출금', th: 'ถอนเงิน' },
    'sidebar.bettingRecord': { zh: '投注紀錄', en: 'Betting Record', ko: '베팅 기록', th: 'บันทึกการเดิมพัน' },
    'sidebar.depositRecord': { zh: '儲值紀錄', en: 'Deposit Record', ko: '충전 기록', th: 'บันทึกการเติมเงิน' },
    'sidebar.profitLoss': { zh: '損益報表', en: 'Profit & Loss', ko: '손익 보고서', th: 'รายงานกำไรขาดทุน' },
    'sidebar.withdrawalRecord': { zh: '提款紀錄', en: 'Withdrawal Record', ko: '출금 기록', th: 'บันทึกการถอนเงิน' },
    'sidebar.withdrawalDetail': { zh: '提款明細', en: 'Withdrawal Detail', ko: '출금 상세', th: 'รายละเอียดการถอนเงิน' },
    'sidebar.accountRecord': { zh: '帳戶紀錄', en: 'Account Record', ko: '계정 기록', th: 'บันทึกบัญชี' },
    'sidebar.personalInfo': { zh: '個人資料', en: 'Personal Info', ko: '개인 정보', th: 'ข้อมูลส่วนตัว' },
    'sidebar.security': { zh: '安全中心', en: 'Security Center', ko: '보안 센터', th: 'ศูนย์ความปลอดภัย' },
    'page.changePassword': { zh: '修改登入密碼', en: 'Change Login Password', ko: '로그인 비밀번호 변경', th: 'เปลี่ยนรหัสผ่านเข้าสู่ระบบ' },

    'auth.registerNow': { zh: '立即註冊', en: 'Join', ko: '지금 가입', th: 'ลงทะเบียนเลย' },
    'auth.usernamePlaceholder': { zh: '用戶名', en: 'Username', ko: '사용자명', th: 'ชื่อผู้ใช้' },
    'auth.passwordPlaceholder': { zh: '密碼', en: 'Password', ko: '비밀번호', th: 'รหัสผ่าน' },
    'auth.forgot': { zh: '忘記密碼', en: 'Forgot?', ko: '비밀번호를 잊으셨나요?', th: 'ลืมรหัสผ่าน' },
    'auth.login': { zh: '登錄', en: 'Login', ko: '로그인', th: 'เข้าสู่ระบบ' },
    'auth.register': { zh: '註冊', en: 'Register', ko: '가입하기', th: 'ลงทะเบียน' },
    'auth.logout': { zh: '登出', en: 'Logout', ko: '로그아웃', th: 'ออกจากระบบ' },
    'auth.balancePrefix': { zh: '餘額：', en: 'Balance: ', ko: '잔액: ', th: 'ยอดเงิน: ' },
    'auth.pointsPrefix': { zh: '點數：', en: 'Points: ', ko: '포인트: ', th: 'พอยท์: ' },
    'auth.usernameLabel': { zh: '用戶名', en: 'Username', ko: '사용자명', th: 'ชื่อผู้ใช้' },
    'auth.usernameInputPlaceholder': { zh: '請輸入用戶名', en: 'Enter your username', ko: '사용자명을 입력하세요', th: 'กรุณากรอกชื่อผู้ใช้' },
    'auth.passwordLabel': { zh: '密碼', en: 'Password', ko: '비밀번호', th: 'รหัสผ่าน' },
    'auth.passwordInputPlaceholder': { zh: '請輸入密碼', en: 'Enter your password', ko: '비밀번호를 입력하세요', th: 'กรุณากรอกรหัสผ่าน' },
    'auth.confirmPasswordLabel': { zh: '確認密碼', en: 'Confirm Password', ko: '비밀번호 확인', th: 'ยืนยันรหัสผ่าน' },
    'auth.confirmPasswordPlaceholder': { zh: '請再次輸入密碼', en: 'Re-enter your password', ko: '비밀번호를 다시 입력하세요', th: 'กรุณากรอกรหัสผ่านอีกครั้ง' },

    'notice.message': {
      zh: '公告：系統將於今日凌晨進行例行維護，期間下注功能將暫停使用，造成不便敬請見諒。',
      en: 'Notice: The system will undergo scheduled maintenance early this morning. Betting will be temporarily unavailable during this time. We apologize for the inconvenience.',
      ko: '공지: 시스템은 오늘 새벽 정기 점검을 진행합니다. 점검 기간 동안 베팅 기능이 일시 중단되니 이용에 불편을 드려 죄송합니다.',
      th: 'ประกาศ: ระบบจะทำการปรับปรุงตามปกติในช่วงเช้าตรู่ของวันนี้ ฟังก์ชันการเดิมพันจะถูกระงับชั่วคราวในช่วงเวลาดังกล่าว ขออภัยในความไม่สะดวก',
    },
    'notice.faq': { zh: '常見問題', en: 'FAQ', ko: '자주 묻는 질문', th: 'คำถามที่พบบ่อย' },
    'notice.liveChat': { zh: '線上客服', en: 'Live Chat', ko: '실시간 상담', th: 'แชทสด' },

    'cs.title': { zh: '聯絡客服', en: 'Contact Support', ko: '고객센터 문의', th: 'ติดต่อฝ่ายบริการลูกค้า' },
    'cs.liveChatTitle': { zh: '線上客服', en: 'Live Chat', ko: '실시간 상담', th: 'แชทสด' },
    'cs.liveChatDesc': { zh: '24 小時即時支援', en: '24/7 instant support', ko: '24시간 실시간 지원', th: 'บริการด่วน 24 ชม.' },
    'cs.telegramTitle': { zh: 'Telegram 頻道', en: 'Telegram Channel', ko: 'Telegram 채널', th: 'ช่อง Telegram' },
    'cs.telegramDesc': { zh: '最新活動與公告', en: 'Latest promos & announcements', ko: '최신 이벤트 및 공지', th: 'โปรโมชันและประกาศล่าสุด' },
    'cs.emailTitle': { zh: 'Email 信箱', en: 'Email', ko: '이메일', th: 'อีเมล' },
    'cs.chatOnline': { zh: '線上', en: 'Online', ko: '온라인', th: 'ออนไลน์' },
    'cs.chatMinimize': { zh: '縮小', en: 'Minimize', ko: '최소화', th: 'ย่อ' },
    'cs.chatClose': { zh: '關閉', en: 'Close', ko: '닫기', th: 'ปิด' },
    'cs.chatPlaceholder': { zh: '輸入訊息…', en: 'Type a message…', ko: '메시지를 입력하세요…', th: 'พิมพ์ข้อความ…' },
    'cs.chatSend': { zh: '傳送', en: 'Send', ko: '전송', th: 'ส่ง' },
    'cs.chatGreeting': { zh: '您好，有什麼能為您服務的嗎？客服人員將盡快為您回覆。', en: 'Hi there! How can we help? A support agent will reply shortly.', ko: '안녕하세요! 무엇을 도와드릴까요? 상담원이 곧 답변드리겠습니다.', th: 'สวัสดีค่ะ มีอะไรให้เราช่วยไหม เจ้าหน้าที่จะตอบกลับโดยเร็ว' },
    'cs.chatAutoReply': { zh: '感謝您的訊息，客服人員將盡快回覆，請稍候。', en: 'Thanks for your message — a support agent will reply shortly.', ko: '메시지 감사합니다. 상담원이 곧 답변드리겠습니다.', th: 'ขอบคุณสำหรับข้อความ เจ้าหน้าที่จะตอบกลับโดยเร็ว' },

    'footer.disclaimer1': {
      zh: '博彩可能造成成癮，請理性遊玩。如需支援資訊，請前往責任博彩協助頁面。',
      en: 'Gambling can be addictive. Please play responsibly. For support resources, please visit the responsible gambling help page.',
      ko: '도박은 중독될 수 있습니다. 책임감 있게 즐겨주세요. 지원 정보가 필요하시면 책임감 있는 게임 도움 페이지를 방문해주세요.',
      th: 'การพนันอาจก่อให้เกิดการเสพติด กรุณาเล่นอย่างมีความรับผิดชอบ หากต้องการข้อมูลช่วยเหลือ กรุณาไปที่หน้าช่วยเหลือการพนันอย่างมีความรับผิดชอบ',
    },
    'footer.disclaimer2': {
      zh: '當您存取、繼續使用或瀏覽本站，即表示您同意我們使用部分瀏覽器 Cookie，以改善您的使用體驗。',
      en: 'By accessing, continuing to use, or browsing this site, you agree to our use of certain browser cookies to improve your experience.',
      ko: '본 사이트에 접속, 계속 이용 또는 열람하시면 더 나은 이용 경험을 위해 일부 브라우저 쿠키를 사용하는 것에 동의하시는 것으로 간주됩니다.',
      th: 'การเข้าถึง ใช้งานต่อ หรือเข้าชมเว็บไซต์นี้ ถือว่าคุณยินยอมให้เราใช้คุกกี้บางส่วนของเบราว์เซอร์เพื่อปรับปรุงประสบการณ์การใช้งานของคุณ',
    },
    'footer.copyright': {
      zh: '© 2026 IGNITE100 版權所有，受法律保護。本站僅供介面展示，不涉及任何實際投注行為。',
      en: '© 2026 IGNITE100. All rights reserved. This site is for interface demonstration purposes only and does not involve any real wagering.',
      ko: '© 2026 IGNITE100. 모든 권리 보유. 본 사이트는 인터페이스 시연 용도로만 제공되며, 실제 베팅 행위와는 무관합니다.',
      th: '© 2026 IGNITE100 สงวนสิทธิ์ทุกประการ เว็บไซต์นี้ใช้เพื่อสาธิตอินเทอร์เฟซเท่านั้น ไม่มีการพนันจริงเกิดขึ้น',
    },
    'footer.backToHub': { zh: '回到 CMS 統一預覽', en: 'Back to CMS Overview', ko: 'CMS 통합 미리보기로 돌아가기', th: 'กลับไปที่ภาพรวม CMS' },

    'vendor.title': { zh: '合作廠商', en: 'Our Partners', ko: '제휴 파트너', th: 'พันธมิตรของเรา' },

    'lang.label': { zh: '語言', en: 'Language', ko: '언어', th: 'ภาษา' },

    'common.refresh': { zh: '重新整理', en: 'Refresh', ko: '새로고침', th: 'รีเฟรช' },
    'common.viewDetail': { zh: '查看詳情', en: 'View Details', ko: '상세 보기', th: 'ดูรายละเอียด' },
    'common.back': { zh: '返回', en: 'Back', ko: '뒤로', th: 'กลับ' },
    'common.submit': { zh: '提交', en: 'Submit', ko: '제출', th: 'ส่ง' },
    'common.confirm': { zh: '確定', en: 'Confirm', ko: '확인', th: 'ยืนยัน' },
    'common.prev': { zh: '上一筆', en: 'Previous', ko: '이전', th: 'ก่อนหน้า' },
    'common.next2': { zh: '下一筆', en: 'Next', ko: '다음', th: 'ถัดไป' },
    'common.notice': { zh: '提示', en: 'Notice', ko: '안내', th: 'แจ้งเตือน' },
    'common.success': { zh: '成功', en: 'Success', ko: '성공', th: 'สำเร็จ' },

    'pay.bankCard': { zh: '銀行卡', en: 'Bank Card', ko: '은행카드', th: 'บัตรธนาคาร' },
    'common.delete': { zh: '刪除', en: 'Delete', ko: '삭제', th: 'ลบ' },
    'pay.qrCodeLabel': { zh: '付款 QR Code', en: 'Payment QR Code', ko: '결제 QR 코드', th: 'QR โค้ดชำระเงิน' },
    'pay.cryptoWallet': { zh: '加密錢包', en: 'Crypto Wallet', ko: '암호화폐 지갑', th: 'กระเป๋าเงินคริปโต' },
    'pay.linePay': { zh: 'LinePay', en: 'LinePay', ko: 'LinePay', th: 'LinePay' },

    'wd.tabWithdraw': { zh: '提款', en: 'Withdraw', ko: '출금', th: 'ถอนเงิน' },
    'wd.tabAccounts': { zh: '帳戶管理', en: 'Account Management', ko: '계정 관리', th: 'จัดการบัญชี' },
    'wd.mainWallet': { zh: '主錢包', en: 'Main Wallet', ko: '메인 지갑', th: 'กระเป๋าเงินหลัก' },
    'wd.turnoverAchievedPrefix': { zh: '*已達成流水：₩ ', en: '*Turnover Achieved: ₩ ', ko: '*달성된 유효 베팅액: ₩ ', th: '*ยอดหมุนที่ทำได้: ₩ ' },
    'wd.targetAmountPrefix': { zh: '目標金額：₩ ', en: 'Target Amount: ₩ ', ko: '목표 금액: ₩ ', th: 'จำนวนเป้าหมาย: ₩ ' },
    'wd.centralWallet': { zh: '中心錢包', en: 'Central Wallet', ko: '중앙 지갑', th: 'กระเป๋าเงินกลาง' },
    'wd.availableAmount': { zh: '可用金額', en: 'Available Amount', ko: '사용 가능 금액', th: 'จำนวนที่ใช้ได้' },
    'wd.walletInfo': { zh: '錢包資訊', en: 'Wallet Information', ko: '지갑 정보', th: 'ข้อมูลกระเป๋าเงิน' },
    'wd.selectWalletType': { zh: '請選擇錢包類型', en: 'Please select wallet type', ko: '지갑 유형을 선택해 주세요', th: 'กรุณาเลือกประเภทกระเป๋าเงิน' },
    'wd.walletAddressPlaceholder': { zh: '請輸入收款錢包地址', en: 'Please enter receiving wallet address', ko: '수신 지갑 주소를 입력해 주세요', th: 'กรุณากรอกที่อยู่กระเป๋าเงินรับเงิน' },
    'wd.bankNamePlaceholder': { zh: '銀行名稱', en: 'Bank Name', ko: '은행명', th: 'ชื่อธนาคาร' },
    'wd.holderPlaceholder': { zh: '收款人姓名', en: "Recipient's Name", ko: '수취인 이름', th: 'ชื่อผู้รับ' },
    'wd.accountPlaceholder': { zh: '銀行卡號', en: 'Bank Card Number', ko: '은행 카드 번호', th: 'หมายเลขบัตรธนาคาร' },
    'wd.fundPasswordPlaceholder': { zh: '請輸入交易密碼', en: 'Please enter transaction password', ko: '거래 비밀번호를 입력해 주세요', th: 'กรุณากรอกรหัสผ่านการทำธุรกรรม' },
    'wd.withdrawAmount': { zh: '提款金額', en: 'Withdrawal Amount', ko: '출금 금액', th: 'จำนวนถอนเงิน' },
    'wd.bankAmountNote': { zh: '* 最低金額：₩ 10,000；最高金額：₩ 9,000,000 *', en: '* Minimum: ₩ 10,000; Maximum: ₩ 9,000,000 *', ko: '* 최소 금액: ₩ 10,000; 최대 금액: ₩ 9,000,000 *', th: '* ขั้นต่ำ: ₩ 10,000; สูงสุด: ₩ 9,000,000 *' },
    'wd.cryptoAmountNote': { zh: '* 最低金額：₩ 100,000；最高金額：₩ 20,000,000 *', en: '* Minimum: ₩ 100,000; Maximum: ₩ 20,000,000 *', ko: '* 최소 금액: ₩ 100,000; 최대 금액: ₩ 20,000,000 *', th: '* ขั้นต่ำ: ₩ 100,000; สูงสุด: ₩ 20,000,000 *' },
    'wd.withdrawPassword': { zh: '提款密碼', en: 'Withdrawal Password', ko: '출금 비밀번호', th: 'รหัสผ่านถอนเงิน' },
    'wd.withdrawPasswordPlaceholder': { zh: '請輸入提款密碼', en: 'Please enter withdrawal password', ko: '출금 비밀번호를 입력해 주세요', th: 'กรุณากรอกรหัสผ่านถอนเงิน' },
    'wd.confirmWithdraw': { zh: '確認提款', en: 'Confirm Withdrawal', ko: '출금 확인', th: 'ยืนยันการถอนเงิน' },
    'wd.manageBankAccount': { zh: '銀行帳戶', en: 'Bank Account', ko: '은행 계좌', th: 'บัญชีธนาคาร' },
    'wd.registeredAccounts': { zh: '已登記提款帳戶', en: 'Registered Withdrawal Accounts', ko: '등록된 출금 계좌', th: 'บัญชีถอนเงินที่ลงทะเบียน' },
    'wd.addBankAccount': { zh: '新增銀行帳戶', en: 'Add Bank Account', ko: '은행 계좌 추가', th: 'เพิ่มบัญชีธนาคาร' },
    'wd.addCryptoWallet': { zh: '新增加密錢包地址', en: 'Add Crypto Wallet Address', ko: '암호화폐 지갑 주소 추가', th: 'เพิ่มที่อยู่กระเป๋าเงินคริปโต' },
    'wd.addAccount': { zh: '新增帳戶', en: 'Add Account', ko: '계좌 추가', th: 'เพิ่มบัญชี' },
    'wd.cryptoWalletAddressLabel': { zh: '加密錢包地址', en: 'crypto wallet address', ko: '암호화폐 지갑 주소', th: 'ที่อยู่กระเป๋าเงินคริปโต' },
    'wd.noAccountBoundOfGroup': { zh: '尚未綁定任何{group}。', en: 'No {group} bound yet.', ko: '아직 등록된 {group}가 없습니다.', th: 'ยังไม่ได้ผูก{group}' },
    'wd.noWithdrawAccountOfGroup': {
      zh: '尚未綁定{group}提款帳戶,請先至{link}',
      en: 'No {group} withdrawal account bound yet. Please {link}',
      ko: '아직 등록된 {group} 출금 계좌가 없습니다. 먼저 {link}',
      th: 'ยังไม่ได้ผูกบัญชีถอนเงิน{group} กรุณา{link}',
    },
    'wd.gotoAccounts': { zh: '前往「帳戶管理」新增', en: 'go to "Account Management" to add', ko: '"계정 관리"로 이동하여 추가', th: 'ไปที่ "จัดการบัญชี" เพื่อเพิ่ม' },
    'wd.myBankAccounts': { zh: '我的銀行帳戶', en: 'My Bank Accounts', ko: '내 은행 계좌', th: 'บัญชีธนาคารของฉัน' },
    'wd.myCryptoWallets': { zh: '我的加密錢包', en: 'My Crypto Wallets', ko: '내 암호화폐 지갑', th: 'กระเป๋าเงินคริปโตของฉัน' },
    'wd.groupBank': { zh: '銀行', en: 'bank', ko: '은행', th: 'ธนาคาร' },
    'wd.groupCrypto': { zh: '加密錢包', en: 'crypto wallet', ko: '암호화폐 지갑', th: 'กระเป๋าเงินคริปโต' },
    'wd.capReached': { zh: '已達提款帳戶數量上限（{cap} 筆），請先刪除不需要的帳戶。', en: 'Withdrawal account limit reached ({cap}). Please remove an unused account first.', ko: '출금 계좌 수 한도({cap}개)에 도달했습니다. 필요 없는 계좌를 먼저 삭제해 주세요.', th: 'ถึงขีดจำกัดบัญชีถอนเงิน ({cap} บัญชี) กรุณาลบบัญชีที่ไม่ใช้ก่อน' },
    'wd.addBankFieldsError': { zh: '請完整填寫銀行名稱、收款人姓名與銀行卡號。', en: 'Please fill in the bank name, recipient name, and bank card number.', ko: '은행명, 수취인 이름, 은행 카드 번호를 모두 입력해 주세요.', th: 'กรุณากรอกชื่อธนาคาร ชื่อผู้รับ และหมายเลขบัตรธนาคารให้ครบถ้วน' },
    'wd.addWalletFieldsError': { zh: '請填寫收款錢包地址。', en: 'Please fill in the receiving wallet address.', ko: '수신 지갑 주소를 입력해 주세요.', th: 'กรุณากรอกที่อยู่กระเป๋าเงินรับเงิน' },
    'wd.addFundPasswordError': { zh: '請輸入交易密碼。', en: 'Please enter the transaction password.', ko: '거래 비밀번호를 입력해 주세요.', th: 'กรุณากรอกรหัสผ่านการทำธุรกรรม' },
    'wd.addSuccessTitle': { zh: '新增成功', en: 'Added Successfully', ko: '추가 성공', th: 'เพิ่มสำเร็จ' },
    'wd.addSuccessMessage': { zh: '提款帳戶已新增，可於「提款」頁籤選用。', en: 'Withdrawal account added. You can select it on the "Withdraw" tab.', ko: '출금 계좌가 추가되었습니다. "출금" 탭에서 선택할 수 있습니다.', th: 'เพิ่มบัญชีถอนเงินแล้ว สามารถเลือกได้ที่แท็บ "ถอนเงิน"' },
    'wd.selectWalletTypeError': { zh: '請先選擇錢包類型。', en: 'Please select a wallet type first.', ko: '먼저 지갑 유형을 선택해 주세요.', th: 'กรุณาเลือกประเภทกระเป๋าเงินก่อน' },
    'wd.walletAddressError': { zh: '請先填寫收款錢包地址。', en: 'Please fill in the receiving wallet address first.', ko: '먼저 수신 지갑 주소를 입력해 주세요.', th: 'กรุณากรอกที่อยู่กระเป๋าเงินรับเงินก่อน' },
    'wd.withdrawPasswordError': { zh: '請先輸入提款密碼。', en: 'Please enter the withdrawal password first.', ko: '먼저 출금 비밀번호를 입력해 주세요.', th: 'กรุณากรอกรหัสผ่านถอนเงินก่อน' },
    'wd.withdrawSuccessTitle': { zh: '提款成功', en: 'Withdrawal Successful', ko: '출금 성공', th: 'ถอนเงินสำเร็จ' },
    'wd.withdrawSuccessMessage': { zh: '您的提款申請已送出，將於 1–24 小時內處理完成，請至「提款紀錄」查看進度。', en: 'Your withdrawal request has been submitted and will be processed within 1–24 hours. Please check "Withdrawal Record" for progress.', ko: '출금 신청이 제출되었습니다. 1~24시간 내에 처리됩니다. 진행 상황은 "출금 기록"에서 확인해 주세요.', th: 'ส่งคำขอถอนเงินแล้ว จะดำเนินการภายใน 1–24 ชั่วโมง กรุณาตรวจสอบความคืบหน้าที่ "บันทึกการถอนเงิน"' },

    'dp.channelA': { zh: '通道 A', en: 'Channel A', ko: '채널 A', th: 'ช่องทาง A' },
    'dp.channelB': { zh: '通道 B', en: 'Channel B', ko: '채널 B', th: 'ช่องทาง B' },
    'dp.channelC': { zh: '通道 C', en: 'Channel C', ko: '채널 C', th: 'ช่องทาง C' },
    'dp.channelD': { zh: '通道 D', en: 'Channel D', ko: '채널 D', th: 'ช่องทาง D' },
    'dp.depositAmount': { zh: '儲值金額', en: 'Deposit Amount', ko: '충전 금액', th: 'จำนวนเติมเงิน' },
    'dp.amountNote': { zh: '* 最低金額：₩ 10,000；最高金額：₩ 9,000,000 *', en: '* Minimum: ₩ 10,000; Maximum: ₩ 9,000,000 *', ko: '* 최소 금액: ₩ 10,000; 최대 금액: ₩ 9,000,000 *', th: '* ขั้นต่ำ: ₩ 10,000; สูงสุด: ₩ 9,000,000 *' },
    'dp.choosePromotion': { zh: '選擇優惠活動', en: 'Choose Promotion', ko: '프로모션 선택', th: 'เลือกโปรโมชั่น' },
    'dp.promo1': { zh: '新會員首存加碼 50%（不適用於 Evolution Gaming、Pragmatic Play 真人遊戲）', en: "New member's first deposit bonus 50% (not applicable to Evolution Gaming, Pragmatic Play live games)", ko: '신규 회원 첫 충전 보너스 50%(Evolution Gaming, Pragmatic Play 라이브 게임 미적용)', th: 'โบนัสฝากครั้งแรกสมาชิกใหม่ 50% (ไม่ใช้กับเกมสด Evolution Gaming, Pragmatic Play)' },
    'dp.noPromotion': { zh: '不使用優惠', en: 'No promotion', ko: '프로모션 사용 안 함', th: 'ไม่ใช้โปรโมชั่น' },
    'dp.confirmDeposit': { zh: '確認儲值', en: 'Confirm Deposit', ko: '충전 확인', th: 'ยืนยันการเติมเงิน' },
    'dp.successTitle': { zh: '儲值成功', en: 'Deposit Successful', ko: '충전 성공', th: 'เติมเงินสำเร็จ' },
    'dp.successMessage': { zh: '您的儲值申請已送出，請至「儲值紀錄」查看處理進度。', en: 'Your deposit request has been submitted. Please check "Deposit Record" for progress.', ko: '충전 신청이 제출되었습니다. 진행 상황은 "충전 기록"에서 확인해 주세요.', th: 'ส่งคำขอเติมเงินแล้ว กรุณาตรวจสอบความคืบหน้าที่ "บันทึกการเติมเงิน"' },
    'dp.receivingBank': { zh: '收款銀行', en: 'Receiving Bank', ko: '수취 은행', th: 'ธนาคารผู้รับ' },
    'dp.receivingAccount': { zh: '收款帳號', en: 'Receiving Account', ko: '수취 계좌', th: 'บัญชีผู้รับ' },
    'dp.depositAmountLabel': { zh: '儲值金額', en: 'Deposit Amount', ko: '충전 금액', th: 'จำนวนเติมเงิน' },
    'dp.transferNote': { zh: '完成轉帳後請點擊下方按鈕，系統將盡快為您確認入帳。', en: 'After completing the transfer, please click the button below. We will confirm your deposit as soon as possible.', ko: '송금을 완료한 후 아래 버튼을 클릭해 주세요. 최대한 빨리 입금을 확인해 드리겠습니다.', th: 'หลังจากโอนเงินแล้ว กรุณากดปุ่มด้านล่าง เราจะยืนยันการฝากเงินให้เร็วที่สุด' },
    'dp.transferDoneBtn': { zh: '我已完成轉帳', en: 'I Have Completed the Transfer', ko: '송금을 완료했습니다', th: 'ฉันโอนเงินเรียบร้อยแล้ว' },
    'dp.scanPayDesc': { zh: '請使用手機掃描下方 QR Code，或複製{label}完成付款。', en: 'Please scan the QR code below with your phone, or copy the {label} to complete payment.', ko: '휴대폰으로 아래 QR 코드를 스캔하거나 {label}을 복사하여 결제를 완료해 주세요.', th: 'กรุณาสแกน QR Code ด้านล่างด้วยมือถือ หรือคัดลอก{label}เพื่อชำระเงิน' },
    'dp.paymentUrl': { zh: '付款網址', en: 'Payment URL', ko: '결제 URL', th: 'URL การชำระเงิน' },
    'dp.receivingAddress': { zh: '收款地址', en: 'Receiving Address', ko: '수취 주소', th: 'ที่อยู่ผู้รับ' },
    'dp.copy': { zh: '複製', en: 'Copy', ko: '복사', th: 'คัดลอก' },
    'dp.copied': { zh: '已複製', en: 'Copied', ko: '복사됨', th: 'คัดลอกแล้ว' },
    'dp.qrDemoNote': { zh: '此為示意用 QR Code 與{label}，僅供介面展示。', en: 'This QR code and {label} are for interface demonstration purposes only.', ko: '이 QR 코드와 {label}은 인터페이스 시연 용도로만 제공됩니다.', th: 'QR Code และ{label}นี้ใช้เพื่อสาธิตอินเทอร์เฟซเท่านั้น' },
    'dp.paymentDoneBtn': { zh: '我已完成付款', en: 'I Have Completed the Payment', ko: '결제를 완료했습니다', th: 'ฉันชำระเงินเรียบร้อยแล้ว' },
    'dp.transferInfoTitle': { zh: '轉帳資訊', en: 'Transfer Information', ko: '송금 정보', th: 'ข้อมูลการโอนเงิน' },
    'dp.scanPayTitle': { zh: '掃碼付款', en: 'Scan to Pay', ko: 'QR 결제', th: 'สแกนเพื่อจ่าย' },

    'acct.editNickname': { zh: '編輯暱稱', en: 'Edit Nickname', ko: '닉네임 수정', th: 'แก้ไขชื่อเล่น' },
    'acct.currentBalance': { zh: '目前餘額', en: 'Current Balance', ko: '현재 잔액', th: 'ยอดเงินปัจจุบัน' },
    'acct.joinDate': { zh: '加入時間', en: 'Join Date', ko: '가입일', th: 'วันที่เข้าร่วม' },
    'acct.remainingTurnover': { zh: '剩餘打碼量', en: 'Remaining Turnover', ko: '남은 유효 베팅액', th: 'ยอดหมุนที่เหลือ' },
    'acct.levelProgress': { zh: '會員獎勵進度 · 第 27 天，03:26', en: 'Membership Rewards Progress · Day 27, 03:26', ko: '멤버십 리워드 진행률 · 27일차, 03:26', th: 'ความคืบหน้ารางวัลสมาชิก · วันที่ 27, 03:26' },
    'acct.current': { zh: '目前：', en: 'Current: ', ko: '현재: ', th: 'ปัจจุบัน: ' },
    'acct.unranked': { zh: '未排名', en: 'Unranked', ko: '순위 없음', th: 'ยังไม่มีระดับ' },
    'acct.nextLevel': { zh: '下一級：', en: 'Next Level: ', ko: '다음 등급: ', th: 'ระดับต่อไป: ' },
    'acct.bronze': { zh: '銅級', en: 'Bronze', ko: '브론즈', th: 'บรอนซ์' },
    'acct.depositNow': { zh: '立即儲值', en: 'Deposit Now', ko: '지금 충전', th: 'เติมเงินทันที' },
    'acct.requestWithdrawal': { zh: '申請提款', en: 'Request Withdrawal', ko: '출금 신청', th: 'ขอถอนเงิน' },
    'acct.bankAccounts': { zh: '銀行帳戶', en: 'Bank Accounts', ko: '은행 계좌', th: 'บัญชีธนาคาร' },
    'acct.quickLinks': { zh: '快速捷徑', en: 'Quick Links', ko: '빠른 링크', th: 'ลิงก์ด่วน' },

    'quickRail.promoChannel': { zh: '促銷頻道', en: 'Promo Channel', ko: '프로모 채널', th: 'ช่องโปรโมชั่น' },
    'nav.menuLabel': { zh: '選單', en: 'Menu', ko: '메뉴', th: 'เมนู' },
    'mobileTabbar.ariaLabel': { zh: '快捷選單', en: 'Quick Menu', ko: '빠른 메뉴', th: 'เมนูด่วน' },

    'pi.nickname': { zh: '暱稱', en: 'Nickname', ko: '닉네임', th: 'ชื่อเล่น' },
    'pi.birthday': { zh: '生日', en: 'Birthday', ko: '생일', th: 'วันเกิด' },
    'pi.email': { zh: 'Email', en: 'Email', ko: '이메일', th: 'อีเมล' },
    'pi.realName': { zh: '真實姓名', en: 'Real Name', ko: '실명', th: 'ชื่อจริง' },
    'pi.phone': { zh: '手機號碼', en: 'Phone Number', ko: '휴대폰 번호', th: 'หมายเลขโทรศัพท์' },
    'pi.edit': { zh: '編輯', en: 'Edit', ko: '수정', th: 'แก้ไข' },

    'sec.personalInfoTitle': { zh: '個人資料', en: 'Personal Info', ko: '개인 정보', th: 'ข้อมูลส่วนตัว' },
    'sec.personalInfoDesc': { zh: '管理您的個人基本資料', en: 'Manage your basic personal information', ko: '개인 기본 정보를 관리하세요', th: 'จัดการข้อมูลส่วนตัวพื้นฐานของคุณ' },
    'sec.changeLoginPwTitle': { zh: '修改登入密碼', en: 'Change Login Password', ko: '로그인 비밀번호 변경', th: 'เปลี่ยนรหัสผ่านเข้าสู่ระบบ' },
    'sec.changeLoginPwDesc': { zh: '定期更換密碼以確保帳戶安全', en: 'Change your password regularly to keep your account secure', ko: '계정 보안을 위해 정기적으로 비밀번호를 변경하세요', th: 'เปลี่ยนรหัสผ่านเป็นประจำเพื่อความปลอดภัยของบัญชี' },
    'sec.changeFundPwTitle': { zh: '修改交易密碼', en: 'Change Transaction Password', ko: '거래 비밀번호 변경', th: 'เปลี่ยนรหัสผ่านการทำธุรกรรม' },
    'sec.changeFundPwDesc': { zh: '提款與敏感操作使用的獨立密碼', en: 'A separate password used for withdrawals and sensitive operations', ko: '출금 및 민감한 작업에 사용되는 별도의 비밀번호', th: 'รหัสผ่านแยกสำหรับการถอนเงินและการดำเนินการที่สำคัญ' },
    'sec.notSet': { zh: '未設定 ›', en: 'Not Set ›', ko: '설정되지 않음 ›', th: 'ยังไม่ตั้งค่า ›' },
    'sec.logoutTitle': { zh: '登出', en: 'Logout', ko: '로그아웃', th: 'ออกจากระบบ' },
    'sec.logoutDesc': { zh: '安全登出目前的帳戶', en: 'Securely log out of your current account', ko: '현재 계정에서 안전하게 로그아웃합니다', th: 'ออกจากระบบบัญชีปัจจุบันอย่างปลอดภัย' },

    'cp.currentPassword': { zh: '目前密碼', en: 'Current Password', ko: '현재 비밀번호', th: 'รหัสผ่านปัจจุบัน' },
    'cp.currentPasswordPlaceholder': { zh: '請輸入目前密碼', en: 'Please enter current password', ko: '현재 비밀번호를 입력해 주세요', th: 'กรุณากรอกรหัสผ่านปัจจุบัน' },
    'cp.newPassword': { zh: '新密碼', en: 'New Password', ko: '새 비밀번호', th: 'รหัสผ่านใหม่' },
    'cp.newPasswordPlaceholder': { zh: '5-16 個字元', en: '5-16 characters', ko: '5-16자', th: '5-16 ตัวอักษร' },
    'cp.confirmNewPassword': { zh: '確認新密碼', en: 'Confirm New Password', ko: '새 비밀번호 확인', th: 'ยืนยันรหัสผ่านใหม่' },
    'cp.confirmNewPasswordPlaceholder': { zh: '請再次輸入新密碼', en: 'Please re-enter new password', ko: '새 비밀번호를 다시 입력해 주세요', th: 'กรุณากรอกรหัสผ่านใหม่อีกครั้ง' },
    'cp.confirmChange': { zh: '確認修改', en: 'Confirm Change', ko: '변경 확인', th: 'ยืนยันการเปลี่ยนแปลง' },
    'cp.hint': { zh: '修改成功後將自動登出，請使用新密碼重新登入。', en: 'You will be automatically logged out after a successful change. Please log in again with your new password.', ko: '변경에 성공하면 자동으로 로그아웃됩니다. 새 비밀번호로 다시 로그인해 주세요.', th: 'ระบบจะออกจากระบบให้อัตโนมัติหลังเปลี่ยนสำเร็จ กรุณาเข้าสู่ระบบใหม่ด้วยรหัสผ่านใหม่' },

    'record.startDate': { zh: '開始日期', en: 'Start Date', ko: '시작일', th: 'วันที่เริ่มต้น' },
    'record.endDate': { zh: '結束日期', en: 'End Date', ko: '종료일', th: 'วันที่สิ้นสุด' },
    'record.to': { zh: '至', en: 'to', ko: '~', th: 'ถึง' },
    'record.search': { zh: '查詢', en: 'Search', ko: '조회', th: 'ค้นหา' },

    'record.orderNo': { zh: '訂單編號', en: 'Order No.', ko: '주문 번호', th: 'หมายเลขคำสั่ง' },
    'record.game': { zh: '遊戲', en: 'Game', ko: '게임', th: 'เกม' },
    'record.settleTime': { zh: '結算時間', en: 'Settlement Time', ko: '정산 시간', th: 'เวลาชำระบัญชี' },
    'record.betAmount': { zh: '投注金額', en: 'Bet Amount', ko: '베팅 금액', th: 'จำนวนเดิมพัน' },
    'record.validBet': { zh: '有效投注', en: 'Valid Bet', ko: '유효 베팅', th: 'เดิมพันที่นับ' },
    'record.payoutAmount': { zh: '派彩金額', en: 'Payout Amount', ko: '지급 금액', th: 'จำนวนเงินที่จ่าย' },
    'record.winLoss': { zh: '輸贏', en: 'Win/Loss', ko: '승패', th: 'ผลแพ้ชนะ' },
    // 投注紀錄：體育串關展開列（只有 202508120001 這筆示範資料用到）
    'record.parlayLabel': { zh: '2串1 過關', en: '2-Leg Parlay', ko: '2폴더 콤비네이션', th: 'พาร์เลย์ 2 คู่' },
    'record.combinedOdds': { zh: '綜合賠率', en: 'Combined Odds', ko: '통합 배당률', th: 'อัตราต่อรองรวม' },
    'record.league': { zh: '聯賽', en: 'League', ko: '리그', th: 'ลีก' },
    'record.event': { zh: '賽事', en: 'Event', ko: '경기', th: 'การแข่งขัน' },
    'record.selection': { zh: '投注選項', en: 'Selection', ko: '베팅 옵션', th: 'ตัวเลือกการเดิมพัน' },
    'record.odds': { zh: '賠率', en: 'Odds', ko: '배당률', th: 'อัตราต่อรอง' },
    'record.result': { zh: '賽果', en: 'Result', ko: '경기 결과', th: 'ผลการแข่งขัน' },
    'record.won': { zh: '贏', en: 'Won', ko: '승', th: 'ชนะ' },
    'record.totalPL': { zh: '總損益', en: 'Total P&L', ko: '총 손익', th: 'กำไรขาดทุนรวม' },

    'record.txNo': { zh: '交易編號', en: 'Transaction No.', ko: '거래 번호', th: 'หมายเลขธุรกรรม' },
    'record.requestTime': { zh: '申請時間', en: 'Request Time', ko: '신청 시간', th: 'เวลาที่ขอ' },
    'record.depositAmount': { zh: '儲值金額', en: 'Deposit Amount', ko: '충전 금액', th: 'จำนวนเติมเงิน' },
    'record.status': { zh: '狀態', en: 'Status', ko: '상태', th: 'สถานะ' },
    'record.method': { zh: '方式', en: 'Method', ko: '방법', th: 'วิธีการ' },
    'record.bankRef': { zh: '銀行參考碼', en: 'Bank Reference', ko: '은행 참조 번호', th: 'รหัสอ้างอิงธนาคาร' },
    'record.completeTime': { zh: '完成時間', en: 'Completion Time', ko: '완료 시간', th: 'เวลาที่เสร็จสิ้น' },
    'record.remark': { zh: '備註', en: 'Remark', ko: '비고', th: 'หมายเหตุ' },
    'record.totalDeposit': { zh: '總儲值金額', en: 'Total Deposit Amount', ko: '총 입금 금액', th: 'จำนวนเติมเงินรวม' },
    'record.withdrawAmount': { zh: '提款金額', en: 'Withdrawal Amount', ko: '출금 금액', th: 'จำนวนถอนเงิน' },
    'record.bankName': { zh: '銀行名稱', en: 'Bank Name', ko: '은행명', th: 'ชื่อธนาคาร' },
    'record.completeDate': { zh: '完成日期', en: 'Completion Date', ko: '완료일', th: 'วันที่เสร็จสิ้น' },
    'record.totalWithdrawal': { zh: '總提款金額', en: 'Total Withdrawal Amount', ko: '총 출금 금액', th: 'จำนวนถอนเงินรวม' },

    'record.txType': { zh: '交易類型', en: 'Transaction Type', ko: '거래 유형', th: 'ประเภทธุรกรรม' },
    'record.time': { zh: '時間', en: 'Time', ko: '시간', th: 'เวลา' },
    'record.txAmount': { zh: '交易金額', en: 'Transaction Amount', ko: '거래 금액', th: 'จำนวนเงินธุรกรรม' },
    'record.currentBalance': { zh: '目前餘額', en: 'Current Balance', ko: '현재 잔액', th: 'ยอดเงินปัจจุบัน' },
    'record.content': { zh: '內容', en: 'Description', ko: '내용', th: 'รายละเอียด' },

    'record.gameType': { zh: '遊戲類型', en: 'Game Type', ko: '게임 유형', th: 'ประเภทเกม' },
    'record.totalWinLoss': { zh: '總輸贏', en: 'Total Win/Loss', ko: '총 승패', th: 'ผลแพ้ชนะทั้งหมด' },
    'record.rebate': { zh: '返水', en: 'Rebate', ko: '캐시백', th: 'เงินคืน' },

    'record.date': { zh: '日期', en: 'Date', ko: '날짜', th: 'วันที่' },
    'record.type': { zh: '類型', en: 'Type', ko: '유형', th: 'ประเภท' },
    'record.gameName': { zh: '遊戲名稱', en: 'Game Name', ko: '게임 이름', th: 'ชื่อเกม' },
    'record.activityName': { zh: '活動名稱', en: 'Activity Name', ko: '이벤트 이름', th: 'ชื่อกิจกรรม' },
    'record.depositTurnover': { zh: '儲值流水', en: 'Deposit Turnover', ko: '충전 유효 베팅액', th: 'ยอดหมุนเงินฝาก' },
    'record.bonusTurnover': { zh: '獎金流水', en: 'Bonus Turnover', ko: '보너스 유효 베팅액', th: 'ยอดหมุนโบนัส' },
    'record.progress': { zh: '進度', en: 'Progress', ko: '진행률', th: 'ความคืบหน้า' },

    'record.statusCompleted': { zh: '已完成', en: 'Completed', ko: '완료됨', th: 'เสร็จสมบูรณ์' },
    'record.statusProcessing': { zh: '處理中', en: 'Processing', ko: '처리 중', th: 'กำลังดำเนินการ' },
    'record.statusRejected': { zh: '已拒絕', en: 'Rejected', ko: '거부됨', th: 'ถูกปฏิเสธ' },
    'bank.kookmin': { zh: '國民銀行', en: 'Kookmin Bank', ko: '국민은행', th: 'ธนาคารคุกมิน' },
    'sport.searchPlaceholder': { zh: '搜尋聯賽或隊伍', en: 'Search leagues or teams', ko: '리그 또는 팀 검색', th: 'ค้นหาลีกหรือทีม' },
    'deposit.amountAria': { zh: '儲值金額', en: 'Deposit amount', ko: '충전 금액', th: 'จำนวนเงินฝาก' },
    'withdrawal.amountAria': { zh: '提款金額', en: 'Withdrawal amount', ko: '출금 금액', th: 'จำนวนเงินถอน' },
    'pwd.toggleAria': { zh: '顯示/隱藏密碼', en: 'Show/hide password', ko: '비밀번호 표시/숨기기', th: 'แสดง/ซ่อนรหัสผ่าน' },
    'acct.levelProgressAria': { zh: '等級進度 62%', en: 'Level progress 62%', ko: '레벨 진행도 62%', th: 'ความคืบหน้าระดับ 62%' },

    'game.sport': { zh: '體育', en: 'Sports', ko: '스포츠', th: 'กีฬา' },
    'game.slot': { zh: '老虎機', en: 'Slots', ko: '슬롯', th: 'สล็อต' },
    'game.live': { zh: '真人娛樂', en: 'Live Casino', ko: '라이브 카지노', th: 'คาสิโนสด' },
    'game.fish': { zh: '捕魚達人', en: 'Fishing Master', ko: '낚시의 달인', th: 'เซียนยิงปลา' },

    'tx.deposit': { zh: '儲值', en: 'Deposit', ko: '충전', th: 'เติมเงิน' },
    'tx.bet': { zh: '投注', en: 'Bet', ko: '베팅', th: 'เดิมพัน' },
    'tx.payout': { zh: '派彩', en: 'Payout', ko: '지급', th: 'จ่ายเงิน' },
    'tx.withdrawal': { zh: '提款', en: 'Withdrawal', ko: '출금', th: 'ถอนเงิน' },
    'tx.bonus': { zh: '彩金', en: 'Bonus', ko: '보너스', th: 'โบนัส' },

    'acct.joinDateValue': { zh: '2025 年 8 月', en: 'August 2025', ko: '2025년 8월', th: 'สิงหาคม 2025' },

    'remark.firstDepositBonus50': { zh: '首存加碼 50%', en: 'First Deposit Bonus 50%', ko: '첫 충전 보너스 50%', th: 'โบนัสฝากครั้งแรก 50%' },
    'remark.turnoverNotMet': { zh: '打碼量未達標', en: 'Turnover requirement not met', ko: '유효 베팅액 미달성', th: 'ไม่ถึงยอดหมุนที่กำหนด' },

    'remark.firstDepositBonus100': { zh: '首存加碼100%', en: 'First Deposit Bonus 100%', ko: '첫 충전 보너스 100%', th: 'โบนัสฝากครั้งแรก 100%' },
    'remark.wedDeposit10': { zh: '週三存款贈10%', en: 'Wednesday Deposit Bonus 10%', ko: '수요일 충전 보너스 10%', th: 'โบนัสฝากวันพุธ 10%' },
    'remark.weekendRebate5': { zh: '週末返水5%', en: 'Weekend Rebate 5%', ko: '주말 캐시백 5%', th: 'เงินคืนวันหยุดสุดสัปดาห์ 5%' },
    'remark.depositFullGift': { zh: '儲值滿額禮', en: 'Deposit Milestone Gift', ko: '충전 목표 달성 선물', th: 'ของขวัญเติมเงินครบยอด' },
    'remark.vipBonus': { zh: 'VIP專屬彩金', en: 'VIP Exclusive Bonus', ko: 'VIP 전용 보너스', th: 'โบนัสพิเศษ VIP' },
    'remark.birthdayGift': { zh: '生日禮金', en: 'Birthday Gift', ko: '생일 선물', th: 'ของขวัญวันเกิด' },
    'remark.dailyCheckIn': { zh: '每日簽到禮', en: 'Daily Check-in Gift', ko: '매일 출석 선물', th: 'ของขวัญเช็คอินรายวัน' },
    'remark.referralBonus': { zh: '邀請好友獎金', en: 'Referral Bonus', ko: '친구 추천 보너스', th: 'โบนัสแนะนำเพื่อน' },
    'remark.sunDeposit': { zh: '週日充值贈', en: 'Sunday Deposit Bonus', ko: '일요일 충전 보너스', th: 'โบนัสฝากวันอาทิตย์' },

    'acctRecord.bankCardDeposit': { zh: '銀行卡儲值', en: 'Bank Card Deposit', ko: '은행 카드 충전', th: 'เติมเงินด้วยบัตรธนาคาร' },
    'acctRecord.sportsBet': { zh: '體育投注', en: 'Sports Bet', ko: '스포츠 베팅', th: 'เดิมพันกีฬา' },
    'acctRecord.sportsPayout': { zh: '體育派彩', en: 'Sports Payout', ko: '스포츠 지급', th: 'จ่ายเงินกีฬา' },
    'acctRecord.bankCardWithdrawal': { zh: '銀行卡提款', en: 'Bank Card Withdrawal', ko: '은행 카드 출금', th: 'ถอนเงินด้วยบัตรธนาคาร' },

    'game.startPlaying': { zh: '開始遊戲', en: 'Play Now', ko: '게임 시작', th: 'เริ่มเล่น' },
    'game.tagExclusive': { zh: '獨家', en: 'Exclusive', ko: '독점', th: 'เอ็กซ์คลูซีฟ' },
    'game.tagHot': { zh: '熱門', en: 'Hot', ko: '인기', th: 'มาแรง' },
    'game.tagNew': { zh: '新遊戲', en: 'New', ko: '신규', th: 'ใหม่' },
    'game.favorite': { zh: '收藏', en: 'Favorite', ko: '즐겨찾기', th: 'รายการที่ชอบ' },
    'game.searchPlaceholder': { zh: '搜尋遊戲', en: 'Search games', ko: '게임 검색', th: 'ค้นหาเกม' },
    'game.search': { zh: '搜尋', en: 'Search', ko: '검색', th: 'ค้นหา' },
    'game.vendor': { zh: '廠商', en: 'Providers', ko: '제공사', th: 'ผู้ให้บริการ' },
    'game.viewMore': { zh: '查看更多 →', en: 'View More →', ko: '더 보기 →', th: 'ดูเพิ่มเติม →' },
    'game.showMore': { zh: '顯示更多', en: 'Show More', ko: '더 보기', th: 'แสดงเพิ่มเติม' },
    'game.scrollLeft': { zh: '向左捲動', en: 'Scroll Left', ko: '왼쪽으로 스크롤', th: 'เลื่อนไปทางซ้าย' },
    'game.scrollRight': { zh: '向右捲動', en: 'Scroll Right', ko: '오른쪽으로 스크롤', th: 'เลื่อนไปทางขวา' },
    'game.chooseVendor': { zh: '選擇廠商', en: 'Choose Provider', ko: '제공사 선택', th: 'เลือกผู้ให้บริการ' },
    'game.hotGames': { zh: '熱門遊戲', en: 'Hot Games', ko: '인기 게임', th: 'เกมมาแรง' },
    'game.miniGames': { zh: '迷你遊戲', en: 'Mini Games', ko: '미니 게임', th: 'มินิเกม' },
    'game.electronicGames': { zh: '電子遊戲', en: 'Electronic Games', ko: '전자 게임', th: 'เกมอิเล็กทรอนิกส์' },
    'game.liveCasinoEyebrow': { zh: '真人娛樂', en: 'Live Casino', ko: '라이브 카지노', th: 'คาสิโนสด' },
    'game.sportsZone': { zh: '體育專區', en: 'Sports Zone', ko: '스포츠 존', th: 'โซนกีฬา' },

    'hero.trending': { zh: '現正流行', en: 'Trending Now', ko: '지금 인기', th: 'กำลังเป็นที่นิยม' },
    'hero.slotSub': { zh: '上千款經典與最新老虎機，隨時開轉。', en: 'Thousands of classic and latest slots, spin anytime.', ko: '수천 개의 클래식과 최신 슬롯을 언제든지 즐기세요.', th: 'สล็อตคลาสสิกและใหม่ล่าสุดนับพันเกม หมุนได้ทุกเมื่อ' },
    'hero.fishSub': { zh: '深海捕魚競技，火力全開搶奪寶藏。', en: 'Deep-sea fishing competition, unleash full firepower for treasure.', ko: '심해 낚시 경쟁, 화력을 총동원해 보물을 쟁취하세요.', th: 'การแข่งขันยิงปลาใต้ทะเลลึก ปลดปล่อยพลังยิงเต็มที่เพื่อล่าสมบัติ' },
    'hero.hotGamesSub': { zh: '全站玩家最愛，精選高回饋原創與授權電子遊戲。', en: 'The most loved by players site-wide, curated high-payout original and licensed games.', ko: '전체 플레이어가 가장 사랑하는, 고배당 오리지널 및 라이선스 게임 모음.', th: 'เกมที่ผู้เล่นทั้งเว็บชื่นชอบที่สุด คัดสรรเกมต้นฉบับและเกมมีลิขสิทธิ์ที่ให้ผลตอบแทนสูง' },
    'hero.liveSub': { zh: '高清直播真人賭桌，24 小時不間斷。', en: 'HD live-streamed casino tables, 24 hours non-stop.', ko: 'HD 생중계 카지노 테이블, 24시간 끊임없이.', th: 'โต๊ะคาสิโนไลฟ์สตรีมความคมชัดสูง เปิดตลอด 24 ชั่วโมง' },
    'hero.miniGamesSub': { zh: '快節奏小遊戲，一局只要幾秒鐘。', en: 'Fast-paced mini games, each round takes only seconds.', ko: '빠른 속도의 미니 게임, 한 라운드가 몇 초면 끝.', th: 'มินิเกมจังหวะเร็ว แต่ละรอบใช้เวลาไม่กี่วินาที' },
    'hero.sportSub': { zh: '全球賽事即時盤口，賽前賽中隨時投注。', en: 'Real-time odds for global matches, bet before or during the game.', ko: '전 세계 경기 실시간 배당, 경기 전후 언제든 베팅.', th: 'อัตราต่อรองแบบเรียลไทม์ทั่วโลก เดิมพันได้ทั้งก่อนและระหว่างเกม' },
    'hero.promotionSub': { zh: '最新加碼、返水與回饋活動，天天都有新驚喜。', en: 'The latest bonuses, rebates, and reward promotions, new surprises every day.', ko: '최신 보너스, 캐시백, 리워드 프로모션, 매일 새로운 즐거움.', th: 'โบนัส เงินคืน และโปรโมชั่นตอบแทนล่าสุด ความประหลาดใจใหม่ทุกวัน' },

    'promo.tabAll': { zh: '全部活動', en: 'All Promotions', ko: '전체 이벤트', th: 'โปรโมชั่นทั้งหมด' },
    'promo.tabDeposit': { zh: '儲值優惠', en: 'Deposit Offers', ko: '충전 혜택', th: 'โปรโมชั่นเติมเงิน' },
    'promo.tabRebate': { zh: '返水回饋', en: 'Rebate', ko: '캐시백', th: 'เงินคืน' },
    'promo.tabVip': { zh: 'VIP 專屬', en: 'VIP Exclusive', ko: 'VIP 전용', th: 'สิทธิพิเศษ VIP' },
    'promo.join': { zh: '立即參加', en: 'Join Now', ko: '지금 참여', th: 'เข้าร่วมทันที' },
    'promo.terms': { zh: '活動細則 →', en: 'Terms & Conditions →', ko: '이벤트 상세 →', th: 'รายละเอียดกิจกรรม →' },

    'promo.tagLimited': { zh: '限時', en: 'Limited Time', ko: '한정 시간', th: 'จำกัดเวลา' },
    'promo.tagDaily': { zh: '每日', en: 'Daily', ko: '매일', th: 'รายวัน' },
    'promo.tagLive': { zh: '真人', en: 'Live', ko: '라이브', th: 'ไลฟ์' },
    'promo.tagSlot': { zh: '老虎機', en: 'Slots', ko: '슬롯', th: 'สล็อต' },
    'promo.tagSport': { zh: '體育', en: 'Sports', ko: '스포츠', th: 'กีฬา' },
    'promo.tagFish': { zh: '捕魚', en: 'Fishing', ko: '낚시', th: 'ยิงปลา' },
    'promo.tagMini': { zh: '迷你', en: 'Mini', ko: '미니', th: 'มินิ' },
    'promo.tagReferral': { zh: '推薦', en: 'Referral', ko: '추천', th: 'แนะนำ' },
    'promo.tagVip': { zh: 'VIP', en: 'VIP', ko: 'VIP', th: 'VIP' },
    'promo.tagCrypto': { zh: '加密貨幣', en: 'Crypto', ko: '암호화폐', th: 'คริปโต' },
    'promo.tagWeekend': { zh: '週末', en: 'Weekend', ko: '주말', th: 'วันหยุดสุดสัปดาห์' },
    'promo.tagLottery': { zh: '抽獎', en: 'Lucky Draw', ko: '럭키 드로우', th: 'ชิงโชค' },

    'promo.title1': { zh: '新會員首存 100% 加碼', en: 'New Member First Deposit Bonus 100%', ko: '신규 회원 첫 충전 보너스 100%', th: 'โบนัสฝากครั้งแรกสมาชิกใหม่ 100%' },
    'promo.desc1': { zh: '完成首次儲值即享 100% 加碼金，最高可領 10,000 元，新會員限領一次。', en: 'Complete your first deposit to receive a 100% bonus, up to ₩10,000, one-time only for new members.', ko: '첫 충전을 완료하면 100% 보너스를 받을 수 있으며, 최대 10,000원까지, 신규 회원 1회 한정입니다.', th: 'ฝากเงินครั้งแรกรับโบนัส 100% สูงสุด 10,000 บาท จำกัดสมาชิกใหม่ 1 ครั้งเท่านั้น' },
    'promo.title2': { zh: '每日簽到領紅包', en: 'Daily Check-in Red Packet', ko: '매일 출석 체크 홍바오', th: 'เช็คอินรายวันรับซองแดง' },
    'promo.desc2': { zh: '連續登入簽到，第 7 天最高可拆 888 元紅包，斷簽重新計算。', en: 'Check in daily for 7 consecutive days to unlock a red packet worth up to ₩888; missing a day resets the streak.', ko: '7일 연속 출석 체크하면 최대 888원 홍바오를 받을 수 있습니다. 하루라도 놓치면 처음부터 다시 계산됩니다.', th: 'เช็คอินต่อเนื่อง 7 วัน รับซองแดงสูงสุด 888 บาท หากขาดจะเริ่มนับใหม่' },
    'promo.title3': { zh: '真人娛樂 1.5% 無上限返水', en: 'Live Casino 1.5% Unlimited Rebate', ko: '라이브 카지노 1.5% 무제한 캐시백', th: 'คาสิโนสดคืนเงิน 1.5% ไม่จำกัด' },
    'promo.desc3': { zh: '真人館所有廠商投注額皆計入，每日結算，返水無上限。', en: 'All live casino provider bets count, settled daily, no cap on rebate.', ko: '라이브 카지노 모든 제공사의 베팅액이 포함되며, 매일 정산되고 캐시백에 한도가 없습니다.', th: 'เดิมพันจากผู้ให้บริการคาสิโนสดทั้งหมดนับรวม คำนวณทุกวัน ไม่จำกัดเงินคืน' },
    'promo.title4': { zh: '老虎機週週回饋 8%', en: 'Slots Weekly Rebate 8%', ko: '슬롯 주간 캐시백 8%', th: 'สล็อตคืนเงินรายสัปดาห์ 8%' },
    'promo.desc4': { zh: '每週一結算上週老虎機淨損，最高回饋 8%，自動派發至錢包。', en: "Settled every Monday based on last week's net slot loss, up to 8% rebate, auto-credited to your wallet.", ko: '매주 월요일 전주 슬롯 순손실을 기준으로 정산하며, 최대 8% 캐시백이 지갑으로 자동 지급됩니다.', th: 'คำนวณทุกวันจันทร์จากยอดขาดทุนสล็อตสัปดาห์ก่อน คืนสูงสุด 8% เข้ากระเป๋าเงินอัตโนมัติ' },
    'promo.title5': { zh: '體育首注失利保險', en: 'Sports First Bet Insurance', ko: '스포츠 첫 베팅 보험', th: 'ประกันเดิมพันกีฬาครั้งแรก' },
    'promo.desc5': { zh: '首張體育注單未中獎，退還本金最高 2,000 元，賽前投注適用。', en: 'If your first sports bet loses, get a refund of up to ₩2,000; applies to pre-match bets.', ko: '첫 스포츠 베팅이 적중하지 않으면 원금 최대 2,000원을 환불해 드립니다. 경기 전 베팅에 적용됩니다.', th: 'หากเดิมพันกีฬาครั้งแรกไม่ชนะ รับเงินคืนสูงสุด 2,000 บาท ใช้ได้กับการเดิมพันก่อนแข่ง' },
    'promo.title6': { zh: '捕魚達人火力加成', en: 'Fishing Master Firepower Boost', ko: '낚시의 달인 화력 증가', th: 'เพิ่มพลังยิงเซียนยิงปลา' },
    'promo.desc6': { zh: '活動期間捕魚遊戲砲台火力 +20%，擊殺 BOSS 額外掉落寶箱。', en: 'During the event, fishing game cannon firepower +20%, defeating bosses drops extra treasure chests.', ko: '이벤트 기간 동안 낚시 게임 대포 화력 +20%, 보스를 처치하면 추가 보물 상자가 드롭됩니다.', th: 'ช่วงกิจกรรม พลังยิงปืนในเกมยิงปลา +20% ฆ่าบอสได้กล่องสมบัติเพิ่ม' },
    'promo.title7': { zh: '迷你遊戲連勝獎金', en: 'Mini Games Win Streak Bonus', ko: '미니 게임 연승 보너스', th: 'โบนัสเกมมินิเกมชนะติดต่อกัน' },
    'promo.desc7': { zh: '迷你遊戲連續獲勝 5 局，額外贈送 300 元獎金，每日限領三次。', en: 'Win 5 consecutive rounds in mini games for an extra ₩300 bonus, up to 3 times per day.', ko: '미니 게임에서 5연승 시 추가로 300원 보너스를 드립니다. 하루 최대 3회까지 받을 수 있습니다.', th: 'ชนะมินิเกมต่อเนื่อง 5 รอบ รับโบนัสเพิ่ม 300 บาท จำกัดวันละ 3 ครั้ง' },
    'promo.title8': { zh: '推薦好友雙方同享', en: 'Refer a Friend, Both Benefit', ko: '친구 추천, 양쪽 모두 혜택', th: 'แนะนำเพื่อน รับสิทธิ์ทั้งสองฝ่าย' },
    'promo.desc8': { zh: '成功推薦好友註冊並完成首存，雙方各得 500 元推薦金。', en: 'When a referred friend registers and completes their first deposit, both of you receive ₩500.', ko: '추천한 친구가 가입 후 첫 충전을 완료하면 양쪽 모두 500원의 추천 보너스를 받습니다.', th: 'เมื่อเพื่อนที่แนะนำลงทะเบียนและฝากเงินครั้งแรกสำเร็จ ทั้งสองฝ่ายรับเงินแนะนำ 500 บาท' },
    'promo.title9': { zh: 'VIP 專屬生日禮金', en: 'VIP Exclusive Birthday Gift', ko: 'VIP 전용 생일 선물', th: 'ของขวัญวันเกิดพิเศษสำหรับ VIP' },
    'promo.desc9': { zh: 'VIP1 以上會員生日當月可領取專屬禮金，等級越高金額越高。', en: 'VIP1 and above members can claim an exclusive gift during their birthday month; higher levels get higher amounts.', ko: 'VIP1 이상 회원은 생일이 있는 달에 전용 선물을 받을 수 있으며, 등급이 높을수록 금액도 커집니다.', th: 'สมาชิกระดับ VIP1 ขึ้นไป รับของขวัญพิเศษในเดือนเกิด ระดับสูงขึ้นได้รับมากขึ้น' },
    'promo.title10': { zh: '加密貨幣儲值免手續費', en: 'Fee-Free Crypto Deposits', ko: '암호화폐 충전 수수료 면제', th: 'เติมเงินคริปโตไม่มีค่าธรรมเนียม' },
    'promo.desc10': { zh: '使用 USDT／BTC 儲值全程免收手續費，到帳最快 1 分鐘。', en: 'No fees at all when depositing with USDT/BTC; funds arrive in as little as 1 minute.', ko: 'USDT/BTC로 충전 시 전 과정 수수료가 면제되며, 최소 1분 내 입금됩니다.', th: 'เติมเงินด้วย USDT/BTC ไม่มีค่าธรรมเนียมใดๆ เงินเข้าเร็วที่สุดใน 1 นาที' },
    'promo.title11': { zh: '週末狂歡連續轉不停', en: 'Weekend Spin Frenzy', ko: '주말 논스톱 스핀 파티', th: 'สปินสนุกไม่หยุดวันหยุดสุดสัปดาห์' },
    'promo.desc11': { zh: '每週六日老虎機累積轉動達標，可領取免費旋轉次數。', en: 'Reach the accumulated slot spin target every Saturday and Sunday to claim free spins.', ko: '매주 토요일과 일요일 슬롯 누적 스핀 목표를 달성하면 무료 스핀을 받을 수 있습니다.', th: 'สปินสล็อตสะสมให้ถึงเป้าทุกวันเสาร์-อาทิตย์ รับฟรีสปิน' },
    'promo.title12': { zh: '月月抽豪禮大獎', en: 'Monthly Grand Prize Draw', ko: '매달 명품 대상 추첨', th: 'ชิงโชคของรางวัลใหญ่ประจำเดือน' },
    'promo.desc12': { zh: '每月投注達標自動獲得抽獎券，最高可抽最新款旗艦手機。', en: 'Reach the monthly betting target to automatically receive a raffle ticket, top prize is the latest flagship phone.', ko: '매월 베팅 목표를 달성하면 자동으로 응모권을 받으며, 최고 상품은 최신 플래그십 스마트폰입니다.', th: 'เดิมพันครบเป้าประจำเดือนรับใบชิงโชคอัตโนมัติ รางวัลใหญ่สุดคือสมาร์ทโฟนเรือธงรุ่นล่าสุด' },

    'about.title': { zh: '關於我們', en: 'About Us', ko: '회사 소개', th: 'เกี่ยวกับเรา' },
    'about.tabSupport': { zh: '客服', en: 'Support', ko: '고객센터', th: 'ฝ่ายบริการลูกค้า' },
    'about.tabNotice': { zh: '公告', en: 'Notice', ko: '공지', th: 'ประกาศ' },
    'about.tabAbout': { zh: '關於我們', en: 'About Us', ko: '회사 소개', th: 'เกี่ยวกับเรา' },
    'about.tabPrivacy': { zh: '隱私權政策', en: 'Privacy Policy', ko: '개인정보 보호정책', th: 'นโยบายความเป็นส่วนตัว' },
    'about.tabInfo': { zh: '責任博彩', en: 'Responsible Gambling', ko: '책임감 있는 게임', th: 'การเล่นพนันอย่างมีความรับผิดชอบ' },
    'about.tabAddiction': { zh: '成癮防治', en: 'Addiction Prevention', ko: '중독 예방', th: 'การป้องกันการเสพติด' },
    'about.tabRules': { zh: '規則條款', en: 'Rules & Terms', ko: '규칙 및 약관', th: 'กฎและข้อตกลง' },
    'about.tabFaq': { zh: '常見問題', en: 'FAQ', ko: '자주 묻는 질문', th: 'คำถามที่พบบ่อย' },
    'about.supportIntro': { zh: '如有任何問題請透過線上客服／Telegram／Email 與我們聯繫，我們提供 24 小時即時支援服務，協助您處理帳戶、儲值、提款與遊戲相關問題。', en: 'If you have any questions, please contact us via live chat, Telegram, or email. We provide 24/7 instant support to help with account, deposit, withdrawal, and game-related issues.', ko: '문의사항이 있으시면 온라인 고객센터, 텔레그램, 이메일로 연락해 주세요. 계정, 충전, 출금 및 게임 관련 문제를 24시간 실시간으로 지원해 드립니다.', th: 'หากมีคำถามใดๆ กรุณาติดต่อเราผ่านแชทสด/Telegram/Email เราให้บริการช่วยเหลือแบบเรียลไทม์ตลอด 24 ชั่วโมง สำหรับปัญหาเกี่ยวกับบัญชี ฝากเงิน ถอนเงิน และเกม' },

    'faq.groupBasic': { zh: '基本資訊', en: 'Basic Information', ko: '기본 정보', th: 'ข้อมูลพื้นฐาน' },
    'faq.groupAccount': { zh: '帳戶管理', en: 'Account Management', ko: '계정 관리', th: 'การจัดการบัญชี' },
    'faq.q1': { zh: '什麼是 IGNITE100？', en: 'What is IGNITE100?', ko: 'IGNITE100이란 무엇인가요?', th: 'IGNITE100 คืออะไร?' },
    'faq.a1': { zh: 'IGNITE100 是一個提供可信賴、經驗證遊戲的海外投注網站，涵蓋體育、老虎機、真人娛樂、電子遊戲、捕魚達人等多元遊戲類型。', en: 'IGNITE100 is an offshore betting site offering trusted, verified games covering sports, slots, live casino, electronic games, fishing, and more.', ko: 'IGNITE100은 스포츠, 슬롯, 라이브 카지노, 전자 게임, 낚시 게임 등 다양한 게임을 제공하는 신뢰할 수 있는 해외 베팅 사이트입니다.', th: 'IGNITE100 เป็นเว็บพนันต่างประเทศที่นำเสนอเกมที่น่าเชื่อถือและได้รับการตรวจสอบ ครอบคลุมกีฬา สล็อต คาสิโนสด เกมอิเล็กทรอนิกส์ และยิงปลา' },
    'faq.q2': { zh: '遊戲結果公平嗎？', en: 'Are the game results fair?', ko: '게임 결과는 공정한가요?', th: 'ผลเกมยุติธรรมหรือไม่?' },
    'faq.a2': { zh: 'IGNITE100 是合法註冊的公司，所有遊戲結果皆採用公平驗證機制，確保每一局結果不受人為操縱。', en: 'IGNITE100 is a legally registered company; all game results use a fair verification mechanism to ensure no manipulation.', ko: 'IGNITE100은 합법적으로 등록된 회사이며, 모든 게임 결과는 공정성 검증 메커니즘을 통해 조작되지 않도록 보장됩니다.', th: 'IGNITE100 เป็นบริษัทที่จดทะเบียนอย่างถูกกฎหมาย ผลเกมทั้งหมดใช้กลไกตรวจสอบความยุติธรรมเพื่อป้องกันการควบคุมผลลัพธ์' },
    'faq.q3': { zh: '我的個人資訊安全嗎？', en: 'Is my personal information safe?', ko: '개인 정보는 안전한가요?', th: 'ข้อมูลส่วนตัวของฉันปลอดภัยหรือไม่?' },
    'faq.a3': { zh: '我們高度重視您的個人資訊安全，IGNITE100 絕不會將您的資料提供予未經授權的第三方。', en: 'We take your personal information security very seriously; IGNITE100 will never provide your data to unauthorized third parties.', ko: '고객님의 개인정보 보안을 매우 중요하게 생각하며, IGNITE100은 승인되지 않은 제3자에게 절대 정보를 제공하지 않습니다.', th: 'เราให้ความสำคัญกับความปลอดภัยของข้อมูลส่วนตัวของคุณอย่างสูงสุด IGNITE100 จะไม่ให้ข้อมูลของคุณแก่บุคคลที่สามที่ไม่ได้รับอนุญาตเด็ดขาด' },
    'faq.q4': { zh: '如何修改個人資料？', en: 'How do I edit my personal information?', ko: '개인 정보는 어떻게 수정하나요?', th: 'จะแก้ไขข้อมูลส่วนตัวได้อย่างไร?' },
    'faq.a4': { zh: '登入後點選「個人資料」，即可修改暱稱等基本資訊。', en: 'After logging in, click "Personal Info" to edit your nickname and other basic information.', ko: '로그인 후 "개인 정보"를 클릭하면 닉네임 등 기본 정보를 수정할 수 있습니다.', th: 'หลังเข้าสู่ระบบ คลิก "ข้อมูลส่วนตัว" เพื่อแก้ไขชื่อเล่นและข้อมูลพื้นฐานอื่นๆ' },
    'faq.q5': { zh: '忘記密碼怎麼辦？', en: 'What if I forget my password?', ko: '비밀번호를 잊어버렸다면 어떻게 하나요?', th: 'ถ้าลืมรหัสผ่านต้องทำอย่างไร?' },
    'faq.a5': { zh: '若您忘記帳戶密碼，請點選登入頁面的「忘記密碼」並依指示完成驗證與重設。', en: 'If you forget your password, click "Forgot Password" on the login page and follow the instructions to verify and reset it.', ko: '비밀번호를 잊으셨다면 로그인 페이지의 "비밀번호를 잊으셨나요?"를 클릭하고 안내에 따라 인증 및 재설정을 완료하세요.', th: 'หากลืมรหัสผ่าน คลิก "ลืมรหัสผ่าน" ที่หน้าเข้าสู่ระบบ และทำตามคำแนะนำเพื่อยืนยันและตั้งรหัสผ่านใหม่' },

    'hero.eyebrow': { zh: '新會員專屬', en: 'New Members Only', ko: '신규 회원 전용', th: 'สำหรับสมาชิกใหม่เท่านั้น' },
    'hero.titleHtml': { zh: '首存 <em>300%</em> 加碼<br />最高送 $3,000', en: '<em>300%</em> Welcome Bonus<br />Up to $3,000 for Poker & Casino', ko: '첫 충전 <em>300%</em> 보너스<br />포커 & 카지노 최대 $3,000', th: 'โบนัสต้อนรับ <em>300%</em><br />รับสูงสุด $3,000 สำหรับโป๊กเกอร์และคาสิโน' },
    'hero.sub': { zh: '即日起完成首次儲值，即可領取加碼金，撲克與賭場遊戲皆適用。', en: 'Complete your first deposit today and claim a bonus that works across both poker and casino games.', ko: '오늘 첫 충전을 완료하면 포커와 카지노 게임 전체에서 사용 가능한 보너스를 받을 수 있습니다.', th: 'ฝากเงินครั้งแรกวันนี้เพื่อรับโบนัสที่ใช้ได้ทั้งเกมโป๊กเกอร์และคาสิโน' },
    'signup.title': { zh: '立即開始', en: "Let's Get Started", ko: '지금 시작하기', th: 'เริ่มต้นเลย' },
    'signup.firstName': { zh: '名字', en: 'First Name', ko: '이름', th: 'ชื่อจริง' },
    'signup.lastName': { zh: '姓氏', en: 'Last Name', ko: '성', th: 'นามสกุล' },
    'signup.dob': { zh: '出生日期', en: 'Date of Birth', ko: '생년월일', th: 'วันเกิด' },
    'signup.dobPlaceholder': { zh: '年/月/日', en: 'YYYY/MM/DD', ko: '년/월/일', th: 'ปี/เดือน/วัน' },
    'signup.next': { zh: '下一步', en: 'Next', ko: '다음', th: 'ถัดไป' },

    'trust.rewards': { zh: '玩樂即得獎勵', en: 'Play & Earn Rewards', ko: '플레이하고 리워드 받기', th: 'เล่นแล้วรับรางวัล' },
    'trust.payouts': { zh: '出入金快速便利', en: 'Quick & Easy Payouts', ko: '빠르고 간편한 출금', th: 'ถอนเงินง่ายและรวดเร็ว' },
    'trust.slots': { zh: '400+ 款老虎機任你玩', en: '400+ Slots to Try', ko: '400개 이상의 슬롯', th: 'สล็อตกว่า 400 เกมให้เลือกเล่น' },
    'trust.safe': { zh: '安全可信賴，自 2016 年起', en: 'Safe & Trusted Since 2016', ko: '2016년부터 안전하고 신뢰할 수 있는', th: 'ปลอดภัยและน่าเชื่อถือตั้งแต่ปี 2016' },

    'sport.homeWin': { zh: '主勝', en: 'Home Win', ko: '홈 승', th: 'เจ้าบ้านชนะ' },
    'sport.draw': { zh: '和局', en: 'Draw', ko: '무승부', th: 'เสมอ' },
    'sport.awayWin': { zh: '客勝', en: 'Away Win', ko: '원정 승', th: 'ทีมเยือนชนะ' },
    // 捕魚達人遊戲名稱(fish.html/index.html 共用)
    'fish.deepSeaHunter': { zh: '深海獵手', en: 'Deep Sea Hunter', ko: '심해 헌터', th: 'นักล่าใต้ทะเลลึก' },
    'fish.goldenReef': { zh: '黃金礁岩', en: 'Golden Reef', ko: '골든 리프', th: 'แนวปะการังทองคำ' },
    'fish.stormTide': { zh: '風暴潮汐', en: 'Storm Tide', ko: '폭풍 조류', th: 'คลื่นพายุ' },
    'fish.beastOnslaught': { zh: '巨獸來襲', en: 'Beast Onslaught', ko: '거대 괴수의 습격', th: 'การโจมตีของสัตว์ประหลาด' },
    'fish.coralTreasure': { zh: '珊瑚秘寶', en: 'Coral Treasure', ko: '산호 보물', th: 'สมบัติปะการัง' },
    'fish.abyssOverlord': { zh: '深淵霸主', en: 'Abyss Overlord', ko: '심연의 지배자', th: 'จ้าวแห่งห้วงลึก' },
    'fish.poseidonsWrath': { zh: '海神之怒', en: "Poseidon's Wrath", ko: '포세이돈의 분노', th: 'พิโรธโพไซดอน' },
    'fish.frozenFishingGround': { zh: '冰封漁場', en: 'Frozen Fishing Ground', ko: '얼어붙은 어장', th: 'แหล่งตกปลาน้ำแข็ง' },
    'fish.glacierBeast': { zh: '冰河巨獸', en: 'Glacier Beast', ko: '빙하 괴수', th: 'อสูรธารน้ำแข็ง' },
    'fish.giantWaveAssault': { zh: '巨浪來襲', en: 'Giant Wave Assault', ko: '거대 파도의 습격', th: 'คลื่นยักษ์ถล่ม' },
    'fish.rainbowCoral': { zh: '幻彩珊瑚', en: 'Rainbow Coral', ko: '무지개 산호', th: 'ปะการังสายรุ้ง' },
    'fish.cosmicFishingGround': { zh: '星際漁場', en: 'Cosmic Fishing Ground', ko: '우주 어장', th: 'แหล่งตกปลาจักรวาล' },
    'fish.midnightHarbor': { zh: '暗夜漁港', en: 'Midnight Harbor', ko: '한밤의 어항', th: 'ท่าเรือยามค่ำคืน' },
    'fish.stormFisherman': { zh: '暴風漁夫', en: 'Storm Fisherman', ko: '폭풍의 어부', th: 'ชาวประมงพายุ' },
    'fish.polarWhaleHunt': { zh: '極地獵鯨', en: 'Polar Whale Hunt', ko: '극지 고래 사냥', th: 'ล่าวาฬขั้วโลก' },
    'fish.turboFishing': { zh: '極速捕魚', en: 'Turbo Fishing', ko: '초고속 낚시', th: 'ตกปลาความเร็วสูง' },
    'fish.deepSeaTreasure': { zh: '深海寶藏', en: 'Deep Sea Treasure', ko: '심해 보물', th: 'สมบัติใต้ทะเลลึก' },
    'fish.deepSeaMystery': { zh: '深海秘境', en: 'Deep Sea Mystery', ko: '심해의 비경', th: 'ดินแดนลึกลับใต้สมุทร' },
    'fish.deepSeaTyrant': { zh: '深海霸王', en: 'Deep Sea Tyrant', ko: '심해의 폭군', th: 'จอมโหดใต้สมุทร' },
    'fish.deepBlueHuntingGround': { zh: '深藍獵場', en: 'Deep Blue Hunting Ground', ko: '딥블루 사냥터', th: 'สนามล่าสีน้ำเงินเข้ม' },
    'fish.tidalStrike': { zh: '潮汐爆擊', en: 'Tidal Strike', ko: '조류 강타', th: 'คลื่นซัดกระหน่ำ' },
    'fish.volcanoFishingGround': { zh: '火山漁場', en: 'Volcano Fishing Ground', ko: '화산 어장', th: 'แหล่งตกปลาภูเขาไฟ' },
    'fish.lavaEruption': { zh: '熔岩噴發', en: 'Lava Eruption', ko: '용암 분출', th: 'ลาวาระเบิด' },
    'fish.mythicSeaMonster': { zh: '神話海怪', en: 'Mythic Sea Monster', ko: '신화 속 바다 괴물', th: 'อสูรทะเลในตำนาน' },
    'fish.ultimateFishingKing': { zh: '終極漁王', en: 'Ultimate Fishing King', ko: '궁극의 낚시왕', th: 'ราชาแห่งการตกปลาสูงสุด' },
    'fish.electricShoal': { zh: '電光魚群', en: 'Electric Shoal', ko: '전광 물고기떼', th: 'ฝูงปลาสายฟ้า' },
    'fish.goldenWaters': { zh: '黃金海域', en: 'Golden Waters', ko: '황금 해역', th: 'น่านน้ำทองคำ' },
    'fish.goldenSharkBay': { zh: '黃金鯊灣', en: 'Golden Shark Bay', ko: '골든 샤크베이', th: 'อ่าวฉลามทองคำ' },
    'fish.dragonPalaceTreasure': { zh: '龍宮尋寶', en: 'Dragon Palace Treasure', ko: '용궁 보물찾기', th: 'ล่าสมบัติวังมังกร' },
    'fish.tornadoStorm': { zh: '龍捲風暴', en: 'Tornado Storm', ko: '토네이도 폭풍', th: 'พายุทอร์นาโด' },
    // 體育專區聯賽名稱(index.html/sport.html 共用)
    'league.premierLeague': { zh: '英超', en: 'Premier League', ko: '프리미어리그', th: 'พรีเมียร์ลีก' },
    'league.laLiga': { zh: '西甲', en: 'La Liga', ko: '라리가', th: 'ลาลีกา' },
    'league.bundesliga': { zh: '德甲', en: 'Bundesliga', ko: '분데스리가', th: 'บุนเดสลีกา' },
    'league.serieA': { zh: '意甲', en: 'Serie A', ko: '세리에 A', th: 'เซเรีย อา' },
    'league.ligue1': { zh: '法甲', en: 'Ligue 1', ko: '리그 1', th: 'ลีกเอิง' },
    'league.championsLeague': { zh: '歐冠', en: 'Champions League', ko: '챔피언스리그', th: 'แชมเปียนส์ลีก' },
    'league.cpbl': { zh: '中華職棒', en: 'CPBL (Taiwan)', ko: '대만 프로야구(CPBL)', th: 'เบสบอลไต้หวัน (CPBL)' },
    'league.npb': { zh: '日職', en: 'NPB (Japan)', ko: '일본 프로야구(NPB)', th: 'เบสบอลญี่ปุ่น (NPB)' },
    'league.atp': { zh: '網球 ATP', en: 'ATP Tennis', ko: '테니스 ATP', th: 'เทนนิส ATP' },
    'league.wta': { zh: '網球 WTA', en: 'WTA Tennis', ko: '테니스 WTA', th: 'เทนนิส WTA' },
    'league.csgo': { zh: '電競 CS2', en: 'Esports CS2', ko: 'e스포츠 CS2', th: 'อีสปอร์ต CS2' },
    'league.dota2': { zh: '電競 Dota 2', en: 'Esports Dota 2', ko: 'e스포츠 Dota 2', th: 'อีสปอร์ต Dota 2' },
    'league.lol': { zh: '電競 LOL', en: 'Esports LOL', ko: 'e스포츠 LOL', th: 'อีสปอร์ต LOL' },
    // 體育專區球隊/選手名稱(index.html/sport.html 共用)
    'team.manchesterUnited': { zh: '曼聯', en: 'Manchester United', ko: '맨체스터 유나이티드', th: 'แมนเชสเตอร์ ยูไนเต็ด' },
    'team.liverpool': { zh: '利物浦', en: 'Liverpool', ko: '리버풀', th: 'ลิเวอร์พูล' },
    'team.manchesterCity': { zh: '曼城', en: 'Manchester City', ko: '맨체스터 시티', th: 'แมนเชสเตอร์ ซิตี้' },
    'team.chelsea': { zh: '切爾西', en: 'Chelsea', ko: '첼시', th: 'เชลซี' },
    'team.realMadrid': { zh: '皇家馬德里', en: 'Real Madrid', ko: '레알 마드리드', th: 'เรอัล มาดริด' },
    'team.barcelona': { zh: '巴塞隆納', en: 'Barcelona', ko: '바르셀로나', th: 'บาร์เซโลนา' },
    'team.bayernMunich': { zh: '拜仁慕尼黑', en: 'Bayern Munich', ko: '바이에른 뮌헨', th: 'บาเยิร์น มิวนิก' },
    'team.borussiaDortmund': { zh: '多特蒙德', en: 'Borussia Dortmund', ko: '도르트문트', th: 'โบรุสเซีย ดอร์ทมุนด์' },
    'team.acMilan': { zh: 'AC米蘭', en: 'AC Milan', ko: 'AC 밀란', th: 'เอซี มิลาน' },
    'team.interMilan': { zh: '國際米蘭', en: 'Inter Milan', ko: '인터 밀란', th: 'อินเตอร์ มิลาน' },
    'team.psg': { zh: '巴黎聖日耳曼', en: 'Paris Saint-Germain', ko: '파리 생제르맹', th: 'ปารีส แซงต์ แชร์กแมง' },
    'team.lyon': { zh: '里昂', en: 'Lyon', ko: '리옹', th: 'ลียง' },
    'team.lakers': { zh: '湖人', en: 'Lakers', ko: '레이커스', th: 'เลเกอร์ส' },
    'team.warriors': { zh: '勇士', en: 'Warriors', ko: '워리어스', th: 'วอร์ริเออร์ส' },
    'team.sixers': { zh: '76人', en: '76ers', ko: '76ers', th: '76ers' },
    'team.bucks': { zh: '公鹿', en: 'Bucks', ko: '벅스', th: 'บัคส์' },
    'team.celtics': { zh: '塞爾提克', en: 'Celtics', ko: '셀틱스', th: 'เซลติกส์' },
    'team.heat': { zh: '熱火', en: 'Heat', ko: '히트', th: 'ฮีท' },
    'team.hawks': { zh: '老鷹', en: 'Hawks', ko: '호크스', th: 'ฮอว์กส์' },
    'team.yankees': { zh: '洋基', en: 'Yankees', ko: '양키스', th: 'แยงกีส์' },
    'team.redSox': { zh: '紅襪', en: 'Red Sox', ko: '레드삭스', th: 'เร้ดซอกซ์' },
    'team.giants': { zh: '巨人', en: 'Giants', ko: '자이언츠', th: 'ไจแอนตส์' },
    'team.ctbcBrothers': { zh: '中信兄弟', en: 'CTBC Brothers', ko: 'CTBC 브라더스', th: 'CTBC บราเธอร์ส' },
    'team.uniLions': { zh: '統一獅', en: 'Uni-Lions', ko: '유니 라이온스', th: 'ยูนิ ไลออนส์' },
    'team.hanshinTigers': { zh: '阪神虎', en: 'Hanshin Tigers', ko: '한신 타이거스', th: 'ฮันชิน ไทเกอร์ส' },
    'team.yomiuriGiants': { zh: '讀賣巨人', en: 'Yomiuri Giants', ko: '요미우리 자이언츠', th: 'โยมิอูริ ไจแอนตส์' },
    'team.mapleLeafs': { zh: '楓葉隊', en: 'Maple Leafs', ko: '메이플리프스', th: 'เมเปิล ลีฟส์' },
    'team.blackhawks': { zh: '黑鷹隊', en: 'Blackhawks', ko: '블랙호크스', th: 'แบล็คฮอว์กส์' },
    'team.naomiOsaka': { zh: '大坂直美', en: 'Naomi Osaka', ko: '오사카 나오미', th: 'นาโอมิ โอซากะ' },
    'team.rafaelNadal': { zh: '納達爾', en: 'Rafael Nadal', ko: '라파엘 나달', th: 'ราฟาเอล นาดาล' },
    'team.mariaSharapova': { zh: '莎拉波娃', en: 'Maria Sharapova', ko: '마리아 샤라포바', th: 'มาเรีย ชาราโปวา' },
    'team.rogerFederer': { zh: '費德勒', en: 'Roger Federer', ko: '로저 페더러', th: 'โรเจอร์ เฟเดอเรอร์' },
  };

  function getLocale() {
    var saved;
    try { saved = localStorage.getItem(LOCALE_KEY); } catch (e) { saved = null; }
    var visible = visibleLocaleIds();
    // 已存的偏好若剛好被 studio 關閉(含中文預設隱藏),自動 fallback 到
    // 預設語系,預設語系也被關掉的話再退而求其次用清單第一個可見語言。
    if (saved && LOCALES.some(function (l) { return l.id === saved; }) && visible.indexOf(saved) !== -1) return saved;
    return visible.indexOf(DEFAULT_LOCALE) !== -1 ? DEFAULT_LOCALE : visible[0];
  }
  function setLocale(id) {
    if (!LOCALES.some(function (l) { return l.id === id; })) return;
    try { localStorage.setItem(LOCALE_KEY, id); } catch (e) {}
    applyLocale();
  }
  function t(key) {
    var entry = STRINGS[key];
    if (!entry) return key;
    var locale = getLocale();
    return entry[locale] || entry[DEFAULT_LOCALE] || key;
  }

  function applyLocale() {
    var locale = getLocale();
    document.documentElement.setAttribute('lang', locale === 'zh' ? 'zh-Hant' : locale);
    Array.prototype.slice.call(document.querySelectorAll('[data-i18n]')).forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-i18n-html]')).forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-i18n-placeholder]')).forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-i18n-aria]')).forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    var currentLabelEls = document.querySelectorAll('[data-lang-current]');
    Array.prototype.slice.call(currentLabelEls).forEach(function (el) {
      var found = LOCALES.filter(function (l) { return l.id === locale; })[0];
      el.textContent = found ? found.label : locale;
    });
    var visible = visibleLocaleIds();
    Array.prototype.slice.call(document.querySelectorAll('[data-lang-option]')).forEach(function (el) {
      var id = el.getAttribute('data-lang-option');
      el.classList.toggle('active', id === locale);
      el.hidden = visible.indexOf(id) === -1;
    });
    // 讓 site.js 重繪目前已掛載的動態區塊（header-auth 等）跟著換語系；
    // 尚未開啟的彈窗/選單本來就會在下次渲染時透過 t() 取得當前語系,不需另外處理。
    document.dispatchEvent(new CustomEvent('cms-v5:locale-changed', { detail: { locale: locale } }));
  }

  function closeLangMenu(root) {
    var menu = root.querySelector('[data-lang-menu]');
    var trigger = root.querySelector('[data-lang-trigger]');
    if (menu) menu.hidden = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }
  function initLangSwitcher() {
    Array.prototype.slice.call(document.querySelectorAll('[data-lang-root]')).forEach(function (root) {
      var trigger = root.querySelector('[data-lang-trigger]');
      var menu = root.querySelector('[data-lang-menu]');
      if (!trigger || !menu) return;
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = !menu.hidden;
        // 同一頁可能有桌機/手機兩份切換器,開一個要把其他關起來。
        Array.prototype.slice.call(document.querySelectorAll('[data-lang-root]')).forEach(function (r) { closeLangMenu(r); });
        menu.hidden = isOpen;
        trigger.setAttribute('aria-expanded', String(!isOpen));
      });
      Array.prototype.slice.call(menu.querySelectorAll('[data-lang-option]')).forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          setLocale(btn.getAttribute('data-lang-option'));
          closeLangMenu(root);
        });
      });
    });
    document.addEventListener('click', function () {
      Array.prototype.slice.call(document.querySelectorAll('[data-lang-root]')).forEach(function (r) { closeLangMenu(r); });
    });
  }

  window.CMS_I18N = {
    t: t, getLocale: getLocale, setLocale: setLocale, LOCALES: LOCALES, applyLocale: applyLocale,
    setVisibleLocales: setVisibleLocales, getVisibleLocales: visibleLocaleIds
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyLocale();
    initLangSwitcher();
  });
})();

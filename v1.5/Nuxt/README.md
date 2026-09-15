套件

忘記密碼流程

1. 忘記密碼
2. 輸入正確的帳號跟信箱後，會寄一封E-Mail附帶新的密碼給使用者
3. 使用者用帳號 + 新密碼登入
4. login data "passwordExpired" true (這時候已經成功登入並取得token)
5. 只要"passwordExpired" true，就會跳到修改密碼頁面

多語言

- 目前後端api支援的語言有
  - en
  - ko
  - zh-cn
  - zh-tw

特別筆記

- 流程
  - 註冊成功之後，使用者必須重新登入，而不是自動幫他登入並跳轉到首頁

流程驗證

- Auth
  - Register
  - Login
  - Logout
  - Forgot Password
  - Change Password

api

- getAnnouncements
  - banner_items - 首頁最上方的大區塊Banner - Component Banner
    - 參考
      - meta_json.config.banner_group_name
        home_banner 首頁最上面 桌機
        home_banner_m 首頁最上面 手機

        home_promotion_banner 首頁中間 桌機
        home_promotion_banner_m 首頁中間 手機
        - gameType 上方的banner
          hot_game_banner_d
          mini_game_banner_d  
          slots_banner_d
          sports_banner_d
          esports_banner_d
          live_banner_d
          poker_banner_d
          fish_banner_d
          lottery_banner_d

  - promotion_items - 首頁下方 Promotion Banner - Component BottomBanner
  - popup_items - 首頁彈窗區塊Banner - Component PromotionModal
  - 備註
    - promotion 能不能點擊跳轉，以單筆資料有沒有promotion_id作為判斷

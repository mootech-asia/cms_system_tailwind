const LIVE_CHAT_LICENSE = 19348679
const LIVE_CHAT_BOOTSTRAP_ID = 'livechat-widget-bootstrap'
let liveChatVisibilityHandlerRegistered = false
let liveChatReadyHandlerRegistered = false
let liveChatInitStarted = false
let liveChatOpenIntent = false

function ensureLiveChatConfig () {
  if (typeof window === 'undefined') return null

  window.__lc = window.__lc || {}
  window.__lc.license = LIVE_CHAT_LICENSE
  window.__lc.asyncInit = true
  window.__lc.integration_name = 'manual_restart_trial'
  window.__lc.product_name = 'livechat'

  return window.__lc
}

function injectLiveChatBootstrap () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  if (document.getElementById(LIVE_CHAT_BOOTSTRAP_ID)) return

  const script = document.createElement('script')
  script.id = LIVE_CHAT_BOOTSTRAP_ID
  script.type = 'text/javascript'
  script.textContent = `
    window.__lc = window.__lc || {};
    window.__lc.license = ${LIVE_CHAT_LICENSE};
    window.__lc.asyncInit = true;
    window.__lc.integration_name = 'manual_restart_trial';
    window.__lc.product_name = 'livechat';
    ;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[LiveChatWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.livechatinc.com/tracking.js",t.head.appendChild(n)}};n.LiveChatWidget=e})(window,document,[].slice)
  `

  document.head.appendChild(script)
}

function initLiveChatWidget () {
  if (typeof window === 'undefined') return
  if (liveChatInitStarted) return
  if (!window.LiveChatWidget?.init) return

  liveChatInitStarted = true
  window.LiveChatWidget.init()
}

function registerLiveChatReadyHandler () {
  if (typeof window === 'undefined') return
  if (liveChatReadyHandlerRegistered) return
  if (!window.LiveChatWidget?.on || !window.LiveChatWidget?.call) return

  const onReady = () => {
    if (liveChatOpenIntent) return

    try {
      window.LiveChatWidget?.call('hide')
    } catch (error) {
      console.error('[LiveChat] Unable to hide launcher on ready:', error)
    }
  }

  window.LiveChatWidget.on('ready', onReady)
  liveChatReadyHandlerRegistered = true
}

function registerLiveChatVisibilityHandler () {
  if (typeof window === 'undefined') return
  if (liveChatVisibilityHandlerRegistered) return
  if (!window.LiveChatWidget?.on || !window.LiveChatWidget?.call) return

  const onVisibilityChanged = (data) => {
    if (data?.visibility === 'maximized') {
      liveChatOpenIntent = false
      return
    }

    if (data?.visibility !== 'minimized') return

    try {
      window.LiveChatWidget?.call('hide')
    } catch (error) {
      console.error('[LiveChat] Unable to hide minimized widget:', error)
    }
  }

  window.LiveChatWidget.on('visibility_changed', onVisibilityChanged)
  liveChatVisibilityHandlerRegistered = true
}

export function preloadLiveChat () {
  if (typeof window === 'undefined') return

  ensureLiveChatConfig()
  injectLiveChatBootstrap()
  registerLiveChatReadyHandler()
  registerLiveChatVisibilityHandler()
  initLiveChatWidget()
}

export function useLiveChat () {
  async function openLiveChat () {
    if (typeof window === 'undefined') return

    liveChatOpenIntent = true
    preloadLiveChat()

    try {
      window.LiveChatWidget?.call('maximize')
    } catch (error) {
      console.error('[LiveChat] Unable to open chat widget:', error)
    }
  }

  return {
    openLiveChat
  }
}

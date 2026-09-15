import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { effectScope, watch } from 'vue'

function getPrimeLocale (lang) {
  const l = String(lang || 'ko')
  if (l === 'ko') {
    return {
      firstDayOfWeek: 0,
      dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
      dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
      dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
      monthNames: [
        '1월',
        '2월',
        '3월',
        '4월',
        '5월',
        '6월',
        '7월',
        '8월',
        '9월',
        '10월',
        '11월',
        '12월'
      ],
      monthNamesShort: [
        '1월',
        '2월',
        '3월',
        '4월',
        '5월',
        '6월',
        '7월',
        '8월',
        '9월',
        '10월',
        '11월',
        '12월'
      ],
      today: '오늘',
      clear: '지우기'
    }
  }

  return {
    firstDayOfWeek: 0,
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    monthNames: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ],
    monthNamesShort: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ],
    today: 'Today',
    clear: 'Clear'
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n
  const initialLang = i18n?.locale?.value || 'ko'

  nuxtApp.vueApp.use(PrimeVue, {
    locale: getPrimeLocale(initialLang),
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: '.p-never-dark',
        cssLayer: false
      }
    }
  })

  if (process.client && i18n) {
    const scope = effectScope()
    scope.run(() => {
      watch(
        () => i18n.locale.value,
        (lang) => {
          const pv = nuxtApp.vueApp.config.globalProperties?.$primevue
          if (pv?.config) pv.config.locale = getPrimeLocale(lang)
        },
        { immediate: true }
      )
    })
  }
})

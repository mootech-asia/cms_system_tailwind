/** 充值 - 流水計算(百分比) */
export function calculateTurnover (
  deposit,
  {
    bonusPercent,
    minBonus,
    maxBonus,
    depositMultiple,
    bonusMultiple,
    otherMultiple
  }
) {
  // 計算紅利
  let bonus = deposit * (bonusPercent / 100)

  if (bonus < minBonus) {
    bonus = minBonus
  }

  if (bonus > maxBonus) {
    bonus = maxBonus
  }

  // 有紅利對應的充值金額
  const qualifiedDeposit = Math.min(
    deposit,
    bonusPercent > 0 ? bonus / (bonusPercent / 100) : deposit
  )

  // 其他充值金額
  const otherDeposit = deposit - qualifiedDeposit

  const depositTurnover = qualifiedDeposit * depositMultiple
  const bonusTurnover = bonus * bonusMultiple
  const otherTurnover = otherDeposit * otherMultiple

  return {
    /** 充值金額 */
    deposit,
    /** 紅利 */
    bonus,
    /** 充值紅利 */
    qualifiedDeposit,
    /** 超出充值紅利的剩餘紅利 */
    otherDeposit,
    /** 流水 - 充值紅利 */
    depositTurnover,
    /** 流水 - 紅利 */
    bonusTurnover,
    /** 流水 - 超出充值紅利的剩餘紅利 */
    otherTurnover,
    /** 總流水 */
    totalTurnover:
      depositTurnover + bonusTurnover + otherTurnover
  }
}

/** 充值 - 流水計算(固定) */
export function calculateFixedTurnover (
  deposit, {
    depositAmount,
    bonusAmount,
    depositMultiple,
    bonusMultiple,
    otherMultiple
  }) {
  // 固定獎金金額 * 固定獎金金額的乘比 ＋ 獎金金額 * 獎金金額乘比 + (原始金額 - 固定獎金金額) * 剩餘乘比
  return depositAmount * depositMultiple + bonusAmount * bonusMultiple + (deposit - depositAmount) * otherMultiple
}

/** 轉千分位(小數點最多兩位) */
export function toThousandth (amount) {
  const v = Number(amount || 0)
  const hasFraction = Math.round(v * 100) % 100 !== 0
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: hasFraction ? 2 : 0
  }).format(v)
}

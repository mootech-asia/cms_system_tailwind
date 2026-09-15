export function formatAmount (n) {
  if (n == null) n = 0
  const cleaned = typeof n === 'string' ? n.replace(/,/g, '') : n
  const num = Number(cleaned || 0)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

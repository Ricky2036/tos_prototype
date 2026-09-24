export function resolveCurrentIslandPrayer({
  masterEnabled,
  simulatedPrayerId,
  dismissedPrayerId,
  activePrayer,
  prayers
}) {
  if (simulatedPrayerId) {
    const simulated = prayers.find((item) => item.id === simulatedPrayerId) || null
    return simulated?.id === dismissedPrayerId ? null : simulated
  }
  if (!masterEnabled) return null

  const prayer = activePrayer || null

  return prayer?.id === dismissedPrayerId ? null : prayer
}

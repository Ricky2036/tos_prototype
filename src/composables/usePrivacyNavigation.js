import { computed, ref, watch } from 'vue'

export function usePrivacyNavigation(privacy, system) {
  const displayedPage = ref(privacy.page)
  const pendingPage = ref(null)
  const destinationRevision = ref(0)
  const destinationTransition = ref('privacy-destination')
  const phase = ref('idle')
  const sourceDeparted = ref(false)
  let destinationApp = privacy.selectedApp
  if (privacy.page && privacy.page !== 'detail') privacy.settingsPage = privacy.page
  const departureStyle = computed(() => {
    if (phase.value === 'closing-control') return {
      transform: `translateY(${(system.overlays.controlCenter.progress - 1) * 100}%)`, pointerEvents:'none'
    }
    if (phase.value === 'opening-page' || sourceDeparted.value) return {transform:'translateY(-100%)',pointerEvents:'none'}
    return {}
  })
  // System overlays can cover the settings app without replacing its navigation state.
  function closeDetail() {
    sourceDeparted.value = false
    pendingPage.value = null
    displayedPage.value = privacy.settingsPage || null
    phase.value = privacy.settingsPage ? 'page' : 'idle'
    privacy.page = displayedPage.value
  }
  function revealDestination() {
    if (!pendingPage.value || !privacy.page) return
    const hadPage = Boolean(privacy.settingsPage)
    const reuse = privacy.settingsPage === pendingPage.value &&
      (pendingPage.value !== 'settings' || destinationApp === privacy.selectedApp)
    privacy.settingsPage = pendingPage.value
    destinationApp = privacy.selectedApp
    if (!reuse) {
      destinationTransition.value = hadPage ? 'privacy-page-slide' : 'privacy-destination'
      destinationRevision.value++
    }
    sourceDeparted.value = true
    displayedPage.value = pendingPage.value
    pendingPage.value = null
    phase.value = reuse ? 'page' : 'opening-page'
  }
  function onDestinationEntered() {
    if (displayedPage.value && displayedPage.value !== 'detail') phase.value='page'
  }
  watch(()=>privacy.page,(value,old)=>{
    if (!value) {destinationTransition.value='privacy-destination';sourceDeparted.value=false;pendingPage.value=null;privacy.settingsPage=null;displayedPage.value=null;phase.value='idle';return}
    if (value === displayedPage.value) return
    if (value === 'detail' && old && old !== 'detail' && system.overlays.controlCenter.status === 'closed') {
      privacy.page=null;return
    }
    if (value !== 'detail' && displayedPage.value === 'detail') {
      pendingPage.value=value;phase.value='closing-control'
      if (system.overlays.controlCenter.status === 'closed') revealDestination()
      else system.requestCloseOverlay('controlCenter')
      return
    }
    if (value === 'detail') {
      displayedPage.value=value;sourceDeparted.value=false;phase.value='idle'
    } else {
      pendingPage.value=value
      revealDestination()
    }
  })
  watch(()=>system.overlays.controlCenter.status,status=>{
    if (status !== 'closed') return
    if (phase.value === 'closing-control') revealDestination()
    else if (displayedPage.value === 'detail') closeDetail()
  })
  return {displayedPage,phase,departureStyle,onDestinationEntered,closeDetail,destinationRevision,destinationTransition}
}

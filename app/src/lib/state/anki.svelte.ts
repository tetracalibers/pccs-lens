let isAnki = $state(false)

export const ankiMode = {
  get isAnki() {
    return isAnki
  },
  toggle() {
    isAnki = !isAnki
  },
  reset() {
    isAnki = false
  }
}

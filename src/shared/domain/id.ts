const MIN_CLIENT_ID = 1000000000
const MAX_CLIENT_ID = 9007199254740991

export function generateClientId(): number {
  const entropy = Math.floor(Math.random() * 1000)
  const candidate = Date.now() * 1000 + entropy

  if (candidate < MIN_CLIENT_ID) {
    return MIN_CLIENT_ID + entropy
  }

  if (candidate > MAX_CLIENT_ID) {
    return MAX_CLIENT_ID - entropy
  }

  return candidate
}

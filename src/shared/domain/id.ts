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

function hashStringToSafeInt(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % MAX_CLIENT_ID
  }

  if (hash < MIN_CLIENT_ID) {
    return MIN_CLIENT_ID + hash
  }

  return hash
}

export function generateMonthlyEntryId(templateId: number, monthKey: string): number {
  return hashStringToSafeInt(`${templateId}:${monthKey}`)
}

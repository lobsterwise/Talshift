export async function getInterestOptions(): Promise<string[]> {
  const response = await fetch('/api/catalog/interests')
  if (!response.ok) throw new Error('Unable to load interest options.')
  const result = await response.json() as { items: string[] }
  return result.items
}
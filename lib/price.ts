/**
 * Fetches the current USDC/USD price from CoinGecko.
 * Results are cached for 60 seconds to avoid hammering the API on every trade.
 *
 * Falls back to 1.0000 if the fetch fails (USDC is a stablecoin, so this is safe).
 */

let cachedPrice: number | null = null
let cacheExpiresAt = 0

export async function getUsdcPrice(): Promise<number> {
  const now = Date.now()
  if (cachedPrice !== null && now < cacheExpiresAt) return cachedPrice

  try {
    const apiKey = process.env.COINGECKO_API_KEY
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (apiKey) headers['x-cg-demo-api-key'] = apiKey

    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd',
      { headers, next: { revalidate: 0 } }, // no Next.js caching — we manage it ourselves
    )

    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`)

    const data: { 'usd-coin': { usd: number } } = await res.json()
    const price = data['usd-coin']?.usd

    if (typeof price !== 'number' || price <= 0) throw new Error('Unexpected price payload')

    cachedPrice = price
    cacheExpiresAt = now + 60_000 // cache for 60 s
    return price
  } catch (err) {
    console.error('[price] CoinGecko fetch failed, using fallback:', err)
    // Keep any previous good value; otherwise default to 1.0000
    return cachedPrice ?? 1.0
  }
}

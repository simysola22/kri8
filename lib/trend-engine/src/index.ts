/**
 * Trend Engine — Provider Factory
 *
 * Set TREND_PROVIDER env var to switch data sources:
 *   TREND_PROVIDER=mock    — built-in placeholder data (default)
 *   TREND_PROVIDER=youtube — YouTube Data API v3 (requires YOUTUBE_API_KEY)
 *
 * Future providers to plug in here:
 *   - tiktok: TikTok for Developers API (official)
 *   - instagram: Meta Content Publishing API
 *   - twitter: Twitter API v2 (X Developer Portal)
 */
import { MockTrendProvider } from "./providers/mock.js";
import { YouTubeTrendProvider } from "./providers/youtube.js";
import type { TrendProvider } from "./types.js";

export * from "./types.js";
export * from "./analyzer.js";
export * from "./inspiration.js";
export { MockTrendProvider } from "./providers/mock.js";
export { YouTubeTrendProvider } from "./providers/youtube.js";

let _provider: TrendProvider | null = null;

export function createTrendProvider(): TrendProvider {
  if (_provider) return _provider;

  const name = process.env.TREND_PROVIDER ?? "mock";

  if (name === "youtube") {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn("[trend-engine] YOUTUBE_API_KEY not set, falling back to mock provider");
      _provider = new MockTrendProvider();
    } else {
      _provider = new YouTubeTrendProvider(apiKey);
    }
  } else {
    _provider = new MockTrendProvider();
  }

  return _provider;
}

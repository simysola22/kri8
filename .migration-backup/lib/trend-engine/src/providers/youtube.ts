/**
 * YouTube Data API v3 Trend Provider
 *
 * Plug-in ready for official YouTube Data API v3.
 * Set YOUTUBE_API_KEY to activate.
 *
 * API docs: https://developers.google.com/youtube/v3/docs
 * Terms: https://developers.google.com/youtube/terms/api-services-terms-of-service
 *
 * Required OAuth scopes (read-only): none — uses API key for public data
 * Rate limits: 10,000 units/day free tier
 */
import type { TrendDashboard, TrendingTopic, TrendingHashtag, KeywordTrend, TrendProvider } from "../types.js";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export class YouTubeTrendProvider implements TrendProvider {
  readonly name = "youtube";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getDashboard(): Promise<TrendDashboard> {
    const [trending, categories] = await Promise.all([
      this.fetchTrendingVideos(),
      this.fetchVideoCategories(),
    ]);

    const topics = this.extractTopics(trending);
    const hashtags = this.extractHashtags(trending);

    return {
      topics,
      hashtags,
      categories,
      lastUpdated: new Date().toISOString(),
      provider: this.name,
    };
  }

  async getKeywordTrends(keywords: string[]): Promise<KeywordTrend[]> {
    return Promise.all(
      keywords.map(async (keyword) => {
        const results = await this.searchVideos(keyword);
        const topics = this.extractTopics(results);
        const hashtags = this.extractHashtags(results);
        return {
          keyword,
          trendScore: Math.min(100, topics.length * 25 + (results.length > 0 ? 25 : 0)),
          relatedTopics: topics.slice(0, 3),
          relatedHashtags: hashtags.slice(0, 3),
        };
      })
    );
  }

  private async fetchTrendingVideos(): Promise<YouTubeVideo[]> {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("chart", "mostPopular");
    url.searchParams.set("videoCategoryId", "22"); // People & Blogs
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", this.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    const data = (await res.json()) as { items?: YouTubeVideo[] };
    return data.items ?? [];
  }

  private async searchVideos(query: string): Promise<YouTubeVideo[]> {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("order", "viewCount");
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("key", this.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
    const data = (await res.json()) as { items?: YouTubeVideo[] };
    return data.items ?? [];
  }

  private async fetchVideoCategories(): Promise<import("../types.js").ContentCategory[]> {
    return [
      { name: "Technology & AI", growthPercent: 0, topContent: [] },
      { name: "Creator Strategy", growthPercent: 0, topContent: [] },
    ];
  }

  private extractTopics(videos: YouTubeVideo[]): TrendingTopic[] {
    return videos.slice(0, 10).map((v, i) => ({
      id: v.id ?? v.id ?? `yt-${i}`,
      name: (v.snippet?.title ?? "").slice(0, 60),
      category: v.snippet?.categoryId ?? "General",
      growthPercent: 0,
      volume: Number(v.statistics?.viewCount ?? 0),
      platform: "youtube" as const,
    }));
  }

  private extractHashtags(videos: YouTubeVideo[]): TrendingHashtag[] {
    const tagMap = new Map<string, number>();
    for (const v of videos) {
      for (const tag of (v.snippet?.tags ?? [])) {
        const normalized = tag.startsWith("#") ? tag : `#${tag}`;
        tagMap.set(normalized, (tagMap.get(normalized) ?? 0) + 1);
      }
    }
    return [...tagMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, count]) => ({ tag, platform: "youtube", volume: count * 10000, growthPercent: 0 }));
  }
}

interface YouTubeVideo {
  id?: string;
  snippet?: {
    title?: string;
    tags?: string[];
    categoryId?: string;
  };
  statistics?: {
    viewCount?: string;
  };
}

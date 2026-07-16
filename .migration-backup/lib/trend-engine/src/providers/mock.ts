import type { TrendDashboard, TrendingHashtag, TrendingTopic, KeywordTrend, TrendProvider, ContentCategory } from "../types.js";

const TOPICS: TrendingTopic[] = [
  { id: "t1", name: "AI-Powered Video Editing", category: "Technology", growthPercent: 127, volume: 2400000, platform: "youtube" },
  { id: "t2", name: "Faceless YouTube Channels", category: "Strategy", growthPercent: 89, volume: 1800000, platform: "youtube" },
  { id: "t3", name: "Short-Form Storytelling", category: "Content", growthPercent: 74, volume: 3200000, platform: "tiktok" },
  { id: "t4", name: "Creator Economy 2025", category: "Business", growthPercent: 56, volume: 980000, platform: "youtube" },
  { id: "t5", name: "Authentic Day-in-Life", category: "Lifestyle", growthPercent: 43, volume: 5100000, platform: "instagram" },
  { id: "t6", name: "Niche Content Strategy", category: "Strategy", growthPercent: 91, volume: 760000, platform: "youtube" },
  { id: "t7", name: "Batch Content Recording", category: "Productivity", growthPercent: 67, volume: 420000, platform: "youtube" },
  { id: "t8", name: "AI Voiceovers & Scripts", category: "Technology", growthPercent: 145, volume: 1100000, platform: "tiktok" },
  { id: "t9", name: "Social Media Monetization", category: "Business", growthPercent: 38, volume: 2900000, platform: "instagram" },
  { id: "t10", name: "Behind-the-Scenes Content", category: "Lifestyle", growthPercent: 29, volume: 6400000, platform: "instagram" },
  { id: "t11", name: "Micro Niche YouTube", category: "Strategy", growthPercent: 113, volume: 340000, platform: "youtube" },
  { id: "t12", name: "Video Essay Format", category: "Content", growthPercent: 61, volume: 890000, platform: "youtube" },
  { id: "t13", name: "Podcast-to-Video Repurposing", category: "Productivity", growthPercent: 78, volume: 520000, platform: "youtube" },
  { id: "t14", name: "Brand Deal Negotiation", category: "Business", growthPercent: 49, volume: 310000, platform: "youtube" },
  { id: "t15", name: "Storytelling Hooks", category: "Content", growthPercent: 83, volume: 1600000, platform: "tiktok" },
];

const HASHTAGS: TrendingHashtag[] = [
  { tag: "#ContentCreator", platform: "instagram", volume: 48000000, growthPercent: 12 },
  { tag: "#AIContent", platform: "tiktok", volume: 8900000, growthPercent: 234 },
  { tag: "#CreatorEconomy", platform: "twitter", volume: 2300000, growthPercent: 45 },
  { tag: "#FacelessYouTube", platform: "youtube", volume: 4500000, growthPercent: 167 },
  { tag: "#VideoEditing", platform: "tiktok", volume: 31000000, growthPercent: 28 },
  { tag: "#NicheMarketing", platform: "instagram", volume: 5600000, growthPercent: 73 },
  { tag: "#ShortFormContent", platform: "tiktok", volume: 19000000, growthPercent: 89 },
  { tag: "#DigitalCreator", platform: "instagram", volume: 22000000, growthPercent: 15 },
  { tag: "#ContentStrategy", platform: "twitter", volume: 1800000, growthPercent: 31 },
  { tag: "#YouTubeGrowth", platform: "youtube", volume: 7200000, growthPercent: 54 },
  { tag: "#ViralContent", platform: "tiktok", volume: 67000000, growthPercent: 22 },
  { tag: "#AuthenticContent", platform: "instagram", volume: 9300000, growthPercent: 87 },
  { tag: "#BatchCreating", platform: "tiktok", volume: 1200000, growthPercent: 112 },
  { tag: "#CreatorTips", platform: "instagram", volume: 14000000, growthPercent: 34 },
  { tag: "#VideoEssay", platform: "youtube", volume: 3800000, growthPercent: 61 },
];

const CATEGORIES: ContentCategory[] = [
  { name: "Technology & AI", growthPercent: 89, topContent: ["AI video tools", "Automation tutorials", "Tech reviews 2025"] },
  { name: "Creator Strategy", growthPercent: 72, topContent: ["YouTube growth tactics", "Monetization methods", "Niche selection"] },
  { name: "Lifestyle & Vlog", growthPercent: 34, topContent: ["Day in the life", "Morning routines", "Travel vlogs"] },
  { name: "Business & Finance", growthPercent: 56, topContent: ["Side hustle ideas", "Passive income", "Freelancing tips"] },
  { name: "Education & Tutorials", growthPercent: 41, topContent: ["How-to guides", "Skill building", "Course creation"] },
  { name: "Entertainment", growthPercent: 18, topContent: ["Challenge videos", "Reaction content", "Storytelling"] },
];

function scoreKeywordMatch(keyword: string, topics: TrendingTopic[]): TrendingTopic[] {
  const kw = keyword.toLowerCase();
  return topics
    .filter(t =>
      t.name.toLowerCase().includes(kw) ||
      t.category.toLowerCase().includes(kw) ||
      kw.split(" ").some(w => t.name.toLowerCase().includes(w) && w.length > 3)
    )
    .slice(0, 3);
}

function scoreHashtagMatch(keyword: string, hashtags: TrendingHashtag[]): TrendingHashtag[] {
  const kw = keyword.toLowerCase();
  return hashtags
    .filter(h => h.tag.toLowerCase().replace("#", "").includes(kw) || kw.includes(h.tag.toLowerCase().replace("#", "")))
    .slice(0, 3);
}

export class MockTrendProvider implements TrendProvider {
  readonly name = "mock";

  async getDashboard(): Promise<TrendDashboard> {
    return {
      topics: TOPICS,
      hashtags: HASHTAGS,
      categories: CATEGORIES,
      lastUpdated: new Date().toISOString(),
      provider: this.name,
    };
  }

  async getKeywordTrends(keywords: string[]): Promise<KeywordTrend[]> {
    return keywords.map(keyword => ({
      keyword,
      trendScore: Math.min(100, Math.max(0, scoreKeywordMatch(keyword, TOPICS).length * 30 + Math.floor(Math.random() * 20))),
      relatedTopics: scoreKeywordMatch(keyword, TOPICS),
      relatedHashtags: scoreHashtagMatch(keyword, HASHTAGS),
    }));
  }
}

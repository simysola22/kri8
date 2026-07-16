export interface TrendingTopic {
  id: string;
  name: string;
  category: string;
  growthPercent: number;
  volume: number;
  platform: "youtube" | "tiktok" | "instagram" | "twitter" | "mock";
}

export interface TrendingHashtag {
  tag: string;
  platform: string;
  volume: number;
  growthPercent: number;
}

export interface ContentCategory {
  name: string;
  growthPercent: number;
  topContent: string[];
}

export interface TrendDashboard {
  topics: TrendingTopic[];
  hashtags: TrendingHashtag[];
  categories: ContentCategory[];
  lastUpdated: string;
  provider: string;
}

export interface KeywordTrend {
  keyword: string;
  trendScore: number;
  relatedTopics: TrendingTopic[];
  relatedHashtags: TrendingHashtag[];
}

export interface IdeaAnalysisResult {
  relevanceScore: number;
  relatedTopics: TrendingTopic[];
  relatedHashtags: TrendingHashtag[];
  contentOpportunities: string[];
  suggestedAngles: string[];
}

export interface InspirationResult {
  relatedIdeas: string[];
  alternativeHooks: string[];
  titleSuggestions: string[];
  audienceQuestions: string[];
}

/** Implement this interface to add a new trend data source (TikTok, YouTube, etc.) */
export interface TrendProvider {
  readonly name: string;
  getDashboard(): Promise<TrendDashboard>;
  getKeywordTrends(keywords: string[]): Promise<KeywordTrend[]>;
}

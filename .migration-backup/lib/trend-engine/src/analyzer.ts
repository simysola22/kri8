import type { TrendDashboard, IdeaAnalysisResult } from "./types.js";

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "is","are","was","were","be","been","have","has","had","do","does","did",
  "will","would","could","should","may","might","i","my","you","your","we",
  "our","they","their","it","its","this","that","these","those","what","when",
  "where","how","why","which","about","into","up","out","can","get","make",
  "just","like","using","use","used","want","need","more","some","all","so",
]);

export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map(w => w.replace(/^['-]+|['-]+$/g, ""))
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .reduce<string[]>((acc, word) => {
      if (!acc.includes(word)) acc.push(word);
      return acc;
    }, [])
    .slice(0, 20);
}

function termOverlap(a: string, b: string): number {
  const aWords = a.toLowerCase().split(/\s+/);
  const bWords = b.toLowerCase().split(/\s+/);
  const matches = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)));
  return matches.length / Math.max(aWords.length, 1);
}

export function analyzeIdea(
  title: string,
  notes: string,
  dashboard: TrendDashboard
): IdeaAnalysisResult {
  const keywords = extractKeywords(`${title} ${notes}`);

  const topicScores = dashboard.topics.map(topic => {
    const score = keywords.reduce((acc, kw) => {
      const overlap = termOverlap(kw, topic.name) + termOverlap(kw, topic.category);
      return acc + overlap;
    }, 0);
    return { topic, score };
  });

  const hashtagScores = dashboard.hashtags.map(ht => {
    const tag = ht.tag.replace("#", "").toLowerCase();
    const score = keywords.reduce((acc, kw) => {
      return acc + (tag.includes(kw) || kw.includes(tag) ? 1 : 0);
    }, 0);
    return { ht, score };
  });

  const relatedTopics = topicScores
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(t => t.topic);

  const relatedHashtags = hashtagScores
    .filter(h => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(h => h.ht);

  const relevanceScore = Math.min(100, Math.round(
    (relatedTopics.length / 5) * 50 +
    (relatedHashtags.length / 8) * 30 +
    (keywords.length > 5 ? 20 : keywords.length * 4)
  ));

  const topCategory = dashboard.categories
    .find(c => relatedTopics.some(t => t.category.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])));

  const contentOpportunities: string[] = [
    ...relatedTopics.slice(0, 3).map(t => `Tie "${title}" to the trending topic: "${t.name}" (+${t.growthPercent}% growth)`),
    ...dashboard.categories
      .sort((a, b) => b.growthPercent - a.growthPercent)
      .slice(0, 2)
      .map(c => `Position this in the growing "${c.name}" category`),
  ].slice(0, 5);

  const suggestedAngles = [
    `"${title}" — the 2025 creator's perspective`,
    `How ${keywords[0] ?? "this"} is changing the game for content creators`,
    `${keywords.slice(0, 2).join(" + ")} — a deep dive breakdown`,
    `The beginner's guide to ${keywords[0] ?? title.split(" ")[0]}`,
    topCategory ? `Why ${topCategory.name} creators can't ignore this` : `What nobody tells you about ${title}`,
  ];

  return { relevanceScore, relatedTopics, relatedHashtags, contentOpportunities, suggestedAngles };
}

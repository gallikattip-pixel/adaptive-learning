import dotenv from 'dotenv';

dotenv.config();

export interface YouTubeVideoRecommendation {
  video_id: string;
  title: string;
  channel_title: string;
  thumbnail_url: string;
  youtube_url: string;
  embed_url: string;
  target_skill: string;
  concept: string;
  difficulty: string;
  estimated_minutes?: number;
  reason: string;
}

interface CacheEntry {
  data: YouTubeVideoRecommendation[];
  timestamp: number;
}

// In-memory cache keyed by "target_skill:difficulty:query"
const memoryCache = new Map<string, CacheEntry>();

const YOUTUBE_SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
const DEFAULT_TIMEOUT_MS = 3000;
const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

const CANONICAL_SKILL_QUERY_MAP: Record<string, { baseQuery: string; concept: string; displayName: string }> = {
  'gd-csharp-scripting': {
    baseQuery: 'Unity C# scripting game development',
    concept: 'C_SHARP',
    displayName: 'C# & Scripting Architecture',
  },
  'gd-engine-architecture': {
    baseQuery: 'Unity game engine architecture fundamentals',
    concept: 'GAME_ENGINE_PLATFORMS',
    displayName: 'Game Engine Architecture',
  },
  'gd-math-physics': {
    baseQuery: 'game development physics mathematics tutorial',
    concept: 'PHYSICS',
    displayName: 'Game Mathematics & Physics',
  },
  'gd-game-design': {
    baseQuery: 'game design fundamentals tutorial',
    concept: 'GAME_DESIGN',
    displayName: 'Game Design & Mechanics',
  },
  'gd-game-ai': {
    baseQuery: 'game AI state machines pathfinding tutorial',
    concept: 'AI',
    displayName: 'Game AI & State Machines',
  },
  'gd-graphics-shaders': {
    baseQuery: 'Unity shaders graphics programming tutorial',
    concept: 'GRAPHICS',
    displayName: 'Graphics & Shaders',
  },
};

/**
 * Builds a deterministic, game-development-specific search query
 * based on the canonical skill ID and target difficulty.
 */
export function buildYouTubeQuery(skillId: string, difficulty: string = 'BEGINNER'): { query: string; concept: string; displayName: string } {
  const cleanSkill = skillId.trim().toLowerCase();
  const diffUpper = difficulty.toUpperCase();

  let diffModifier = 'tutorial';
  if (diffUpper === 'BEGINNER' || diffUpper === 'EASY') {
    diffModifier = 'beginner tutorial';
  } else if (diffUpper === 'HARD' || diffUpper === 'ADVANCED') {
    diffModifier = 'advanced deep dive';
  }

  const mapping = CANONICAL_SKILL_QUERY_MAP[cleanSkill];
  if (mapping) {
    return {
      query: `${mapping.baseQuery} ${diffModifier}`,
      concept: mapping.concept,
      displayName: mapping.displayName,
    };
  }

  // Fallback for custom or unknown game dev skills
  const sanitizedSkill = cleanSkill.replace(/^gd-/, '').replace(/[-_]/g, ' ');
  return {
    query: `game development ${sanitizedSkill} ${diffModifier}`,
    concept: 'GAME_DEVELOPMENT',
    displayName: sanitizedSkill,
  };
}

/**
 * Validates whether a string is a strictly well-formed YouTube video ID.
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  return typeof videoId === 'string' && YOUTUBE_VIDEO_ID_REGEX.test(videoId.trim());
}

/**
 * Clears the in-memory YouTube cache (useful for testing).
 */
export function clearYouTubeCache(): void {
  memoryCache.clear();
}

/**
 * Searches the YouTube Data API v3 for learning videos matching a skill gap.
 */
export async function searchYouTubeForSkill(
  skillId: string,
  difficulty: string = 'BEGINNER',
  customApiKey?: string
): Promise<YouTubeVideoRecommendation[]> {
  const apiKey = customApiKey !== undefined ? customApiKey : (process.env.YOUTUBE_API_KEY || '').trim();

  // Rule 6: If API key is missing, return [] without crashing or inventing fallbacks
  if (!apiKey) {
    return [];
  }

  const { query, concept, displayName } = buildYouTubeQuery(skillId, difficulty);
  const cacheKey = `${skillId}:${difficulty.toUpperCase()}:${query}`;

  const ttlMinutes = parseInt(process.env.YOUTUBE_CACHE_TTL_MINUTES || '1440', 10);
  const ttlMs = Math.max(1, ttlMinutes) * 60 * 1000;
  const now = Date.now();

  // Check cache
  const cached = memoryCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < ttlMs) {
    return cached.data;
  }

  const maxResults = parseInt(process.env.YOUTUBE_MAX_RESULTS_PER_SKILL || '1', 10);
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    safeSearch: 'strict',
    videoEmbeddable: 'true',
    relevanceLanguage: 'en',
    maxResults: String(Math.max(1, Math.min(5, maxResults))),
    key: apiKey,
  });

  const url = `${YOUTUBE_SEARCH_ENDPOINT}?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Safe operational logging without leaking API keys
      console.warn(`[YouTubeService] API request returned HTTP status ${response.status}`);
      return [];
    }

    const data = (await response.json()) as any;
    if (!data || !Array.isArray(data.items)) {
      return [];
    }

    const recommendations: YouTubeVideoRecommendation[] = [];

    for (const item of data.items) {
      const rawVideoId = item?.id?.videoId;
      if (!isValidYouTubeVideoId(rawVideoId)) {
        continue;
      }

      const videoId = rawVideoId.trim();
      const snippet = item.snippet || {};
      const title = (snippet.title || '').trim();
      const channelTitle = (snippet.channelTitle || '').trim();
      const thumbnails = snippet.thumbnails || {};
      const thumbnailUrl = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      // Grounded explanation referencing specific skill and level
      const reason = `Targeted video lesson to strengthen your ${displayName} skill (${difficulty.toLowerCase()} level).`;

      recommendations.push({
        video_id: videoId,
        title: title || `${displayName} Tutorial`,
        channel_title: channelTitle || 'YouTube Creator',
        thumbnail_url: thumbnailUrl,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        embed_url: `https://www.youtube-nocookie.com/embed/${videoId}`,
        target_skill: skillId,
        concept,
        difficulty: difficulty.toUpperCase(),
        reason,
      });
    }

    // Cache valid results
    if (recommendations.length > 0) {
      memoryCache.set(cacheKey, {
        data: recommendations,
        timestamp: now,
      });
    }

    return recommendations;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      console.warn('[YouTubeService] API request timed out after 3000ms');
    } else {
      console.warn('[YouTubeService] API request failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return [];
  }
}

/**
 * Retrieves YouTube video recommendations for the active skill gaps in a UnifiedPersonalizedPlan.
 */
export async function getYouTubeRecommendationsForPlan(
  skillGaps: Array<{ skill: string; status?: string; score?: number }>,
  masteryItems?: Array<{ skill: string; recommended_next_difficulty?: string }>
): Promise<YouTubeVideoRecommendation[]> {
  if (!Array.isArray(skillGaps) || skillGaps.length === 0) {
    return [];
  }

  // Identify prioritized skills (prioritize NOT_READY / WEAK / DEVELOPING skill gaps)
  const prioritizedGaps = skillGaps
    .filter((g) => g.status !== 'STRONG')
    .slice(0, 3);

  // If all skills are strong, take top 2 for advancement
  const targetGaps = prioritizedGaps.length > 0 ? prioritizedGaps : skillGaps.slice(0, 2);

  const masteryDiffMap = new Map<string, string>();
  if (Array.isArray(masteryItems)) {
    for (const m of masteryItems) {
      if (m.skill && m.recommended_next_difficulty) {
        masteryDiffMap.set(m.skill, m.recommended_next_difficulty);
      }
    }
  }

  const results: YouTubeVideoRecommendation[] = [];
  const seenVideoIds = new Set<string>();

  for (const gap of targetGaps) {
    const skillId = gap.skill;
    const difficulty = masteryDiffMap.get(skillId) || 'BEGINNER';

    try {
      const videos = await searchYouTubeForSkill(skillId, difficulty);
      for (const vid of videos) {
        if (!seenVideoIds.has(vid.video_id)) {
          seenVideoIds.add(vid.video_id);
          results.push(vid);
        }
      }
    } catch {
      // Continue processing other skills if one fails
    }
  }

  return results;
}

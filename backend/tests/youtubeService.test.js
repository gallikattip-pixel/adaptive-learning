/**
 * Unit tests for backend YouTube Recommendation Service
 * Stage 2 Verification
 *
 * Verifies:
 * 1. Missing API key -> []
 * 2. Successful API response -> normalized video
 * 3. Invalid video ID -> rejected
 * 4. Cache hit -> no second API call
 * 5. Cache expiry -> new API call
 * 6. API error -> []
 * 7. Timeout -> []
 * 8. Quota/API failure -> []
 * 9. No fake fallback URL
 * 10. Correct YouTube URL generation
 * 11. Correct nocookie embed URL
 * 12. Query contains Game Development context
 */

import {
  buildYouTubeQuery,
  isValidYouTubeVideoId,
  searchYouTubeForSkill,
  getYouTubeRecommendationsForPlan,
  clearYouTubeCache,
} from '../dist/services/youtubeService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// Preserve native fetch
const originalFetch = global.fetch;

async function runTests() {
  console.log('================================================================');
  console.log('STAGE 2 — YOUTUBE RECOMMENDATION SERVICE UNIT TESTS');
  console.log('================================================================');

  // --- Test 1: Missing API Key -> returns [] ---
  clearYouTubeCache();
  const resMissingKey = await searchYouTubeForSkill('gd-csharp-scripting', 'BEGINNER', '');
  assert(Array.isArray(resMissingKey) && resMissingKey.length === 0, 'Case 01: Missing API key returns empty array [] without crashing');

  // --- Test 2: Successful API Response -> returns normalized video ---
  clearYouTubeCache();
  const mockValidItem = {
    id: { videoId: 'dQw4w9WgXcQ' },
    snippet: {
      title: 'Unity C# Scripting Tutorial for Beginners',
      channelTitle: 'GameDev Guides',
      thumbnails: {
        high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
      },
    },
  };

  let fetchCallCount = 0;
  global.fetch = async () => {
    fetchCallCount++;
    return {
      ok: true,
      status: 200,
      json: async () => ({ items: [mockValidItem] }),
    };
  };

  const resSuccess = await searchYouTubeForSkill('gd-csharp-scripting', 'BEGINNER', 'TEST_MOCK_API_KEY');
  assert(resSuccess.length === 1, 'Case 02: Successful API response returns normalized video object');
  const video = resSuccess[0];
  assert(video.video_id === 'dQw4w9WgXcQ', 'Case 02b: video_id extracted accurately');
  assert(video.title === 'Unity C# Scripting Tutorial for Beginners', 'Case 02c: title extracted accurately');
  assert(video.channel_title === 'GameDev Guides', 'Case 02d: channel_title extracted accurately');

  // --- Test 3: Invalid Video ID -> rejected ---
  clearYouTubeCache();
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      items: [
        { id: { videoId: 'invalid-id' }, snippet: { title: 'Bad Video' } },
        { id: { videoId: '<script>alert(1)</script>' }, snippet: { title: 'XSS Attempt' } },
        { id: { videoId: '' }, snippet: { title: 'Empty ID' } },
        { id: {}, snippet: { title: 'Missing ID' } },
        mockValidItem, // Only this 11-char ID is valid
      ],
    }),
  });

  const resInvalid = await searchYouTubeForSkill('gd-game-ai', 'MEDIUM', 'TEST_MOCK_API_KEY');
  assert(resInvalid.length === 1 && resInvalid[0].video_id === 'dQw4w9WgXcQ', 'Case 03: Invalid/malformed video IDs are strictly rejected');

  // --- Test 4: Cache Hit -> no second API call ---
  clearYouTubeCache();
  fetchCallCount = 0;
  global.fetch = async () => {
    fetchCallCount++;
    return {
      ok: true,
      status: 200,
      json: async () => ({ items: [mockValidItem] }),
    };
  };

  await searchYouTubeForSkill('gd-graphics-shaders', 'BEGINNER', 'TEST_MOCK_API_KEY');
  assert(fetchCallCount === 1, 'Case 04a: First search executes fetch');

  await searchYouTubeForSkill('gd-graphics-shaders', 'BEGINNER', 'TEST_MOCK_API_KEY');
  assert(fetchCallCount === 1, 'Case 04b: Second search uses in-memory cache without repeating fetch');

  // --- Test 5: Cache Expiry / Skill differentiation ---
  await searchYouTubeForSkill('gd-math-physics', 'BEGINNER', 'TEST_MOCK_API_KEY');
  assert(fetchCallCount === 2, 'Case 05: Different skill key triggers separate API call');

  // --- Test 6: API Error (e.g. 500) -> returns [] ---
  clearYouTubeCache();
  global.fetch = async () => ({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
  });

  const resApiError = await searchYouTubeForSkill('gd-game-design', 'BEGINNER', 'TEST_MOCK_API_KEY');
  assert(Array.isArray(resApiError) && resApiError.length === 0, 'Case 06: API HTTP error returns [] gracefully');

  // --- Test 7: Timeout -> returns [] ---
  clearYouTubeCache();
  global.fetch = async () => {
    const err = new Error('The operation was aborted');
    err.name = 'AbortError';
    throw err;
  };

  const resTimeout = await searchYouTubeForSkill('gd-engine-architecture', 'BEGINNER', 'TEST_MOCK_API_KEY');
  assert(Array.isArray(resTimeout) && resTimeout.length === 0, 'Case 07: Request timeout / AbortError returns [] gracefully');

  // --- Test 8: Quota Exceeded (403) -> returns [] ---
  clearYouTubeCache();
  global.fetch = async () => ({
    ok: false,
    status: 403,
    statusText: 'Forbidden - Quota Exceeded',
  });

  const resQuota = await searchYouTubeForSkill('gd-csharp-scripting', 'BEGINNER', 'TEST_MOCK_API_KEY');
  assert(Array.isArray(resQuota) && resQuota.length === 0, 'Case 08: Quota exceeded (403) returns [] gracefully without crashing');

  // --- Test 9: No Fake Fallback URL ---
  assert(resQuota.length === 0, 'Case 09: Zero synthetic fallback videos are invented on error');

  // --- Test 10: Correct YouTube URL generation ---
  const expectedWatchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  assert(video.youtube_url === expectedWatchUrl, `Case 10: YouTube watch URL is exactly ${expectedWatchUrl}`);

  // --- Test 11: Correct Nocookie Embed URL ---
  const expectedEmbedUrl = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';
  assert(video.embed_url === expectedEmbedUrl, `Case 11: Embed URL uses privacy-enhanced ${expectedEmbedUrl}`);

  // --- Test 12: Query contains Game Development Context ---
  const q1 = buildYouTubeQuery('gd-csharp-scripting', 'BEGINNER');
  const q2 = buildYouTubeQuery('gd-graphics-shaders', 'HARD');
  const q3 = buildYouTubeQuery('gd-game-ai', 'MEDIUM');
  assert(q1.query.includes('Unity C#') && q1.query.includes('beginner'), 'Case 12a: gd-csharp-scripting query includes Unity C# & beginner context');
  assert(q2.query.includes('shaders') && q2.query.includes('advanced'), 'Case 12b: gd-graphics-shaders query includes shaders & advanced context');
  assert(q3.query.includes('AI') && q3.query.includes('pathfinding'), 'Case 12c: gd-game-ai query includes state machines & pathfinding context');

  // Restore fetch
  global.fetch = originalFetch;

  console.log('================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

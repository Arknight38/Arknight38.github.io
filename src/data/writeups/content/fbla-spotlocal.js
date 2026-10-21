export const fblaSpotlocal = {
  id: "fbla-spotlocal",
  title: "SpotLocal: Finding Local Businesses",
  subtitle:
    "Business discovery built with React, Express, and PostgreSQL, combining search, ranking, and local preferences.",
  date: "2025",
  categories: ["fullstack", "data", "tools"],
  tags: ["react", "typescript", "express", "postgresql", "electron", "search"],
  readTime: "5 min",
  featured: false,
  content: `## Overview

SpotLocal is a local-business discovery application built with React and TypeScript, an Express API, and PostgreSQL. It combines searchable business listings with filters, reviews, favorites, recent history, and recommendations. An Electron shell provides a desktop entry point.

The useful engineering problem is turning a large business dataset into a responsive browsing experience. A visitor might know a name, a category, a fragment of a description, or simply that they want somewhere open now. The application uses different tools for those different questions.

## Keeping list requests small

The API separates listing data from detailed business records. A page of search results does not need every large JSON field that a full business view might use. Pagination, filters, and sorting run on the server, while independent count and data queries can execute together.

PostgreSQL search combines a text-search vector with \`plainto_tsquery\` and a name match through \`ILIKE\`. The frontend also contains deterministic fuzzy matching: exact matches rank ahead of prefixes, substrings, category matches, and edit-distance matches. That makes the behavior explainable without presenting it as an AI recommendation system.

## Handling changing search requests

Typing quickly can create overlapping network requests. The pagination hook cancels its previous controller before creating the next one:

\`\`\`typescript
if (abortControllerRef.current) {
  abortControllerRef.current.abort()
}
const controller = new AbortController()
abortControllerRef.current = controller
\`\`\`

The controller's signal accompanies the request. This avoids spending as much work on a result the visitor has already moved past. It also exposes a subtle follow-up problem: loading and error state need to belong to the current request, so an older request's cleanup cannot mark a newer search finished.

A separate warm cache shares an in-flight request and keeps a set of highly rated businesses available. This helps repeat lookups avoid another round trip. Failed loads should remain retryable; the current empty-cache fallback is an area to improve.

## Recommendations with understandable rules

The recommendation code prioritizes open featured businesses, then highly rated open businesses, followed by closed featured entries and other highly rated choices. A small seeded rotation changes selections within a group.

That is a useful fit for this project. The recommendations can be explained in terms of availability and ranking, and their behavior can be tested with a small dataset. The assistant similarly combines intent rules, filters, and fuzzy matching rather than relying on a language model.

## Preferences that stay close to the user

Favorites are stored as business IDs, with a set used for toggling membership. Recent history is capped at ten entries. Versioned local-storage keys give the application a place to evolve those formats, and a custom event lets interested parts of the interface respond when preferences change.

The Electron shell uses context isolation, disables Node integration in the renderer, and enables sandboxing. That establishes a sensible separation between the web interface and desktop privileges. Packaging the API and database lifecycle remains separate work; wrapping the frontend alone does not make the whole application self-contained.

## Two pagination models for different browsing patterns

The regular browsing hook uses limit-and-offset pagination. It is straightforward for numbered pages and lets the interface request a known slice of a filtered result set. The backend also contains a separate cursor-based stream endpoint using the pair of rating and ID as its continuation position.

That pair matters when several businesses share a rating. A rating alone does not uniquely identify where the next page should begin; the ID provides a stable tie-breaker. Cursor pagination is a natural fit for incremental browsing, while offset pagination is easy to expose as numbered pages.

They are separate paths in the current implementation. Connecting the interface to the cursor endpoint would require deliberately updating its navigation state rather than assuming that the existing hook already benefits from it.

## Fuzzy matching with edit-distance dynamic programming

The frontend search utility first handles exact names, prefixes, substrings, and category matches. More expensive fuzzy comparison runs later for sufficiently long queries. It uses a Levenshtein matrix, where each cell represents the minimum edits needed for two prefixes.

The edit-distance calculation compares matching characters directly and otherwise selects the least expensive edit:

\`\`\`typescript
if (b.charAt(i - 1) === a.charAt(j - 1)) {
  matrix[i][j] = matrix[i - 1][j - 1]
} else {
  matrix[i][j] = Math.min(
    matrix[i - 1][j - 1] + 1,
    Math.min(
      matrix[i][j - 1] + 1,
      matrix[i - 1][j] + 1
    )
  )
}
\`\`\`

The three alternatives are substitution, insertion, and deletion. Token-based comparisons let a misspelled query match a word inside a longer business name. Scores retain the match class, so an exact result ranks ahead of a merely similar spelling rather than being mixed into one unexplained score.

## Content-based recommendation profiles

Favorites become category and tag frequency maps. Each nonfavorite candidate receives a category contribution, a tag contribution, and a smaller quality adjustment. The implemented profile construction includes:

\`\`\`typescript
const cats = [b.category, ...(b.categories || [])]
cats.forEach((c) => catFreq.set(c, (catFreq.get(c) || 0) + 1))
b.tags.forEach((t) => tagFreq.set(t, (tagFreq.get(t) || 0) + 1))
\`\`\`

The candidate quality term caps review-count influence at 500 reviews, and existing favorites are excluded. Without a preference history, the function falls back to trending results. This is implemented content-based filtering rather than a trained recommendation model: the selected businesses can be explained through matching attributes.

## PostgreSQL retrieval before frontend ranking

The API's search clause combines \`search_vector @@ plainto_tsquery('english', ...)\` with a name \`ILIKE\` path. Listing fields are narrower than detail fields, and independent count and page queries can run together. These mechanisms address retrieval and payload size, while the frontend fuzzy utilities address matching and ranking within supplied data.

The distinction matters: the presence of a fuzzy function does not mean every server query uses edit distance. The project contains complementary paths for database filtering, interface search, and preference-based discovery.

## Concepts explored

Dynamic programming handles spelling differences, frequency maps describe preferences, and database queries retrieve eligible records. The interesting implementation is how those distinct mechanisms contribute to discovery without requiring an opaque model.

## Things to do next

I would focus on reliable search state, retryable caching, and stable pagination before adding more discovery features. Search fixtures could cover misspellings, tied ratings, unavailable businesses, and rapid filter changes.
`,
};

// Content utility functions

/**
 * Calculate estimated reading time in minutes
 * @param {string} content - The text content
 * @param {number} wordsPerMinute - Average reading speed (default: 200)
 * @returns {string} - Reading time as "X min"
 */
export function calculateReadingTime(content, wordsPerMinute = 200) {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
}

/**
 * Generate URL-friendly slug from a title
 * @param {string} title - The title to convert
 * @returns {string} - URL-friendly slug
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Format date for display
 * @param {string} dateStr - Date string (e.g., "2024" or "2024-01")
 * @returns {string} - Formatted date
 */
export function formatDate(dateStr) {
  if (dateStr === 'ongoing') return 'Ongoing';
  
  // Handle year-only format
  if (/^\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Handle full date format
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Extract excerpt from content
 * @param {string} content - Full content
 * @param {number} maxLength - Maximum length of excerpt
 * @returns {string} - Truncated excerpt
 */
export function extractExcerpt(content, maxLength = 150) {
  // Remove markdown syntax for plain text excerpt
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Filter and sort content items
 * @param {Array} items - Array of content items
 * @param {Object} options - Filter options
 * @returns {Array} - Filtered and sorted items
 */
export function filterContent(items, options = {}) {
  const { category, searchQuery, sortBy = 'date' } = options;
  
  let filtered = [...items];
  
  // Filter by category
  if (category && category !== 'all') {
    filtered = filtered.filter(item => item.category === category || item.tags?.includes(category));
  }
  
  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.excerpt?.toLowerCase().includes(query) ||
      item.content?.toLowerCase().includes(query)
    );
  }
  
  // Sort items
  filtered.sort((a, b) => {
    if (sortBy === 'date') {
      // Handle 'ongoing' dates
      if (a.date === 'ongoing') return -1;
      if (b.date === 'ongoing') return 1;
      return new Date(b.date) - new Date(a.date);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });
  
  return filtered;
}

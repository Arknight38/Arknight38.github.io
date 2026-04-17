// Modular writeups - each writeup is in its own file for easier editing
// Import all writeups here and export as a unified collection

import { fluxMessaging } from './content/flux-messaging.js';
import { arkvisor } from './content/arkvisor.js';
import { atlus } from './content/atlus.js';
import { arkmt } from './content/marathon-tools.js';
import { arkdrv } from './content/ark-drv.js';
import { wdfilterdrv } from './content/wdfilterdrv.js';
import { cs2Extern } from './content/cs2-extern.js';
import { gifEngine } from './content/gif-engine.js';
import { serverShenanigans } from './content/server-shenanigans.js';
import { fblaSpotlocal } from './content/fbla-spotlocal.js';
import { snowflakeAnalytics } from './content/snowflake-analytics.js';
import { runeEditor } from './content/rune-editor.js';
import { hd2Cheats } from './content/hd2-cheats.js';
import { cs2externdrv } from './content/cs2externdrv.js';
import { manualmapdrv } from './content/manualmapdrv.js';
import { byovdScanner } from './content/byovd-scanner.js';
import { monitorDefNotMal } from './content/monitor-def-not-mal.js';

// Export the combined writeups array
// Order matters for display - featured items first, then chronological
export const writeups = [
  fluxMessaging,
  arkvisor,
  atlus,
  arkmt,
  arkdrv,
  wdfilterdrv,
  cs2Extern,
  gifEngine,
  serverShenanigans,
  fblaSpotlocal,
  snowflakeAnalytics,
  runeEditor,
  hd2Cheats,
  cs2externdrv,
  manualmapdrv,
  byovdScanner,
  monitorDefNotMal,
];

// Helper function to get writeup by ID
export function getWriteupById(id) {
  return writeups.find(w => w.id === id);
}

// Helper function to get related writeups based on shared tags
export function getRelatedWriteups(currentId, limit = 3) {
  const current = getWriteupById(currentId);
  if (!current) return [];

  const currentTags = new Set(current.tags || []);
  const currentCategories = new Set(current.categories || (current.category ? [current.category] : []));

  const scored = writeups
    .filter((w) => w.id !== currentId)
    .map((w) => {
      const tags = w.tags || [];
      const categories = w.categories || (w.category ? [w.category] : []);

      let sharedTags = 0;
      for (const t of tags) {
        if (currentTags.has(t)) sharedTags++;
      }

      let sharedCategories = 0;
      for (const c of categories) {
        if (currentCategories.has(c)) sharedCategories++;
      }

      const score = sharedTags * 3 + sharedCategories;
      return { w, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ w }) => w);
}

// Export categories for filtering UI
// Each writeup should use the 'categories' array (not 'category' string)
// and can belong to multiple categories
export const writeupCategories = [
  { id: 'all', label: 'all' },
  { id: 'systems', label: 'systems' },
  { id: 'tools', label: 'tools' },
  { id: 'reverse-engineering', label: 'reverse engineering' },
  { id: 'security', label: 'security' },
  { id: 'fullstack', label: 'full stack' },
  { id: 'data', label: 'data' },
  { id: 'closed', label: 'closed source' },
];

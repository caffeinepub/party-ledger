import { EVENT_CATEGORIES, type EventCategory } from './categories';

const CATEGORY_PREFIX = '##CATEGORIES:';
const CATEGORY_SUFFIX = '##';

export function encodeCategories(categories: EventCategory[], comment: string): string {
  if (categories.length === 0) return comment;
  const categoryString = `${CATEGORY_PREFIX}${categories.join(',')}${CATEGORY_SUFFIX}`;
  return `${categoryString}\n${comment}`;
}

export function parseCategories(comment: string): { categories: EventCategory[]; cleanComment: string } {
  const match = comment.match(new RegExp(`${CATEGORY_PREFIX}([^#]+)${CATEGORY_SUFFIX}`));
  
  if (!match) {
    return { categories: [], cleanComment: comment };
  }

  const categoriesStr = match[1];
  const categories = categoriesStr
    .split(',')
    .map((c) => c.trim())
    .filter((c) => EVENT_CATEGORIES.includes(c as EventCategory)) as EventCategory[];

  const cleanComment = comment.replace(match[0], '').trim();

  return { categories, cleanComment };
}

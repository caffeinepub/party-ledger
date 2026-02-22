export const EVENT_CATEGORIES = [
  'Birthday',
  'Wedding',
  'Corporate',
  'Social',
  'Charity',
  'Other',
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  Birthday: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  Wedding: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Corporate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Social: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Charity: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function validateCategory(category: string): category is EventCategory {
  return EVENT_CATEGORIES.includes(category as EventCategory);
}

export function formatCategories(categories: EventCategory[]): string {
  return categories.join(', ');
}

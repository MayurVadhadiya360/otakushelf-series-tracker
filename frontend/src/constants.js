export const SERIES_TYPES = [
  { value: "novel", label: "Novel" },
  { value: "manga", label: "Manga" },
  { value: "manhua", label: "Manhua" },
  { value: "manhwa", label: "Manhwa" },
  { value: "anime", label: "Anime" },
  { value: "donghua", label: "Donghua" },
  { value: "other", label: "Other" },
];

export const SERIES_STATUSES = [
  { value: "planning", label: "Plan to start" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
];

export const SORT_OPTIONS = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "created_desc", label: "Recently added" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
  { value: "rating_desc", label: "Highest rated" },
];

// Six themes: three palettes, each with a dark and light variant.
// `swatch` is shown next to the theme's name in the selector.
export const THEMES = [
  { value: "indigo_dark", label: "Indigo — Dark", swatch: "#D4A24E" },
  { value: "indigo_light", label: "Indigo — Light", swatch: "#D4A24E" },
  { value: "cool_dark", label: "Cool — Dark", swatch: "#4A90E2" },
  { value: "cool_light", label: "Cool — Light", swatch: "#4A90E2" },
  { value: "warm_dark", label: "Warm — Dark", swatch: "#C9A961" },
  { value: "warm_light", label: "Warm — Light", swatch: "#C9A961" },
];

export const DEFAULT_THEME = "indigo_dark";

export function typeLabel(value) {
  return SERIES_TYPES.find((t) => t.value === value)?.label || value;
}

export function statusMeta(value) {
  return SERIES_STATUSES.find((s) => s.value === value) || SERIES_STATUSES[0];
}

// A small fixed palette used to color-code genre chips/spines when a genre
// has no explicit color assigned. Picked from a hue wheel so neighbors
// don't clash.
export const GENRE_FALLBACK_COLORS = [
  "#D4756B", "#D4A24E", "#8FAF6B", "#4FB6A8", "#4E86C4",
  "#8B7FD1", "#C97BAE", "#6B9E8C", "#B58A4E", "#7B8FC9",
];

export function colorForGenre(genre) {
  if (genre?.color) return genre.color;
  if (!genre?.id) return GENRE_FALLBACK_COLORS[0];
  let hash = 0;
  for (let i = 0; i < genre.id.length; i++) {
    hash = (hash * 31 + genre.id.charCodeAt(i)) >>> 0;
  }
  return GENRE_FALLBACK_COLORS[hash % GENRE_FALLBACK_COLORS.length];
}

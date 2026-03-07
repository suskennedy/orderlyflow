
export const getVendorCategoryInfo = (category?: string | null) => {
  if (!category) return { icon: 'business' as any, color: '#6B7280' };
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('plumber')) return { icon: 'water', color: '#10B981' }; // Emerald
  if (categoryLower.includes('electrician')) return { icon: 'flash', color: '#F59E0B' }; // Amber
  if (categoryLower.includes('cleaner') || categoryLower.includes('cleaning')) return { icon: 'sparkles', color: '#3B82F6' }; // Blue
  if (categoryLower.includes('gardener') || categoryLower.includes('landscap')) return { icon: 'leaf', color: '#059669' }; // Green
  if (categoryLower.includes('painter')) return { icon: 'color-palette', color: '#8B5CF6' }; // Violet
  if (categoryLower.includes('contractor') || categoryLower.includes('builder')) return { icon: 'construct', color: '#EF4444' }; // Red
  if (categoryLower.includes('organizer')) return { icon: 'grid', color: '#EC4899' }; // Pink
  if (categoryLower.includes('repair') || categoryLower.includes('handyman')) return { icon: 'build', color: '#F97316' }; // Orange
  if (categoryLower.includes('maintenance')) return { icon: 'settings', color: '#6366F1' }; // Indigo
  if (categoryLower.includes('hvac')) return { icon: 'thermometer', color: '#06B6D4' }; // Cyan
  if (categoryLower.includes('roofing')) return { icon: 'home', color: '#78350F' }; // Brown
  if (categoryLower.includes('pest')) return { icon: 'bug', color: '#4B5563' }; // Cool Gray
  if (categoryLower.includes('security')) return { icon: 'shield-checkmark', color: '#111827' }; // Black/Dark
  if (categoryLower.includes('appliance')) return { icon: 'tv', color: '#312E81' }; // Indigo
  if (categoryLower.includes('architect')) return { icon: 'pencil', color: '#4338CA' };
  if (categoryLower.includes('carpenter')) return { icon: 'hammer', color: '#B45309' };
  if (categoryLower.includes('closet')) return { icon: 'door-closed', color: '#BE185D' };
  if (categoryLower.includes('drywall')) return { icon: 'square', color: '#9CA3AF' };
  if (categoryLower.includes('fenc')) return { icon: 'barcode', color: '#3F6212' };
  if (categoryLower.includes('floor')) return { icon: 'layers', color: '#92400E' };
  if (categoryLower.includes('garage')) return { icon: 'car', color: '#1F2937' };
  if (categoryLower.includes('interior')) return { icon: 'receipt', color: '#7E22CE' };
  if (categoryLower.includes('masonry') || categoryLower.includes('concrete')) return { icon: 'albums', color: '#4B5563' };
  if (categoryLower.includes('pool') || categoryLower.includes('spa')) return { icon: 'boat', color: '#0EA5E9' };
  if (categoryLower.includes('solar')) return { icon: 'sunny', color: '#EAB308' };
  if (categoryLower.includes('well') || categoryLower.includes('water')) return { icon: 'water', color: '#0891B2' };
  if (categoryLower.includes('window')) return { icon: 'browsers', color: '#3B82F6' };

  return { icon: 'business', color: '#6B7280' };
};

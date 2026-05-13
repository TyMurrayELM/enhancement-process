const SUPERVISOR_EMAILS: Record<string, string> = {
  'Jose Zacarias': 'jose.zacarias@encorelm.com',
  'James Llewellyn': 'james.llewellyn@encorelm.com',
  'Adrian Garcia': 'adrian.garcia@encorelm.com',
  'Keylon Ross Sr': 'keylon.ross@encorelm.com',
};

export function getSupervisorEmail(name?: string | null): string | null {
  if (!name) return null;
  return SUPERVISOR_EMAILS[name] ?? null;
}

export function getFieldSupervisorsForRegion(regionName?: string): string[] {
  const region = regionName?.toLowerCase() || '';
  if (region.includes('vegas')) return ['Adrian Garcia'];
  return ['James Llewellyn', 'Keylon Ross Sr'];
}

export function getDefaultMeetingAttendee(regionName?: string): string {
  const region = regionName?.toLowerCase() || '';
  if (region.includes('vegas')) return 'adrian.garcia@encorelm.com';
  return 'david.cedeno@encorelm.com';
}

// Phoenix doesn't observe DST; Vegas does. Returning the property's timezone keeps
// calendar events anchored to property-local time regardless of the user's browser TZ.
export function getRegionTimezone(regionName?: string): string {
  const region = regionName?.toLowerCase() || '';
  if (region.includes('vegas')) return 'America/Los_Angeles';
  return 'America/Phoenix';
}

// Convert "First [Middle] Last [Suffix]" to "first.last@encorelm.com".
// Strips common suffixes (Jr/Sr/II/III/IV/V) so "Keylon Ross Sr" becomes
// keylon.ross@encorelm.com, not keylon.sr@encorelm.com.
export function nameToEmail(fullName?: string | null): string {
  if (!fullName) return '';
  const cleaned = fullName
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)\s*$/, '');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return '';
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName}.${lastName}@encorelm.com`;
}

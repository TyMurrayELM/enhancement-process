import { Project, getAspireLink } from '@/lib/types';
import {
  getDefaultMeetingAttendee,
  getRegionTimezone,
  getSupervisorEmail,
  nameToEmail,
} from '@/lib/teamConfig';

const GOOGLE_CALENDAR_BASE = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

// Format YYYY-MM-DD + hour into Google Calendar's floating timestamp. Times are
// interpreted in the timezone given by the URL's ctz param, so no Date math
// against the browser TZ is needed.
function formatCalendarDateTime(yyyyMmDd: string, hour: number, minute = 0): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const [y, m, d] = yyyyMmDd.split('-');
  return `${y}${m}${d}T${pad(hour)}${pad(minute)}00`;
}

// Add N days to a YYYY-MM-DD using UTC math so DST never shifts the day.
function addDaysToDateString(yyyyMmDd: string, days: number): string {
  const d = new Date(`${yyyyMmDd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface CalendarUrlInput {
  title: string;
  location: string;
  details: string;
  dateOnly: string;
  startHour: number;
  endHour: number;
  attendees: string[];
  tz: string;
}

function buildCalendarUrl(input: CalendarUrlInput): string {
  const start = formatCalendarDateTime(input.dateOnly, input.startHour);
  const end = formatCalendarDateTime(input.dateOnly, input.endHour);
  const params = [
    `text=${encodeURIComponent(input.title)}`,
    `dates=${start}/${end}`,
    `details=${encodeURIComponent(input.details)}`,
    `location=${encodeURIComponent(input.location)}`,
    `add=${encodeURIComponent(input.attendees.join(','))}`,
    `ctz=${encodeURIComponent(input.tz)}`,
  ];
  return `${GOOGLE_CALENDAR_BASE}&${params.join('&')}`;
}

export function createInitialMeetingCalendarUrl(project: Project, meetingDate: string): string {
  const titleParts = ['Initial Site Meeting', project.clientName];
  if (project.oppName) titleParts.push(project.oppName);

  const aspireLink = getAspireLink(project.opportunityId) ?? 'N/A';
  const details =
    `Initial on-site meeting for enhancement project\n\n` +
    `WO#: ${project.aspireWoNumber || `#${project.id}`}\n` +
    `Property: ${project.clientName}\n` +
    `Opportunity: ${project.oppName || 'N/A'}\n` +
    `Value: ${project.value.toLocaleString()}\n` +
    `Client Specialist: ${project.accountManager}\n` +
    `Enhancement Specialist: ${project.specialist}\n\n` +
    `View in Aspire:\n${aspireLink}\n\n` +
    `Agenda:\n` +
    `- Walk property and confirm scope\n` +
    `- Locate valves and timer stations${project.requiresIrrigation ? '' : ' (if applicable)'}\n` +
    `- Discuss client expectations and timeline\n` +
    `- Take before photos\n` +
    `- Confirm any special requirements`;

  return buildCalendarUrl({
    title: titleParts.join(' - '),
    location: project.clientName,
    details,
    dateOnly: meetingDate.slice(0, 10),
    startHour: 9,
    endHour: 10,
    attendees: [getDefaultMeetingAttendee(project.regionName)],
    tz: getRegionTimezone(project.regionName),
  });
}

const VISIT_LABELS: Record<string, string> = {
  weekOne: '1-Week Follow-up',
  month1: '30-Day Follow-up',
  month2: '60-Day Follow-up',
  month3: '90-Day Follow-up',
};

export function createWarrantyCalendarUrl(
  project: Project,
  visitType: string,
  daysAfterCompletion: number,
): string {
  if (!project.completedDate) return '';

  const titleParts = [VISIT_LABELS[visitType], project.clientName];
  if (project.oppName) titleParts.push(project.oppName);

  const aspireLink = getAspireLink(project.opportunityId) ?? 'N/A';
  const details =
    `${VISIT_LABELS[visitType]} inspection for enhancement project\n\n` +
    `WO#: ${project.aspireWoNumber || `#${project.id}`}\n` +
    `Property: ${project.clientName}\n` +
    `Opportunity: ${project.oppName || 'N/A'}\n` +
    `Value: ${project.value.toLocaleString()}\n` +
    `Client Specialist: ${project.accountManager}\n` +
    `Enhancement Specialist: ${project.specialist}\n` +
    `Field Supervisor: ${project.fieldSupervisor || 'TBD'}\n\n` +
    `View in Aspire:\n${aspireLink}\n\n` +
    `Inspection Tasks:\n` +
    `- Check health and condition of trees & shrubs\n` +
    `- Verify irrigation system functionality\n` +
    `- Inspect staking and support systems\n` +
    `- Document any issues with photos\n` +
    `- Report findings to Enhancement Manager\n` +
    `- Notify client of any concerns`;

  const attendees = [getDefaultMeetingAttendee(project.regionName)];
  const supervisorEmail = getSupervisorEmail(project.fieldSupervisor);
  if (supervisorEmail && !attendees.includes(supervisorEmail)) {
    attendees.push(supervisorEmail);
  }
  if (visitType === 'month1' || visitType === 'month2' || visitType === 'month3') {
    const specialistEmail = nameToEmail(project.specialist);
    if (specialistEmail && !attendees.includes(specialistEmail)) {
      attendees.push(specialistEmail);
    }
  }

  return buildCalendarUrl({
    title: titleParts.join(' - '),
    location: project.clientName,
    details,
    dateOnly: addDaysToDateString(project.completedDate.slice(0, 10), daysAfterCompletion),
    startHour: 9,
    endHour: 10,
    attendees,
    tz: getRegionTimezone(project.regionName),
  });
}

export function getFollowUpDate(completedDate: string | undefined, daysToAdd: number): string | null {
  if (!completedDate) return null;
  const date = new Date(completedDate);
  date.setDate(date.getDate() + daysToAdd);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

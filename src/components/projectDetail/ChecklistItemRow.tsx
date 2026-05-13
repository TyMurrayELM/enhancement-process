'use client';

import { Project, ChecklistItem } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { createWarrantyCalendarUrl, getFollowUpDate } from '@/lib/calendar';
import Image from 'next/image';

interface ChecklistEntry {
  completed: boolean;
  completedDate: string | null;
  completedBy?: string;
}

interface Props {
  item: ChecklistItem;
  project: Project;
  checklistEntry: ChecklistEntry | undefined;
  onCheckboxChange: (itemId: string, checked: boolean) => void;

  // Inline-editor state for the special items
  initialMeetingDate: string;
  setInitialMeetingDate: (value: string) => void;
  onOpenCalendar: () => void;

  materialsVendors: string;
  setMaterialsVendors: (value: string) => void;

  fieldSupervisor: string;
  setFieldSupervisor: (value: string) => void;
  fieldSupervisors: string[];

  beforePhotoLink: string;
  beforePhotoDate: string | null;
  onBeforePhotoChange: (value: string) => void;

  progressPhotoLinks: Array<{ link: string; addedDate: string }>;
  newProgressLink: string;
  setNewProgressLink: (value: string) => void;
  onAddProgressLink: () => void;
  onRemoveProgressLink: (index: number) => void;

  completionPhotoLink: string;
  completionPhotoDate: string | null;
  onCompletionPhotoChange: (value: string) => void;
}

const REQUIRED_PILL = <span className="ml-2 text-xs text-red-600 font-medium">REQUIRED</span>;

export default function ChecklistItemRow(props: Props) {
  const { item, project, checklistEntry, onCheckboxChange } = props;

  const renderCompletedStamp = (entry: ChecklistEntry | undefined) =>
    entry?.completedDate && (
      <span className="text-xs text-green-600 font-medium">✓ {formatDate(entry.completedDate)}</span>
    );

  if (item.id === 'schedInitialMeeting') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            checked={checklistEntry?.completed || false}
            onChange={(e) => {
              if (e.target.checked && !props.initialMeetingDate.trim()) {
                alert('Please select a date before checking this item');
                return;
              }
              onCheckboxChange(item.id, e.target.checked);
            }}
            className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-900 font-medium">{item.label}</span>
                {REQUIRED_PILL}
              </div>
              {renderCompletedStamp(checklistEntry)}
            </div>
          </div>
        </div>
        <div className="ml-8 bg-gray-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Date:</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={props.initialMeetingDate}
              onChange={(e) => props.setInitialMeetingDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            />
            <button
              onClick={props.onOpenCalendar}
              disabled={!props.initialMeetingDate}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                props.initialMeetingDate
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={props.initialMeetingDate ? 'Create Google Calendar invite' : 'Select a date first'}
            >
              <Image
                src="/icons/googlecalendaricon.png"
                alt="Google Calendar"
                width={20}
                height={20}
                className="flex-shrink-0"
              />
              Create Invite
            </button>
          </div>
          {props.initialMeetingDate && (
            <p className="text-xs text-gray-500 mt-1">
              Selected:{' '}
              {new Date(props.initialMeetingDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (item.id === 'materials') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            checked={checklistEntry?.completed || false}
            onChange={(e) => onCheckboxChange(item.id, e.target.checked)}
            className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-900 font-medium">{item.label}</span>
                {REQUIRED_PILL}
              </div>
              {renderCompletedStamp(checklistEntry)}
            </div>
          </div>
        </div>
        <div className="ml-8 bg-gray-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Vendor(s):</label>
          <input
            type="text"
            value={props.materialsVendors}
            onChange={(e) => props.setMaterialsVendors(e.target.value)}
            placeholder="Enter vendor name(s)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          />
          {props.materialsVendors && (
            <p className="text-xs text-gray-500 mt-1">Vendor(s): {props.materialsVendors}</p>
          )}
        </div>
      </div>
    );
  }

  if (item.id === 'fsassigned') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            checked={checklistEntry?.completed || false}
            onChange={(e) => {
              if (e.target.checked && !props.fieldSupervisor.trim()) {
                alert('Please select a field supervisor before checking this item');
                return;
              }
              onCheckboxChange(item.id, e.target.checked);
            }}
            className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-900 font-medium">{item.label}</span>
                {REQUIRED_PILL}
              </div>
              {renderCompletedStamp(checklistEntry)}
            </div>
          </div>
        </div>
        <div className="ml-8 bg-gray-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Field Supervisor:</label>
          <select
            value={props.fieldSupervisor}
            onChange={(e) => props.setFieldSupervisor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          >
            <option value="">Select a field supervisor...</option>
            {props.fieldSupervisors.map((supervisor) => (
              <option key={supervisor} value={supervisor}>
                {supervisor}
              </option>
            ))}
          </select>
          {props.fieldSupervisor && (
            <p className="text-xs text-gray-500 mt-1">Assigned: {props.fieldSupervisor}</p>
          )}
        </div>
      </div>
    );
  }

  if (item.id === 'beforePhotos') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            checked={props.beforePhotoLink.trim() !== ''}
            readOnly
            className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-900 font-medium">{item.label}</span>
                {REQUIRED_PILL}
              </div>
              {props.beforePhotoDate && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ {formatDate(props.beforePhotoDate)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="ml-8 bg-gray-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Google Photos Link:</label>
          <input
            type="url"
            value={props.beforePhotoLink}
            onChange={(e) => props.onBeforePhotoChange(e.target.value)}
            placeholder="Paste Google Photos link here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          />
          {props.beforePhotoLink.trim() && (
            <a
              href={props.beforePhotoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-700 mt-1 inline-block"
            >
              View Photos →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (item.id === 'progressPhotos') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            checked={props.progressPhotoLinks.length > 0}
            readOnly
            className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
          />
          <div className="flex-1">
            <span className="text-gray-900 font-medium">{item.label}</span>
            {REQUIRED_PILL}
          </div>
        </div>
        <div className="ml-8 bg-gray-50 p-3 rounded-lg space-y-2">
          {props.progressPhotoLinks.map((photoSet, index) => (
            <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
              <div className="flex-1">
                <a
                  href={photoSet.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 block truncate"
                >
                  Progress Set {index + 1} →
                </a>
                <span className="text-xs text-gray-500">
                  Added: {formatDate(photoSet.addedDate)}
                </span>
              </div>
              <button
                onClick={() => props.onRemoveProgressLink(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="flex gap-2">
            <input
              type="url"
              value={props.newProgressLink}
              onChange={(e) => props.setNewProgressLink(e.target.value)}
              placeholder="Paste Google Photos link..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            />
            <button
              onClick={props.onAddProgressLink}
              disabled={!props.newProgressLink.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (item.id === 'completionPhotos') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            checked={props.completionPhotoLink.trim() !== ''}
            readOnly
            className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-900 font-medium">{item.label}</span>
                {REQUIRED_PILL}
              </div>
              {props.completionPhotoDate && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ {formatDate(props.completionPhotoDate)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="ml-8 bg-gray-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Google Photos Link:</label>
          <input
            type="url"
            value={props.completionPhotoLink}
            onChange={(e) => props.onCompletionPhotoChange(e.target.value)}
            placeholder="Paste Google Photos link here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          />
          {props.completionPhotoLink.trim() && (
            <a
              href={props.completionPhotoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-700 mt-1 inline-block"
            >
              View Photos →
            </a>
          )}
        </div>
      </div>
    );
  }

  // Default branch — includes warranty visit handling
  const warrantyVisitMap: Record<string, { type: string; days: number }> = {
    weekOneInspection: { type: 'weekOne', days: 7 },
    month1Visit: { type: 'month1', days: 30 },
    month2Visit: { type: 'month2', days: 60 },
    month3Visit: { type: 'month3', days: 90 },
  };
  const warrantyVisit = warrantyVisitMap[item.id];
  const isFollowUpStage = project.status === 'follow_up';
  const isWarrantyVisit = isFollowUpStage && !!warrantyVisit;
  const showNotCompleteWarning = isWarrantyVisit && !project.completedDate;
  const dueDate =
    isWarrantyVisit && project.completedDate
      ? getFollowUpDate(project.completedDate, warrantyVisit.days)
      : null;

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!project.completedDate) {
      alert('Cannot schedule until the opportunity is marked complete in Aspire');
      return;
    }
    const url = createWarrantyCalendarUrl(project, warrantyVisit.type, warrantyVisit.days);
    window.open(url, '_blank');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checklistEntry?.completed || false}
          onChange={(e) => onCheckboxChange(item.id, e.target.checked)}
          className="mt-1 h-5 w-5 text-green-600 rounded focus:ring-green-500"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col flex-1">
              <div>
                <span className="text-gray-900 font-medium">{item.label}</span>
                {REQUIRED_PILL}
              </div>
              {showNotCompleteWarning ? (
                <span className="text-xs text-red-600 font-semibold mt-1">
                  Opportunity not yet complete in Aspire
                </span>
              ) : (
                dueDate && (
                  <span className="text-xs text-blue-600 font-medium mt-1">Due: {dueDate}</span>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              {isWarrantyVisit && (
                <button
                  onClick={handleScheduleClick}
                  disabled={!project.completedDate}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
                    project.completedDate
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={
                    project.completedDate
                      ? 'Create calendar invite for this visit'
                      : 'Complete opportunity in Aspire first'
                  }
                >
                  <Image
                    src="/icons/googlecalendaricon.png"
                    alt="Google Calendar"
                    width={14}
                    height={14}
                    className="flex-shrink-0"
                  />
                  Schedule
                </button>
              )}

              {checklistEntry?.completedDate && (
                <div className="text-right">
                  <span className="text-xs text-green-600 font-medium block whitespace-nowrap">
                    ✓ {formatDate(checklistEntry.completedDate)}
                  </span>
                  {checklistEntry.completedBy && (
                    <span className="text-xs text-gray-500 block">{checklistEntry.completedBy}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </label>
    </div>
  );
}

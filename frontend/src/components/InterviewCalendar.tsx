import type { Interview } from '../types';

interface Props {
  interviews: Interview[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getBusinessDays(from: Date, count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseTime(time: string): number {
  if (!time) return Infinity;
  const trimmed = time.trim();

  // 24h HH:MM format from native time input.
  const h24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    const hours = parseInt(h24[1], 10);
    const mins = parseInt(h24[2], 10);
    if (hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
      return hours * 60 + mins;
    }
    return Infinity;
  }

  // Legacy AM/PM format.
  const ampm = trimmed.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!ampm) return Infinity;
  let hours = parseInt(ampm[1], 10);
  const mins = parseInt(ampm[2], 10);
  const meridiem = ampm[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function formatTime(time: string): string {
  if (!time) return '';
  // Already in AM/PM format (legacy data)
  if (/AM|PM/i.test(time)) {
    return time.replace(/\s*(AM|PM)/i, (_, m) => m.toUpperCase());
  }
  // 24h HH:MM format from native time input
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')}${period}`;
}

export function InterviewCalendar({ interviews, onEdit, onDelete }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const businessDays = getBusinessDays(today, 5);

  const firstDay = businessDays[0];
  const lastDay = businessDays[businessDays.length - 1];

  const weekLabel =
    firstDay.getMonth() === lastDay.getMonth()
      ? `${MONTHS[firstDay.getMonth()]} ${firstDay.getDate()}–${lastDay.getDate()}, ${firstDay.getFullYear()}`
      : `${MONTHS[firstDay.getMonth()]} ${firstDay.getDate()} – ${MONTHS[lastDay.getMonth()]} ${lastDay.getDate()}, ${firstDay.getFullYear()}`;

  // Group interviews by date
  const byDate = new Map<string, Interview[]>();
  for (const interview of interviews) {
    const ymd = interview.date;
    if (!byDate.has(ymd)) byDate.set(ymd, []);
    byDate.get(ymd)!.push(interview);
  }

  // Count upcoming (today or later)
  const todayYMD = toYMD(today);
  const upcomingCount = interviews.filter(i => i.date >= todayYMD).length;

  return (
    <div className="calendar-section">
      <div className="calendar-header">
        <h3 className="calendar-title">Upcoming Interviews</h3>
        {upcomingCount > 0 && (
          <span className="upcoming-badge">{upcomingCount} upcoming</span>
        )}
      </div>
      <div className="calendar-week-label">{weekLabel}</div>
      <div className="calendar-days">
        {businessDays.map(day => {
          const ymd = toYMD(day);
          const dayInterviews = (byDate.get(ymd) || []).sort(
            (a, b) => parseTime(a.time) - parseTime(b.time)
          );
          const isToday = ymd === todayYMD;
          const hasBusy = dayInterviews.length > 0;

          return (
            <div
              key={ymd}
              className={`calendar-day${hasBusy ? ' calendar-day--busy' : ''}${isToday ? ' calendar-day--today' : ''}`}
            >
              <div className="calendar-day-header">
                <span className="calendar-day-name">{DAYS[day.getDay()]}</span>
                <span className={`calendar-day-num${isToday ? ' calendar-day-num--today' : ''}`}>
                  {day.getDate()}
                </span>
              </div>
              <div className="calendar-events">
                {dayInterviews.length === 0 ? (
                  <span className="calendar-empty">Free</span>
                ) : (
                  dayInterviews.map(iv => (
                    <div key={iv.id} className="calendar-event">
                      <span
                        className="calendar-dot"
                        style={{ background: iv.tentative ? 'var(--calendar-dot-tentative)' : 'var(--calendar-dot-confirmed)' }}
                      />
                      <div className="calendar-event-info">
                        <span className="calendar-event-company">{iv.company}</span>
                        {iv.type && <span className="calendar-event-type">{iv.type}</span>}
                        <span className="calendar-event-time">
                          {formatTime(iv.time)}
                          {iv.tentative && ' · tentative'}
                        </span>
                      </div>
                      {(onEdit || onDelete) && (
                        <div className="calendar-event-actions">
                          {onEdit && (
                            <button className="action-btn action-btn--edit" onClick={() => onEdit(iv.id)} title="Edit">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                          )}
                          {onDelete && (
                            <button className="action-btn action-btn--delete" onClick={() => onDelete(iv.id)} title="Delete">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

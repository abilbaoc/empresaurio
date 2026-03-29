-- Content approval workflow
-- Extends content_calendar with approval status lifecycle and feedback field

-- Drop the existing status constraint and recreate with new values
alter table content_calendar
  drop constraint if exists content_calendar_status_check;

alter table content_calendar
  add constraint content_calendar_status_check
  check (status in ('draft', 'ready', 'approved', 'published', 'archived'));

-- Add approval feedback column for rejection reasons
alter table content_calendar
  add column if not exists approval_feedback text;

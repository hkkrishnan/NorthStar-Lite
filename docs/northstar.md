# Northstar Product Requirements Document

## 1. Product Summary

Cluster To-Do is a personal, local-first task and project visualizer. It reads and writes user-owned Markdown files and presents active work as a calm Eisenhower-style matrix.

The product is intended for one person managing multiple profiles, such as Work and Personal. Each profile has its own projects, tasks, history, and review state. A task can be standalone or belong to exactly one project. Projects contain one level of tasks.

The central promise is:

> Capture a task with minimal friction, then understand what deserves attention through a visual review.

## 2. Product Decisions

These decisions are based on the user's answers.

- Primary user: one individual user.
- Initial use: personal productivity across work and home contexts.
- Main problem: tasks are difficult to visualize, deadlines are easy to miss, and project subtasks are hard to understand as a whole.
- Primary views: a Project Matrix and a Task Matrix, both using the same Eisenhower model.
- Secondary views: task list, project list, project detail, daily review, and completed-task history.
- Platforms: browser-based app, usable on desktop and phone.
- Offline behavior: required.
- Storage: user-owned Markdown files.
- Sync: a Google Drive or OneDrive-backed workspace, with conflict visibility and manual resolution.
- Manual editing: supported. External Markdown edits must appear in the GUI after refresh or reopen.
- Task nesting: one level, Project -> Task.
- Task membership: one task can belong to zero or one project.
- Effort estimates: excluded from version one.
- Delegation: represented as a boolean state, without assignee names in version one.
- Visual tone: calm planning canvas, with stronger visual treatment for overdue work.
- Notifications: included as a lightweight capability, subject to browser permissions.
- Search: required.
- Daily review: required.

## 3. Important Platform Constraint

A normal browser cannot reliably open and continuously edit an arbitrary file inside Google Drive or OneDrive on every device without some form of provider integration. Desktop browsers can use local file access APIs, but mobile browsers have more restricted file access.

Therefore, the implementation should separate the task experience from the storage mechanism.

### Recommended architecture

- Build the core as an installable Progressive Web App.
- Use a local-first data layer backed by IndexedDB for offline operation.
- Define a storage adapter interface rather than coupling the UI directly to OneDrive or Google Drive.
- Support a desktop local-folder adapter using the browser file system APIs where available.
- Support a cloud-file adapter for Google Drive or OneDrive for phone access and cross-device synchronization.
- Keep the Markdown representation as the canonical user-owned format.

The app can run as a local browser application for work environments where the hosted site is blocked. The same frontend can later be hosted for phone access. If automatic phone synchronization is required in the first release, the cloud-file adapter is part of the MVP and requires provider authentication and API integration.

## 4. Goals

- Make active priorities understandable at a glance.
- Make overdue tasks impossible to overlook without making the whole interface stressful.
- Make task capture fast enough to become a habit.
- Make projects and their subtasks visible without requiring a complex project-management workflow.
- Keep the user's data portable, inspectable, and editable outside the app.
- Work offline and synchronize safely when a connection or synced folder becomes available.
- Keep Work and Personal profiles clearly separated while making it easy to switch between them.
- Let projects and their individual tasks occupy different matrix positions based on their own importance and due dates.

## 5. Non-Goals For Version One

- Team collaboration or shared editing workflows.
- Assignees, comments, mentions, or permissions.
- A full calendar replacement.
- Time tracking or effort estimation.
- Unlimited task hierarchy.
- AI-generated plans or automatic task decomposition.
- Complex recurring-task rules.
- Attachments stored inside the task system.
- A proprietary backend database as the only source of truth.

## 6. Primary User Stories

- As a user, I can switch between Work and Personal profiles without mixing their tasks or projects.
- As a user, I can create additional profiles if I need them later.
- As a user, I can switch between a Project Matrix and a Task Matrix inside the current profile.
- As a user, I can see projects positioned by project-level priority in the Project Matrix.
- As a user, I can see each granular task positioned independently in the Task Matrix.
- As a user, I can type a task title and an optional date in one quick-add interaction.
- As a user, I can specify importance without completing a long form.
- As a user, I can drag a task between quadrants and have its saved priority update.
- As a user, I can see overdue tasks more prominently than tasks that are merely upcoming.
- As a user, I can create a project and add tasks to it without navigating through several screens.
- As a user, I can expand a project in the matrix to inspect its open subtasks.
- As a user, I can mark a task complete and remove it from the active matrix.
- As a user, I can review completed tasks later.
- As a user, I can manually edit the Markdown source and see the result in the app.
- As a user, I can use the app offline and synchronize changes later.
- As a user, I can see when synchronization has failed or when a file conflict needs attention.
- As a user, I can search and filter tasks without changing their underlying data.
- As a user, I can perform a daily review focused on overdue and upcoming work.

## 7. Core Concepts

### Task

A task is a single actionable item. It may be standalone or belong to one project.

Required fields:

- Stable identifier
- Title
- Status
- Importance
- Created timestamp
- Updated timestamp

Optional fields:

- Due date
- Project identifier
- Delegated state
- Notes
- Tags
- Recurrence rule
- Completion timestamp

### Project

A project is a larger goal composed of multiple tasks. It is not itself a task and does not require unlimited nesting.

Required fields:

- Stable identifier
- Title
- Status
- Created timestamp
- Updated timestamp

Optional fields:

- Description
- Due date
- Importance
- Tags

### Profile

A profile is a top-level workspace such as Work or Personal. Each profile has its own projects, standalone tasks, completed history, filters, and daily review. The user can create, rename, select, and archive profiles without changing other profiles.

The first-run experience should offer two profiles by default:

- Work
- Personal

The user may rename these or add more profiles later. Deleting a profile must require confirmation because it affects an entire Markdown source file.

## 8. Priority Model

The matrix uses neutral labels and two axes:

- Importance: Important or Less important
- Urgency: Urgent or Not urgent

The resulting quadrants are:

- Important and urgent
- Important but not urgent
- Urgent but less important
- Neither important nor urgent

### Importance

Importance is selected by the user. Version one should support a simple binary value:

- Important
- Less important

The quick-add flow should default to Less important unless the user chooses otherwise. The exact default may be changed through settings later.

### Urgency

Urgency is calculated from the due date and the current date. It should not be stored as an independent user-editable field in the first version.

Recommended rules:

- Overdue: due date is before today. Display as Urgent and apply overdue styling.
- Today: due date is today. Display as Urgent.
- Soon: due date is within the next 7 calendar days. Display as Urgent.
- Later: due date is more than 7 days away. Display as Not urgent.
- No due date: Display as Not urgent.

The threshold of 7 days should be a named configuration value so it can be changed without redesigning the data model.

The app must use the user's local calendar date, not a server timezone, for urgency calculation.

### Dragging

Dragging a task or project card to a different quadrant updates the saved importance value. Because urgency is calculated, dragging across the urgency axis should have one of these behaviors:

- Recommended: ask the user whether to add or change a due date so the task remains in the selected quadrant.
- If no due-date change is made, recalculate the task back to the quadrant implied by its due date.

This prevents the visual position from disagreeing with the underlying rules.

## 9. Task Status

Version one supports:

- Inbox: captured but not yet organized.
- Open: ready to act on.
- In progress: actively being worked on.
- Waiting: blocked or waiting for someone else.
- Completed: finished and removed from the active matrix.
- Cancelled: intentionally no longer needed.

New tasks should default to Inbox when created without priority information. If the user supplies enough information to classify the task, it may default directly to Open.

Completed and cancelled tasks remain in the Markdown history and can be viewed through history filters.

## 10. Low-Friction Capture

Quick capture is a primary product requirement.

The app should provide one input that accepts natural task text, including a date and optional importance signal. The parser should recognize common forms such as:

```text
Send proposal to client tomorrow !important
Renew passport 2026-10-15
Review budget next Friday important
Buy printer ink
```

The parser should extract:

- Task title
- Due date, when recognizable
- Importance, when recognizable
- Optional project marker, when recognizable
- Optional delegation marker

The original title should remain intact unless the user confirms a parsed change. Ambiguous dates should be shown for confirmation rather than silently converted.

### Quick-add acceptance criteria

- A title-only task can be created with one submit action.
- A task with an ISO date such as `2026-10-15` is saved with that due date.
- Common relative dates such as today, tomorrow, and next Monday are interpreted using the user's local timezone.
- An importance marker can be recognized without opening an advanced editor.
- The user can correct parsed fields before saving.
- The full editor remains available for notes, status, project, delegation, tags, and recurrence.

## 11. Projects And Visualization

Projects appear in the Project Matrix as larger cards rather than as ordinary task cards. A project card should show:

- Project title
- Number of open tasks
- Progress indicator
- Overdue count, if any
- The project's matrix position

Clicking or tapping a project opens its detail view, where the user can see and edit all direct tasks. The Task Matrix does not force a project's tasks to remain near one another: every task is positioned independently using its own importance and due date. This means tasks from the same project may appear in all four quadrants.

### Project position recommendation

Projects should have their own importance and optional due date. If a project has no explicit priority, calculate its position from its open tasks:

- Importance: Important if any open task is Important; otherwise Less important.
- Urgency: Urgent if any open task is overdue, due today, or due within 7 days; otherwise Not urgent.

If the project has an explicit importance or due date, use that value for the project card. This gives the user control while still making projects visible automatically.

### Project progress

Progress is calculated as:

```text
completed tasks / total tasks
```

Cancelled tasks should not count as completed work or remaining work. A project with no tasks has 0% progress.

### Project detail acceptance criteria

- A project can be created with only a title.
- A task can be moved into or out of one project.
- A project detail view shows all direct tasks, including completed tasks when the user enables history.
- The project displays progress and overdue count.
- Completing a project task updates project progress immediately.
- A project can be archived without deleting its task history.

## 12. Recurring Tasks

Recurring tasks are desirable but should remain simple.

Version one should support a small set of recurrence options:

- Every day
- Every week
- Every month

When a recurring task is completed, the app should create the next occurrence and retain a completion record for the previous occurrence. The active matrix shows only the next occurrence.

The recurrence rule must be stored in Markdown so it survives outside the app. Custom schedules, skipped occurrences, and complex calendar rules are deferred.

## 13. Delegation

Delegation is a boolean attribute in version one:

- Delegated
- Not delegated

Delegated tasks should receive a small visual badge and remain filterable. The app should not require an assignee name. A delegated task may also have status Waiting.

## 14. Screens

### Matrix shell

The default home screen contains:

- Profile selector with Work and Personal clearly visible
- Project Matrix and Task Matrix view switcher
- Quick-add input scoped to the active profile
- Sync state for the active profile
- Search control
- Filter controls
- Four-quadrant matrix
- Clear overdue styling

The app should remember the last selected profile and matrix mode on each device. Switching profiles must replace the visible data rather than combining profiles by default.

On desktop, the matrix should favor spatial scanning. On mobile, the four quadrants may stack vertically or use a swipeable layout, but all quadrants must remain easy to reach.

### Project Matrix

The Project Matrix shows only active projects from the selected profile. Each project is one card positioned using the project's importance and urgency. The card shows progress, open task count, and overdue task count. Selecting a project opens its detail view.

Standalone tasks do not appear in the Project Matrix. Projects with no tasks may still appear and show 0% progress.

### Task Matrix

The Task Matrix shows active tasks from the selected profile, including standalone tasks and tasks belonging to projects. Each task is positioned independently using its own importance and calculated urgency.

A project label or subtle visual marker identifies project membership without forcing project tasks into a single cluster. The user can filter the Task Matrix to one project to see that project's tasks spread across the four quadrants.

### Task detail

The detail surface may be a side panel on desktop and a full-screen sheet on mobile. It supports editing:

- Title
- Due date
- Importance
- Status
- Project
- Delegated state
- Notes
- Tags
- Recurrence

Changes should autosave or save with one clear action. The user should never need to navigate through a separate settings workflow for ordinary task editing.

### List view

The list view provides a compact alternative to the matrix and supports sorting by:

- Due date
- Updated date
- Importance
- Project
- Status

### Project list and detail

The project list shows project progress, matrix position, and overdue counts. A project detail screen shows the project's tasks and allows quick task creation directly within that project. The project detail screen should offer a compact matrix option so the user can see only that project's tasks arranged by their individual priorities.

### History view

The history view contains completed and cancelled tasks. It is scoped to the active profile and supports filtering by project, completion date, and search text.

### Daily review

The daily review should be a short guided view, not a complex workflow. It surfaces:

- Overdue tasks
- Tasks due today
- Tasks due in the next 7 days
- Projects with overdue subtasks
- Inbox items that still need classification

For each item, the user can complete, defer by changing the due date, change priority, open details, or dismiss it from the review.

## 15. Search And Filters

Search must cover task titles, notes, project names, and tags within the active profile.

Version one filters:

- Profile
- Project
- Status
- Due-date range
- Delegated state
- Tags
- Overdue only

Filters should be temporary view state and should not modify the Markdown data.

## 16. Notifications

The app should support optional browser notifications for:

- Tasks due today
- Tasks becoming overdue
- Daily review reminder

Notifications require explicit user permission and must be disabled by default. The core product must remain useful without notifications because browsers may restrict background notifications for local applications.

## 17. Markdown Storage Format

### Recommended file layout

Use one Markdown file per profile with structured sections. This keeps Work and Personal separate at the file level while avoiding a large number of small files.

```text
cluster/
  work.md
  personal.md
  ideas.md
```

Each profile file contains project definitions and task records. The app may also support a folder-based layout later, but version one should have one obvious source file per profile.

### Why this format

- Easy to back up and sync.
- Easy to open manually.
- Easy to move between providers.
- Fewer files to conflict than one file per task.
- Simple enough for an AI coding agent to parse and generate.

### YAML frontmatter

YAML frontmatter is a small metadata block at the top of a Markdown file. It is not visible as the main document content but gives the app structured values to read.

Example profile file:

````markdown
---
type: cluster-profile
version: 1
id: work
title: Work
---

# Projects

## Project: Website Launch

```yaml
id: project-website-launch
status: open
importance: important
due: 2026-10-01
```

Launch the new company website.

## Tasks

### Task: Draft homepage copy

```yaml
id: task-draft-homepage-copy
status: open
importance: important
project: project-website-launch
due: 2026-09-05
delegated: false
tags: [writing]
```

Prepare the first draft for review.

### Task: Review analytics setup

```yaml
id: task-review-analytics
status: waiting
importance: less-important
project: project-website-launch
delegated: true
```

Waiting for access to the analytics account.
````

The exact parser format should be chosen during implementation and documented with several valid examples. The app must tolerate ordinary Markdown text around metadata and should preserve unknown fields when rewriting a file where practical.

### Storage rules

- IDs are stable and generated once.
- Dates use `YYYY-MM-DD`.
- Timestamps use ISO 8601.
- Importance is `important` or `less-important`.
- Status uses the defined status values.
- A task's `project` is optional and may reference only one project ID.
- Computed urgency is not persisted as the primary source of truth.
- Completed tasks keep `completedAt`.
- Unknown metadata should not cause the whole profile to fail.
- Invalid records should be shown in a validation or import-warning panel instead of being silently discarded.

## 18. Synchronization And Conflicts

The app should show a visible sync state:

- Local only
- Reading
- Saving
- Synced
- Offline changes pending
- Conflict detected
- Error

### Sync behavior

- Read the source file when a profile opens.
- Re-read on explicit refresh.
- Re-read when the browser returns to the foreground where supported.
- Save changes after an edit is confirmed or autosaved.
- Keep a local cached copy for offline use.
- Queue local edits while offline.
- Attempt synchronization when the source becomes available.

### Conflict behavior

Before saving, compare the source revision or file hash with the revision last read by the app. If the source changed externally, do not overwrite it silently.

The conflict view should show:

- Local version
- External version
- A simple choice to keep local, keep external, or merge individual records

For the first implementation, record-level merge is preferred. If that is too complex, preserve both versions in a conflict copy and let the user choose manually. Data loss must never be hidden behind an automatic overwrite.

## 19. Offline And Browser Behavior

- The app shell and last synchronized data should remain available offline.
- New and edited tasks should be stored locally until synchronization is available.
- The UI must clearly distinguish saved locally from synchronized to the source file.
- If the browser does not support direct folder access, provide an explicit file open/import and export/download path.
- The app should not require a hosted service for the core matrix, parsing, filtering, or editing logic.
- Mobile browser support must be tested independently because local file permissions differ from desktop browsers.

## 20. MVP Scope

The first coded version should include:

- One or more Markdown-backed profiles.
- Profile switching and creation, with Work and Personal available by default.
- Markdown parsing and writing.
- Quick-add task capture.
- Automatic parsing of ISO and common relative dates.
- Manual importance selection.
- Computed urgency.
- Project Matrix showing project-level priority.
- Task Matrix showing each task's independent priority.
- Dragging to change importance, with due-date confirmation when needed.
- Standalone tasks.
- Projects with one level of tasks.
- Project cards with progress and overdue counts.
- Task detail editing.
- Completion and cancellation.
- Completed-task history.
- Search and the agreed filters.
- Offline local cache.
- Visible sync state.
- Basic conflict detection.
- Responsive desktop and mobile layouts.

### MVP exclusions

- Multi-user collaboration.
- Assignee names.
- Effort estimates.
- Attachments.
- Complex recurring rules.
- Calendar integrations.
- Required core behavior must not depend on AI. Local, rule-based importance inference ships in the core; an optional server-side semantic inference provider may be configured later with schema validation, timeout, and local fallback.
- Rich text editing.

## 21. Suggested Delivery Order

1. Define and test the Markdown parser and writer with fixtures.
2. Build profile loading, validation, and local caching.
3. Build the matrix with standalone task cards.
4. Add quick capture and natural date parsing.
5. Add task detail editing and completion.
6. Add projects, project expansion, and progress calculation.
7. Add drag behavior and priority updates.
8. Add list, search, filters, and history.
9. Add offline queue and sync status.
10. Add conflict detection and resolution.
11. Add mobile layout and touch interactions.
12. Add optional notifications and recurring tasks.

## 22. Acceptance Criteria For The First Usable Prototype

- Opening a valid profile file displays active projects and tasks in the correct matrix views.
- A standalone task can be added in one quick interaction.
- A task with a due date within seven days appears urgent.
- A past-due task receives prominent overdue styling.
- A task without a due date remains not urgent unless the user changes the product rule later.
- Dragging a task changes its stored importance.
- A project displays its direct tasks and calculated progress.
- Completing a task removes it from the active matrix and keeps it in history.
- Editing the Markdown file externally and refreshing updates the GUI.
- A file changed externally since the last read is not silently overwritten.
- The last loaded profile remains usable without network access.
- The interface works on a desktop viewport and a phone viewport.
- A new task can be captured without opening an advanced editor.

## 23. Success Measures

The product is successful if:

- The user can capture a basic task in under 10 seconds.
- The user can identify overdue work within a few seconds of opening the app.
- The user can understand a project's remaining work without opening every task individually.
- The user can complete a daily review without needing a separate notes system.
- The user can move between Work and Personal profiles without confusion.
- The user continues using the app because capture and review feel low-friction.
- The user's Markdown files remain readable and useful even when opened outside the app.

## 24. Remaining Implementation Decisions

These decisions can be made by the coding agent using the recommendations in this document:

- Frontend framework and build tooling.
- Exact Markdown parser library.
- Whether the first cloud adapter targets Google Drive or OneDrive.
- Whether desktop local-file access and mobile cloud access ship together or in two milestones.
- Exact visual treatment of project clusters.
- Exact notification scheduling behavior.
- Whether ambiguous natural-language dates require a confirmation step.

The most important technical decision is to preserve the storage-adapter boundary. The UI should operate on a normalized task and project model, while local files, Google Drive, and OneDrive remain replaceable storage implementations.

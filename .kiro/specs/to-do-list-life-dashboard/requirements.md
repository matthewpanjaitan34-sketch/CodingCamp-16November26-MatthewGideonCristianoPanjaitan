# Requirements Document

## Introduction

The To-Do List Life Dashboard is a modern, responsive, single-page web application that helps users organize daily activities in one place. The Dashboard runs entirely in the browser, uses the Local Storage API for persistence, and is built with plain HTML, CSS, and vanilla JavaScript without any front-end framework or backend server.

The Dashboard provides five integrated features: a personalized greeting with a live digital clock, a Pomodoro focus timer, a to-do list with create/update/delete and duplicate prevention, a quick-links panel for favorite website shortcuts, and a light/dark theme toggle. All user data (display name, tasks, quick links, theme) persists across browser sessions through Local Storage.

This document captures functional and non-functional requirements using EARS patterns and INCOSE quality rules. Correctness properties are included as acceptance criteria where applicable, covering data persistence invariants, the no-duplicate-task invariant, timer accuracy, and theme persistence.

## Glossary

- **Dashboard**: The overall single-page web application described in this document.
- **Clock**: The component of the Dashboard that displays the current time and date.
- **Greeting**: The component of the Dashboard that displays a time-of-day greeting, optionally including the Display_Name.
- **Focus_Timer**: The Pomodoro-style countdown timer component of the Dashboard.
- **Task_List**: The to-do list component of the Dashboard that stores Task items.
- **Task**: A single to-do item consisting of text and a completion status.
- **Quick_Links**: The component of the Dashboard that stores Quick_Link shortcuts.
- **Quick_Link**: A saved website shortcut consisting of a label and a target URL.
- **Theme_Manager**: The component of the Dashboard that switches and persists the visual theme.
- **Local_Storage**: The browser Web Storage API used by the Dashboard to persist data across sessions.
- **Display_Name**: The custom name a user enters to personalize the Greeting.
- **Remaining_Time**: The current countdown value shown by the Focus_Timer, expressed in minutes and seconds.
- **Light_Mode**: The default bright visual theme of the Dashboard.
- **Dark_Mode**: The alternate low-light visual theme of the Dashboard.
- **Serializer**: The part of the Dashboard that converts data objects into JSON strings for Local_Storage.
- **Parser**: The part of the Dashboard that converts JSON strings from Local_Storage back into data objects.

## Requirements

### Requirement 1: Greeting and Digital Clock

**User Story:** As a user, I want to see the current time, date, and a personalized greeting, so that I feel informed and welcomed when I open the Dashboard.

#### Acceptance Criteria

1. THE Clock SHALL display the current local time in 24-hour format showing hours, minutes, and seconds, and update the display once per second.
2. THE Clock SHALL display the current local date showing the day, month, and year.
3. WHILE the current local hour is between 05:00 and 11:59, THE Greeting SHALL display the text "Good morning".
4. WHILE the current local hour is between 12:00 and 16:59, THE Greeting SHALL display the text "Good afternoon".
5. WHILE the current local hour is between 17:00 and 20:59, THE Greeting SHALL display the text "Good evening".
6. WHILE the current local hour is between 21:00 and 04:59, THE Greeting SHALL display the text "Good night".
7. WHEN a user enters a Display_Name, THE Greeting SHALL append the Display_Name to the greeting text, separated by a space.
8. WHEN a user enters or changes a Display_Name, THE Greeting SHALL save the Display_Name to Local_Storage.
9. WHEN the Dashboard loads, THE Greeting SHALL load and display the saved Display_Name from Local_Storage.
10. IF no saved Display_Name exists in Local_Storage, THEN THE Greeting SHALL display the greeting text without a name.
11. IF a user enters a Display_Name that is empty, consists only of whitespace, or exceeds 50 characters, THEN THE Greeting SHALL reject the input without saving or appending it and display an error message indicating the Display_Name must be 1 to 50 non-whitespace characters.
12. THE Greeting SHALL provide a single editable name input that users use both to enter a new Display_Name and to change a previously saved Display_Name, where submitting a new valid Display_Name replaces the previously saved Display_Name in both the displayed Greeting and Local_Storage without requiring a separate edit flow.

### Requirement 2: Focus Timer (Pomodoro)

**User Story:** As a user, I want a Pomodoro focus timer with start, stop, and reset controls, so that I can run focused work sessions of a fixed length.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a default duration of 25 minutes.
2. WHEN a user activates the Start control, IF the Focus_Timer is not running and the Remaining_Time is greater than zero, THEN THE Focus_Timer SHALL begin counting down from the current Remaining_Time in one-second decrements.
3. WHILE the Focus_Timer is running, THE Focus_Timer SHALL display the Remaining_Time in MM:SS format.
4. WHEN a user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the current Remaining_Time.
5. WHEN a user activates the Reset control, THE Focus_Timer SHALL stop the countdown and restore the Remaining_Time to the default 25-minute duration.
6. WHEN the Remaining_Time reaches zero, THE Focus_Timer SHALL stop the countdown.
7. THE Focus_Timer SHALL prevent the Remaining_Time from becoming negative.
8. WHILE the Focus_Timer is running, THE Focus_Timer SHALL compute the Remaining_Time from the actual elapsed real time, determined by comparing timestamps captured at countdown start and at each display update rather than relying solely on the setInterval callback frequency, so that timing drift does not accumulate, and SHALL keep the Remaining_Time accurate to within one second of the true elapsed real time.

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks that persist across sessions, so that I can track my daily activities without losing data.

#### Acceptance Criteria

1. WHEN a user submits a new Task whose text, after trimming leading and trailing whitespace, contains between 1 and 200 characters, THE Task_List SHALL add the Task to the end of the list.
2. WHEN a user edits a Task with text that, after trimming leading and trailing whitespace, contains between 1 and 200 characters and is not identical to the trimmed text of any other existing Task, THE Task_List SHALL update the Task text in place while preserving the Task's completion status and position in the list.
3. WHEN a user activates a Task's completion control, THE Task_List SHALL toggle the Task between the completed and uncompleted states, where a completed Task displays a checked completion indicator and the Task text rendered with a strikethrough style and an uncompleted Task displays an unchecked completion indicator and the Task text without a strikethrough, and THE Task_List SHALL preserve the Task's text and position in the list when toggling its completion status.
4. WHEN a user deletes a Task, THE Task_List SHALL remove the Task from the list.
5. IF a user submits a Task whose text, after trimming leading and trailing whitespace, is identical to the trimmed text of an existing Task under case-sensitive comparison, THEN THE Task_List SHALL reject the Task and display a message indicating that a duplicate Task already exists.
6. IF a user submits a Task whose text is empty or contains only whitespace, THEN THE Task_List SHALL reject the Task and display a message indicating that the Task text is required.
7. WHEN the Task_List changes, THE Task_List SHALL save the current list to Local_Storage.
8. WHEN the Dashboard loads, THE Task_List SHALL load saved Tasks from Local_Storage.
9. FOR ALL Task submissions and Task edits, the Task_List SHALL maintain the invariant that no two Tasks in the list share identical text, where identical text means trimmed text matching under case-sensitive comparison (no-duplicate-task invariant).
10. FOR ALL Task_List states, saving the list to Local_Storage then loading it SHALL produce a list equivalent to the original, where equivalent means the loaded list contains the same number of Tasks in the same order, with each Task's text and completion status matching the original (persistence round-trip property).
11. IF a user edits a Task and the resulting text, after trimming leading and trailing whitespace, is empty, contains only whitespace, or is identical to the trimmed text of another existing Task under case-sensitive comparison, THEN THE Task_List SHALL reject the edit, retain the Task's original text, and display a message indicating the reason for rejection.

### Requirement 4: Quick Links

**User Story:** As a user, I want to save, open, and delete favorite website shortcuts that persist across sessions, so that I can reach frequently used sites quickly.

#### Acceptance Criteria

1. WHEN a user submits a Quick_Link with a label of 1 to 50 characters that is not whitespace-only, a URL of 1 to 2048 characters that is not whitespace-only, and the Quick_Links list contains fewer than 20 Quick_Links, THE Quick_Links SHALL add the Quick_Link to the panel.
2. WHEN a user activates a Quick_Link, THE Quick_Links SHALL open the target URL in a new browser tab.
3. WHEN a user deletes a Quick_Link, THE Quick_Links SHALL remove the Quick_Link from the panel.
4. WHEN the Quick_Links list changes, THE Quick_Links SHALL save the current list to Local_Storage.
5. WHEN the Dashboard loads, THE Quick_Links SHALL load saved shortcuts from Local_Storage.
6. IF a user submits a Quick_Link with an empty or whitespace-only label, an empty or whitespace-only URL, a label longer than 50 characters, or a URL longer than 2048 characters, THEN THE Quick_Links SHALL reject the Quick_Link, leave the Quick_Links list unchanged, and display an on-screen message indicating the rejection.
7. FOR ALL Quick_Link states, saving the list to Local_Storage then loading it SHALL produce a list with the same number of Quick_Links, matching labels, matching URLs, and matching order as the original (persistence round-trip property).
8. IF the Quick_Links list already contains 20 Quick_Links, THEN THE Quick_Links SHALL reject a new Quick_Link submission, leave the list unchanged, and display an on-screen message indicating that the maximum number of shortcuts has been reached.
9. IF a user submits a Quick_Link whose URL does not conform to a valid HTTP or HTTPS URL format, THEN THE Quick_Links SHALL reject the Quick_Link, leave the Quick_Links list unchanged, and display an on-screen message indicating that the URL must be a valid HTTP or HTTPS URL.

### Requirement 5: Light and Dark Mode

**User Story:** As a user, I want to toggle between light and dark themes and have my choice remembered, so that I can use the Dashboard comfortably in any lighting.

#### Acceptance Criteria

1. WHEN a user activates the theme toggle, THE Theme_Manager SHALL switch the Dashboard between Light_Mode and Dark_Mode.
2. WHEN the theme changes, THE Theme_Manager SHALL save the selected theme to Local_Storage.
3. WHEN the Dashboard loads, THE Theme_Manager SHALL load and apply the saved theme from Local_Storage.
4. IF no saved theme exists in Local_Storage or the saved theme is neither Light_Mode nor Dark_Mode, THEN THE Theme_Manager SHALL apply Light_Mode as the default theme.
5. IF saving the theme to Local_Storage fails, THEN THE Theme_Manager SHALL keep the currently selected theme displayed without reverting to the previously displayed theme.

### Requirement 6: Responsive Layout and Visual Design

**User Story:** As a user, I want a modern, clean, and responsive dashboard, so that I can use it comfortably on desktop, tablet, and mobile devices.

#### Acceptance Criteria

1. WHILE the viewport width is less than 768 pixels, THE Dashboard SHALL arrange its components in a single-column layout.
2. WHILE the viewport width is between 768 and 1023 pixels, THE Dashboard SHALL arrange its components in a two-column layout.
3. WHILE the viewport width is 1024 pixels or greater, THE Dashboard SHALL arrange its components in a layout of three or more columns.
4. THE Dashboard SHALL apply spacing values that are integer multiples of a single base spacing unit across all components.
5. THE Dashboard SHALL render all text at a font size drawn from a single defined set of typographic sizes.
6. THE Dashboard SHALL render primary content with a larger font size, a greater font weight, and a higher color contrast ratio than secondary content.
7. WHEN a user interacts with an interactive control, THE Dashboard SHALL display visible feedback within 100 milliseconds.

### Requirement 7: Data Persistence and Serialization

**User Story:** As a user, I want my data to persist and load reliably across browser sessions, so that I do not lose my settings, tasks, or shortcuts.

#### Acceptance Criteria

1. THE Serializer SHALL convert data objects into valid JSON strings before writing to Local_Storage.
2. THE Parser SHALL convert JSON strings read from Local_Storage back into data objects.
3. FOR ALL data objects written to Local_Storage, serializing the object then parsing the result SHALL produce a data object in which all field values and nested structures are deeply equal to those of the original object (serialization round-trip property).
4. IF Local_Storage contains data that cannot be parsed as valid JSON or that does not conform to the expected data object structure, THEN THE Parser SHALL restore the defined default values and continue operating without throwing an uncaught exception.

### Requirement 8: Technical Constraints and Project Structure

**User Story:** As a developer, I want the project to follow strict technical constraints and a fixed structure, so that it satisfies the Coding Camp assignment requirements.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and vanilla JavaScript without external libraries or front-end frameworks.
2. THE Dashboard SHALL operate entirely client-side in the browser without a backend server.
3. THE Dashboard SHALL use the Local_Storage API for all data persistence.
4. WHERE the project structure is defined, THE Dashboard SHALL include exactly one CSS file located at css/style.css and exactly one JavaScript file located at js/script.js.
5. THE Dashboard SHALL include an entry file located at the project root named index.html.
6. THE Dashboard source code SHALL use identifiers whose names indicate their purpose, control structures nested no more than 3 levels deep, and comments explaining the intent of any logic whose purpose is not clear from the code alone.
7. THE Dashboard SHALL include only the files required for the defined project structure and the Kiro specifications, with no additional files beyond these.
8. THE implementation SHALL NOT delete, overwrite, or modify any files under the .kiro/ directory, including the specification documents in .kiro/specs/, when implementing the Dashboard application.

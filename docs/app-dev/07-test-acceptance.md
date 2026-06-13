# Test and Acceptance Plan

## Storage Tests

Required scenarios:

- Initialize a new SQLite database.
- Apply schema migrations once.
- Apply schema migrations repeatedly without duplicating schema.
- Create, list, update, and soft-delete a voice.
- Create, update, and soft-delete a generation.
- Verify deleted records are hidden by default.
- Verify audio files are copied to `data/app/voices/` and `data/app/generations/`.

## UI Workflow Tests

Required scenarios:

- Voice Library empty state appears when no saved voices exist.
- Uploaded reference audio can be saved as a voice.
- Saved voice appears in selector after save.
- Selecting a saved voice uses its stored audio path.
- Successful generation creates a `succeeded` history record.
- Failed generation creates a `failed` history record with `error_summary`.
- Reuse action restores generation parameters without auto-generating.

## Electron Lifecycle Tests

Required scenarios:

- Default AppShell opens the React renderer without starting or embedding the legacy Gradio WebUI.
- Renderer receives AppShell status through IPC.
- Voice Library and History can request data through the app-service IPC boundary.
- Explicit `VOXCPM_START_LEGACY_GRADIO=1` development mode starts the legacy Python backend.
- Closing the Electron window stops only AppShell-owned backend processes.

## App Service CLI Tests

Required scenarios:

- `list-voices` returns an empty list for a new app data root.
- `create-voice` copies source audio and returns stored metadata.
- `list-generations` returns non-deleted history records.
- Generation status actions move records through `pending`, `running`, `succeeded`, and `failed`.
- Unknown CLI actions return a JSON error.

## Regression Tests

Existing generation behavior must remain valid:

- Voice design with no reference audio still works.
- Reference-audio generation still accepts an uploaded audio path.
- Ultimate cloning still passes `prompt_wav_path` and `prompt_text`.
- Local FFmpeg wrapper remains available for formats such as `.m4a`.

## Documentation Acceptance

Docs are acceptable when:

- Every first-scope feature appears in PRD, architecture, data design, UI workflows, and tests.
- Table names, field names, status enum, and paths are consistent.
- Model internals and training are not documented as app-layer scope.
- A future AI agent can implement Phase 2 without asking for storage path, table purpose, or deletion policy.

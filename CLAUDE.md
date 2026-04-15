## Code generation rules

- **Modularization**: Split code into focused modules/files — one concern per file.
  Max ~200 lines per file before splitting.
- **File organization**: Group by feature, not by type (e.g., `auth/`, `budget/`, not `hooks/`, `utils/`).
- **Best practices**: Prefer composition over inheritance. No magic numbers — use named constants.
- **Refactoring**: If you identify a refactoring opportunity while implementing a task,
  STOP and present it to the user first. Include: what would change, why it's better,
  and estimated effort. Do not refactor without explicit confirmation.
- **No gold-plating**: Only build what was asked. No speculative abstractions.
- **Design docs**: If a change deviates from or updates the original design, update any relevant design or strategy docs in the repo (e.g. `docs/`, ADRs, README sections) to reflect the new direction.
- **Diagrams**: Add Mermaid diagrams wherever applicable (e.g. flows, architecture, DB schema, state machines) — embed them directly in Markdown docs.

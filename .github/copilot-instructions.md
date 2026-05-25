# Copilot instructions

See AGENTS.md at the repository root for onboarding and actionable guidance for AI coding agents.

- Primary guidance: follow `AGENTS.md` conventions (monorepo layout, quick commands, VS Code tasks).
- When changing packaging or native modules, run builds locally and flag potential native dependency issues.

## Git Commit Message Standard

When generating commit messages (e.g., when clicking the "Generate Commit Message" button in the VS Code Source Control panel), you MUST strictly follow the repository's specialized commit format:

1. **Multi-line output:** Write one line per logical change.
2. **Strict line format:** Each line must follow this exact lowercase pattern:
   `<lowercase verb phrase describing the change> --<type> --<scope>`
   *   **DO NOT** capitalize the first letter of the description.
   *   **DO NOT** add a trailing period.
   *   *Example:* `implement drag indicator reordering and checkbox multi-select --change --pos`
3. **Allowed Types (`--<type>`):**
   *   `--feat` (Added feature)
   *   `--change` (Changed/modified feature)
   *   `--fix` (Fixed issue)
   *   `--bug` (Fixed issue)
   *   `--chore` (Chore/routine work)
4. **Allowed Scopes (`--<scope>`):**
   *   `--pos` (Kermes POS app)
   *   `--electron` (Kermes Electron wrapper)
   *   `--admin` (Kermes Admin dashboard)
   *   `--menu` (Kermes Menu app)
   *   `--web` (Kermes Marketing/Download web)
   *   `--global` (Global repository changes)

### Example Output
```text
implement drag handle reordering and checkbox multi-select --change --pos
add category-level select all checkboxes to headers --feat --pos
design floating glassmorphic bulk actions bar at viewport bottom --change --pos
upgrade tooltips with arrows and shift-click keycap badges --change --pos
add translation strings to localization files --feat --pos
```

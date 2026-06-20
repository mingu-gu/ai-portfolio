# Troubleshooting

## The student does not know where they are

Run the progress scanner and point to the first non-done stage. Avoid explaining every later stage.

## No project files exist

They are still in `prepare`. Ask for a short brief, then create the first local project.

## Dev server fails

Ask for the exact command and error. Check `package.json` scripts. Common next actions:

- install dependencies
- run the correct dev script
- fix the first syntax error only

## The screen looks wrong

Ask for expected vs actual. Fix one visible issue at a time: layout overflow, text contrast, spacing, mobile breakage.

## Git is confusing

Use the save-point metaphor. Start with:

```bash
git status
git add .
git commit -m "Initial brand website"
```

Do not use destructive reset commands.

## GitHub push fails

Check remote URL and authentication. If remote is missing, create or connect a repository. If push is rejected, inspect the exact message before giving commands.

## Vercel build fails

Build failure is a log, not a dead end. Ask for the first red error line, framework, and build command. Feed the log back into the coding agent.

## Supabase questions appear

Acknowledge the idea, then park it unless the instructor changed scope. Record it as a future feature in progress notes.

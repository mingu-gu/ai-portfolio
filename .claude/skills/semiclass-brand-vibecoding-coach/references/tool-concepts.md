# Tool Concepts

Explain tools by the concept they provide.

## Claude Code / Codex

Concept: a coding agent that reads the project folder and turns a brief into file edits.

Use it for:
- creating sections and components
- adjusting copy and style
- fixing responsive layout
- reading errors and proposing file-level fixes

Do not describe it as magic. The useful loop is brief -> edit -> preview -> feedback.

## Git / GitHub

Concept: Git is the save-point system; GitHub is the remote source that deployment tools can read.

Use it for:
- saving a known-good state
- seeing what changed
- pushing the project to a remote repository
- giving Vercel a source to deploy

## Vercel

Concept: a deployment service that reads GitHub, builds the project, and creates a public URL.

Use it for:
- turning local work into a shareable website
- getting deployment logs
- automatic redeploys after GitHub push

## Supabase

Concept: a managed backend for database, auth, and file storage.

This class only mentions Supabase. Use it later when the site needs memory: saved form submissions, login, uploads, dashboards, or admin pages.

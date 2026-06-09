# AGENTS.md

## Security rules

- Never read, print, summarize, copy, edit, or expose `.env` or `.env.local` files.
- Never run commands such as `cat .env`, `less .env`, `grep COUNTIT .env`, or anything that prints secrets.
- Do not include environment variable values in responses, logs, tests, README files, screenshots, or generated files.
- Use `.env.example` when you need to inspect or document required environment variables.
- If environment variables are needed, only check whether required variable names exist, not their values.
- If a task appears to require reading `.env`, stop and ask for confirmation.
- Keep `.env` and `.env.local` ignored by Git.

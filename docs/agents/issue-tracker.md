# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create**: `gh issue create --title "..." --body "..."`
- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state open --json number,title,body,labels,comments`
- **Comment**: `gh issue comment <number> --body "..."`
- **Label**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repository from `git remote -v`; `gh` does this automatically inside the clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

If this is changed to `yes`, use the matching `gh pr` commands and only include external PRs from non-members in the triage queue. GitHub issues and PRs share a number space, so resolve ambiguous references before acting.

## Skill operations

- When a skill says **publish to the issue tracker**, create a GitHub issue.
- When a skill says **fetch the relevant ticket**, run `gh issue view <number> --comments`.
- For wayfinding, use one issue labelled `wayfinder:map` as the map and linked child issues labelled `wayfinder:<type>`.
- Represent blockers with GitHub issue dependencies when available; otherwise use a `Blocked by: #<n>` line.
- Claim a ticket with `gh issue edit <number> --add-assignee @me`.
- Resolve it by commenting with the result, closing the issue, and updating the map's decisions.

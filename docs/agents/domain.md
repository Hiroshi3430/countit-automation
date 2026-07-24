# Domain Docs

This repository uses a single-context domain documentation layout.

## Before exploring

- Read `CONTEXT.md` at the repository root when it exists.
- Read ADRs under `docs/adr/` that affect the area being changed.
- If these files do not exist, proceed silently. Domain-modeling skills create them lazily when terminology or decisions are resolved.

## Layout

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

Use terminology defined in `CONTEXT.md` rather than inventing synonyms. If work contradicts an existing ADR, identify the conflict explicitly instead of silently overriding it.

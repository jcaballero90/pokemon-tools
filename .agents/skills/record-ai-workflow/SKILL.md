---
name: record-ai-workflow
description: Record significant AI-assisted pokemon-tools work under docs/tfm/ai-methodology/workflows. Use for methodology and validation traceability, not CI/CD workflows or routine chat.
---

# Record an AI-assisted project workflow

Follow `<repo-root>/AGENTS.md`.

## Choose what merits a record

Record workflows that materially shape requirements, architecture, security, testing, infrastructure, course-knowledge preparation, or TFM methodology. Do not create a file for every prompt or minor correction. If documentation was not requested, propose the record and obtain approval first.

## Establish what happened

Read relevant prompts, resulting artifacts, validation evidence, and human feedback. Consult `<workspace-root>/knowledge-private/master-index.md` first when course knowledge materially informed the workflow, then only relevant validated documents. Distinguish course guidance, project decisions, AI suggestions, and human approval.

Reflect the actual workflow, even if it differed from the normal ChatGPT Assistant → Codex → human-review sequence in `AGENTS.md`. Record models, reasoning level, prompt origin, and final executed prompt only when reliably known; link an existing prompt file rather than duplicating its text. Never invent execution details or validation.

## Maintain the workflow record

Use `<repo-root>/docs/tfm/ai-methodology/workflows/`. Update an existing record when continuing the same workflow; otherwise use a new, stable sequential filename after the highest assigned number. Do not create duplicates.

Keep the public record concise: purpose, inputs and knowledge routing, roles and significant steps, decisions and their evidence, outputs, validation, human review, limitations, and lessons learned where supported. Link to actual artifacts. Capture approved rationale and alternatives, not a chat transcript or private internal reasoning. Mark unfinished work and pending review honestly.

Do not expose private course material, credentials, or personal data. Do not modify project decisions, implementation, or private knowledge-base status through this recording skill.

## Check the result

Verify that linked prompts and outputs exist, factual claims have evidence, models and review state are not guessed, course guidance is attributed accurately, and no existing workflow is duplicated.

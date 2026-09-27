Execute the project's master lesson consolidation workflow for exactly one selected lesson.

Before doing anything, read and follow:

<repo-root>/AGENTS.md

and:

<repo-root>/.agents/skills/consolidate-master-lesson/SKILL.md

The selected source lesson directory is:

<lesson-directory>

Treat `<lesson-directory>` as the only lesson authorized for this execution.

Do not process adjacent lessons, parent directories, sibling lessons, or the rest of the master's course.

## Objective

Apply the `consolidate-master-lesson` skill to the selected lesson and generate its private consolidated Markdown knowledge document.

This execution is part of a controlled validation of the consolidation workflow.

The result must remain a draft pending human review.

## Before generating output

Inspect the selected lesson directory and:

1. Identify all relevant source files and extracted project directories.
2. Classify them according to the skill as:
   - primary;
   - secondary;
   - supplementary.
3. Determine the lesson's logical module and lesson hierarchy from the available workspace structure.
4. Determine the intended Markdown output path under:

   `<workspace-root>/knowledge-private/master-md/`

5. Determine whether any relevant visual assets need to be preserved under:

   `<workspace-root>/knowledge-private/assets/`

6. Check whether the intended Markdown output or any intended asset already exists.

If an output conflict exists, follow the existing-output protection rules in the skill and stop before overwriting anything.

## Consolidation

If no blocking ambiguity or output conflict exists, consolidate the lesson according to the skill.

In particular:

- use the primary source as the normal conceptual backbone;
- use secondary sources to enrich corresponding concepts without silently overriding the primary source;
- treat `ADJ-*` files and extracted project directories as supplementary material;
- do not recursively ingest complete extracted projects by default;
- preserve useful detail rather than aggressively summarizing;
- remove unnecessary duplication between sources;
- preserve meaningful source distinctions;
- preserve relevant diagrams, tables, code, examples, and warnings;
- correct only obvious OCR artifacts whose intended meaning is clear;
- do not use external knowledge, web research, or project-specific decisions to complete or correct the course material;
- write the consolidated knowledge document in Spanish unless the source material clearly requires otherwise;
- preserve technical terminology appropriately.

## Visual assets

Inspect the lesson visually where necessary.

If a diagram, table, architecture figure, workflow, screenshot, or other visual contains meaningful instructional information that is not adequately represented by extracted text:

- preserve the relevant original visual as an asset when technically practical;
- use a stable, source-traceable filename;
- store it under `<workspace-root>/knowledge-private/assets/`;
- link it from the Markdown using a relative path.

Do not extract decorative or repeated visual elements.

Do not replace a meaningful original visual solely with a Mermaid reconstruction.

## Output

Generate the consolidated Markdown under:

`<workspace-root>/knowledge-private/master-md/`

Preserve the logical module/lesson hierarchy from the source workspace.

Do not flatten the course hierarchy.

Do not create multiple Markdown files unless the lesson structure clearly requires it under the rules of the skill.

Do not modify:

- source material under `<workspace-root>/ocr/`;
- `AGENTS.md`;
- `SKILL.md`;
- public project documentation;
- AI methodology documentation;
- any other lesson.

## Processing registry

If `<workspace-root>/knowledge-private/processing/lessons-status.md` exists, update only the row corresponding to the selected lesson after a successful consolidation.

Set:

- Status: `Draft`
- Model: the Codex model and reasoning level used for this execution
- Outputs: number of consolidated Markdown files created
- Human review: `No`

Preserve any relevant existing notes and add only concise operational notes when necessary.

Never set a lesson to `Validated` automatically.

Only explicit human approval may change:

- `Draft` → `Validated`
- `Draft` → `Needs review`
- `Needs review` → `Validated`

Do not modify any other lesson row.

## Validation report

After generation, report concisely:

1. Selected lesson.
2. Output Markdown file or files created.
3. Primary sources used.
4. Secondary sources used.
5. Supplementary sources inspected or used.
6. Extracted project directories inspected.
7. Assets created or reused.
8. Source conflicts found.
9. Significant OCR uncertainties.
10. Secondary-only concepts included.
11. Important source content that could not be represented confidently.
12. Any decision made to keep supplementary material separate from the main narrative.
13. Any issue that should be reviewed before this draft is accepted.

Explicitly state that the generated result is a draft awaiting human validation.

Do not process another lesson after completing this one.

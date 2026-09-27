Create a lightweight inventory of the master's course lesson structure and initialize the private lesson-processing status registry.

Before doing anything, read and follow:

<repo-root>/AGENTS.md

Do NOT execute the lesson-consolidation skill.

Do NOT generate any consolidated lesson Markdown.

Do NOT modify source material.

## Scope

Inspect:

<workspace-root>/ocr/

The purpose of this task is only to identify the lesson units that will later be processed individually.

Use directory structure, filenames, file types, and extracted archive directories.

Do not deeply read PDF contents unless absolutely necessary to determine whether a directory is a lesson or only a structural/container directory.

Do not inspect extracted project source code recursively.

## Lesson identification

Identify the logical hierarchy:

module
→ lesson
→ source material

Use the existing directory structure as the primary signal.

A lesson is normally a directory containing one or more course-content files such as:

- `PPT-*` primary presentations;
- secondary PDFs;
- `ADJ-*` supplementary material;
- extracted archive directories;
- other lesson-specific supporting files.

Do not treat every individual PDF as a separate lesson.

Do not invent lesson boundaries that are not supported by the directory structure.

If a directory appears ambiguous, mark it for review rather than guessing.

## Source inventory

For each identified lesson, collect lightweight counts or indicators for:

- number of `PPT-*` primary PDFs;
- number of secondary PDFs;
- number of `ADJ-*` files;
- number of extracted archive directories;
- presence of spreadsheets;
- presence of other notable file types.

Do not calculate exhaustive statistics inside extracted archive directories.

## Complexity estimate

Assign a rough operational complexity:

- `Simple`
- `Medium`
- `High`

Use only structural indicators, not deep content interpretation.

Suggested criteria:

### Simple
Typical characteristics:
- one or very few primary PDFs;
- few secondary files;
- no extracted projects;
- few or no supplementary files.

### Medium
Typical characteristics:
- several primary or secondary sources;
- some supplementary material;
- moderate lesson size;
- limited archive/project material.

### High
Typical characteristics:
- many primary and secondary sources;
- multiple conceptual subtopics;
- extracted projects or archives;
- many supplementary files;
- heterogeneous material likely to require more context.

This classification is only an operational estimate for model selection and batching.

Do not treat it as an academic classification.

## Existing processed lessons

Check:

<workspace-root>/knowledge-private/master-md/

Determine whether any identified lessons already have consolidated Markdown outputs.

Known currently processed lessons include at least:

- Bases de datos
- Arquitecturas distribuidas y comunicación entre servicios

Do not overwrite or modify their Markdown files.

Use their existing outputs only to initialize processing status.

## Output

Create:

<workspace-root>/knowledge-private/processing/lessons-status.md

Create the `processing/` directory if necessary.

The file is private operational metadata and must not be copied into the public repository.

Use a concise Markdown table with columns similar to:

| Module | Lesson | Primary | Secondary | ADJ | Archives | Other | Complexity | Status | Model | Outputs | Human review | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | ---: | --- | --- |

Use these status values:

- `Pending`
- `Draft`
- `Validated`
- `Needs review`

Do not use `Processing` in the static inventory unless an execution is actively incomplete.

## Validation status initialization

Do not infer human-validation status from the contents of generated Markdown files.

In particular, the absence of a "pending human review" notice does NOT prove that a lesson has been validated.

The lesson-processing registry is the authoritative source for validation status once it exists.

For this initial registry creation, use the following explicitly provided human-validation state:

- `Infraestructura y cloud / Bases de datos` → `Validated`
- `Arquitectura del software / Arquitecturas distribuidas y comunicación entre servicios` → `Validated`

These statuses are provided by the human developer and must not be inferred from file contents.

If consolidated Markdown exists for any other lesson but no explicit human-validation state is available, use:

`Draft`

For lessons with no consolidated output, use:

`Pending`

Never assign `Validated` unless explicit human approval is available.

Leave model blank for unprocessed lessons.

For already processed lessons, record the model only if it can be determined confidently from existing workflow information or explicit task context. Do not guess.

For `Outputs`, record the number of consolidated Markdown files detected.

For `Human review`, use a concise value such as:

- `Yes`
- `No`
- `Partial`

Do not mark a lesson as validated merely because output files exist.

## Notes

Use `Notes` only for operationally relevant information, for example:

- multiple primary presentations;
- extracted projects present;
- ambiguous lesson boundary;
- unusual supplementary material;
- known source irregularities;
- possible high-context lesson.

Keep notes concise.

Do not duplicate detailed source analysis here.

## Ordering

Preserve the course's logical module and lesson ordering where it can be inferred from directory structure or numbering.

Do not alphabetically reorder material if that would destroy the apparent course order.

## Verification

After creating the registry:

1. Report the total number of modules identified.
2. Report the total number of lesson units identified.
3. Report counts by complexity:
   - Simple
   - Medium
   - High
4. Report any ambiguous directories that could not be classified confidently.
5. Report any spreadsheets found.
6. Report which lessons were detected as already processed and distinguish their explicitly provided validation status from status inferred only from output existence.
7. Confirm that no consolidated lesson Markdown or source material was modified.

Do not create any other documentation or workflow files.
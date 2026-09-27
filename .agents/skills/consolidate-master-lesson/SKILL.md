---
name: consolidate-master-lesson
description: Consolidate one selected master's-course lesson from OCR/searchable PDFs into private, source-traceable Markdown. Use for lesson consolidation, not public documentation or bulk processing.
---

# Consolidate a master's-course lesson

Follow [AGENTS.md](../../../AGENTS.md). This skill may refine but never weaken its privacy, attribution, traceability, or non-hallucination rules.

## Scope and locations

Process one explicitly selected lesson directory. Do not process adjacent lessons or the full course unless separately authorized.

| Content | Location | Rule |
| --- | --- | --- |
| Sources | `<workspace-root>/ocr/` | Read only; never modify source PDFs. |
| Consolidated Markdown | `<workspace-root>/knowledge-private/master-md/` | Private. |
| Extracted assets | `<workspace-root>/knowledge-private/assets/` | Private. |
| Public repository | `<repo-root>/` | Never copy course content or assets here. |

Consolidate by lesson, not by source file. Produce one coherent document by default. Produce multiple documents only when distinct lesson subtopics require separate treatment; keep all outputs in the same lesson directory. Never create multiple variants unless requested.

The result is a synthesis of the supplied sources, not a file-by-file conversion, concatenation, generic summary, or description of those sources. It MUST contain enough substantive educational content to study the represented topic without opening the originals. Preserve supported concepts, definitions, explanations, relationships, procedures, examples, tables, formulas, code, conclusions, distinctions, and warnings. Do not discard material because it seems basic or shorten substantial material merely for concision.

Do not add, correct, modernize, or complete content with model knowledge, web research, external documentation, assumptions, or project decisions. Preserve and report unsupported gaps.

## Workflow

1. Inspect all relevant files in the selected lesson directory.
2. Classify each source and determine the lesson's conceptual structure.
3. Consolidate the educational content, removing repetition while preserving detail and provenance.
4. Inspect meaningful visuals and non-PDF attachments that text extraction may not represent.
5. Write the output using the exact contract below.
6. Validate the output and report the review information required below.

## Source authority and integration

| Class | Identifier | Use and authority |
| --- | --- | --- |
| Primary | Filename starts with `PPT-` | Defines the taught structure, terminology, concepts, examples, diagrams, recommendations, and conclusions. |
| Secondary | Course summary, conclusion, or explanatory file that is neither primary nor supplementary | Expands or clarifies primary content but never silently overrides it. A processed filename may no longer contain its former `OK-` prefix. |
| Supplementary | Filename starts with `ADJ-`, including an associated extracted archive directory | Exercise, project, code, dataset, reference, or supporting material; not normative by default. |

Apply these rules:

- Integrate useful secondary content into the relevant conceptual section without repetition.
- Mark a meaningful secondary-only concept as material not explicit in the primary source. Use concept- or section-level provenance, not sentence-level citations.
- Before using supplementary material, determine its role. Integrate only content that materially improves understanding and identify it as supplementary. Otherwise, state its role only in traceability.
- If sources disagree, preserve the primary claim, state the secondary claim and discrepancy, and do not decide correctness with external knowledge.
- Correct an apparent source or OCR error only when the intended text is unambiguous. Report any uncertainty that could change meaning.
- Use provenance notes in the educational body only for secondary-only content, supplementary content, conflicts, or uncertainty. Do not duplicate ordinary traceability there.

### Multiple primary presentations

Treat every `PPT-*` file as primary. Infer its relationship and teaching order only from directory structure, filenames, numbering, titles, and content. Preserve established order, distinct conceptual boundaries, and meaningful differences in scope or emphasis; consolidate overlap without repetition. Never choose one primary arbitrarily or merge distinct subtopics only because they share a directory. If order or relationships remain uncertain, report the ambiguity instead of inventing them.

## Supplementary material

Inspect supplementary material only as deeply as needed to determine what it demonstrates, which lesson concepts it applies, and what is educationally relevant. Do not reproduce an entire attachment or copy extracted directories into either knowledge base or public repository.

### Extracted archives and software projects

Inspect high-level structure and representative files first: README files, manifests, configuration, entry points, notebooks, spreadsheets, relevant source directories, and documentation. Ignore generated, dependency, cache, binary, IDE, and output directories unless explicitly relevant, including `node_modules`, `.venv`, `build`, `dist`, `target`, and `coverage`.

Normally summarize the archive's purpose and lesson relationship and record it as supplementary traceability. Include only educationally material excerpts, tables, formulas, or examples.

### Spreadsheets

Do not alter or reproduce an entire workbook by default. Inspect sheet names, table structure, headers, representative rows, relevant formulas and charts, and instructional sheets. Classify its role, such as dataset, exercise, worked example, calculation model, reference table, or supporting data. Preserve only representative material that explains a taught concept. For hands-on practice, summarize its purpose and retain traceability. Do not infer conclusions unsupported by the course.

## OCR, visuals, tables, and code

The PDFs are OCR-processed and searchable, but extracted text is not assumed complete.

- Normalize broken words, obvious character substitutions, spacing, line breaks, duplicated headers or footers, page numbers, branding, navigation artifacts, and OCR noise only when meaning is clear.
- Inspect educational diagrams, architecture figures, workflows, tables, screenshots, and other meaningful visuals.
- When practical, preserve an instructional visual under `<workspace-root>/knowledge-private/assets/` with a source-based name such as `PPT-Bases-de-datos-p12.png`, then link it relatively from Markdown.
- A textual explanation or Mermaid diagram may improve searchability but MUST NOT replace an original visual containing relevant information.
- Do not extract decoration, logos, repeated branding, or visuals without educational value.
- Preserve meaningful tables as Markdown tables when practical.
- Preserve relevant code semantics; do not modernize or improve the code.
- When formatting is ambiguous, preserve meaning over visual appearance.

## Language and writing style

Write the educational body in Spanish. Retain English technical terms used by the sources or established terminology; do not unnecessarily translate names of technologies, APIs, patterns, or standards.

Write the knowledge itself directly. Do not substitute source-description phrases such as “la presentación explica”, “la unidad trata”, “el documento adjunto contiene”, or “la lección introduce” when the actual content can be stated. Such wording is allowed only to express provenance, source role, conflict, or uncertainty.

Headings and body structure may adapt to the lesson's conceptual organization. Metadata and traceability MUST follow the exact contract below.

## Output location and hierarchy

Preserve the logical module and lesson hierarchy:

`<workspace-root>/knowledge-private/master-md/<module>/<lesson>/`

Every lesson MUST have its own directory. For one document, normally use `<module>/<lesson>/<lesson>.md`. For multiple documents, use clear, stable filenames reflecting conceptual order or scope. Never flatten a single-document lesson into the module directory.

## Output contract

Every generated Markdown MUST begin with YAML frontmatter containing exactly these six top-level properties in this order:

```yaml
---
title: "<document title>"
module: "<module name>"
lesson: "<lesson name>"
source_policy:
  primary:
    - "<primary source>"
  secondary:
    - "<secondary source>"
  attachments:
    - "<supplementary source>"
status: Draft
human_review: No
---
```

- `title` identifies the document; `module` and `lesson` identify the source hierarchy. `title` may equal `lesson`.
- Never invent metadata or sources.
- Include all three `source_policy` categories. Use `[]` for an empty category.
- `source_policy` MUST be structured YAML, never inline JSON or an inline object.
- New or regenerated documents use `status: Draft` and `human_review: No`, unless an explicitly authorized workflow supplies other values from the processing registry.
- Status fields are metadata only. Do not repeat draft, validation, or review notices in the educational body.

Every generated Markdown MUST end with exactly one `## Source traceability` section. Its table header MUST be exactly:

```markdown
## Source traceability

| Source | Type | Use |
| --- | --- | --- |
```

Add one row per traceable source; for example:

```markdown
| `PPT-example.pdf` | Primary | Estructura principal, conceptos y ejemplos de la unidad. |
```

Traceability rules:

- Use only `Primary`, `Secondary`, or `Attachment` in `Type`, mapped respectively from `primary`, `secondary`, and `attachments`.
- Keep `Use` concise and normally in Spanish.
- Every source in the table MUST exist in `source_policy`; every declared source that was used or meaningfully inspected MUST appear in the table.
- Do not replace the table with prose, lists, or a different layout.

## Existing output protection

Never silently overwrite Markdown or assets. If an intended output exists, stop before modifying it, identify the existing file and conflict, and request explicit approval to update or replace it. Apply the same rule to assets. Reuse an existing asset that clearly represents the same source visual. Never bypass a conflict with suffixes such as `-2`, `-new`, `-final`, or `-updated`.

## Validation

Before completion, verify all of the following:

- Output path preserves `<module>/<lesson>/`, with a dedicated lesson directory.
- Frontmatter has exactly the six required top-level properties in the required order.
- `source_policy` is structured YAML and includes all three categories.
- Metadata and sources were not invented.
- Exactly one final `## Source traceability` section uses the exact `Source | Type | Use` table.
- Frontmatter and table classifications agree.
- No operational status or human-review notice appears in the educational body.
- Educational content is self-contained and proportionate to the sources.
- Conflicts, material OCR uncertainty, and unsupported gaps were not silently resolved.

## Completion report and boundary

Treat every output as a draft pending human review. Report:

- output files;
- primary, secondary, and supplementary sources used;
- extracted assets;
- source conflicts and significant OCR uncertainty;
- included secondary-only concepts;
- important content not represented confidently.

This skill creates only private consolidated course knowledge. It MUST NOT create public documentation, ADRs, architecture decisions, requirements, TFM report sections, or AI-methodology records. If any appears warranted, report it as a documentation candidate under `AGENTS.md` and wait for approval. Prefer a reviewable result for the selected lesson over bulk generation; do not speculate about uninspected lessons.

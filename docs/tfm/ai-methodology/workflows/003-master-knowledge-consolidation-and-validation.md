# Master knowledge consolidation and validation

## Objective

The workflow transformed supplied Master's course material into a private, searchable, and traceable Markdown knowledge base for selective use during TFM work. Its scope includes support for requirements, architecture, security, testing, infrastructure, and methodology decisions when course knowledge is materially relevant.

The source material, consolidated documents, and preserved visual assets remain private. They are not loaded into every development task. Future agents first use the lightweight index to identify the smallest relevant subset, then open the underlying knowledge documents and verify attribution before using course material in project documentation or decisions.

## Source preparation

Lesson directories were inventoried before consolidation. Files were classified by their role rather than treated as an undifferentiated collection:

- `PPT-*` files were primary teaching material.
- Summaries, conclusions, and other explanatory documents were secondary sources.
- `ADJ-*` files were supplementary or practical attachments.
- Extracted archive directories were supplementary practical material, such as examples or projects.

Selectable and searchable PDFs were preserved where possible. OCR was used only when source text was not reliably available, avoiding unnecessary transformation of already usable documents. Archive contents were inspected selectively according to their relevance, while dependency, cache, build, and secret-bearing files were excluded unless their structure was necessary to establish the scope of a practical exercise.

## Source hierarchy and consolidation rules

The authority order was:

1. primary presentations;
2. secondary summaries or expansions;
3. supplementary attachments and extracted projects.

Primary material defined the teaching structure and central claims. Secondary material could add detail, examples, or conclusions, but could not silently replace the primary account. When sources disagreed, the discrepancy was retained as a caveat rather than corrected from external knowledge. Attachments and extracted projects were inspected only deeply enough to understand their supported practical role.

Consolidation did not introduce external subject knowledge. It preserved useful definitions, explanations, distinctions, procedures, examples, and other educational substance supported by the supplied sources. Meaningful visuals could be retained as private assets when they carried information that text alone would not preserve. Each output retained source provenance through structured metadata and a traceability table.

## Consolidation skill

A dedicated [consolidation skill](../../../../.agents/skills/consolidate-master-lesson/SKILL.md) was created because repeatable constraints were required across many heterogeneous lessons. Ad-hoc prompts alone did not provide a stable enough contract for source authority, depth, privacy, and output structure.

At a high level, the skill governs source classification, preservation of module and lesson hierarchy, consolidation rather than aggressive summarization, selective archive or project inspection, handling of meaningful visuals, protection of existing outputs, provenance, review state, and the final output-format contract. Reusable prompts supply execution scope; the skill supplies the consistent method.

## Controlled validation

The workflow was exercised on representative lessons before broad batch processing. The initial set included a relatively small database lesson, a large distributed-architecture lesson, and a cloud lesson with supplementary material.

These trials tested handling of multiple primary presentations, secondary-only expansions, visual extraction, archive or project inspection, source discrepancies, output hierarchy, and human review. They also showed that the method had to scale by source complexity rather than assume every lesson could be processed with the same batch size or inspection depth.

## Batch processing and durable state

Remaining lessons were processed incrementally with the [single-lesson prompt](../prompts/006-run-master-lesson-consolidation.md), the [batch prompt](../prompts/008-run-master-lessons-batch.md), and related reusable instructions. Lessons were handled sequentially within each run, and completed outputs were persisted before work continued.

The private `knowledge-private/processing/lessons-status.md` registry served as durable operational state. It recorded lesson identity, source counts, complexity, output counts, status, human-review state, and substantive notes. This made interrupted runs recoverable: existing outputs could be inspected and safely completed without generating duplicate or suffixed files, and completed lessons did not need to be regenerated. Practical batch size varied with lesson complexity and execution limits.

The [inventory prompt](../prompts/007-inventory-master-lessons.md) established processing scope, while the [path-normalization prompt](../prompts/005-normalize-workspace-paths.md) kept reusable instructions independent of one machine.

## Human review and detected inconsistency

Human review exposed inconsistent consolidation depth. Some generated Markdown documents were sufficiently self-contained and educational; others were thin or mainly described what the source files contained instead of incorporating the knowledge itself.

The central cause was an underspecified depth requirement in the initial consolidation contract. Variation between models and executions added another avoidable variable, but the evidence does not establish that one model was universally superior.

The corrected requirement was explicit: a consolidated document must contain the educational knowledge itself and be sufficiently self-contained for a reader to study the represented topic without reopening the source PDFs. Length alone is not a quality measure; coverage must be proportional to the substantive source material.

## Content audit and remediation

A read-only audit was recorded in the private `knowledge-private/processing/content-audit.md` file. It evaluated 196 Markdown documents and classified 138 as `GOOD`, 47 as `THIN`, 10 as `META-ONLY`, and 1 as `STRUCTURAL`. At lesson level, 25 lessons were marked for regeneration.

- `GOOD` meant useful, self-contained synthesis at an appropriate depth.
- `THIN` meant genuine educational content was present but meaningful source material was omitted.
- `META-ONLY` meant the document mostly described the sources instead of incorporating their educational substance.
- `STRUCTURAL` meant educational coverage was acceptable but a significant structure or traceability issue remained.

Remediation was selective. `GOOD` documents were preserved; only `THIN` and `META-ONLY` documents were regenerated after re-inspecting the original course sources. The audit supplied diagnostic guidance, never course knowledge. A lesson returned to `Draft / No` only after deficient documents had been regenerated, and it required human review again before becoming validated. Structural-only issues were corrected separately so acceptable educational content was not unnecessarily invalidated.

## Output contract and normalization

Human review also identified inconsistent metadata and traceability formats. The final contract requires exactly six top-level frontmatter fields, in this order:

- `title`
- `module`
- `lesson`
- `source_policy`
- `status`
- `human_review`

`source_policy` uses structured YAML for primary, secondary, and attachment sources. Every knowledge document ends with one `## Source traceability` section containing a `Source | Type | Use` table. Type values are standardized as `Primary`, `Secondary`, or `Attachment`. Educational prose normally remains in Spanish, while structural metadata and traceability labels are standardized.

During the final normalization pass, 196 Markdown documents were audited, 194 required normalization, and 623 source relationships were validated. This pass changed structure only: educational content and lesson validation states were preserved.

## Human validation

The private `knowledge-private/processing/lessons-status.md` file is the authoritative operational registry:

- `Draft / No` means the current lesson output awaits human validation.
- `Validated / Yes` means a human reviewed the lesson and considered it a faithful consolidation of the supplied sources.

`Validated` does not independently certify that every claim in the original course material is technically correct. It certifies faithful representation under the documented source hierarchy and consolidation rules.

The cleaned current registry contains 65 lessons, all marked `Validated / Yes`. The complete current knowledge base has therefore undergone human review and validation. Obsolete Notes text that still described human review as pending was removed, while source discrepancies, technical ambiguities, OCR uncertainty, archive-inspection limits, dated provider information, and other substantive caveats were retained.

## Lightweight knowledge index

The private `knowledge-private/master-index.md` file is a routing layer organized as module → lesson → document → topics → relative path. It covers 11 modules, 65 lessons, and 196 knowledge documents.

When course knowledge is relevant, future agents should:

1. consult the index;
2. identify the smallest relevant document set;
3. open only those documents;
4. verify course attribution against the actual knowledge document.

The index is not intended for every prompt, does not reproduce substantial educational content, and does not replace the underlying documents.

## Lessons learned

- Automated generation required human review to detect both content and structural defects.
- A source hierarchy prevented silent blending or overriding of material.
- Source discrepancies should be preserved rather than externally corrected during course consolidation.
- Durable operational state enabled safe interruption and resumption.
- Educational depth must be an explicit requirement, not an assumed property of consolidation.
- Output format must be a contract rather than a collection of examples.
- Content quality and format quality require separate validation passes.
- Selective remediation is preferable to regenerating material already judged acceptable.
- A lightweight routing index reduces context cost during later project work.

## Final result

The completed system comprises a private, human-validated Markdown knowledge base; private preserved visual assets; a processing and validation registry; a content-audit record; a lightweight navigation index; a reusable consolidation skill; reusable execution prompts; and public workflow documentation that exposes the method without exposing private course content.

Together, these artifacts support selective, traceable use of course knowledge during the TFM while keeping source material private and preserving the distinction between faithful course consolidation and independent technical verification.

## Traceability

- [Consolidation skill](../../../../.agents/skills/consolidate-master-lesson/SKILL.md)
- [Path-normalization prompt](../prompts/005-normalize-workspace-paths.md)
- [Single-lesson consolidation prompt](../prompts/006-run-master-lesson-consolidation.md)
- [Lesson inventory prompt](../prompts/007-inventory-master-lessons.md)
- [Batch consolidation prompt](../prompts/008-run-master-lessons-batch.md)
- [Workflow-documentation prompt](../prompts/009-document-master-knowledge-consolidation-workflow.md)
- [Consolidation skill design record](002-master-consolidation-skill-design.md)
- [This workflow record](003-master-knowledge-consolidation-and-validation.md)

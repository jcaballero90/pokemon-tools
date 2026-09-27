Document the completed end-to-end workflow used to build and validate the private Master's course knowledge base.

Read and follow:

<repo-root>/AGENTS.md

Relevant existing workflow documentation:

<repo-root>/docs/tfm/ai-methodology/workflows/001-agents-bootstrap.md
<repo-root>/docs/tfm/ai-methodology/workflows/002-master-consolidation-skill-design.md

Relevant prompts:

<repo-root>/docs/tfm/ai-methodology/prompts/

Relevant skill:

<repo-root>/.agents/skills/consolidate-master-lesson/SKILL.md

Private operational evidence:

<workspace-root>/knowledge-private/processing/lessons-status.md
<workspace-root>/knowledge-private/processing/content-audit.md
<workspace-root>/knowledge-private/master-index.md

Private knowledge base:

<workspace-root>/knowledge-private/master-md/

Create or replace:

<repo-root>/docs/tfm/ai-methodology/workflows/003-master-knowledge-consolidation-and-validation.md

The existing workflow file may be replaced because this execution explicitly corrects its language consistency and final-state accuracy.

## Objective

Document the methodology actually used to transform the Master's course material into a validated private Markdown knowledge base suitable for selective use during the TFM.

Before documenting the final workflow state, normalize the processing registry so that obsolete review-status notes do not contradict the current validated state.

Focus on:

- process;
- decisions;
- human oversight;
- problems detected;
- corrective actions;
- final validated result.

Do not produce:

- a lesson inventory;
- a batch execution log;
- a reproduction of prompts or the skill;
- a model benchmark;
- a chronology of every run.

## Privacy and evidence rules

This workflow document is public project documentation.

Do not reproduce:

- private course text;
- source excerpts;
- educational content;
- private assets;
- copyrighted material.

It is acceptable to describe:

- source categories;
- methodology;
- validation approach;
- aggregate counts;
- processing decisions;
- issues detected;
- remediation;
- final knowledge-base structure.

Use logical paths only.

Do not use machine-specific paths.

Do not invent facts.

If a count or historical detail cannot be verified from the available evidence, omit it or phrase it cautiously.

## Processing registry cleanup

Before creating or updating the workflow document, inspect:

<workspace-root>/knowledge-private/processing/lessons-status.md

The current validation state is authoritative.

Verify that all lessons are currently:

- Status: `Validated`
- Human review: `Yes`

If this is not true, do not claim that the knowledge base is fully validated. Report the inconsistency instead.

If all lessons are `Validated / Yes`, clean only obsolete wording in the `Notes` column that incorrectly implies human validation is still pending.

Examples of obsolete wording include:

- "pendiente de revisión humana"
- "requiere nueva revisión humana"
- "pending human review"
- equivalent statements whose only purpose was to indicate that validation had not yet happened.

Preserve substantive notes, including:

- source discrepancies;
- technical ambiguities;
- OCR uncertainty;
- unusual source structure;
- selectively inspected projects or archives;
- dated provider information;
- examples that require interpretation;
- any other meaningful caveat.

If a note contains both substantive information and obsolete review wording, remove only the obsolete review wording and preserve the substantive information.

Do not remove a caveat merely because the lesson is validated.

Do not change:

- source counts;
- complexity;
- outputs;
- lesson identity;
- Status;
- Human review.

After cleanup, verify that the registry no longer contains notes claiming that human validation is pending when the corresponding lesson is already `Validated / Yes`.

## Required structure

# Master knowledge consolidation and validation

## Objective

Explain that the goal was to create a private, searchable, traceable Markdown knowledge base that can support later TFM work such as:

- requirements;
- architecture;
- security;
- testing;
- infrastructure;
- methodology.

Clarify that the original and consolidated course material remain private and are consulted selectively rather than loaded into every development task.

## Source preparation

Describe the preprocessing and source classification:

- `PPT-*`: primary teaching material;
- secondary summaries/conclusions;
- `ADJ-*`: supplementary/practical attachments;
- extracted archive directories: supplementary practical material.

Mention that selectable/searchable PDFs were preserved where possible and OCR was used only where needed.

Keep this methodological; do not reproduce OCR commands unless materially relevant.

## Source hierarchy and consolidation rules

Explain the authority hierarchy:

1. primary presentations;
2. secondary summaries/expansions;
3. supplementary attachments and extracted projects.

Describe that:

- primary material defines the main teaching structure;
- secondary material may expand but does not silently override primary material;
- discrepancies are preserved instead of externally corrected;
- supplementary projects are inspected selectively;
- no external knowledge is added during course consolidation;
- meaningful visuals may be preserved as private assets;
- source provenance is retained.

## Consolidation skill

Explain why a dedicated skill was created instead of relying on ad-hoc prompts.

Reference:

`<repo-root>/.agents/skills/consolidate-master-lesson/SKILL.md`

Describe its responsibilities at a high level:

- source classification;
- lesson hierarchy preservation;
- consolidation rather than aggressive summarization;
- archive/project inspection;
- visual handling;
- output protection;
- provenance;
- review state;
- output-format contract.

## Controlled validation

Describe that the workflow was tested first on representative lessons before bulk processing.

Use only a few examples, such as:

- a relatively small database lesson;
- a large distributed-architecture lesson;
- a cloud lesson with supplementary material.

Explain that these tests validated:

- multiple primary presentations;
- secondary-only expansions;
- visual extraction;
- archive/project inspection;
- source discrepancies;
- output hierarchy;
- human review.

Do not reproduce their educational content.

## Batch processing and durable state

Explain that the remaining lessons were processed incrementally using reusable prompts and:

`<workspace-root>/knowledge-private/processing/lessons-status.md`

Describe that:

- lessons were processed sequentially;
- completed outputs were persisted before continuing;
- the registry acted as durable operational state;
- interrupted runs could resume safely;
- already completed lessons did not need to be regenerated;
- practical batch size varied with lesson complexity and execution limits.

Reference reusable prompt files when relevant, but do not reproduce their contents.

## Human review and detected inconsistency

Explain that human review exposed inconsistent consolidation depth across generated documents.

Some Markdown documents were sufficiently self-contained and educational, while others were too thin or primarily described what the source files contained.

Record the main lesson learned:

The required educational depth had not initially been constrained strongly enough in the consolidation contract.

Changing models/executions also introduced an avoidable variable, but do not claim that one model was universally superior.

Explain the corrected requirement:

A consolidated Markdown document must contain the educational knowledge itself and be sufficiently self-contained to study the represented topic without reopening the original PDFs.

## Content audit and remediation

Describe the read-only audit recorded in:

`<workspace-root>/knowledge-private/processing/content-audit.md`

If verified from the file, include:

- 196 Markdown documents audited;
- 138 GOOD;
- 47 THIN;
- 10 META-ONLY;
- 1 STRUCTURAL;
- 25 lessons marked for regeneration.

Briefly define:

- `GOOD`;
- `THIN`;
- `META-ONLY`;
- `STRUCTURAL`.

Describe the remediation strategy:

- preserve GOOD documents;
- regenerate only THIN and META-ONLY documents;
- re-inspect original course sources;
- use the audit only as diagnostic guidance, never as course knowledge;
- return a lesson to `Draft / No` only after its deficient documents were successfully regenerated;
- perform human review again after remediation;
- fix structural-only issues separately without unnecessarily invalidating educational content.

## Output contract and normalization

Explain that human review also revealed inconsistent metadata and traceability formatting.

Describe the final output contract:

Frontmatter contains exactly:

- `title`
- `module`
- `lesson`
- `source_policy`
- `status`
- `human_review`

`source_policy` uses structured YAML.

Every knowledge Markdown ends with:

`## Source traceability`

using:

`Source | Type | Use`

with source types:

- Primary
- Secondary
- Attachment

Explain that educational content remains normally in Spanish while structural metadata and traceability labels are standardized.

Describe the final normalization pass.

If verified from available evidence, include:

- 196 Markdown documents audited;
- 194 normalized;
- 623 source relationships validated.

State that educational content and validation states were preserved during this normalization.

## Human validation

Explain that:

`<workspace-root>/knowledge-private/processing/lessons-status.md`

is the authoritative operational registry.

Define:

- `Draft / No`: awaiting human validation;
- `Validated / Yes`: human-reviewed and considered a faithful consolidation of the supplied sources.

Clarify that `Validated` means faithful representation of the source material, not independent verification that every original course claim is technically correct.

Verify the final state from the cleaned current registry before describing it.

If all lessons are `Validated / Yes`, state that the complete knowledge base has been human reviewed and validated.

Do not describe any validation work as pending unless the current registry actually contains a pending state.

## Lightweight knowledge index

Describe:

`<workspace-root>/knowledge-private/master-index.md`

Explain that it acts as a routing layer:

module → lesson → document → topics → relative path.

Its purpose is to let future agents:

1. consult the index when course knowledge is materially relevant;
2. identify a small subset of documents;
3. open only those documents;
4. verify course attribution against the actual knowledge document.

Clarify that the index is not intended to be consulted on every prompt and does not replace the underlying knowledge documents.

## Lessons learned

Summarize the main methodological lessons grounded in this workflow:

- automated generation required human review;
- source hierarchy prevented silent blending of material;
- discrepancies should be preserved rather than externally corrected during course consolidation;
- durable operational state enabled safe interruption and resume;
- output depth must be specified explicitly;
- output format must be defined as a contract, not only through examples;
- content quality and format quality require separate validation;
- selective remediation is preferable to regenerating acceptable material;
- a lightweight routing index reduces future context cost.

## Final result

Summarize the completed system:

- private validated Markdown knowledge base;
- private visual assets;
- processing/validation registry;
- content-audit record;
- lightweight navigation index;
- reusable consolidation skill;
- reusable prompts;
- public workflow documentation without exposing private course content.

## Traceability

End with a concise repository-relative traceability section linking to the main artifacts used to define and execute this workflow, including:

- consolidation skill;
- relevant reusable prompts;
- previous workflow design record;
- this workflow record.

Do not link public documentation directly to private copyrighted course files.

## Writing style

Write the complete workflow document in concise technical English.

Headings, prose, labels, and explanatory text must all use English consistently.

Do not mix English headings with Spanish body text.

Keep original repository artifact names and literal identifiers unchanged when applicable.

Prefer process and decisions over chronology.

Target approximately 2–4 Markdown pages.

Avoid repeating information already explained in another section.

Do not create any other documentation files.

The only files this task may modify are:

- <workspace-root>/knowledge-private/processing/lessons-status.md
- <repo-root>/docs/tfm/ai-methodology/workflows/003-master-knowledge-consolidation-and-validation.md

At the end, report:

- whether all lessons were verified as `Validated / Yes`;
- number of obsolete review-status notes cleaned from the registry;
- workflow file created or replaced;
- any factual point that could not be verified confidently.

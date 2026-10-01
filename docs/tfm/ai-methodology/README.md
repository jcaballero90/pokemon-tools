# AI-assisted development methodology

**Purpose:** explain how AI work is governed and where its reviewable evidence lives for Pokémon Tools. This page is a navigation and synthesis of existing records, not a new execution log or a final TFM report. Its claims are limited to the [project rules](../../../AGENTS.md), the linked prompts and workflows, and the current public project artifacts. Writing this overview was owner-authorized; that authorization is not itself a human content-validation result.

## Roles and decision authority

The project rules describe a normal sequence: discuss and refine a task in ChatGPT Assistant, transfer a final prompt to Codex for workspace-aware execution, then have the human developer inspect and accept, correct, or reject the result. A workflow record must describe what **actually happened** when it differs from this sequence. Saved prompt files show instructions supplied to an agent; they do not alone prove that the expected output was produced or reviewed. The [recording skill](../../../.agents/skills/record-ai-workflow/SKILL.md) therefore asks for inputs, outputs, validation, human feedback, and limitations rather than a transcript of every exchange.

| Role | Project responsibility |
| --- | --- |
| Human developer | Defines product scope, weighs alternatives, approves consequential decisions, reviews AI output, and remains responsible for the submitted result. |
| ChatGPT Assistant | Helps structure problems and refine prompts when that step is used and recorded. |
| Codex | Inspects the workspace, changes files, runs available checks, and reports evidence and limitations. |

The [global rules](../../../AGENTS.md) name a usual prompt-design model, while execution models may vary. This overview does not infer a model, reasoning level, or prompt origin for unrecorded work. The first two workflow records state their own model details; later records should be read on their own terms.

## Course knowledge and public project decisions

The original course material and consolidated lesson content remain outside the public repository. The [knowledge consolidation workflow](workflows/003-master-knowledge-consolidation-and-validation.md) documents source classification, controlled trials, content audit, selective remediation, format normalization, and human validation without copying the private source text. The private `knowledge-private/master-index.md` routes a future task to the smallest relevant set of validated lesson documents. A validated consolidation means the material was reviewed as a faithful representation of its sources; it is not independent proof that every source claim remains technically current.

For substantive project documentation or an important decision, the method is to consult that index, inspect the relevant validated lesson, then distinguish five things in the public result: what the course supports, current external facts where needed, the owner's approved requirements, the actual repository evidence, and any AI inference. Course examples never silently become product requirements. Private course files, screenshots, and substantial copied text do not enter this repository. These boundaries are codified in [AGENTS.md](../../../AGENTS.md) and the [consolidation skill](../../../.agents/skills/consolidate-master-lesson/SKILL.md).

The validated course lessons **Introducción → IA en el proceso de desarrollo → Filosofía de uso de IA en desarrollo** and **Uso responsable durante el desarrollo** support human control, critical validation, and responsibility for AI-assisted output. **Herramientas → Codex** also emphasizes review of repository-level changes. These are course principles, not evidence that a particular Pokémon Tools change was tested or accepted. The project-specific roles, files, and approval process come from the owner and [AGENTS.md](../../../AGENTS.md).

## Recorded preparation workflows

| Record | Main input and output | Evidence and review boundary |
| --- | --- | --- |
| [001 — AGENTS.md bootstrap](workflows/001-agents-bootstrap.md) | [Final prompt](prompts/001-create-agents.md) → [global rules](../../../AGENTS.md). | Records human review, a repository-security refinement, and acceptance for the preparation phase. |
| [002 — consolidation skill design](workflows/002-master-consolidation-skill-design.md) | [Creation prompt](prompts/003-create-master-consolidation-skill.md) → [one-lesson skill](../../../.agents/skills/consolidate-master-lesson/SKILL.md). | Records review and refinements to protect existing outputs and handle extracted projects. Its “ready for first test” statement describes that historical stage; the later [validation workflow](workflows/003-master-knowledge-consolidation-and-validation.md) records subsequent use. |
| [003 — knowledge consolidation and validation](workflows/003-master-knowledge-consolidation-and-validation.md) | [Inventory](prompts/007-inventory-master-lessons.md), [single-lesson](prompts/006-run-master-lesson-consolidation.md), and [batch](prompts/008-run-master-lessons-batch.md) instructions → private knowledge base, audit, registry, and index. | Records the initial depth problem, corrective audit and selective regeneration, format normalization, and final human-reviewed state. Private operational files remain outside the public repo. |
| [004 — documentation skills](workflows/004-documentation-skills-design-and-validation.md) | Owner-approved skill plan and [AGENTS.md](../../../AGENTS.md) → focused skills for requirements, architecture, ADRs, security, testing, infrastructure, delivery readiness, and workflow recording. | Explicitly says no separate saved execution prompt exists; records individual owner review and read-only skill checks, not successful future use of every skill. |
| [005 — project documentation pass](workflows/005-project-documentation-pass.md) | Owner-approved documentation audit → requirements, architecture, security, test, infrastructure, API, and methodology records. | Records the documentation pass as it stood before host deployment; later status changes belong in living docs and later workflow records. |
| [006 — staging and production rollout](workflows/006-staging-production-rollout.md) | Host preparation, GitHub environment setup, staging and production workflows → reported live public boilerplate. | Captures repository workflow behavior and owner-reported results; does not invent run IDs or claim untested security/product behavior. |

The [prompt archive](prompts/) contains reusable or final instructions from the preparation work. A prompt's filename and content should not be mistaken for an implementation log. Workflow 005 records the earlier documentation pass; workflow 006 records the subsequent staging-to-production rollout. When a future task materially changes a decision or methodology, update an existing workflow record if it continues the same workflow or create one new record under [workflows](workflows/) after approval. Routine chat and minor corrections do not each need a record.

## How the project documentation uses this method

The current public documents serve different evidence roles:

| Artifact | What it establishes |
| --- | --- |
| [Requirements](../../requirements/requirements.md) | Owner-approved scope, acceptance conditions, and implementation or verification state. |
| [Architecture map](../../architecture/architecture.md) and [ADRs](../../adr/) | Current component relationships and the accepted rationale, alternatives, and consequences of major decisions. |
| [Data sources](../../data-sources.md), [API contracts](../../api-contracts.md), and [security plan](../../security/security-plan.md) | Source authority, observed interface behavior and gaps, and risks with controls or open decisions. |
| [Test strategy](../../testing/test-strategy.md) | Which checks have run, what remains unverified, and how each accepted requirement can be demonstrated. |
| [Infrastructure plan](../../infrastructure/infrastructure-plan.md) and [operations guide](../../operations.md) | Approved deployment topology, release gates, host procedure, and current rollout status. |

These artifacts were written after the initial application construction and reviewed against the repository during a separate documentation pass. They are useful outcome and decision records, but the six workflow files above do **not** constitute a complete AI execution history for that initial build or every later document. Do not infer missing prompts, model settings, test results, or human content approvals from their existence. Further review and corrections should be recorded in the relevant living document or a significant workflow record when there is concrete evidence.

## Validation and present limits

AI output is checked against the task's risk: source attribution and local links for documentation, code/tests for behavior, and host or off-host exercises for ingress and recovery. A saved workflow may establish that a prompt and artifact exist, while a passing automated check establishes only the behavior it exercised. An accepted ADR records a decision, not proof of its deployed operation. The [requirements](../../requirements/requirements.md), [test strategy](../../testing/test-strategy.md), and [operations guide](../../operations.md) keep these distinctions visible.

The validated *Proyecto Final* course brief calls for a working original project and specific delivery materials; it does not prescribe an AI-methodology chapter or a thesis outline. This overview is supporting evidence for the owner's account of how the work was developed. The [staging and production rollout record](workflows/006-staging-production-rollout.md) captures the deployment sequence and known limits. Submission links and final test access remain separate tasks.

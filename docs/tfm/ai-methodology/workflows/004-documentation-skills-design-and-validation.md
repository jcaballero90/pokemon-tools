# Documentation skills: design and validation

> Status: Validated — human review completed.

## Purpose

This workflow established focused, discoverable skills for the project's documentation areas. Each skill guides future work without creating project requirements, choosing an implementation stack, or treating course examples as pokemon-tools decisions. This record captures the approved design rationale and observed validation, not a transcript of the design conversation.

## Inputs and knowledge routing

The starting input was the project owner's approved eight-skill plan, refined through review of each proposed skill in this task. There is no separate saved execution prompt for this effort. [AGENTS.md](../../../../AGENTS.md) supplies the shared privacy, source-attribution, documentation-approval, and human-review rules.

For substantive choices, the private master index was used to locate only relevant validated knowledge documents. The routes included *Ingeniería del software → Análisis de requisitos*; *Arquitectura del software → Introducción a la arquitectura de software*; *Calidad → Documentación con IA*, *Testing*, and *Métricas, coverage y complejidad*; *Seguridad → Introducción al desarrollo seguro* and *Metodologías de desarrollo seguro*; *Infraestructura y cloud → Cloud computing*, *Contenerización*, and *DevOps y CICD*; *Proyecto Final → Proyecto Final*; and *Introducción → IA en el proceso de desarrollo* with *Herramientas → Codex*. These lessons informed the skill methods; their examples did not become product requirements or technology decisions. No private course text or source files were copied into the public skill or workflow documents.

## Workflow and decisions

1. The shared [AGENTS.md](../../../../AGENTS.md) guidance was refined to route substantive documentation and important decisions through the private index before the relevant validated documents. Routine coding need not load the knowledge base. Materially preferable external approaches must be discussed before being recorded as project decisions.
2. The existing [lesson-consolidation skill](../../../../.agents/skills/consolidate-master-lesson/SKILL.md) was placed under `.agents/skills/` without changing its consolidation purpose. The eight new skills were then reviewed, created, and tested one at a time rather than generated as an unreviewed batch.
3. Scope boundaries were made explicit: living overview documents describe the current project state; ADRs retain the rationale and lifecycle of consequential decisions; AI workflow records retain method and validation evidence. Candidate documentation is proposed before a new file is created unless the task already requests it.
4. The project owner chose one living requirements specification with stable `REQ-001` identifiers and a linked index containing each tracked field once. Security, testing, and infrastructure likewise start with one living plan or strategy document, while the TFM-deliverables skill creates no parallel checklist by default.
5. The project owner plans to version the project after its structure is defined. Git history, once available, will preserve exact revisions; ADRs preserve major decision rationale. No per-edit changelog, Git repository, or remote was created during this workflow.
6. For TFM delivery, generated project files use literal `<user>` and `<password>` placeholders, with final test access handled manually by the owner. The owner-reported email deadline of 2026-10-26 is kept distinct from the older date in the validated *Proyecto Final* document and must be reconfirmed before submission.

## Resulting skills

| Skill | Responsibility and boundary |
| --- | --- |
| [specify-requirements](../../../../.agents/skills/specify-requirements/SKILL.md) | Elicit and maintain accepted requirements; do not turn course exercises into product scope. |
| [design-architecture](../../../../.agents/skills/design-architecture/SKILL.md) | Maintain the current system overview; route consequential rationale to ADRs. |
| [record-adr](../../../../.agents/skills/record-adr/SKILL.md) | Preserve one significant decision per stable numbered record, including alternatives and consequences. |
| [plan-security](../../../../.agents/skills/plan-security/SKILL.md) | Maintain one risk-and-control plan grounded in actual project scope. |
| [plan-testing](../../../../.agents/skills/plan-testing/SKILL.md) | Trace planned checks to accepted requirements without imposing tools or arbitrary coverage targets. |
| [plan-infrastructure](../../../../.agents/skills/plan-infrastructure/SKILL.md) | Document approved or observed operational choices without prematurely selecting a provider or platform. |
| [prepare-tfm-deliverables](../../../../.agents/skills/prepare-tfm-deliverables/SKILL.md) | Check delivery readiness against the validated brief without inventing a thesis structure or publishing artifacts. |
| [record-ai-workflow](../../../../.agents/skills/record-ai-workflow/SKILL.md) | Record significant AI-assisted work and its validation without duplicating transcripts or CI/CD workflows. |

## Validation and current limits

Each new skill was checked for its required frontmatter, discriminating scope, source routing, and local discovery when Codex runs from the `pokemon-tools` directory. Read-only example sessions exercised the intended boundaries: provisional requirements and architecture, ADR acceptance, security planning, requirement-traceable testing, infrastructure selection, TFM submission readiness, and evidence-based AI workflow recording. Those examples do not prove performance on future real project tasks.

No requirements, architecture, ADR, security, testing, or infrastructure project document was created during skill design. No framework, database, provider, Git repository, remote, or application code was initialized. The saved Codex desktop project still points to the parent workspace rather than `pokemon-tools`; automatic discovery in that saved-project context remains to be confirmed. Discovery from the `pokemon-tools` working directory was verified.

## Human review

The project owner reviewed and approved the content of the eight skills individually and validated this workflow record after requesting removal of incidental validation-tool details.

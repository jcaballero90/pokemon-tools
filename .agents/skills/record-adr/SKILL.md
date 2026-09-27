---
name: record-adr
description: Draft and maintain ADRs for consequential pokemon-tools technical decisions in docs/adr. Use for decision rationale and lifecycle, not general architecture overviews or routine changes.
---

# Record pokemon-tools architecture decisions

Follow `<repo-root>/AGENTS.md`.

## Decide whether an ADR is warranted

Use an ADR for a consequential project choice whose context, alternatives, and trade-offs will matter later, such as a significant architecture, data, security, testing, infrastructure, or API decision. Do not create one for a routine implementation detail or for every component. If documentation was not requested, propose the ADR as a candidate and obtain approval before creating a file.

Read relevant accepted requirements, the current architecture overview, existing ADRs, and available project evidence. Consult `<workspace-root>/knowledge-private/master-index.md` first, then *Calidad → Documentación con IA → ADRs* (`01-adrs.md`) and only the domain documents relevant to this decision. Course examples are not pokemon-tools decisions. If the knowledge base is unavailable, say so and do not make unsupported course attributions.

## Discuss the decision

State the problem, constraints, plausible alternatives, evidence, and material trade-offs. Distinguish facts about the project, course guidance, external information, and interpretation. Do not invent benchmarks, requirements, or consensus. Discuss a materially preferable external approach with the user before recording it as the project decision.

The user decides whether to accept a proposal. A draft may remain **Proposed** while its choice or evidence is unsettled; mark it **Accepted** only after explicit human agreement. Do not implement the decision or select technology merely by writing an ADR.

## Maintain the record

Create one Markdown file per approved ADR documentation task under `<repo-root>/docs/adr/`, named `ADR-001-short-title.md`, `ADR-002-short-title.md`, and so on. Start at 001, then use one higher than the highest assigned number; never fill gaps, renumber, or reuse an identifier. The filename convention is a project navigation choice, not a course requirement.

Keep the record concise and focused on *why*. Include a title, date, one status, context and constraints, plausible alternatives, decision and justification (or the open choice if Proposed), consequences including downsides, and references to available requirements, evidence, and existing documents. When course knowledge materially informs the record, identify the relevant validated document by module, lesson, and title without copying private material or machine-specific paths into the public repository. Use **Proposed**, **Accepted**, **Deprecated**, or **Superseded** as the status. Do not present an undecided choice as accepted.

Keep `<repo-root>/docs/architecture/architecture.md` as the living map of the system. An accepted ADR explains a consequential choice; the architecture overview can link to it without repeating its alternatives and rationale. Do not create or expand the overview through this skill unless the requested change requires keeping an existing overview consistent.

When a decision changes, preserve the old ADR and its rationale. With approval, mark it Deprecated or Superseded as appropriate, create a new ADR for the replacement decision, and cross-link the records. Do not silently rewrite history or treat a later proposal as accepted.

## Check the result

Verify that the ID is unique and stable, the status reflects human agreement, alternatives and consequences are supported by evidence, links resolve, and course guidance is distinguished from the pokemon-tools decision. Report unresolved questions and any related documentation updates as candidates rather than creating extra files automatically.

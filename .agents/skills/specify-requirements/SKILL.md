---
name: specify-requirements
description: Elicit, agree, and maintain pokemon-tools product requirements in docs/requirements/requirements.md. Use for requirements work, not architecture decisions or private course consolidation.
---

# Specify pokemon-tools requirements

Follow `<repo-root>/AGENTS.md`. Treat the user as the current project decision owner; do not invent other stakeholders or their approval.

## Ground the discussion

Read the existing requirements document before proposing changes. For substantive requirements work, consult `<workspace-root>/knowledge-private/master-index.md` first, then only the relevant validated documents on requirements analysis and, when useful, Spec Driven Development. Course examples illustrate methods; they are not pokemon-tools features.

If the knowledge base is unavailable, tell the user and ask how to proceed before making course-backed claims. Identify materially different external approaches as external and discuss their trade-offs before recording a decision.

## Elicit and agree

Discuss intended users, the problem, base functionality, scope boundaries, constraints, and additions with the user. Clarify ambiguous needs and propose observable checks. Distinguish a need from a proposed implementation.

Present candidate requirements and assumptions for review. Accept a requirement only after the user explicitly agrees to it. Keep unapproved ideas, unresolved scope, and missing measurable targets under **Open questions**, outside the accepted-requirements index. Do not promote a course exercise or an earlier example into a project requirement.

## Maintain the specification

Use one living file: `<repo-root>/docs/requirements/requirements.md`. Create or update it only when the user has requested requirements documentation or approved the change. Default to English unless the user requests another language.

At the start of the file, keep a table containing every accepted requirement. Use columns **ID**, **Title**, **Type**, **Priority**, and **Implementation**. Link each ID to a detail heading containing only its stable identifier, such as `### REQ-001`. Put the title, type, priority, and implementation state only in the table; do not repeat their values in the detail section. This table is the single source for those fields.

Assign stable, sequential `REQ-001`-style identifiers; never renumber or reuse an identifier. In each detail section, record a clear requirement statement, the origin of the project decision (including user approval), and an observable acceptance or verification criterion. Use **Functional**, **Nonfunctional**, or **Constraint** as the project type convention. Represent business, user, data, and integration needs within the relevant requirement rather than losing them to this three-type convention. Record a priority only when the user has decided it; otherwise use **Undecided** in the table. Do not specify a technology as a requirement unless the user has accepted it as a constraint.

Use **Not started**, **In progress**, **Implemented**, or **Verified** for Implementation. Base progress changes on evidence, not assumption. **Implemented** means the work exists but its acceptance criterion is not yet confirmed; **Verified** requires evidence that the criterion is met. Requirement approval and implementation progress are separate. If a separate task tracker later becomes authoritative, discuss how to avoid competing status records.

Discuss material changes to an accepted requirement before editing it. Preserve its identifier and make the change understandable. Link to existing architecture, ADR, or testing documents when useful; do not create those documents through this skill. If course knowledge materially influenced an entry, cite the relevant consolidated document concisely and distinguish that guidance from the project decision.

## Check the result

Verify that the table links to every accepted requirement exactly once, identifiers remain stable, each tracked field has one authoritative value, statements are unambiguous, criteria are checkable, and open questions are not presented as decisions. Report what was accepted, what remains unresolved, and any proposed architecture or ADR documentation as candidates rather than creating extra files.

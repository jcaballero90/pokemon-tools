---
name: design-architecture
description: Analyze and document pokemon-tools architecture under docs/architecture. Use for system structure, boundaries, and interactions; route significant decision rationale to ADRs.
---

# Design pokemon-tools architecture

Follow `<repo-root>/AGENTS.md`.

## Establish context

Read accepted requirements, existing architecture and ADR documents, and relevant implementation or configuration. Consult the private master index first, then only the validated architecture knowledge documents relevant to the question. Course examples and styles are not approved pokemon-tools decisions.

If requirements are unresolved, identify the missing inputs and keep architecture options provisional. Distinguish deployment topology, internal boundaries, and communication patterns rather than treating them as one mutually exclusive choice.

## Analyze options

Map proposed responsibilities, interfaces, data flows, and operational needs to actual requirements and constraints. Compare only plausible options, including their simplicity, testability, maintenance, operational cost, and ability to evolve. State assumptions and uncertainty; do not select a framework, database, architecture style, or infrastructure because it appeared in a lesson.

Discuss consequential choices and trade-offs with the user before treating them as accepted. Do not initialize technology or application code through this skill.

## Maintain the architecture overview

When architecture documentation is requested or approved, use `<repo-root>/docs/architecture/architecture.md` as the initial living overview. Describe the approved or observed system structure, relevant requirement links, component responsibilities, interfaces and flows, and material constraints. Clearly label anything still proposed or unknown. Add a diagram only when it clarifies a relationship and keep it consistent with the text.

Keep the overview focused on what the system is and how its parts relate. Put the reasoning and alternatives for a consequential choice in an ADR; link to an accepted ADR when one exists. Propose an ADR as a documentation candidate rather than creating it through this skill. Do not create additional architecture files without approval.

## Check the result

Verify that described components and constraints are supported by accepted requirements, observed implementation, or accepted decisions; links resolve; proposed and approved states are distinct; and diagrams agree with the prose. Report unresolved choices and documentation candidates.

---
name: plan-security
description: Plan and maintain pokemon-tools security risks and controls in docs/security/security-plan.md. Use for project security documentation, not vulnerability scans or implementation.
---

# Plan pokemon-tools security

Follow `<repo-root>/AGENTS.md`.

## Establish context

Read accepted requirements, the current architecture and ADRs, and relevant implementation or configuration. Consult `<workspace-root>/knowledge-private/master-index.md` first, then only the validated security and quality documents relevant to the project's actual scope. Course examples are not approved pokemon-tools requirements or controls.

## Identify concerns and controls

Discuss the data and assets to protect, users and permissions, entry points, trust boundaries, and plausible misuse or failure scenarios. If the design is not settled, label assumptions and open questions; do not invent an attack surface or apply every OWASP category by default.

For each material concern, propose a proportionate control, its rationale and trade-offs, and a way to verify it. Distinguish proposed controls from agreed decisions, and observed implementation from planned checks. Do not maintain a second implementation-status tracker when the requirements document is authoritative. Discuss consequential security choices with the user and propose an ADR candidate when appropriate; do not create the ADR through this skill.

## Maintain the security plan

When security documentation is requested or approved, create or update one living file: `<repo-root>/docs/security/security-plan.md`. Cover the known scope and assumptions, relevant risks and controls, verification evidence or planned checks, residual risks, open questions, and useful links to requirements, architecture, ADRs, and testing documentation.

If course knowledge materially informs a control, identify the validated document by module, lesson, and title; distinguish that guidance from the project decision. Do not copy private course material or expose secrets in the public repository. Keep detailed test cases and operational configuration in their respective documentation areas. Do not create additional security files without approval.

Update the living plan in place rather than creating version-suffixed copies. Preserve the rationale for consequential changes in ADRs, and use Git history for exact revisions once the project is versioned; do not create a parallel changelog through this skill. Until then, report substantive edits in the task handoff. Do not initialize Git or configure a remote through this skill.

This skill does not select technology, implement controls, or run a security scan unless separately requested.

## Check the result

Verify that risks reflect the known system, controls address identified risks, decisions and evidence are not overstated, links resolve, and unresolved issues remain visible.

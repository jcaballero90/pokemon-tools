---
name: plan-infrastructure
description: Plan pokemon-tools deployment and operations in docs/infrastructure when justified by project scope. Use for infrastructure documentation, not application architecture or provisioning.
---

# Plan pokemon-tools infrastructure

Follow `<repo-root>/AGENTS.md`.

## Establish context

Read accepted requirements, architecture, ADRs, relevant security and testing plans, and any actual configuration. Consult `<workspace-root>/knowledge-private/master-index.md` first, then only relevant validated infrastructure lessons. Course examples do not select a provider, container platform, CI/CD service, or database for pokemon-tools.

## Evaluate operational needs

Discuss environments, deployment and delivery, configuration and secrets, data operations, observability, recovery, and cost only where relevant to the project. Compare plausible options against requirements, maintainability, security, effort, and TFM scope. Keep undecided choices and assumptions explicitly provisional.

Verify current provider capabilities, prices, or service limits against current authoritative sources before relying on them; identify these as external information rather than course guidance. Discuss consequential choices with the user and propose an ADR candidate when appropriate.

## Maintain the infrastructure plan

When infrastructure documentation is requested or approved, create or update one living file: `<repo-root>/docs/infrastructure/infrastructure-plan.md`. Describe only approved or observed topology and operational choices; keep proposals and open questions separate. Link to requirements, architecture, ADRs, security, and testing instead of duplicating their decisions or status.

Do not create extra infrastructure documents or configuration, provision services, install tools, initialize Git, or configure a remote through this skill unless separately requested.

## Check the result

Verify that described infrastructure is supported by project evidence or an accepted decision, time-sensitive claims are current, no secrets are exposed, links resolve, and unresolved operational risks remain visible.

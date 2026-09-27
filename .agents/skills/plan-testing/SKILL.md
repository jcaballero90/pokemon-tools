---
name: plan-testing
description: Plan pokemon-tools testing in docs/testing and trace checks to accepted requirements. Use for test strategy, not implementing tests or selecting a framework.
---

# Plan pokemon-tools testing

Follow `<repo-root>/AGENTS.md`.

## Establish context

Read accepted requirements and their verification criteria, relevant architecture, ADRs and security documentation, and any existing tests or configuration. Consult `<workspace-root>/knowledge-private/master-index.md` first, then only relevant validated documents on testing, requirements verification, and quality metrics. Course examples, tools, and coverage percentages are not automatically project targets.

## Define the strategy

Identify critical behaviors and risks with the user. Choose appropriate unit, integration, end-to-end, manual validation, or nonfunctional checks according to what the project actually needs. Distinguish verification of acceptance criteria from validation that the product solves the intended problem.

Trace each accepted requirement to suitable checks, or mark its verification gap. Keep checks for unapproved requirements provisional. If a criterion cannot be checked, raise that issue rather than silently changing the requirement. Consider test data, environments, dependencies, and evidence needed to make results credible. Do not set arbitrary coverage thresholds or select tools solely because they appear in the course.

## Maintain the strategy

When testing documentation is requested or approved, create or update one living file: `<repo-root>/docs/testing/test-strategy.md`. Record scope and assumptions, selected test levels, requirement-to-check links, relevant test-data and environment needs, expected evidence, gaps, and open questions.

Distinguish planned checks from tests that exist and results actually observed. Link to the requirements and security plan rather than duplicating their status fields. Propose an ADR for a consequential testing choice; do not create it through this skill. Do not create additional testing documents, install tools, write tests, or configure CI unless separately requested.

## Check the result

Verify that accepted requirements have an identifiable check or visible gap, the chosen levels match project risks, evidence is not invented, links resolve, and unresolved decisions remain explicit.

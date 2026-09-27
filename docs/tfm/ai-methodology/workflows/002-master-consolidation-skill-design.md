# AI Workflow: Master lesson consolidation skill design

## Purpose

The skill provides a reusable, reviewable way to consolidate one master's-course lesson into private Markdown while preserving substance, source hierarchy, visuals, and traceability.

## Workflow

ChatGPT Assistant → rule design and iterative refinement → final prompt → Codex execution → generated SKILL.md → human review → output-protection refinement → extracted-project handling refinement → current validation state.

The design established one-lesson-at-a-time processing; primary, secondary, and supplementary source roles; no external knowledge during consolidation; preservation of useful visuals and assets; OCR uncertainty handling; source traceability; and human review before acceptance.

## AI roles

- **ChatGPT Assistant:** discussion, reasoning, and prompt design.
- **Codex:** workspace-aware execution and skill generation.
- **Human developer:** review, correction, approval, and final decision.

## Model usage

Prompt design: ChatGPT Assistant, GPT-5.6 Sol, Medium reasoning.

Execution: Codex, GPT-5.6 Sol, Medium reasoning.

## Input

Final creation prompt: [003-create-master-consolidation-skill.md](../prompts/003-create-master-consolidation-skill.md).

## Output

Resulting skill: [consolidate-master-lesson/SKILL.md](../../../../.agents/skills/consolidate-master-lesson/SKILL.md).

## Human review

The initial skill was manually reviewed. Codex identified a risk of collisions with existing output files and assets; an explicit protection rule was added after human review. Further review led to a rule treating extracted ZIP project directories as supplementary material, inspecting them selectively rather than recursively ingesting them by default. The revised skill was reviewed again and accepted as ready for a first controlled lesson test.

## Validation status

The skill design is accepted for testing. It has not yet been validated against a real lesson. Validation will use a controlled test on a representative lesson before any bulk processing.

## Result

The skill is ready for first-use validation, not final for bulk execution.

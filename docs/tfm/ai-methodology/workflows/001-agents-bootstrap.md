# AI Workflow: Global AGENTS.md bootstrap

## Purpose

The global [AGENTS.md](../../../../AGENTS.md) establishes permanent operating rules for pokemon-tools, including workspace boundaries, source attribution, privacy, traceability, and AI-assisted work.

## Workflow

ChatGPT Assistant → prompt design and iterative refinement → final prompt → Codex execution → generated AGENTS.md → human review → refinement → final validation.

## AI roles

- **ChatGPT Assistant:** discussion and prompt design.
- **Codex:** workspace-aware execution.
- **Human developer:** review, approval, correction, and final decision.

## Model usage

Prompt design: ChatGPT Assistant, GPT-5.6 Sol, Medium reasoning.

Execution: Codex, GPT-5.6 Sol, Medium reasoning.

## Input

Final prompt: [001-create-agents.md](../prompts/001-create-agents.md).

## Output

Resulting artifact: [AGENTS.md](../../../../AGENTS.md).

## Human review

The generated AGENTS.md was manually reviewed. Codex correctly treated the task-specific scope section as execution instructions rather than permanent rules. Codex proposed repository-security rules; the proposal was reviewed, refined, approved, and incorporated. The resulting AGENTS.md was accepted for the current project phase.

## Result

AGENTS.md is considered stable for the current preparation phase and may evolve later through reviewed changes.

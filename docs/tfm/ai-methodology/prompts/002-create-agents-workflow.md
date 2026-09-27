Create the following documentation file:

D:\TFM\pokemon-tools\docs\tfm\ai-methodology\workflows\001-agents-bootstrap.md

Document, in a concise way, the AI-assisted workflow used to create the project's global AGENTS.md.

Use these existing artifacts as reference:

D:\TFM\pokemon-tools\AGENTS.md

and, if it exists:

D:\TFM\pokemon-tools\docs\tfm\ai-methodology\prompts\001-create-agents.md

The document should include:

# AI Workflow: Global AGENTS.md bootstrap

## Purpose
Briefly explain why AGENTS.md was created and its role in the project.

## Workflow
Summarize the process:

ChatGPT Assistant
→ prompt design and iterative refinement
→ final prompt
→ Codex execution
→ generated AGENTS.md
→ human review
→ refinement
→ final validation

## AI roles
Briefly distinguish:
- ChatGPT Assistant: discussion and prompt design.
- Codex: workspace-aware execution.
- Human developer: review, approval, correction, and final decision.

## Model usage
Record:

Prompt design:
- ChatGPT Assistant
- GPT-5.6 Sol
- Medium reasoning

Execution:
- Codex
- GPT-5.6 Sol
- Medium reasoning

## Input
Link to the final prompt file if it exists:

../prompts/001-create-agents.md

Do not duplicate the full prompt.

## Output
Link to the resulting AGENTS.md using a relative Markdown link.

## Human review
Briefly record that:
- the generated AGENTS.md was manually reviewed;
- Codex correctly treated the task-specific scope section as execution instructions rather than permanent rules;
- Codex proposed adding repository-security rules;
- that proposal was reviewed, refined, approved, and incorporated;
- the resulting AGENTS.md was accepted for the current project phase.

## Result
State that AGENTS.md is considered stable for the current preparation phase and may evolve later through reviewed changes.

Keep the document concise.

Do not create or modify any other file.
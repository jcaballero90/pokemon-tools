Create the following documentation file:

D:\TFM\pokemon-tools\docs\tfm\ai-methodology\workflows\002-master-consolidation-skill-design.md

Document, concisely, the AI-assisted workflow used to design and create the lesson-consolidation skill located at:

D:\TFM\pokemon-tools\skills\consolidate-master-lesson\SKILL.md

Use these artifacts as reference:

D:\TFM\pokemon-tools\AGENTS.md
D:\TFM\pokemon-tools\skills\consolidate-master-lesson\SKILL.md

and, if it exists:

D:\TFM\pokemon-tools\docs\tfm\ai-methodology\prompts\003-create-master-consolidation-skill.md

The documented workflow was:

1. The need for a reusable lesson-consolidation workflow was discussed in ChatGPT Assistant.
2. The consolidation rules were iteratively designed before execution.
3. The design established:
   - one-lesson-at-a-time processing;
   - primary, secondary, and supplementary source hierarchy;
   - no external knowledge during course consolidation;
   - preservation of useful visuals and assets;
   - OCR uncertainty handling;
   - source traceability;
   - human review before acceptance.
4. The final creation prompt was transferred to Codex.
5. Codex generated the initial SKILL.md.
6. The generated skill was manually reviewed.
7. Codex identified a workflow risk related to existing output files and assets.
8. An explicit existing-output protection rule was added after human review.
9. A further review identified the need to define how extracted ZIP project directories should be handled.
10. A rule was added so extracted projects are treated as supplementary material, inspected selectively, and not recursively ingested by default.
11. The resulting skill was reviewed again and considered ready for a first controlled lesson test.
12. The skill has NOT yet been validated against a real lesson, so it must not be described as fully validated.

Use the following structure:

# AI Workflow: Master lesson consolidation skill design

## Purpose
Briefly explain why the skill was created and what problem it solves.

## Workflow
Summarize the sequence:

ChatGPT Assistant
→ rule design and iterative refinement
→ final prompt
→ Codex execution
→ generated SKILL.md
→ human review
→ output-protection refinement
→ extracted-project handling refinement
→ current validation state

## AI roles
Briefly distinguish:
- ChatGPT Assistant: discussion, reasoning, and prompt design.
- Codex: workspace-aware execution and skill generation.
- Human developer: review, correction, approval, and final decision.

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
Link to the creation prompt if it exists:

../prompts/003-create-master-consolidation-skill.md

Do not duplicate the full prompt.

## Output
Link to:

../../../../skills/consolidate-master-lesson/SKILL.md

## Human review
Briefly record:
- the initial skill was reviewed manually;
- output-collision handling was added;
- extracted ZIP project-directory handling was added;
- the final skill was reviewed again;
- the skill was accepted as ready for a first controlled lesson test.

## Validation status
Make clear that:
- the skill design is accepted for testing;
- it has not yet been validated against a real lesson;
- validation will occur through a controlled test on a representative lesson before bulk processing.

## Result
State that the skill is currently considered ready for first-use validation, not final for bulk execution.

Keep the document concise.

Do not create or modify any other file.
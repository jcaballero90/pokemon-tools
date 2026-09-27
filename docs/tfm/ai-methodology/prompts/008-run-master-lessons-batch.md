Execute a controlled batch of master lesson consolidations.

Before doing anything, read and follow:

<repo-root>/AGENTS.md

and:

<repo-root>/.agents/skills/consolidate-master-lesson/SKILL.md

Also use the reusable single-lesson execution rules defined in:

<repo-root>/docs/tfm/ai-methodology/prompts/006-run-master-lesson-consolidation.md

The lessons authorized for this batch are provided in:

<lesson-directories>

Treat that list as exhaustive for this execution.

Do not process any lesson that is not explicitly included.

## Batch principle

Each lesson must remain an independent consolidation unit.

Process lessons sequentially.

The goal of this execution is to complete every authorized lesson in the supplied list.

For each lesson:

1. Complete the full single-lesson workflow.
2. Generate its output under the private knowledge base.
3. Update only that lesson's row in the processing registry.
4. Report any blocking issue if one exists.
5. Continue immediately with the next authorized lesson.

Do not merge source material from different lessons.

Do not create cross-lesson consolidated documents.

Do not infer that adjacent folders should also be processed.

Do not stop the batch merely to report progress after completing a lesson.

After successfully completing and registering one lesson, continue immediately with the next authorized lesson unless:

- a blocking condition requires human intervention;
- continuing would violate an existing-output protection rule;
- an execution, runtime, context, model-usage, tool, or environment limit prevents further work;
- or another condition makes safe continuation impossible.

Progress reporting alone is not a reason to end the batch.

Partial progress is not a completion condition.

## Failure and interruption behavior

If a specific lesson cannot be completed because of:

- an output collision;
- an ambiguous lesson boundary;
- missing or inaccessible source material;
- a source issue that prevents reliable consolidation;
- insufficient confidence about the intended output structure;
- another blocking condition defined by the skill;

stop processing that lesson.

Record or preserve its appropriate status in the processing registry.

Then:

- continue with the next authorized lesson if it is independent and can be processed safely;
- otherwise stop the batch and report the blocking condition.

Never bypass output protection by creating alternate filenames.

The goal remains to process every other authorized lesson that can be completed safely.

Partial completion of the batch is acceptable only when continuing is prevented by:

- a blocking condition requiring human intervention;
- an execution or runtime limit;
- a model usage or context limit;
- a tool or environment failure;
- or another condition that makes safe continuation impossible.

If execution is interrupted or cannot safely continue:

- preserve all completed lesson outputs;
- preserve their registry updates;
- do not roll back completed lessons;
- do not mark an incomplete lesson as `Draft`;
- report the first lesson that was not completed;
- leave all remaining uncompleted authorized lessons unchanged as `Pending`.

Do not voluntarily end the batch solely because several lessons have already been completed.

## Resource-awareness

Do not expand the batch beyond the explicitly supplied lesson list.

Use resources efficiently, but continue processing the authorized lesson list while safe execution remains possible.

Do not reduce the requested batch size on your own merely to conserve context, model usage, or execution time.

If an actual execution, context, usage, tool, or environment limit prevents further work, follow the interruption behavior defined above.

Do not perform deep recursive inspection of supplementary project directories unless required by the lesson-consolidation skill.

Do not re-read or reprocess lessons already marked `Draft` or `Validated`.

## Processing registry

Use:

<workspace-root>/knowledge-private/processing/lessons-status.md

For each successfully generated lesson, update only its corresponding row:

- Status: `Draft`
- Model: the Codex model and reasoning level used for this execution, only when exposed reliably
- Outputs: number of consolidated Markdown files created
- Human review: `No`

Preserve existing relevant notes.

Add only concise operational notes when useful.

Never set a lesson to `Validated` automatically.

Only explicit human approval may change:

- `Draft` → `Validated`
- `Draft` → `Needs review`
- `Needs review` → `Validated`

Do not modify rows for lessons that were not part of this batch.

If a lesson fails before producing a valid draft, do not mark it as `Draft`.

## Output protection

Before processing each lesson, check whether its intended output directory or files already exist.

Follow the existing-output protection rules from the skill.

Do not overwrite existing outputs without explicit human approval.

If an authorized lesson is already marked `Draft` or `Validated`, do not reprocess it. Skip it and continue with the next authorized lesson.

## Final batch report

Provide the final batch report only after:

- every authorized lesson has been completed or safely skipped because of a blocking condition; or
- execution can no longer continue because of an actual runtime, context, usage, tool, or environment limit.

Do not produce the final batch report merely because partial progress has been made.

The report must contain:

1. Lessons requested.
2. Lessons successfully consolidated.
3. Lessons skipped or blocked.
4. Markdown outputs created per lesson.
5. Supplementary archives or projects inspected.
6. Assets created or reused.
7. Source conflicts or significant uncertainties found.
8. Registry rows updated.
9. Any lesson that requires special human review.
10. The first unfinished lesson, if execution was interrupted.
11. Remaining authorized lessons that were not reached.
12. Confirmation that no unauthorized lesson was processed.

Explicitly state that all generated lesson outputs remain drafts awaiting human validation.

Do not create additional workflow or methodology documentation as part of this batch.

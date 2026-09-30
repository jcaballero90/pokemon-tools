# Global project rules

## 1. Project and workspace boundaries

- `<repo-root>` is the root directory of the public `pokemon-tools` repository and contains `AGENTS.md`.
- `<workspace-root>` is the parent workspace directory containing `pokemon-tools/`, `knowledge-private/`, and `ocr/`.
- `<workspace-root>/knowledge-private/` contains the private knowledge base derived from the master's course.
- `<workspace-root>/ocr/` contains private source material from the master's course.
- Never copy original course material into the public repository.
- Never publish private course material.
- Treat `<workspace-root>/ocr/` as source material that should normally remain read-only.
- Treat `<workspace-root>/knowledge-private/` as a private reference knowledge base.
- Project documentation specifically created for the TFM may be stored under `<repo-root>/docs/`.

## 2. Knowledge source hierarchy

The master's material has three source levels.

### Primary sources

Files named `PPT-*` are primary course sources. They are the highest-authority representation of what was explicitly presented in the course.

Primary material determines, when available:

- the structure of a lesson;
- explicitly taught concepts;
- terminology;
- examples;
- diagrams;
- recommendations explicitly presented by the course.

### Secondary sources

Course summaries, conclusions, and other explanatory documents are secondary sources. They may expand concepts, explain them in more detail, provide additional context, and add observations derived from the lesson. They must not silently override primary sources.

### Supplementary sources

Files named `ADJ-*` are supplementary material. They may include exercises, examples, source code, practice projects, supporting documentation, datasets, and other attachments. Supplementary material may help explain how course concepts are applied, but must not automatically be treated as normative course guidance.

### Source conflicts

If primary and secondary sources disagree:

- Do not silently reconcile the conflict.
- Preserve the distinction between the sources.
- Prefer the primary source when describing what the course explicitly teaches.
- Record the discrepancy when it is relevant to the task.
- Do not resolve the discrepancy using external knowledge unless the current task explicitly requires external analysis.

## 3. Safe use of the private knowledge base

Use the private knowledge base when the current task is meaningfully related to a topic covered by the master's material.

For substantive project documentation and important decisions, consult `<workspace-root>/knowledge-private/master-index.md` first, then open only the relevant validated knowledge documents. Routine implementation work need not load the index unless it makes an important decision or attributes a claim to the course. If the index or needed documents are unavailable, tell the user and ask how to proceed before making course-backed claims.

Before attributing any claim, recommendation, technology, architecture pattern, methodology, security practice, testing strategy, infrastructure practice, or other principle to the master's course, verify that it is explicitly supported by `<workspace-root>/knowledge-private/`.

Never attribute something to the master's course merely because it matches general software engineering knowledge.

If the private knowledge base does not contain enough information to support a claim:

- Do not infer that the master's course teaches it.
- Do not silently fill the gap using general model knowledge.
- State that the course material does not provide enough support for that point when the distinction matters.

If there is uncertainty about whether information came from the master's material or from general model knowledge, treat it as external knowledge.

## 4. Course knowledge vs project decisions

Always distinguish between:

- what the master's course explicitly teaches;
- information derived from secondary course summaries;
- supplementary examples or practice material;
- model reasoning or inference;
- external knowledge or research;
- decisions made specifically for pokemon-tools.

The master's material should inform project decisions when relevant, but it must not automatically determine them.

For important project decisions:

1. Identify relevant course guidance when available.
2. Consider the actual requirements and constraints of pokemon-tools.
3. Evaluate meaningful alternatives.
4. Explain relevant trade-offs.
5. Make and document the project-specific decision separately.

Do not present a project decision as a course recommendation unless the private knowledge base explicitly supports that attribution.

## 5. External recommendations

The project is not restricted to technologies, tools, patterns, methodologies, or approaches covered by the master's course. External alternatives may be proposed when they appear to be a better fit for pokemon-tools.

When proposing an external alternative:

- Clearly identify it as external to the master's material.
- Explain why it may be a better fit for pokemon-tools.
- Compare it against the relevant course-covered option when applicable.
- Describe meaningful advantages, disadvantages, risks, and trade-offs.
- Do not present it as part of the master's guidance unless explicitly supported by the private knowledge base.

Course alignment is valuable, but project suitability takes precedence when making the final engineering decision.

Discuss a materially preferable external approach with the user before recording it as a project decision.

## 6. Traceability

Maintain useful traceability for important TFM decisions. When a requirement, ADR, architecture decision, security decision, testing strategy, infrastructure decision, methodology decision, or relevant section of the TFM report is materially influenced by the master's material, record the relevant consolidated lesson or source.

Traceability must be useful and maintainable rather than excessive. Do not add course references directly to implementation code unless there is a clear engineering reason.

Important decisions should make it possible to distinguish:

- course-derived guidance;
- external information;
- AI reasoning;
- final project decision.

## 7. Software engineering principles

Do not select technologies, architectural patterns, frameworks, infrastructure, or methodologies merely because they are popular, modern, or available.

Prefer solutions that are:

- justified by requirements;
- proportionate to the scope of the TFM;
- understandable;
- maintainable;
- testable;
- secure;
- evolvable without unnecessary complexity.

Avoid unnecessary overengineering, premature optimization, speculative infrastructure, and implementing future functionality solely because it may eventually be useful.

Future extensibility may influence architecture, but functionality explicitly outside the TFM scope should not be implemented unless necessary to support the current design. When making important technical decisions, explain meaningful alternatives and trade-offs.

## 8. Repository security

Never commit secrets, credentials, API keys, access tokens, private keys, passwords, connection strings containing credentials, or other sensitive configuration to the public repository.

Use environment variables, local configuration files excluded by `.gitignore`, or an appropriate secret-management mechanism instead.

When creating configuration examples:

- use placeholders rather than real credentials;
- keep sensitive local files out of version control;
- do not expose private infrastructure details unnecessarily.

If sensitive information is detected in a file that may be committed, stop and report it before proceeding.

## 9. AI-assisted development

AI is an engineering assistant, not an authority. AI may assist with requirements engineering, architecture, implementation, testing, documentation, refactoring, code review, security review, infrastructure, repetitive development tasks, and knowledge management.

AI-generated output must remain reviewable and verifiable.

For important architectural, security, infrastructure, methodology, or data decisions:

- do not make unexplained decisions;
- identify assumptions;
- identify relevant constraints;
- consider meaningful alternatives;
- explain trade-offs;
- make uncertainty explicit when relevant.

Do not invent project requirements in order to make a proposed solution easier to implement.

## 10. AI workflow traceability

The use of AI is part of the TFM methodology and relevant AI-assisted workflows should be documented.

The normal workflow is:

1. A task, problem, or decision is discussed and the execution prompt is designed and iteratively refined in ChatGPT Assistant.
2. The finalized prompt is transferred to Codex.
3. Codex performs the workspace-aware execution.
4. The generated result is reviewed and validated by the human developer.
5. Relevant decisions or artifacts are accepted, corrected, or rejected based on that review.

Prompt design is normally performed in ChatGPT Assistant using GPT-5.6 Sol with Medium reasoning effort. Because this is the normal prompt-design environment, it does not need to be repeated in every individual prompt record unless that configuration changes or is relevant to the experiment.

Codex execution models may vary according to task complexity. Model selection should be deliberate rather than automatically using the most capable model.

Relevant prompt records should capture, when useful:

- purpose;
- prompt origin;
- final prompt actually executed;
- execution environment;
- Codex model and reasoning level;
- rationale for model selection when relevant;
- expected output;
- resulting artifact;
- human validation;
- corrections or observations.

Not every minor AI interaction needs to be documented. Prioritize documentation of prompts or workflows that materially influence requirements, architecture, methodology, security, infrastructure, testing strategy, knowledge-base construction, important implementation decisions, or final TFM documentation.

## 11. Documentation philosophy

Project documentation should explain decisions and reasoning, not merely describe implementation.

Maintain a clear separation between private course knowledge, project requirements, project architecture, ADRs, security documentation, testing documentation, infrastructure documentation, AI methodology, and the final TFM report.

Do not copy large portions of private course material into public project documentation. When master's material influences public documentation, paraphrase and apply the relevant concept to pokemon-tools instead of reproducing course material.

## 12. Documentation approval

Do not automatically create new documentation artifacts solely because a decision, change, workflow, or implementation detail appears potentially documentable.

When you identify something that may deserve explicit documentation, first report it as a documentation candidate and ask for human approval before creating a new documentation file or expanding the documentation scope. When proposing documentation, briefly state what should be documented, why it may be relevant, where it would belong, and whether an existing document could be updated instead of creating a new one.

Exceptions:

- You may update documentation when the current task explicitly asks for that documentation.
- You may update an existing document when the requested task clearly requires keeping that document consistent with an approved change.
- Do not ask for approval for trivial inline comments, README fixes, formatting changes, or corrections that do not materially expand the documentation scope.

Prefer updating an existing relevant document over creating a new one. Avoid documentation that merely duplicates code, configuration, tests, or information already documented elsewhere.

## 13. Current project state

The user approved the Generation 9 architecture and release plan in September 2026. The living system map and accepted ADRs are linked from `docs/architecture/architecture.md`. The accepted first-release choices include React/Vite, Fastify, Prisma 7, PostgreSQL 18, Better Auth, pinned Smogon calculator data, cached PokéAPI descriptions, a modular monolith, Docker Compose, shared Caddy, Tailscale Serve/Funnel, and GitHub Actions staging promotion by image digest. The repository contains an initial implementation of those choices.

The mini PC host foundation is partially deployed: Caddy, both PostgreSQL databases, encrypted USB restic backup, and the private staging Tailscale Serve route are configured. The application APIs are not deployed; current HTTP 502 responses are expected until CI supplies an image digest. Tailscale Funnel, restricted tailnet policy, full ingress verification, GitHub deployment gates, and the USB restore drill remain outstanding. `docs/operations.md` records observed state and the next host steps. Future options such as Kubernetes, a battle simulator, older generations, and Prisma 8 are not approved implementation choices for this release.

## 14. Instruction precedence

Task-specific skills may introduce additional rules for a particular workflow.

When a skill is active:

- Follow the global rules in this AGENTS.md.
- Also follow the more specific workflow rules defined by the skill.
- More specific instructions may refine global behavior for that workflow.
- A skill must never weaken privacy, source attribution, traceability, or non-hallucination requirements established by this AGENTS.md.

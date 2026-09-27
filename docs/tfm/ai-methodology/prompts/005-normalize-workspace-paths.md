Normalize workspace path references in the project's permanent instruction files.

Modify only:

D:\TFM\pokemon-tools\AGENTS.md
D:\TFM\pokemon-tools\skills\consolidate-master-lesson\SKILL.md

The goal is to remove machine-specific absolute paths such as:

D:\TFM\...

from permanent project instructions and replace them with portable logical workspace paths.

Do NOT modify archived prompts under:

docs/tfm/ai-methodology/prompts/

Those prompts are historical execution records and must preserve the exact paths that were used when they were executed.

Do NOT modify workflow documentation unless necessary. Existing relative Markdown links should remain unchanged.

## Logical path convention

Introduce and consistently use these logical roots:

- `<repo-root>`: the root directory of the `pokemon-tools` repository, containing `AGENTS.md`.
- `<workspace-root>`: the parent workspace directory containing:
  - `pokemon-tools/`
  - `knowledge-private/`
  - `ocr/`

Therefore:

- Public repository:
  `<repo-root>/`

- OCR source material:
  `<workspace-root>/ocr/`

- Private knowledge base:
  `<workspace-root>/knowledge-private/`

- Consolidated Markdown:
  `<workspace-root>/knowledge-private/master-md/`

- Private assets:
  `<workspace-root>/knowledge-private/assets/`

These are logical path aliases used in project instructions. They must not depend on a Windows drive letter or a particular local machine path.

## AGENTS.md

Update path references so the workspace boundaries use the logical roots above.

For example, instead of machine-specific or ambiguous references, make it explicit that:

- `<repo-root>` is the public repository.
- `<workspace-root>/knowledge-private/` is the private knowledge base.
- `<workspace-root>/ocr/` is the private source-material area.

Keep all existing behavioral rules unchanged.

Do not otherwise rewrite or restructure AGENTS.md.

## consolidate-master-lesson/SKILL.md

Replace absolute workspace paths with the logical roots above.

In particular, normalize references to:

- source material;
- private consolidated Markdown;
- private assets;
- public repository.

Ensure instructions remain unambiguous regardless of the physical location of SKILL.md inside the repository.

Keep the existing relative Markdown link to AGENTS.md if it is already correct.

Do not alter:
- source hierarchy rules;
- consolidation behavior;
- OCR rules;
- visual handling;
- extracted-project handling;
- overwrite protection;
- human-review rules;
- privacy rules.

## Verification

After editing:

1. Verify that neither AGENTS.md nor SKILL.md contains `D:\TFM`.
2. Verify that the logical definitions of `<repo-root>` and `<workspace-root>` are clear.
3. Verify that no behavioral rule was accidentally changed.
4. Report exactly which path references were normalized.

Do not create or modify any other file.
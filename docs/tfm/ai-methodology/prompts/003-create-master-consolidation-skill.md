Create the following skill file:

D:\TFM\pokemon-tools\skills\consolidate-master-lesson\SKILL.md

The skill will define how Codex must consolidate the master's course material from OCR/searchable PDFs into a private Markdown knowledge base.

Read and respect:

D:\TFM\pokemon-tools\AGENTS.md

This skill must refine those global rules for this specific workflow. It must not weaken or contradict them.

The skill must be written in English.

# Purpose

The purpose of this skill is to transform the source documents belonging to ONE course lesson into ONE coherent, consolidated Markdown document whenever the lesson structure makes that appropriate.

This is not a simple PDF-to-Markdown conversion.

The goal is to create a high-quality private knowledge base that:

- preserves the substance of the course;
- removes unnecessary duplication between sources;
- keeps source provenance visible;
- distinguishes primary, secondary, and supplementary material;
- preserves relevant diagrams and visual information;
- does not introduce external knowledge;
- remains useful later for requirements, architecture, implementation, and TFM documentation.

# Workspace

Source material:

D:\TFM\ocr\

Private Markdown knowledge base:

D:\TFM\knowledge-private\master-md\

Private extracted assets:

D:\TFM\knowledge-private\assets\

Public repository:

D:\TFM\pokemon-tools\

Course-derived consolidated Markdown and course assets must remain private.

Do not copy course-derived content or course assets into the public repository.

# Scope of execution

This skill operates on ONE explicitly selected lesson directory at a time.

It must NOT recursively process the entire master's course unless explicitly instructed to do so in a separate task.

For each execution:

1. Receive or determine the source lesson directory.
2. Inspect all relevant files in that lesson directory.
3. Classify the sources.
4. Determine the appropriate consolidated document structure.
5. Generate one consolidated Markdown document when appropriate.
6. Extract or preserve relevant visual assets when needed.
7. Report ambiguities or source conflicts.

Do not modify source PDFs.

# Source classification

Classify source documents according to these rules.

## Primary sources

Files whose names begin with:

PPT-

These are the primary representation of the course lesson.

They have priority for:

- lesson structure;
- terminology;
- explicitly taught concepts;
- diagrams;
- examples;
- recommendations;
- conclusions explicitly presented by the course.

## Secondary sources

Course summaries, conclusions, or explanatory documents that are not classified as primary or supplementary.

These may expand, clarify, or develop concepts from the primary source.

They must not silently override the primary source.

Typical secondary sources may originate from source files that previously used an `OK-` prefix, even if that prefix is no longer present in the processed filename.

## Supplementary sources

Files whose names begin with:

ADJ-

These are supplementary materials.

They may contain:

- exercises;
- practical examples;
- code;
- projects;
- datasets;
- reference material;
- supporting documentation.

Do not automatically merge supplementary material into the main lesson narrative.

Use it only when it materially contributes to understanding the lesson, and clearly identify its supplementary nature.

# Consolidation principle

Consolidate by LESSON, not by source file.

The primary presentation should normally provide the conceptual backbone of the resulting Markdown document.

Secondary documents may expand individual sections.

For example:

Primary presentation:

- Relational databases
- NoSQL databases
- Vector databases
- Conclusions

Secondary documents:

- NoSQL summary
- Vector database summary
- Lesson conclusions

The resulting Markdown should normally be ONE coherent lesson document in which the presentation provides the structure and the secondary sources enrich the corresponding sections.

Do NOT produce one Markdown file per PDF unless the lesson structure clearly requires it.

Do NOT simply concatenate converted PDF text.

Do NOT create a shorter generic summary that discards relevant course content.

The goal is consolidation, not aggressive summarization.

# Primary vs secondary information

When information from a secondary source expands a topic already present in the primary source:

- integrate the useful additional information into the corresponding section;
- preserve the terminology and framing of the course;
- avoid repeating the same concept multiple times;
- retain meaningful details that add educational value.

When a meaningful concept appears only in a secondary source:

- it may be included;
- clearly indicate that it comes from secondary course material and is not explicitly present in the primary presentation.

Do not over-label every sentence.

Use provenance at a section or concept level where useful.

# Source conflicts

If sources disagree:

- do not silently choose a compromise;
- do not use general knowledge to decide which source is technically correct;
- preserve the primary source as the authoritative representation of what was explicitly presented in the lesson;
- record the relevant discrepancy;
- make clear what the secondary source states.

If a discrepancy appears to be an obvious OCR error, it may be normalized only when the intended text is unambiguous.

Do not silently correct substantive technical claims based on external knowledge.

# External knowledge prohibition

During course consolidation, do NOT use:

- general model knowledge;
- web research;
- external documentation;
- personal assumptions;
- project-specific architectural decisions;

to expand, correct, modernize, or complete the course material.

The resulting Markdown must represent the supplied course material.

If the sources do not contain enough information to explain something, preserve that limitation rather than filling the gap.

This is stricter than normal project-decision work.

# OCR handling

The PDFs have already been processed to make their text searchable.

Expect occasional OCR defects.

You may correct obvious OCR artifacts such as:

- broken words;
- accidental character substitutions;
- spacing errors;
- page-number interference;
- duplicated headers or footers;
- line-break artifacts.

Only correct them when the intended text is sufficiently clear from context.

Do not reinterpret ambiguous technical content.

If an OCR defect may materially change the meaning, report it rather than guessing.

# Visual content

Primary presentations may contain diagrams, architecture figures, workflows, tables, screenshots, or other visuals that carry information not fully represented in extracted text.

Do not assume that extracted text alone captures the lesson.

Inspect relevant visual content when necessary.

For useful instructional visuals:

1. Preserve the original visual as an asset when technically practical.
2. Store it under:

D:\TFM\knowledge-private\assets\

3. Use a traceable filename that identifies its source, for example:

PPT-Bases-de-datos-p12.png

4. Reference the asset from the consolidated Markdown using a relative path.

Where useful, also provide a textual explanation or Mermaid representation to improve searchability and understanding.

A Mermaid reconstruction must NOT replace the original source visual when the original contains relevant information.

Do not extract decorative images, logos, repeated branding, or visual elements without educational value.

# Tables and code

Preserve meaningful tables as Markdown tables when practical.

Preserve code examples when they are relevant to the lesson.

Do not alter code semantics merely to modernize or improve the example.

If formatting from the source is ambiguous, prioritize faithful meaning over visual reproduction.

# Output language

The consolidated knowledge documents should normally be written in Spanish because the source course material is primarily in Spanish.

Preserve technical terms in English when that matches the source material or established terminology.

Do not unnecessarily translate names of technologies, APIs, patterns, or standards.

# Output document structure

Adapt the exact structure to the lesson instead of forcing every lesson into the same headings.

However, include YAML frontmatter similar to:

---
title: <lesson title>
module: <module name>
source_policy:
  primary:
    - <primary source>
  secondary:
    - <secondary source>
  attachments:
    - <supplementary source>
---

Do not invent module names or metadata.

If metadata cannot be determined safely, omit it or mark it as unknown rather than guessing.

The body should follow the conceptual organization of the lesson.

At the end, include:

## Source traceability

Use a concise table such as:

| Source | Type | Use |
| --- | --- | --- |
| PPT-example.pdf | Primary | Main lesson structure and concepts |
| example-summary.pdf | Secondary | Expanded section X |
| ADJ-example.pdf | Supplementary | Practical example |

Include only sources actually used or meaningfully inspected.

# Provenance within the document

Do not cite every paragraph.

Add source provenance where it materially helps distinguish:

- primary teaching;
- secondary-only expansions;
- supplementary material;
- source discrepancies.

Possible lightweight forms include short notes such as:

> Source note: this extension appears in secondary course material and is not explicit in the primary presentation.

Avoid cluttering the document with repetitive provenance markers.

# Content preservation

Preserve:

- relevant concepts;
- definitions;
- relationships between concepts;
- arguments;
- examples;
- meaningful conclusions;
- technical distinctions;
- relevant warnings;
- useful code;
- meaningful diagrams and tables.

Remove or normalize:

- duplicated content across sources;
- repeated headers and footers;
- page numbers;
- presentation branding;
- navigation artifacts;
- OCR noise;
- purely decorative material.

Do not remove content merely because it seems basic or obvious.

The knowledge base must remain sufficiently complete to support later TFM work.

# Attachments

Treat `ADJ-*` files carefully.

Before integrating attachment content into the main consolidated lesson, determine whether it is:

- explanatory material;
- a practical exercise;
- a code example;
- a standalone reference;
- unrelated supporting material.

Do not force standalone practical material into the conceptual narrative.

When an attachment is useful but should remain logically separate, summarize its role in the lesson and preserve traceability without reproducing its full contents in the main narrative.

# Output location and naming

Preserve the logical module/lesson hierarchy from the source material when creating files under:

D:\TFM\knowledge-private\master-md\

Use readable, stable filenames.

Do not flatten the complete course hierarchy into a single directory.

Do not create multiple output variants for the same lesson unless explicitly requested.

# Human review

The generated Markdown is a draft until reviewed by the human developer.

After consolidation, report:

- output file created;
- primary sources used;
- secondary sources used;
- supplementary sources used;
- assets extracted;
- source conflicts;
- significant OCR uncertainties;
- secondary-only concepts that were included;
- any important content that could not be represented confidently.

Do not silently resolve uncertainties.

# Documentation boundaries

This skill creates the private consolidated course knowledge requested by the workflow.

It must not automatically create:

- public project documentation;
- ADRs;
- architecture decisions;
- requirements;
- TFM report sections;
- AI methodology documentation.

If execution reveals something that may deserve separate project documentation, report it as a documentation candidate according to AGENTS.md and wait for human approval.

# Safety against over-processing

Do not process additional lessons merely because they are adjacent to the requested lesson.

Do not recursively process the entire course.

Do not create speculative classifications or structures for lessons that have not been inspected.

Prefer a careful, reviewable result for one lesson over bulk generation.

# Final instruction

Create only:

D:\TFM\pokemon-tools\skills\consolidate-master-lesson\SKILL.md

Do not execute the skill yet.

Do not generate any consolidated course Markdown yet.

Do not modify AGENTS.md.

Do not modify files under:

D:\TFM\ocr\
D:\TFM\knowledge-private\

After creating the skill, report:

1. the file created;
2. the main rules encoded;
3. any ambiguity or workflow risk you identified;
4. any additional rule you believe should be considered before the first lesson is processed.

Do not add unrequested rules without human approval.
---
name: Presentations
description: Read, create or edit PowerPoint or Google Slides decks. Use for presentation, slide deck, PowerPoint, PPT, PPTX, or Google Slides requests.
---

## Google Slides Routing

- **Existing native Google Slides deck**: use the Google Drive plugin's Google Slides skill. Do not round-trip through a local PPTX unless the user asks.
- **Net-new native Google Slides deck**: read `routing/google_slides.md`, create and verify a local PPTX with this skill, then import it as a native Google Slides deck.
- **PowerPoint or local deck**: continue with the local workflow below.

## Available Resources

- `style_guidelines.md`: REQUIRED for deck planning, narrative, copy, layout, typography, and visual consistency.
- `routing/google_slides.md`: REQUIRED for every net-new native Google Slides deliverable.
- `references/template-following.md`: REQUIRED when a user-provided PPTX supplies the layout, style, or template.
- `template_following_scripts/`: Inspection, frame-map validation, starter-deck, contact-sheet, and fidelity helpers for template following.
- `builtin_templates_support/`: Guidance, manifests, and prompts for bundled templates.
- `assets/builtin_templates/codex-grid-layout-library/`: Runtime-mounted previews, design tokens, layout registry, and 26 exact plain-JavaScript Codex Grid layout modules.
- `artifact_tool_docs/`: Artifact Tool API documentation and coding examples. Read `artifact_tool_docs/API_QUICK_START.md` first.
- `container_tools/`: Rendering, montage, image, and overflow helpers.

The following helper scripts are located in the `container_tools/` directory:

- `ensure_raster_image.py`: Ensure images are rasterized; convert to PNG if needed; quick usage `--input_files <img_path1> ...`.
- `render_slides.py`: Render a PowerPoint file into a folder of PNG slides using default sizing; quick usage: `<input.pptx>`. Output files are named `slide-1.png`, `slide-2.png`, ... in a directory with the same name as the input file.
- `create_montage.py`: Build a tiled montage from images in a directory (for viewing multiple image assets or rendered slides at once); quick usage: `--input_dir <imgs_dir> --output_file <montage.png>`. It supports most image formats with auto conversion under the hood.
- `slides_test.py`: Detect content overflowing the original slide canvas; usage: `<input.pptx>`.

## Artifact Template Selection

Open the template selection picker for creating new presentations when the user has not provided a template, reference, or visual direction. Also open the picker when the user asks to browse or upload templates. Do not open it if the user declines templates, requests a connected-source design search, or if `list_artifact_templates` is unavailable this turn. Subject matter, audience, tone, company names, and source files do not by themselves specify a template or visual direction.

Call `list_artifact_templates({artifactKind, request})` with `artifactKind: "presentation"`, or `"google-slides"` for Google Slides requests. Include compatible Office and Google templates without changing the requested output format.

Before calling `list_artifact_templates`, paginate `list_mcp_resources({server: "codex_apps"})`. Include every resource whose `_meta.skill_name` starts with `artifact-template-`, even when `allow_implicit_invocation` is `false`. Pass at most 100 resources as `pluginTemplates`: `{skillName: _meta.plugin_name + ":" + _meta.skill_name, resourceUri: uri, pluginId: _meta.plugin_id, pluginReleaseSkillId: _meta.plugin_release_skill_id, title, description: resource.description}`. Pass descriptions unchanged. Wait for a nonempty listing before opening the picker. Do not download a template before the user selects it.

Rank templates by relevance, breaking ties in favor of personal or shared templates. Include a mix of styles. Pass their `skillName` values unchanged to `choose_artifact_template({artifactKind, request, templates})` and call it once. Set `includeAllTemplates: true` only when the user requests the full catalog. The picker displays at most ten templates.

Follow the selected template or uploaded reference. Save an uploaded reference only when `saveForFutureUse` is true. Use Template Creator with the returned `displayName`. Continue without a template if the picker is declined, cancelled, unavailable, or fails. Do not replace the picker with `request_user_input` or a chat list. Browsing templates does not authorize artifact creation.

## Visual Workflow Routing

For every local PPTX workflow, choose exactly one visual route. The first matching route wins:

1. **Existing PPTX being edited, or a user-designated reference deck or template**: use the existing deck or chosen visual reference as the design source. A presentation supplied only as source material does not establish the visual direction. Read `references/template-following.md`, inspect every source slide, duplicate selected source slides, and edit inherited elements in place. Do not mix in Codex Grid or another template.
2. **Explicit custom visual direction without a reference deck**: create the deck from scratch using the requested theme, brand treatment, mood, or formatting. Do not use Codex Grid.
3. **No visual direction**: use the bundled Codex Grid layout library as the default composition reference. Before planning, read `builtin_templates_support/codex-grid-layout-library/ARTIFACT.md` and `assets/builtin_templates/codex-grid-layout-library/design_tokens.json`, and inspect `assets/builtin_templates/codex-grid-layout-library/assets/previews/layout-library.png`.

   Do not read template-registry.json in full.

   First query only compact routing fields:
   templateId, templateUse, useWhen, avoidWhen, layoutFamily,
   densityBudget.level, previewPng, and component.module.

   After selecting 2–4 candidate layouts, read only those entries and their
   corresponding content-token and module files.

   Preserve each selected layout's hierarchy and media frames while replacing sample content, and vary adjacent silhouettes.

The bundled layout modules are composition references, not a request to emit all 26 layouts in the user's deck. User-provided references and explicit visual direction always override Codex Grid.

## Important Instructions

- [HARD REQUIREMENT] Audience-facing copy: visible slide content must be written for the intended audience, not for the person or model producing the deck. Do not expose planning notes, timing scaffolds, talk tracks, content-selection commentary, or other internal process language unless the user explicitly requests it.
- Include [Sources] blocks in the speaker notes for every externally sourced asset and every externally sourced non-trivial claim.
- Info density: avoid cramming low-value details onto a single slide. Prefer lower-density slides with high-value content.
  - Title slide: keep the title slide minimal and simple. Avoid cramming in too much information.
- Layout: keep things clean and simple. Avoid low-quality visuals, but also avoid excessive white space. By default, use equal left and right margins on each slide.
- [HARD REQUIREMENT] Overlap: always pay attention to programmatic overlap warnings. Do not assume that overlapping elements in diagrams are intentional, and do not ignore overlap warnings without inspecting them. You MUST fix all unintended overlap errors before delivering the slides. This is critical.
- [HARD REQUIREMENT] Font size: when a template is provided, match its font sizes. When no template or style guidance is given, you MUST use at least 50pt for deck titles, 35pt for slide titles, 24pt for mid-level text such as subheadings, callout headers, and text-box titles, and 16pt for body text.
- Text layout: when there is too much text, shorten it before shrinking the font size. Inspect visually for unexpected text wrapping. NEVER allow a title/banner text box intended for one line to wrap to two lines.
- Narrative copy must fit the chosen layout: shorten it or change layouts rather than adding density or shrinking type.
- Visual assets:
  - [HARD REQUIREMENT] DO NOT use Python to draw images; DO NOT use programmatic vector shapes for visuals; DO NOT use programmatic drawings of any sort. Use image search or image_gen tool instead!
  - [HARD REQUIREMENT] Minimize the use of diagrams. Add them only when requested or when a single diagram materially improves the clarity of complex concepts. Diagram implementation rules: use native PowerPoint shapes for simple diagrams; use Graphviz for complex relational/topological/network-like diagrams; use image_gen for highly aesthetic, illustrative, or scientific infographic diagrams (e.g. chemical structures, circuit diagrams, etc.). When using native PowerPoint shapes with connectors, create connectors (arrows/edges) before creating entity nodes, so edges appear behind nodes and never cross through node shapes or labels. If this ordering is awkward during early iteration, you may create nodes first in the initial draft, then switch to connectors-first in the revised code.
  - Before sourcing or generating visuals, be mindful of the desired aspect ratio, placement, and cropping options on the slide. For example, if you intend to place text to the left of the image containing a person, you should ask image_gen to put the person on the right side of the image.
  - By default, DO NOT reuse the same image more than once (unless it's a background).
  - Prepare visuals for both the main concept and decorative support.
  - Inspect final image crops at full-slide size and replace assets that are blurry, distorted, poorly framed, or visually inconsistent with the deck.
  - Keep diagram labels concise, maintain clear hierarchy, and use consistent connector semantics.
- Default styling: use one composition instead of a collection of UI panels. UI-like styling typically includes card grids, pills, badges, button-like text boxes, tab or navigation patterns, repeated modular panels, dense dashboard-style layouts, and other component-library aesthetics that imply interactivity. Use stylized text boxes sparingly, favoring a flat structure on the canvas.

## Shared Workflow Instructions

### Presentations clarification questions

- Ask for new presentations or major rewrites. Skip this for edits/conversions.
- Inspect prompt, conversation history, existing file and relevant references to figure out what questions to ask.
- Questions should cover topic, audience, and purpose and come before planning
- When asking questions, focus on consequential dimensions not stated or clearly implied.
- When the artifact is a new analysis, focus on which definition, metric, or lens should drive conclusions.
- Unresolved reference labels or question marks are user-owned: ask, don't infer.
- Once topic, audience, and purpose are clear, proceed without asking. Choose emphasis, format, length, style, details. Use placeholders for missing facts.

Use `request_user_input` once if available, else ask via a message. Have the best suggestion first. Append `(Recommended)` to its label. Have another good alternative second. Have `Use your judgment` as the third and final option. If the request times out or returns no answer, proceed using your best judgment; do not ask again.

### Planning

- Apply `style_guidelines.md` to define the communication job, narrative arc, slide sequence, and visual approach.
- Apply the selected visual route above. Treat user-provided images as content, reusable assets, and explicit visual constraints without weakening a source deck's template contract.
- For existing or template-based decks, preserve the master → layout → slide hierarchy instead of flattening inherited elements. Discover masters and layouts with `presentation.inspect({ kind: "layout" })` (`type: "master"` identifies masters); inspect full master state through `presentation.masters.items`, `master.elements`, `master.placeholders.summary()`, and `master.toProto()`. Find child layouts by `parentLayoutId`, reuse them with `slide.setLayout(layout)`, and fill slide placeholders locally. Edit slides for one-offs, layouts for repeated changes, and masters only for intentional global changes; render representative descendant slides afterward. Read `artifact_tool_docs/api/references/master.spec.md`, `artifact_tool_docs/api/references/layout.spec.md`, `artifact_tool_docs/api/references/inspect.md`, and `artifact_tool_docs/api/references/cookbook/imported-deck.md`.
- Keep source and asset provenance in `$TMP_DIR/source-notes.txt`.

### Environment

Work in a writable, conversation-specific or tmp directory. Follow any working-directory and output-path instructions supplied by Codex.

Set:

- `SKILL_DIR=<absolute path to this skill>`
- `TMP_DIR=<absolute path to a temporary build directory within the working directory>`
- `FINAL_PPTX=<absolute path to the final .pptx>`

Resolve the bundled runtime once before running presentation builders or helper scripts:

```bash
export RUNTIME_NODE="$CODEX_PRIMARY_RUNTIME_NODE"
export RUNTIME_NODE_MODULES="$CODEX_PRIMARY_RUNTIME_NODE_MODULES"
export RUNTIME_BIN_DIR="$CODEX_PRIMARY_RUNTIME/dependencies/bin/override"

test -x "$RUNTIME_NODE"
test -d "$RUNTIME_NODE_MODULES"
test -d "$RUNTIME_BIN_DIR"
```

These three variables must contain absolute paths. Do not substitute system, global, repo-local, or newly installed dependencies. If any path is unavailable, report a blocker instead of guessing or searching for another runtime.

For user-authored `.mjs` builders with bare `@oai/artifact-tool` imports, create a `node_modules` symlink in the writable build directory:

```bash
ln -s "$RUNTIME_NODE_MODULES" "$TMP_DIR/node_modules"
```

Do not modify the bundled runtime or create the link from a synchronized workspace. Bundled skill scripts read the runtime variables directly and do not need this link.

An explicit user destination always wins. Otherwise, place `FINAL_PPTX` in the host-preferred output location. Use absolute paths in scripts and handoffs. Put intermediate files under `$TMP_DIR` and only final deliverables at the output location.

Use `.txt` for generated intermediate prose in `$TMP_DIR`, including plans, source notes, prompt records, design notes, QA ledgers, and fallback reasons. Reserve `.md` for installed skill resources. Do not create generated planning files such as `slide-plan.md`.

### Implementation

You MUST use `@oai/artifact-tool` from JavaScript ES modules to implement the slide deck.

Read the local docs before coding:

- `artifact_tool_docs/API_QUICK_START.md`
- `artifact_tool_docs/api/API_DOCS.md`

Create an ES module source file (`.mjs`) under `$TMP_DIR` and export the final PowerPoint deck (`.pptx`) to `$FINAL_PPTX`. Do not leave TypeScript-only syntax such as type annotations, `type` declarations, or `interface` declarations in the submitted `.mjs` source.

You MUST NOT use `python-pptx` or the old Python `artifact_tool` API.

Immediately before the first create/edit authoring command, run `mark_artifact_operation_started.mjs` successfully exactly once using the command below. Do not run it for read-only work. For edits, replace `create` with `edit`; adjust the expected count and output format to match the requested outputs.

Set the command's working directory to the skill directory and run the marker as one standalone command. Do not use shell-variable expansion or combine it with another command.

```bash
node container_tools/mark_artifact_operation_started.mjs --operation-kind create --expected-output-count 1 --output-format pptx
```

Run generated presentation modules with `"$RUNTIME_NODE"`. The runtime setup above makes bare `@oai/artifact-tool` imports resolve from `$TMP_DIR` while bundled helper scripts read their dependencies directly from the three runtime environment variables.

### Quality Assessment

Before delivery:

1. Render every final slide.
2. Inspect each slide individually at full size; use a contact sheet only for deck-level flow and consistency.
3. Fix unintended overlap, clipping, wrapping, broken connectors, unresolved placeholders, inconsistent footers or page markers, and chart/data mismatches.
4. Confirm the deck satisfies the user request and the narrative remains coherent.
5. Verify researched claims and sourced assets are traceable and cite sources when research informed the deck.

### Deliverables

Return a short user-visible summary of the completed deck. Mention sources cited or used when research informed the deck. Do not attach scratch plans, previews, layout JSON, or temporary assets unless the user asks.

#### Final Response

- Include a short user-visible summary and standalone Markdown link(s) only to final `.pptx` artifact(s), one per line: `[Launch Plan.pptx](sandbox:/absolute/path/to/launch-plan.pptx)`.
- Do not mention internal tooling or support artifacts like rendered previews or builder files unless explicitly requested.

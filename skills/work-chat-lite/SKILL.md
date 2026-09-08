---
name: work-chat-lite
description: Apply a lightweight Chat-style workflow in ChatGPT Work for simple questions, translation, rewriting, short explanations, and brainstorming when no current data, files, external tools, or multi-step deliverable is needed. Do not use for research, file editing, external actions, or tasks requiring verification.
---

# WORK Chat Lite

Use this skill to triage a request before starting a full WORK workflow. It changes the handling style, not the execution surface, model, billing, or credit rules. Never claim that WORK has switched to Chat or that credits have been bypassed.

## Use the lightweight path when

The request is self-contained and can be answered from the user's message or context already supplied in the current conversation. Typical examples are:

- translation, proofreading, rewriting, tone adjustment, or a short draft;
- a simple explanation, definition, calculation, or comparison;
- brainstorming, naming, outlining, or a short opinion based on supplied information;
- summarizing text that the user has already provided.

## Stay in the lightweight path

- Answer directly and proportionately. Prefer Traditional Chinese when the user writes in Traditional Chinese.
- Use only the minimum context needed. Do not repeat the user's full background or restate the request unnecessarily.
- Do not browse the web or call apps, plugins, MCP tools, browser automation, or subagents.
- Do not create, edit, or inspect files unless the user explicitly asks for a file operation; that request is a full WORK task.
- Do not create a plan, progress report, or long explanation for a short request.
- If the user asks for a ready-to-copy message or draft, provide the draft directly.
- Ask a clarifying question only when the missing detail changes the answer materially; otherwise make a reasonable assumption and state it briefly.

## Escalate to regular WORK when

Use the normal WORK workflow if the request involves any of the following:

- current or time-sensitive information, web research, citations, or verification;
- uploaded or local files, spreadsheets, documents, presentations, images, code, or generated artifacts;
- connected services, external actions, messages, calendar changes, repository changes, or other side effects;
- several dependent steps, large-scale analysis, data extraction, or a deliverable that must be reviewed;
- medical, legal, financial, safety-critical, or otherwise high-stakes accuracy where verification is appropriate;
- an explicit request to use a tool, search, a file, or a particular connected source.

Do not suppress a required tool or verification merely to remain lightweight. If useful, briefly tell the user that the task needs the full WORK workflow.

## Previous Chat or project context

Do not assume that this skill can open or invoke an arbitrary older ChatGPT Chat conversation. Use information already present in the current conversation, the active project context, authorized files, or enabled connected sources. If an older conversation is essential but its contents were not supplied, ask the user to paste the relevant part or provide a concise handoff summary.

## Credit-aware behavior

This skill aims to avoid unnecessary tool calls, long outputs, and multi-step execution. It does not guarantee lower credit usage, because actual usage depends on the plan, model, reasoning or speed settings, input and output size, and tools or features used. Never describe the lightweight path as a quota workaround.

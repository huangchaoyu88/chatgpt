---
name: photo-expense-split
description: Extract expenses from uploaded receipt or payment photos, maintain a chat ledger, and calculate fair multi-person splits and settlements. Use when the user wants to record spending, divide a bill, or reconcile who owes whom from images; not for generic image OCR alone.
---

# 拍照記帳分帳

Turn receipt photos, screenshots, or photographed handwritten bills into a reviewable expense record and an auditable split. Work in the user's language, normally Traditional Chinese.

## Core workflow

1. **Read the upload.** Identify whether multiple images are views of one receipt, separate receipts, or duplicate shots. Extract merchant, date/time, currency, line items, quantity, unit price, discounts, subtotal, tax, service charge, tip, total, and payer if visible. Preserve the source wording when an item name is unclear.
2. **Show a draft before committing.** Put uncertain OCR in `?` or mark it as uncertain; never silently guess a digit, decimal, currency, or negative sign. Reconcile the arithmetic. If the itemized sum does not explain the printed total, keep the unexplained amount as a separate fee or ask the user to clarify.
3. **Ask only necessary questions.** Resolve missing participants, payer, currency conversion, ambiguous amounts, or a total mismatch. If the user has already stated a rule—such as “大家均分” or “我付”—use it without re-asking.
4. **Apply the requested split.** Support equal shares, item assignment, shared items, weighted ratios/shares, custom amounts, and exclusions (for example, someone did not eat dessert). Taxes, fees, discounts, and tips must be allocated by an explicit rule; default to proportional allocation across included participants and state that assumption.
5. **Round transparently.** Use the smallest currency unit. When equal division leaves a remainder, assign the extra unit(s) explicitly—preferably to the payer or rotate fairly—and ensure the displayed shares sum exactly to the receipt total.
6. **Commit only after confirmation.** Treat the record as provisional until the user says to record/save it, unless the user directly gave an unambiguous instruction to記帳. Keep the original total and the split total auditable.
7. **Settle balances.** For a group, calculate each person's paid amount, owed amount, and net balance. Positive means they should receive; negative means they should pay. Simplify transfers into the fewest practical payments, without changing totals.

## Output format

For a new photo, respond in this order:

- **辨識結果**: merchant/date/currency/total and an item table; label uncertain fields.
- **分帳草稿**: each person's items, allocated fees, and exact amount to pay.
- **結算**: who pays whom, or state that everyone is settled.
- **記帳紀錄**: a compact structured record suitable for continuing the ledger.

Do not claim that an expense was permanently saved to an app or database unless a connected tool actually completed that action. In ordinary chat, maintain the ledger in the conversation and offer a CSV/JSON/table export when requested.

## Rules that prevent common errors

- Use the receipt's printed total as the source of truth unless the user corrects it; do not replace it with a reconstructed sum.
- Never convert currencies using an invented rate. Ask for the rate or use a user-provided rate and record its date/source.
- A receipt photographed twice counts once. If two receipts look similar but differ in total/date, ask before merging.
- “代付” affects settlement, not who consumed an item. “不吃／不參加” removes that person from the relevant allocation only.
- When a person paid for the whole group, record the payer separately from participants.
- Do not infer a person's identity from a face, phone number, or private receipt detail; use the names the user supplies.
- Redact or omit card numbers, loyalty IDs, addresses, and other unnecessary sensitive data from the ledger.

For the canonical record, allocation rules, and settlement math, read [references/schema.md](references/schema.md).

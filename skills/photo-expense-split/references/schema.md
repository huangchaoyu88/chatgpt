# Canonical record and calculation rules

Use this as the internal shape of a ledger entry. It may be rendered as a table, JSON, CSV, or natural language; do not expose fields that are unknown.

```json
{
  "id": "local sequential id",
  "merchant": "string or null",
  "date": "YYYY-MM-DD or null",
  "currency": "ISO code or receipt label",
  "source_images": ["short labels only"],
  "items": [
    {
      "name": "string",
      "quantity": 1,
      "unit_price": 0,
      "amount": 0,
      "discount": 0,
      "consumers": ["person names"],
      "confidence": "high|medium|low"
    }
  ],
  "adjustments": [
    {"type": "tax|service|tip|fee|discount|rounding|unknown", "amount": 0}
  ],
  "total": 0,
  "payer": "person name or null",
  "participants": ["person names"],
  "allocation_method": "equal|items|ratio|custom|pending",
  "shares": {"person": 0},
  "status": "draft|confirmed",
  "notes": "assumptions and unresolved questions"
}
```

## Allocation

- **Equal:** divide the confirmed total among included participants. Allocate remainder units deterministically and show the recipients of the extra units.
- **Items:** assign each item to its consumers. If an item is shared by `n` people, divide that item's amount among them with the same smallest-unit remainder rule.
- **Ratio:** if weights are `w_i`, calculate `share_i = total * w_i / sum(w)`, then round while preserving the exact total.
- **Custom:** accept explicit amounts only when their sum equals the total. If not, show the difference and ask whether it is a fee, discount, or correction.
- **Adjustments:** unless the user specifies otherwise, allocate tax/service/tip/fees proportionally to the pre-adjustment item shares; allocate discounts proportionally as a reduction. If there are no item shares, allocate across participants.

## Settlement

For each person:

`net = paid - share`

Positive `net` is receivable; negative `net` is payable. Match payable people to receivable people, using transfers no larger than the remaining balance. Round only at the final smallest currency unit and verify that all transfers net to zero.

If several people paid, preserve each payment in the record. If the user asks for a simpler “誰給誰”, minimize the number of transfers; if they ask for a receipt-style audit, show the full paid/share/net table as well.

## Confirmation prompts

Prefer one compact question containing all blockers, for example:

> 我辨識到總額 ¥12,480，但「飲料」金額看不清楚。這餐是 A、B、C 三人，A 先付全額；要均分，還是按品項分？

Do not ask for confirmation of fields that are already clear and do not pause between every line item.

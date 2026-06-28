# GMN Automation — End-to-End Audit Report

**Auditor:** agent-7 (Claude Opus 4.7)
**Date:** 2026-06-28
**Branch:** `claude/crm-ai-chatbot-automation-LV7NO`
**Scope:** Lead journey for `origem ∈ {FORMS, PROSPECCAO, INDICACAO}` — capture → flows → reply handling → cadence → terminal stages.

---

## Severity legend

- **P0 — blocker** — production will misbehave for the most common path; fix before go-live.
- **P1 — high** — silent corruption / lost notifications / data quality issue; fix this week.
- **P2 — medium** — defensive hardening; race conditions; tail cases.
- **P3 — low** — cosmetics / unused code / future-proofing.

`status`:

- **FIXED** — applied in this commit.
- **REPORT** — risky / behavior change; flagged for human decision.

---

## Findings (applied fixes)

### A1. [P0] `move_stage` could crash if target stage was deleted — **FIXED**

`src/lib/flows/engine.ts` — the `move_stage` branch passed `config.stageId` to Prisma without checking it exists. If an admin deletes the "Perdido" stage after a flow was wired up, the cron tick that tries to run that step throws and stops the loop for the remaining items in that batch (try/catch is per-item but the FK error message is opaque). Now the engine looks up the target stage and skips with `result: { reason: "target_stage_deleted" }`. Also added a branch for `missing_stage_id` (e.g. when `gmn-flows.ts` resolved `perdidoId = undefined` because the pipeline lacks a "Perdido" stage).

### A2. [P0] Template deleted while still referenced by a `FlowStep` would send a blank WhatsApp — **FIXED**

`src/lib/flows/engine.ts` — the `send_whatsapp` branch silently fell through if `prisma.followUpTemplate.findUnique` returned null or `isActive=false`, using `raw = config.message` which is typically empty. The Meta API accepts empty bodies and rejects them at delivery, or sends a stray space message. Now it skips the step with `result: { reason: "template_deleted" | "template_inactive" }`.

### A3. [P0] Unresolved `{{linkAnalise}}` (and other missing vars) sent literally to the lead — **FIXED**

`src/lib/flows/engine.ts` — `button-handler.ts` had a guard for this on `trigger_template`, but the `engine.ts` `send_whatsapp` path did not. So when a Forms lead is moved to "Análise gerada" and `LeadService.customData.linkAnalise` was never filled in, T2A goes out with literal `{{linkAnalise}}` in the body. Now `engine.ts` matches `{{ var }}` after rendering and:
- skips the step (`result: { reason: "unresolved_variables", missing }`),
- creates a `flow_missing_vars` notification for all ADMIN/MANAGER recipients describing exactly which vars are missing and which lead is blocked.

### A4. [P1] No Vercel cron registered → flows never tick in production — **FIXED**

`vercel.json` — the audit prompt called this out. The repo had `/api/cron/flows` and `/api/cron/followups` routes but no `crons` block in `vercel.json`, so on production those endpoints are only callable manually (Bearer-gated). Now wired:

```json
"crons": [
  { "path": "/api/cron/flows",     "schedule": "*/5 * * * *" },
  { "path": "/api/cron/followups", "schedule": "*/10 * * * *" }
]
```

The routes already accept GET (Vercel cron sends GET) by delegating to POST. The Bearer auth is conditional on `CRON_SECRET`; Vercel's GET will not carry that header. **ACTION REQUIRED:** either unset `CRON_SECRET` on Vercel, or configure the cron with an `Authorization` header.

### A5. [P1] INDICAÇÃO lead with no `serviceIds` got no notification — **FIXED**

`src/app/api/leads/route.ts` — the indicação notification was inside the `if (serviceIds && Array.isArray(serviceIds))` block. So `POST /api/leads` with `source=INDICACAO` and no `serviceIds` (which is the documented manual-only path) created a `Lead` silently with no notification, no Activity, and no flow. Now the indicação notification path is outside the serviceIds block and an `Activity` is always written for manual creates.

### A6. [P1] Duplicate `lead_replied` notification when both webhook and `check_response` cron fire — **FIXED**

`src/lib/flows/lead-replied.ts` — `processIncomingMessage` calls `onLeadReplied` fire-and-forget when a message comes in. Then the next cron tick, if a `check_response` step is due, ALSO calls `onLeadReplied` (engine.ts line ~236). Both runs see `stopped > 0` (the second sees the same execution that the first stopped, depending on timing) and both create notifications. Now the function looks for any existing `lead_replied` notification for this lead in the last 5 minutes (via `data->>leadId` JSON filter) and short-circuits the recipient loop if found.

### A7. [P1] WhatsApp-originated leads got assigned to a random pipeline stage — **FIXED**

`src/lib/chatbot/processor.ts` — when an unknown phone messages in, the processor created the Lead, picked `prisma.service.findFirst()` as defaultService, then `prisma.pipelineStage.findFirst({ where: { order: 0 } })` — this latter query returns the first stage of ANY pipeline (GMN, tráfego pago, default), not necessarily the pipeline of `defaultService`. So a WhatsApp lead could land in `Pipeline GMN → Novo lead` while `defaultService = "Tráfego Pago"`, which then triggers GMN flows incorrectly. Fixed by resolving the pipeline of `defaultService.id` first, then taking its first stage; falls back to the default (serviceId=null) pipeline if no dedicated one exists.

### A8. [P2] `button-handler.ts` unused `pattern` var + missing null guards on `stageNamePattern`/`templateId` — **FIXED**

`src/lib/flows/button-handler.ts` — `const pattern = (action.stageNamePattern as string).toLowerCase()` was unused and would crash if `stageNamePattern` was undefined (admin could save a malformed button JSON). Replaced with a typed guard and used `pattern` consistently. Same null-guard added for `trigger_template`'s `templateId`.

### A9. [P2] `move_stage` empty-message guard — **FIXED**

`src/lib/flows/engine.ts` — added a `!message.trim()` check before `sendWhatsAppMessage`, so a misconfigured FlowStep with no template and no `config.message` skips instead of calling Meta with an empty body.

---

## Findings (reported only — risky / behavior change)

### B1. [P0] `POST /api/leads/capture` defaults `source` to `WEBSITE` but GMN Forms flow requires `source = "FORMS"` — **REPORT**

`src/app/api/leads/capture/route.ts:46` — `source: source || "WEBSITE"`. The GMN Forms flow's condition is `{ source: "FORMS" }` (`gmn-flows.ts:99,121`). So if the public form does not pass `source: "FORMS"` explicitly, the lead lands with `source=WEBSITE` and the welcome flow never triggers. The capture endpoint is consumed by an external site (no internal callers found), so I can't tell whether the caller sends `source` correctly. **Recommend:**
- decide whether the default should be `FORMS` (safest for GMN) or keep `WEBSITE` and require the caller to send `source=FORMS`,
- ensure all public forms send `source` explicitly,
- consider an integration test posting an empty body and asserting the trigger fires.

### B2. [P0] Phone lookup is exact-match — phone normalization mismatch loses inbound replies — **REPORT**

Multiple sites do `prisma.lead.findUnique({ where: { phone } })` with the phone string as-given. Forms and the admin UI typically save phones with `+55 11 99999-1234` formatting; the WhatsApp webhook delivers them as `5511999991234` (digits only — `normalizePhone` is only used outbound). So an inbound reply from a lead created via Forms will not find the existing Lead, will create a NEW lead with `source=WHATSAPP`, and the original flow will keep firing into the void. **Recommend:** normalize phones on write (Lead create + update) and at lookup time. Migration needed for existing rows.

### B3. [P1] `mark_lost` button does not stop other running flow executions explicitly — **REPORT**

`src/lib/flows/button-handler.ts:98` — when a lead clicks "Não, obrigado", the button-handler moves the lead to Perdido and sets status=PERDIDO. The cancellation of running flows depends on the upstream `processIncomingMessage` → `onLeadReplied` (fire-and-forget) finishing first. Because `handleButtonClick` is ALSO fire-and-forget at the webhook level, there's a race: `mark_lost` could complete before `onLeadReplied`, and then `triggerFlows` (from a hypothetical `move_stage_by_name` action chained before mark_lost) could spawn a new execution that `onLeadReplied` then cancels. Today there's no such chain, but the implicit dependency is fragile. **Recommend:** call `onLeadReplied` synchronously (await) inside `processIncomingMessage` OR have `mark_lost` explicitly stop all running flows for the lead.

### B4. [P1] Race: cron-driven `check_response` calling `onLeadReplied` can cancel the new flow triggered by a button click — **REPORT**

Same root cause as B3 from a different angle. If a lead clicks a button → webhook → button-handler triggers `move_stage_by_name` → new flow execution starts. Meanwhile a `check_response` step from an old running flow is due. `onLeadReplied` (called from the cron's check_response branch) does `findMany({ status: "running" })` — which now includes the freshly-created execution from the button click — and cancels it. **Recommend:** in `onLeadReplied`, filter executions to those `startedAt < lastMessageAt - 1s` to avoid cancelling executions that started after the message.

### B5. [P1] After button click → "Análise gerada" (PROSPECCAO), no flow fires — **REPORT**

`src/lib/flows/gmn-flows.ts` — the "Forms — Análise enviada" flow has `condition: { source: "FORMS" }`. The "Em contato — Follow-ups" flow only triggers on stage "Em contato", not "Análise gerada". So a Prospecção lead that clicks "Sim, quero receber" moves to "Análise gerada" (T3 sent in-line by button-handler), then sits there silently — no cadence kicks in until a human moves them to "Em contato". **Recommend:** either change "Forms — Análise enviada" `condition` to null (covers both origins, T2A becomes a "send if Forms only" first step), OR add a sibling Prospecção flow with `condition: { source: "PROSPECCAO" }` that fires on "Análise gerada" and starts at T5.

### B6. [P2] `stageByName` does substring match — picks wrong stage if pipeline has overlapping names — **REPORT**

`src/lib/flows/gmn-flows.ts:42-43` — `pipeline.stages.find((s) => s.name.toLowerCase().includes(pattern.toLowerCase()))`. If an admin renames a stage to e.g. "Novo lead (qualificado)" and adds another "Novo lead frio", the lookup returns whichever Postgres returns first. Today the default GMN pipeline names are exact ("Novo lead", "Análise gerada", "Em contato", "Em negociação", "Ganho", "Perdido") so this is latent. **Recommend:** match on exact lowercased name, fall back to substring as a one-off compatibility shim.

### B7. [P2] `onLeadReplied` auto-move "Em contato → Em negociação" without consulting humans — **REPORT**

`src/lib/flows/lead-replied.ts:47-71` — any reply from a lead in "Em contato" auto-promotes to next stage, which triggers the "Em negociação" cadence (T8/T9). This is by design per the audit spec, but consider: a lead that says "preciso pensar" gets promoted to Negociação and immediately receives T8 (proposta). **Recommend:** add a 1-hour grace period and let a human override before auto-promoting, OR keep auto-promote but delay T8 by 4h to allow human intervention.

### B8. [P2] `LeadService.customData.linkAnalise` setter UI not verified — **REPORT**

The "Dados do serviço" UI exists (`src/lib/service-fields.ts` lists the field) but I did not exercise it. Confirm:
- updating `linkAnalise` writes to `LeadService.customData.linkAnalise` (the field, not a flat column),
- the field is visible on the lead detail page,
- there's a UX cue when the lead is about to enter Análise gerada without it filled (the new flow_missing_vars notification in A3 catches this post-hoc, but a pre-flight check is nicer).

### B9. [P2] `processIncomingMessage` reaction/system/order messages still trigger `onLeadReplied` — **REPORT**

A lead "reacting" with a 👍 to a previous AI message is now extracted as `[Reacao: 👍 -> <id>]` and saved as `sender: LEAD`. `onLeadReplied` fires, stops the flow, notifies the team. Probably correct behavior (the lead is engaging), but worth noting. **Recommend:** filter out `reaction` messages from the reply trigger if Ingrid finds them too noisy.

### B10. [P2] `/api/cron/flows` GET endpoint exposes results unauthenticated when CRON_SECRET is unset — **REPORT**

`src/app/api/cron/flows/route.ts:7` — `if (cronSecret && authHeader !== ...)`. If `CRON_SECRET` is empty/unset, the endpoint is wide open (Vercel cron uses GET). **Recommend:** require `CRON_SECRET` to be present in production; either reject if unset, or use Vercel's `x-vercel-cron` header check (only present on Vercel-originated cron calls).

### B11. [P2] `flowStepExecution` query has no row-locking — concurrent crons would double-process — **REPORT**

`src/lib/flows/engine.ts:92` — `processDueFlowSteps` does `findMany({ status: "pending" })` then updates. Two cron invocations starting within seconds of each other (Vercel sometimes overlaps) would both pick the same rows and both try to send. The status update happens AFTER the WhatsApp send. **Recommend:** wrap each step in a transaction with `update({ where: { id, status: "pending" } })` first (optimistic lock), only proceed if the row was claimed. Or move to a dedicated worker queue.

### B12. [P3] `chatbot/processor.ts` `inflightByPhone` Map is in-process only — won't dedupe across Vercel instances — **REPORT**

The per-phone serialization guard helps in dev but is useless on Vercel (each invocation is a fresh Lambda). Already documented in the comment. Real serialization would need a Redis lock or a DB advisory lock. Probably fine for current volume.

### B13. [P3] `ensureGmnFlows` skips updating a flow if any execution is "running" — could leave templates stale forever — **REPORT**

`src/lib/flows/gmn-flows.ts:177-180` — `if (running > 0) continue`. If there's always at least one active lead, the flow definition is frozen. **Recommend:** version flows so new flows are created with `v2` suffix and old ones are deactivated after their executions complete.

### B14. [P3] `extractStatusUpdates` failure path appends `[delivery: failed — reason]` to the original message content — corrupts the audit trail — **REPORT**

`src/app/api/webhook/whatsapp/route.ts:131-141` — instead of a dedicated `Message.deliveryStatus` column. **Recommend:** add a column `Message.deliveryStatus String?` and `Message.deliveryError String?` so the original content stays untouched.

### B15. [P3] `triggerFlows` does not consider `triggerCondition` if `triggerStageId` doesn't match — fine as-is, just noting

Working as intended. No change needed.

---

## What I did NOT test (suggested next pass)

- Webhook signature verification with a real Meta payload (manual curl test).
- The actual `/api/flows/setup-gmn` admin route end-to-end.
- The behavior when a Lead is deleted mid-flow (cascade should handle, but `FlowExecution.leadId` has no FK cascade per the schema — need to verify).
- The `Conversation.isAiActive=false` handoff path: does it block flows from sending more messages? Today flows send via `sendWhatsAppMessage` directly, bypassing the conversation's `isAiActive` flag.
- Concurrent `triggerFlows` calls for the same (lead, flow, leadService) — the idempotency check there is a `findFirst` followed by a `create` without a transaction, so two parallel calls could both create executions.

## Summary

| Severity | Count | Fixed | Reported |
|----------|-------|-------|----------|
| P0       | 5     | 3     | 2        |
| P1       | 6     | 4     | 2        |
| P2       | 8     | 2     | 6        |
| P3       | 5     | 0     | 5        |
| **Total**| **24**| **9** | **15**   |

All applied fixes pass `tsc --noEmit`. Lint not run (project does not have eslint configured beyond the next defaults prompt).

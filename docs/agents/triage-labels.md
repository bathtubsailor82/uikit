# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Canonical role             | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Two species: Actionables and Containers

The triage roles above are the vocabulary of **Actionables** (User
Story / Bug / tracer-bullet slice) — the items that flow through the
triage state machine and end up in an agent's queue.

**Containers** (Feature / PRD) are a different species. They never
enter the triage queue. They carry a single typing label:

| Typing label | Label in our tracker | Meaning                                                                          |
| ------------ | -------------------- | -------------------------------------------------------------------------------- |
| `prd`        | `prd`                | Container (Feature/PRD), parent of tracer-bullet children. Applied by `/to-prd`. |

`prd` is a **typing label, not a canonical triage role** — it marks the
species, it does not move through the triage state machine. A Container
has no triage state: `/to-prd` types it `prd`, `/to-issues` decomposes
it, `/code-review` reviews its perimeter (report-only), and the
maintainer closes it by hand. There are no state labels and no maturity
label for Containers — an idea not yet mature stays in `inbox`; a PRD
not yet prioritised is simply a `prd` on which `/to-issues` hasn't been
invoked.

`/triage` skips `prd` items entirely — it never applies a triage role to
a Container and never lists one in its buckets.

## Local extensions (outside the triage state machine)

Project-specific labels that don't map to a canonical triage role. The
engineering skills ignore these — they're for your own workflow
(area tagging, milestones, etc.). Document them here so a
future maintainer (or agent) understands their intent.

| Label | Purpose | Used by |
| ----- | ------- | ------- |
| `inbox` | Raw human dump captured pre-triage. Lives *before* the triage state machine. Items leave this label by being closed (wontfix), promoted via `/to-prd` (which labels them `prd` — they become Containers), or left to mature. | `/inbox` to create, `/grill-me` and `/grill-with-docs` to process |
| `blocked` | Issue is waiting on an external dependency (upstream fix, third-party API, decision elsewhere). Distinct from `needs-info` which waits on the reporter. | Human + agents (informational only — does not drive triage transitions) |

Add rows as you create custom labels. **Never** assume an extension
label has triage semantics — only the five canonical roles above drive
state transitions. In particular, `/triage` ignores items labelled
`inbox` — they belong to the pre-triage pipeline.

---
tracker: gh
---

# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## Language (working / output axes)

This repo declares two explicit language axes; the actual values live in the standalone language section of `CLAUDE.md`, which is load-bearing — auto-injected every session, it reaches every skill. This paragraph is a near-point-of-use reinforcement for the skills that already open this file (`to-issues`, `code-review`, `inbox`) and for the Ralph executor context.

- **`working_language`** — the language of live, non-persisted interaction: chat replies, grill sessions, review reports shown in the conversation.
- **`output_language`** — the language of artefacts persisted on the tracker: issue/PRD titles and bodies, comments, PR descriptions, commit message bodies. It **inherits** `working_language` unless declared distinct (e.g. a francophone maintainer working in FR on a repo whose issues must stay EN for international contributors).

Some tokens stay **frozen EN** regardless of either axis, because they are technical identifiers and not human prose: tags/labels (`ready-for-agent`, `prd`, `blocked`, …), Conventional Commits prefixes (`feat:`, `fix:`, …), Ralph keywords (`BLOCKED:`), code identifiers, and paths. When in doubt, ask: "is this a technical identifier, or prose for a human?" — an identifier stays EN; prose follows the declared language.

For this repo's declared values, see the standalone language section in `CLAUDE.md`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Parent and child relationships (two layers)

PRD → tracer-bullet relationships live in two independent layers. They can diverge; the **body text is authoritative**. Neither layer is a bash contract function — the tracker contract is relation-free.

- **Canonical — body text.** Each child carries a `## Parent: #N` line naming its parent PRD, and a `## Blocked by` section listing blockers as `Blocked by: #N`. Every decision reads this text (scoping, `/code-review` child enumeration, Ralph's parent hint, dependency ordering).

- **Best-effort — native sub-issues (display only).** GitHub supports native sub-issues (2024+ API). `/to-issues` links a child to its parent for the GitHub UI:

  Prerequisites: `gh` authenticated with a `repo`-scope token; repository on GitHub Pro/Team/Enterprise, or a public repo on Free.

  ```bash
  child_internal_id=$(gh api repos/{owner}/{repo}/issues/{child_number} --jq '.id')
  gh api -X POST repos/{owner}/{repo}/issues/{parent_number}/sub_issues \
      -F sub_issue_id="$child_internal_id"
  ```

  The sub_issues API needs the child's **internal** id (`.id`), not its number; the call is idempotent. This link is **display only** — never read by a decision, and may be absent (older API, insufficient plan/scope, transient failure). Do not block on it.

## Keeping Containers (PRDs) out of Ralph's queue

Ralph's `tracker_next_issue` skips any candidate that carries **both** `prd` and `ready-for-agent` — by label, not by inspecting sub-issues, so a freshly created childless PRD is still skipped. A PRD is typed `prd` by `/to-prd` and never made AFK-ready; if one is accidentally tagged `ready-for-agent`, remove the label with `gh issue edit <number> --remove-label ready-for-agent`.

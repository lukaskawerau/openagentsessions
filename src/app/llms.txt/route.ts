const llmsText = `# openagentsessions.org — llms.txt

Purpose: help an LLM agent guide a human through publishing a training session gist and submitting it.

## What the agent should do

1) Ask the human for a redacted session transcript file (no secrets, tokens, private data).
2) Create a PUBLIC GitHub gist owned by the human's GitHub account.
3) Add a metadata file named openagentsessions.json at gist root.
4) Hand the gist URL to the human for submission on openagentsessions.org.

## Hard requirements (submission validator + moderators)

- gist must be public
- gist must be owned by the same GitHub account used for OAuth login
- forked gists are not accepted
- human must attest: rights to publish + secrets redacted + CC0 intent
- include openagentsessions.json metadata

## Metadata file: openagentsessions.json

Use this exact shape (extend with extra fields if useful):

{
  "schema_version": "1.0",
  "license": "CC0-1.0",
  "consent_confirmed": true,
  "redaction_done": true,
  "created_at": "2026-02-20T00:00:00Z",
  "session": {
    "agent": "pi-coding-agent",
    "model": "claude-sonnet-4",
    "language": "typescript",
    "topic": "auth bugfix"
  },
  "tags": ["bugfix", "auth"]
}

## Example: create gist with GitHub CLI

Given files:
- session.md (or session.json / transcript.txt)
- openagentsessions.json

Run:

gh gist create session.md openagentsessions.json --public --desc "Open agent session (CC0)"

Return the resulting gist URL to the human.

## Human submission flow (after OAuth)

1) Human signs in with GitHub at https://openagentsessions.org
2) Human opens https://openagentsessions.org/submit
3) Paste gist URL
4) Confirm attestation checkbox
5) Submit
6) Wait for moderation (pending -> approved/rejected/removed)

## Safety guidance for the agent

- Never include API keys, passwords, access tokens, internal URLs, customer data.
- Prefer over-redaction to under-redaction.
- If unsure about rights/provenance, stop and ask the human.
`;

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

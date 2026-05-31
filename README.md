# n8n-nodes-faceless-video

An [n8n](https://n8n.io) community node for the **Faceless Video API** — turn a script (a
list of segments) into a captioned, voiced short video (**9:16 / 1:1 / 16:9 MP4**) in one
node, ready to auto-post from your n8n workflows.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) ·
[Compatibility](#compatibility)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/),
or in the n8n UI: **Settings → Community Nodes → Install** `n8n-nodes-faceless-video`.

## Credentials

Create a **Faceless Video API** credential:

- **Base URL** — where your Faceless Video API is hosted (e.g. `https://your-app.onrender.com`).
- **API Key** — the `x-api-key` for your account.

Use the credential's **Test** button to verify the connection.

## Operations

### Video → Generate

Enqueue a render. Add one or more **Segments** (each has **Text** and an optional **Image
URL**), pick a **Voice** and **Aspect Ratio** (9:16 / 1:1 / 16:9), and optionally set a
**Callback URL**.

- **Wait for Completion** (default on): the node polls until the render is `done` and returns
  the final `url`. Turn it off to return immediately with a `job_id` (`status: "queued"`).

### Video → Get Result

Fetch a job by **Job ID**. Returns `{ job_id, status, url?, error? }`
(`status`: `queued | processing | done | failed`).

## Compatibility

Tested against n8n's current community-node API (`n8nNodesApiVersion: 1`). Requires a running
Faceless Video API instance.

## Resources

- Faceless Video API — your self-hosted render service (set its URL as the credential's **Base URL**)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)

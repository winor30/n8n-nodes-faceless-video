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

## Example workflow

**Script → faceless video.** A Manual Trigger feeds three script segments into the node; with
**Wait for Completion** on, the node returns the finished MP4 `url`. Paste this into n8n
(**Workflows → Import from File / clipboard**) and set the **Faceless Video API** credential:

```json
{
  "name": "Script → Faceless Video",
  "nodes": [
    {
      "parameters": {},
      "name": "When clicking 'Execute workflow'",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [240, 320]
    },
    {
      "parameters": {
        "operation": "generate",
        "segments": {
          "segment": [
            { "text": "Did you know honey never spoils?" },
            { "text": "Archaeologists found 3000-year-old honey in Egyptian tombs, still edible." },
            { "text": "Its low moisture and acidity stop bacteria cold." }
          ]
        },
        "voice": "alloy",
        "aspect": "9:16",
        "waitForCompletion": true
      },
      "name": "Faceless Video",
      "type": "n8n-nodes-faceless-video.facelessVideo",
      "typeVersion": 1,
      "position": [480, 320]
    }
  ],
  "connections": {
    "When clicking 'Execute workflow'": {
      "main": [[{ "node": "Faceless Video", "type": "main", "index": 0 }]]
    }
  }
}
```

The **Faceless Video** node outputs:

```json
{ "job_id": "…", "status": "done", "url": "https://your-app.onrender.com/files/<id>.mp4" }
```

Add a download / upload node after it (e.g. HTTP Request, or a YouTube/TikTok node) to
auto-post the result. To return immediately with a `job_id` instead of waiting, turn off
**Wait for Completion** and poll later with **Get Result**.

## Compatibility

Tested against n8n's current community-node API (`n8nNodesApiVersion: 1`). Requires a running
Faceless Video API instance.

## Resources

- Faceless Video API — your self-hosted render service (set its URL as the credential's **Base URL**)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)

// api/parse-event.js
// Vercel Node.js Function for AI Calendar Copilot
// Handles POST /api/parse-event and returns structured calendar event JSON.

/**
 * Build CORS + JSON headers
 */
function buildHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export default {
  async fetch(request) {
    const headers = buildHeaders();

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST is supported" }),
        { status: 405, headers }
      );
    }

    // Parse incoming JSON
    let text = "";
    try {
      const body = await request.json();
      text = typeof body.text === "string" ? body.text : "";
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", details: String(err) }),
        { status: 400, headers }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
        { status: 500, headers }
      );
    }

    // --- LLM CALL -----------------------------------------------------------
    let parsed = null;

    try {
      const openaiRes = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `
Your job is to extract calendar event details from natural language text.
You MUST extract **every person mentioned** unless the text explicitly excludes them.

Rules:
- If text says “add X”, “include X”, “invite X”, “with X”, then X MUST be included in guests.
- If multiple people are mentioned, include ALL of them.
- Do NOT infer people not mentioned (do NOT assume spouse, coworkers, etc.).
- If email is not explicitly given, ask for the email.
- Do NOT hallucinate details.
- Output ONLY valid JSON (no explanation, no commentary).

Return this structure:

{
  "title": string,
  "date": string | null,              // YYYY-MM-DD
  "time": string | null,              // HH:mm (24h)
  "durationMinutes": number | null,
  "guests": [
    { "name": string, "email": string | null }
  ],
  "description": string | null,
  "originalText": string
}
`
              },
              {
                role: "user",
                content: text
              }
            ],
            temperature: 0
          })
        }
      );

      const result = await openaiRes.json();

      // Model returns JSON as a string — parse it
      const raw = result.choices?.[0]?.message?.content || "{}";
      parsed = JSON.parse(raw);

    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "LLM parsing failed",
          details: String(err)
        }),
        { status: 500, headers }
      );
    }
    // ------------------------------------------------------------------------

    // Always keep original text
    parsed.originalText = text;

    return new Response(JSON.stringify(parsed, null, 2), {
      status: 200,
      headers
    });
  }
};

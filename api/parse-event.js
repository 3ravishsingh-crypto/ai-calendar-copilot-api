// api/parse-event.js
// Vercel Node.js Function (Manifest v3-friendly backend)
// Docs: Vercel builds any file inside /api as a serverless function using the Node.js runtime. :contentReference[oaicite:7]{index=7}

/**
 * Helper: common headers so browsers (and your future Chrome extension)
 * can call this endpoint without CORS errors.
 */
function buildHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",            // TODO: tighten later if you want
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

// The Node.js runtime uses the `fetch`-style default export for functions.
export default {
  /**
   * Handles all HTTP methods at /api/parse-event
   * We'll use POST for real work and OPTIONS for CORS preflight.
   */
  async fetch(request) {
    const headers = buildHeaders();

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST is supported at /api/parse-event" }),
        { status: 405, headers }
      );
    }

    let text = "";
    try {
      const body = await request.json();
      text = typeof body.text === "string" ? body.text : "";
    } catch (err) {
      // If JSON is invalid, return a 400 error
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", details: String(err) }),
        { status: 400, headers }
      );
    }

    // Hard-coded example event for now (MVP dummy logic).
    // Later we'll swap this logic out with an LLM.
    const exampleEvent = {
      title: "Sync with Shraddha about AI Calendar Copilot",
      date: "2025-11-20",             // YYYY-MM-DD
      time: "10:00",                  // 24h HH:mm
      durationMinutes: 60,
      guests: [
        {
          name: "Shraddha Patel",
          email: "shrddhptl5@gmail.com"
        }
      ],
      description:
        "Discuss AI Calendar Copilot roadmap, milestones, and next steps.",
      originalText: text || ""
    };

    return new Response(JSON.stringify(exampleEvent, null, 2), {
      status: 200,
      headers
    });
  }
};

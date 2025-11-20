export default {
  async fetch(req, env) {
    const url = new URL(req.url);

  // --- CHORD PRACTICE with global memory (no reminder) ---
if (url.pathname === "/api/challenge") {
  try {
    const userId = "global"; // global memory shared across all users

    // Step 1: get last challenge (if any)
    const lastChallenge = await env.CHORD_MEMORY.get(userId, { type: "json" });

    // Step 2: ask LLM for a *different* chord exercise
    const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: "You are a friendly and encouraging music theory tutor. Prefer less common chords if they have not been used recently." },
        {
          role: "user",
          content: lastChallenge
            ? `Give me a different chord spelling exercise than "${lastChallenge.prompt}". 
               Vary between major, minor, diminished, or augmented triads.
               Return JSON with {prompt, gold_answer, explanation}.`
            : "Give me one simple chord spelling exercise as JSON with {prompt, gold_answer, explanation}."
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "chord_exercise",
          schema: {
            type: "object",
            properties: {
              prompt: { type: "string" },
              gold_answer: { type: "array", items: { type: "string" } },
              explanation: { type: "string" }
            },
            required: ["prompt", "gold_answer", "explanation"]
          }
        }
      },
      temperature: 0.8,
      max_tokens: 200
    });

    // Step 3: clean up and prepare challenge
    const challenge = {
      prompt: result.response.prompt,
      gold_answer: result.response.gold_answer,
      explanation: result.response.explanation,
      timestamp: Date.now()
    };

    // Step 4: store the new challenge globally
    await env.CHORD_MEMORY.put(userId, JSON.stringify(challenge));

    // Step 5: return only the new challenge
    return new Response(JSON.stringify(challenge, null, 2), {
      headers: { "content-type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}    // 🧠 --- CHECK ANSWER (simple grading endpoint) ---

if (url.pathname === "/api/submit" && req.method === "POST") {
  try {
    const { answer, gold_answer } = await req.json();

    // --- Normalize note names ---
    function normalizeNote(note) {
      return note
        .trim()
        .replace(/,/g, "") // remove commas
        .replace(/([A-Ga-g])b/g, (_, p1) => p1.toUpperCase() + "♭") // Eb -> E♭
        .replace(/([A-Ga-g])#/g, (_, p1) => p1.toUpperCase() + "♯") // F# -> F♯
        .toUpperCase();
    }

    // Clean and normalize both arrays
    const a = answer.map(normalizeNote).filter(n => n.length > 0);
    const g = gold_answer.map(normalizeNote);

    // Check for equality
    const correct = a.length === g.length && a.every((n, i) => n === g[i]);

    const message = correct
      ? "✅ Correct! Well done — that’s the right chord."
      : `❌ Not quite. The correct notes are ${g.join(", ")}.`;

    return new Response(JSON.stringify({ message }), {
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
    // 2️⃣ --- STREAMING EXPLANATION (streams text) ---
   // 2️⃣ --- STREAMING EXPLANATION (linked to current challenge) ---
if (url.pathname === "/api/challenge-stream") {
  try {
    // Parse the body from the front-end (it includes the current challenge)
    const { prompt } = await req.json();

    // If no prompt was passed, fall back to a friendly message
    const userPrompt = prompt
      ? `Explain in detail how to build the chord in this exercise: "${prompt}".`
      : "Explain how to build a simple major triad in detail.";

    // Stream AI output
    const stream = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      stream: true,
      messages: [
        { role: "system", content: "You are a kind and knowledgeable music tutor." },
        { role: "user", content: userPrompt }
      ]
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}

    // 3️⃣ --- DEFAULT RESPONSE (for other paths) ---
    return new Response("Hello from Chord Coach v3!");
  }
};
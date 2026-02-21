const OpenAI = require("openai");

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];

const SYSTEM_PROMPT = `You are a business transaction parser for a small Indian micro-entrepreneur billing app called NanoBiz.

Extract structured invoice data from speech. Input can be English, Tamil transliteration (Tanglish), or a mix.

Return ONLY a valid JSON object with these EXACT keys:
{
  "transaction_type": "selling" or "buying" or "payment",
  "party_name": string,
  "item_name": string or null,
  "quantity": number or null,
  "amount": number,
  "payment_method": "cash" or "upi" or "bank" or null
}

TRANSACTION TYPE - use EXACTLY one of these three string values:
- "selling": sold, billed, vitten, vittan, vithar, gave, delivered, supply, vangunar, bill pannen, vittom
- "buying":  bought, purchased, vaanginen, vanginen, vaangi, ordered, vanginar, vaangitar
- "payment": paid, received, collected, kuduthen, kuduthaar, panam vanginen, settled, paisa kuduthen

TAMIL NUMBER WORDS (convert to digits before returning amount):
- onnu/oru=1, rendu/irandu=2, moonu/mundru=3, naalu=4, anju/aindu=5
- aaru=6, ezhu=7, ettu=8, onbathu=9, pathu=10
- irupathu=20, muppathu=30, narppathu=40, ambathu=50, aruvathu=60
- nooru/noooru=100, eranoor/iranunoooru/rendu-nooru=200, moonoor=300, naanoor=400, anjnoor=500
- aayiram=1000, rendu-aayiram=2000, anju-aayiram=5000, pathu-aayiram=10000, latcham=100000
- EXAMPLES: "eranoor rubai"=200, "anju aayiram"=5000, "pathu latcham"=1000000

OTHER RULES:
- party_name: the person or business name mentioned (English or Tamil transliteration)
- If quantity not mentioned, use 1
- If multiple numbers, pick the monetary amount (larger number is usually the price)
- payment_method: cash/rokkam => "cash", upi/gpay/phonepe => "upi", bank/neft/transfer => "bank", else null
- Be forgiving with typos and messy speech
- Return ONLY the JSON object, no explanation, no markdown, no code fences`;

/**
 * POST /api/ai/parse
 */
const parseInvoiceSentence = async (req, res) => {
  try {
    const { sentence } = req.body;

    if (!sentence || typeof sentence !== "string" || !sentence.trim()) {
      return res.status(400).json({ error: "A non-empty sentence is required." });
    }

    let lastError = null;

    for (const model of MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: sentence.trim() },
          ],
        });

        const raw = completion.choices[0].message.content;
        const parsed = JSON.parse(raw);

        // Normalize transaction_type to exactly "selling" / "buying" / "payment"
        const tt = (parsed.transaction_type || "").toLowerCase();
        if (/sell|sale|vit|supply|deliver/.test(tt)) {
          parsed.transaction_type = "selling";
        } else if (/buy|purchas|vaangi|vanginen|order/.test(tt)) {
          parsed.transaction_type = "buying";
        } else if (/pay|receipt|collect|kuduth|settl/.test(tt)) {
          parsed.transaction_type = "payment";
        }

        console.log(`AI parsed [${model}]:`, parsed.transaction_type, "|", parsed.party_name, "|", parsed.amount);
        return res.json(parsed);
      } catch (err) {
        console.warn(`${model} failed: ${err.message?.slice(0, 80)}`);
        lastError = err;
        continue;
      }
    }

    throw lastError;
  } catch (error) {
    console.error("AI parse error:", error.message);
    return res.status(500).json({
      error: "AI parsing failed",
      details: error.message,
    });
  }
};

module.exports = { parseInvoiceSentence };

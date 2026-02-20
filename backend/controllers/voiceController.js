/**
 * @desc   Placeholder for voice-to-text AI processing.
 *         In a real implementation this would accept an audio blob,
 *         send it to an ASR service, and return structured invoice data.
 * @route  POST /api/voice-process
 */
/**
 * @desc   Placeholder for voice-to-text AI processing.
 *         Accepts a text transcript (or audio blob in future)
 *         and returns structured invoice data.
 *
 *         Example Tamil input:
 *         "ravi 200 ruubaiku muttai vangunar"
 *
 *         Returns structured JSON the frontend can auto-fill.
 *
 * @route  POST /api/voice-process
 * @body   { transcript: string }
 */
exports.processVoice = async (req, res) => {
  try {
    const { transcript } = req.body;

    // TODO: Replace with real AI/NLP endpoint
    // For now return mock structured data
    const mockResult = {
      customer_name: "Ravi",
      item_name: "Eggs",
      quantity: 1,
      amount: 200,
    };

    console.log(`[Voice] Received transcript: "${transcript || '(none)'}"`);

    res.json({
      message: "Voice processing complete",
      transcript: transcript || "",
      parsed: mockResult,
    });
  } catch (error) {
    console.error("processVoice error:", error);
    res.status(500).json({ message: "Server error processing voice" });
  }
};

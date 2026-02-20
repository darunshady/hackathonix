/**
 * @desc   Placeholder for voice-to-text AI processing.
 *         In a real implementation this would accept an audio blob,
 *         send it to an ASR service, and return structured invoice data.
 * @route  POST /api/voice-process
 */
exports.processVoice = async (req, res) => {
  try {
    // Placeholder response — replace with real AI integration later
    res.json({
      message: "Voice processing placeholder",
      parsed: {
        customerName: "Sample Customer",
        items: [{ name: "Widget", qty: 2, price: 49.99 }],
      },
    });
  } catch (error) {
    console.error("processVoice error:", error);
    res.status(500).json({ message: "Server error processing voice" });
  }
};

/**
 * Markdown Stripper for Voice Output
 * Converts markdown text to natural speech-friendly text
 */

/**
 * Strip markdown formatting and convert to speech-friendly text
 */
function stripMarkdownForSpeech(text) {
    if (!text) return '';

    let speech = text;

    // Remove HTML tags
    speech = speech.replace(/<[^>]*>/g, '');

    // Remove code blocks (```code```)
    speech = speech.replace(/```[\s\S]*?```/g, '');
    speech = speech.replace(/`([^`]+)`/g, '$1');

    // Remove bold/italic markers but keep text
    speech = speech.replace(/\*\*\*([^*]+)\*\*\*/g, '$1'); // Bold + italic
    speech = speech.replace(/\*\*([^*]+)\*\*/g, '$1');     // Bold
    speech = speech.replace(/\*([^*]+)\*/g, '$1');         // Italic
    speech = speech.replace(/__([^_]+)__/g, '$1');         // Bold (underscore)
    speech = speech.replace(/_([^_]+)_/g, '$1');           // Italic (underscore)

    // Convert headers to normal text (remove # symbols)
    speech = speech.replace(/^#{1,6}\s+(.+)$/gm, '$1');

    // Convert blockquotes to normal text (remove >)
    speech = speech.replace(/^>\s+(.+)$/gm, '$1');

    // Convert links to just the link text [text](url) -> text
    speech = speech.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove reference-style links
    speech = speech.replace(/\[([^\]]+)\]\[[^\]]+\]/g, '$1');

    // Convert unordered list markers to natural speech
    speech = speech.replace(/^\s*[-*+]\s+(.+)$/gm, '$1'); // Remove bullets

    // Convert ordered list numbers to natural speech
    speech = speech.replace(/^\s*\d+\.\s+(.+)$/gm, '$1'); // Remove numbers

    // Remove horizontal rules
    speech = speech.replace(/^[-*_]{3,}$/gm, '');

    // Convert emojis with context (keep them as they add emotion)
    // Note: Emojis are generally okay in TTS - they either get read as names or skipped

    // Remove multiple consecutive line breaks (replace with single space)
    speech = speech.replace(/\n{3,}/g, '\n\n');

    // Convert double line breaks to pause marker
    speech = speech.replace(/\n\n/g, '... ');

    // Convert single line breaks to spaces
    speech = speech.replace(/\n/g, ' ');

    // Clean up multiple spaces
    speech = speech.replace(/\s{2,}/g, ' ');

    // Remove markdown tables
    speech = speech.replace(/\|[^\n]+\|/g, '');

    // Remove strikethrough
    speech = speech.replace(/~~([^~]+)~~/g, '$1');

    // Add natural pauses for better speech flow
    // Add pause after sentences if not already present
    speech = speech.replace(/([.!?])([A-Z])/g, '$1 $2');

    // Trim whitespace
    speech = speech.trim();

    return speech;
}

/**
 * Add natural conversational markers for farmer-friendly speech
 */
function addConversationalMarkers(text) {
    if (!text) return '';

    // Don't modify if it already starts with a conversational marker
    const conversationalStarters = [
        'okay', 'well', 'so', 'hmm', 'alright', 'let me',
        'got it', 'i see', 'makes sense', 'right'
    ];

    const startsWithMarker = conversationalStarters.some(marker =>
        text.toLowerCase().startsWith(marker)
    );

    if (startsWithMarker) {
        return text;
    }

    // Add a natural opening based on content type
    if (text.toLowerCase().includes('weather') || text.toLowerCase().includes('forecast')) {
        return `Okay, so ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
    } else if (text.toLowerCase().includes('plant') || text.toLowerCase().includes('should')) {
        return `Well, ${text}`;
    } else if (text.toLowerCase().includes('irrigate') || text.toLowerCase().includes('water')) {
        return `Hmm, let me check... ${text}`;
    } else {
        // Default conversational opener
        return `Alright, ${text}`;
    }
}

/**
 * Optimize text for natural TTS speech with Nova voice
 */
function optimizeForNovaVoice(text, options = {}) {
    const {
        addConversational = true,
        maxLength = null,
        language = 'auto' // 'en', 'sw', or 'auto'
    } = options;

    // Strip markdown first
    let speech = stripMarkdownForSpeech(text);

    // Add conversational markers if requested
    if (addConversational) {
        speech = addConversationalMarkers(speech);
    }

    // Truncate if too long (to stay within TTS limits)
    if (maxLength && speech.length > maxLength) {
        // Find last complete sentence within limit
        const truncated = speech.substring(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        const lastQuestion = truncated.lastIndexOf('?');
        const lastExclamation = truncated.lastIndexOf('!');

        const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

        if (lastSentenceEnd > 0) {
            speech = truncated.substring(0, lastSentenceEnd + 1);
        } else {
            speech = truncated + '...';
        }
    }

    return speech;
}

/**
 * Build TTS instructions for farmer-friendly, natural speech
 */
function buildVoiceInstructions(language = 'en') {
    const baseInstructions = `You are FarmerChat, a friendly agricultural advisor speaking to Kenyan farmers.
Speak warmly, patiently, and conversationally - like a helpful neighbor, not a robot.
Use a moderate pace, be clear but not slow.
Keep your tone encouraging and supportive.`;

    if (language === 'sw') {
        return baseInstructions + ` Speak in Swahili with a natural Kenyan accent.`;
    } else if (language === 'en') {
        return baseInstructions + ` Speak in English with a warm, friendly tone suitable for Kenyan farmers.`;
    } else {
        return baseInstructions + ` Speak naturally in the language of the text provided.`;
    }
}

// Export for use in other scripts
window.markdownStripper = {
    stripMarkdownForSpeech,
    addConversationalMarkers,
    optimizeForNovaVoice,
    buildVoiceInstructions
};

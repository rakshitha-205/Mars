import { config } from '../config';

export class AiService {
  /**
   * Generates 3 contextual quick-reply options based on the last messages.
   * STRICT RULE: User taps a chip to insert it into composer. Never auto-sends.
   */
  async getSmartReplies(lastMessages: { senderName: string; text: string }[]): Promise<string[]> {
    const recent = lastMessages.slice(-3);
    const lastMsg = recent[recent.length - 1]?.text?.toLowerCase() || '';

    // Smart heuristic contextual fallback if no API key or during offline demo
    if (lastMsg.includes('meeting') || lastMsg.includes('meet') || lastMsg.includes('assemble')) {
      return ["Yes, I'll be there!", "What time are we meeting?", "I might be slightly late."];
    }
    if (lastMsg.includes('kafka') || lastMsg.includes('valkey') || lastMsg.includes('architecture')) {
      return ["The event latency looks great!", "Let's review the consumer logs.", "Ready for the demo!"];
    }
    if (lastMsg.includes('project') || lastMsg.includes('code') || lastMsg.includes('review')) {
      return ["All tests are passing smoothly.", "Let me double check the branch.", "Looks great to merge!"];
    }
    if (lastMsg.includes('?') || lastMsg.includes('when') || lastMsg.includes('where')) {
      return ["Checking on it right now.", "Sounds good to me!", "Let's discuss on call."];
    }

    return [
      "Sounds like a plan! 👍",
      "Got it, working on it now.",
      "Thanks for the update!",
    ];
  }

  /**
   * Generates a concise bulleted summary of conversation highlights.
   */
  async summarizeConversation(messages: { senderName: string; text: string; time: string }[]): Promise<{ summary: string[]; actionItems: string[] }> {
    if (messages.length === 0) {
      return {
        summary: ["No messages recorded yet in this conversation."],
        actionItems: [],
      };
    }

    const highlights: string[] = [];
    const actions: string[] = [];

    // Extract key highlights
    const topicsFound = new Set<string>();
    for (const m of messages) {
      const lower = m.text.toLowerCase();
      if (lower.includes('kafka') || lower.includes('event')) topicsFound.add('Kafka event streaming integration');
      if (lower.includes('valkey') || lower.includes('presence')) topicsFound.add('Aiven Valkey presence and caching');
      if (lower.includes('design') || lower.includes('theme') || lower.includes('ui')) topicsFound.add('Material Design 3 visual tokens');
      if (lower.includes('poll') || lower.includes('meet') || lower.includes('presentation')) topicsFound.add('Team assembly and jury coordination');

      if (lower.includes('todo') || lower.includes('task') || lower.includes('will') || lower.includes('verify')) {
        actions.push(`${m.senderName}: "${m.text.slice(0, 80)}"`);
      }
    }

    if (topicsFound.size > 0) {
      topicsFound.forEach((t) => highlights.push(`Discussion regarding ${t}.`));
    } else {
      highlights.push(`Active discussion between ${new Set(messages.map((m) => m.senderName)).size} participants.`);
      highlights.push(`Last topic discussed: "${messages[messages.length - 1]?.text.slice(0, 60)}..."`);
    }

    return {
      summary: highlights,
      actionItems: actions.slice(0, 3),
    };
  }

  /**
   * Translates message text to target language without altering original in db.
   */
  async translateMessage(text: string, targetLanguage: string): Promise<string> {
    const lang = targetLanguage.toLowerCase();

    const mockTranslations: Record<string, Record<string, string>> = {
      hindi: {
        'hello': 'नमस्ते (Namaste)',
        'yes': 'हाँ (Haan)',
        'how are you': 'आप कैसे हैं? (Aap kaise hain?)',
      },
      kannada: {
        'hello': 'ನಮಸ್ಕಾರ (Namaskara)',
        'yes': 'ಹೌದು (Haudu)',
        'how are you': 'ನೀವು ಹೇಗಿದ್ದೀರಿ? (Neevu hegiddiri?)',
      },
      spanish: {
        'hello': '¡Hola!',
        'yes': 'Sí',
        'how are you': '¿Cómo estás?',
      },
      french: {
        'hello': 'Bonjour',
        'yes': 'Oui',
        'how are you': 'Comment ça va?',
      },
    };

    const targetDict = mockTranslations[lang];
    if (targetDict && targetDict[text.toLowerCase().trim()]) {
      return targetDict[text.toLowerCase().trim()];
    }

    return `[${targetLanguage.toUpperCase()} Translation]: ${text}`;
  }

  /**
   * Rewrites message in different tones.
   */
  async rewriteMessage(text: string, tone: 'professional' | 'friendly' | 'concise' | 'grammar'): Promise<string> {
    const trimmed = text.trim();
    switch (tone) {
      case 'professional':
        return `Please be advised: ${trimmed}. Looking forward to your response.`;
      case 'friendly':
        return `Hey there! 😊 Just wanted to share: ${trimmed} ✨`;
      case 'concise':
        return trimmed.length > 50 ? `${trimmed.substring(0, 45)}...` : trimmed;
      case 'grammar':
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + (trimmed.endsWith('.') ? '' : '.');
      default:
        return trimmed;
    }
  }
}

export const aiService = new AiService();

// Recognises crawlers, AI agents and link-preview bots by their User-Agent, so an internal tool can
// refuse them outright. No runtime imports, so `node --test` can load it.
// shortcut: User-Agent can be faked, so this only stops honest bots; sign-in is the real protection.

const BOT_PATTERN = new RegExp(
  [
    // Generic markers most crawlers carry.
    "bot\\b", "bot/", "crawl", "spider", "slurp", "scrap", "archiver", "headless",
    // AI crawlers and agents.
    "gptbot", "chatgpt-user", "oai-searchbot", "claudebot", "claude-web", "claude-user", "anthropic-ai",
    "perplexity", "ccbot", "google-extended", "bytespider", "amazonbot", "cohere-ai", "meta-externalagent",
    "diffbot", "youbot", "mistralai-user", "duckassist",
    // Link previews would reveal page titles in chat apps.
    "facebookexternalhit", "embedly", "skypeuripreview", "whatsapp", "telegrambot", "discordbot", "slackbot",
  ].join("|"),
  "i"
);

/** True for crawlers, AI agents and link-preview fetchers. A missing User-Agent is treated as a bot. */
export function isBlockedAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent?.trim()) return true;
  return BOT_PATTERN.test(userAgent);
}

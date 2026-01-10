/**
 * WhatsApp Formatting Utilities
 * Converts standard markdown to WhatsApp format
 */

/**
 * Convert markdown formatting to WhatsApp format
 * - **bold** -> *bold* (WhatsApp uses single asterisks)
 * - __bold__ -> *bold*
 * - *italic* stays the same in some cases, but we focus on bold
 * - _italic_ -> _italic_ (already correct)
 * - ~~strike~~ -> ~strike~ (WhatsApp uses single tilde)
 * - ```code``` -> ```code``` (already correct)
 */
export function formatForWhatsApp(text) {
  if (!text) return text;
  
  // Convert **bold** to *bold* (WhatsApp uses single asterisks for bold)
  let formatted = text.replace(/\*\*([^*]+)\*\*/g, '*$1*');
  
  // Convert __bold__ to *bold*
  formatted = formatted.replace(/__([^_]+)__/g, '*$1*');
  
  // Convert ~~strikethrough~~ to ~strikethrough~ (WhatsApp uses single tilde)
  formatted = formatted.replace(/~~([^~]+)~~/g, '~$1~');
  
  return formatted;
}

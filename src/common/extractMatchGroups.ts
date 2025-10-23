/**
 * Extract issue key, content (title/comment), and keywords from regex match groups
 * Supports both named capture groups and positional capture groups
 */
export const extractMatchGroups = (
  match: RegExpMatchArray,
): { issueKey: string | null; content: string; keywords: string } => {
  if (match.groups) {
    // Detect named capture groups
    // Support both 'comment' and 'title' for PR and Commit
    const content = match.groups.comment || match.groups.title || "";

    return {
      issueKey: match.groups.issueKey || null,
      content,
      keywords: match.groups.keywords || "",
    };
  }

  // Positional capture groups - use existing logic
  const [
    ,
    extractedIssueKey = null,
    extractedContent = "",
    extractedKeywords = "",
  ] = match;
  return {
    issueKey: extractedIssueKey,
    content: extractedContent,
    keywords: extractedKeywords,
  };
};

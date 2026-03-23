export function renderMessageContent(content: string, isSent: boolean) {
  const rdvRegex = /\[RDV:([^\]]+)\]/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let segmentIndex = 0;

  const processTextSegment = (text: string, baseKey: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let lastUrlIndex = 0;
    let urlIndex = 0;
    let urlMatch;
    const regex = new RegExp(urlRegex.source, "g");
    while ((urlMatch = regex.exec(text)) !== null) {
      if (urlMatch.index > lastUrlIndex) {
        const rawText = text.slice(lastUrlIndex, urlMatch.index);
        result.push(
          <span key={`${baseKey}-t-${urlIndex}`} style={{ whiteSpace: "pre-line" }}>{rawText}</span>
        );
      }
      const url = urlMatch[0];
      result.push(
        <a
          key={`${baseKey}-u-${urlIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={isSent
            ? "underline text-white/90 hover:text-white"
            : "underline text-[#722F37] hover:text-[#5a252c]"
          }
        >
          {url}
        </a>
      );
      lastUrlIndex = urlMatch.index + url.length;
      urlIndex++;
    }
    if (lastUrlIndex < text.length) {
      result.push(
        <span key={`${baseKey}-t-${urlIndex}`} style={{ whiteSpace: "pre-line" }}>{text.slice(lastUrlIndex)}</span>
      );
    }
    return result;
  };

  let match;
  while ((match = rdvRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const rawText = content.slice(lastIndex, match.index);
      processTextSegment(rawText, `seg-${segmentIndex}`).forEach(el => parts.push(el));
      segmentIndex++;
    }
    const path = match[1];
    const label = path.includes("prendre-rdv")
      ? "📅 Prendre un rendez-vous"
      : "🔗 Ouvrir le lien";
    parts.push(
      <a
        key={`rdv-${segmentIndex}`}
        href={path}
        className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isSent
            ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
            : "bg-[#722F37]/10 hover:bg-[#722F37]/20 text-[#722F37] border border-[#722F37]/30"
        }`}
      >
        {label}
      </a>
    );
    lastIndex = rdvRegex.lastIndex;
    segmentIndex++;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    processTextSegment(remaining, `seg-${segmentIndex}`).forEach(el => parts.push(el));
  }

  return <div className="flex flex-col gap-0.5">{parts}</div>;
}

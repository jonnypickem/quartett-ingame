const canUseNavigator = () => typeof navigator !== "undefined";

export const copyText = async (text: string): Promise<boolean> => {
  if (!text) {
    return false;
  }

  if (canUseNavigator() && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to the legacy copy path below.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.top = "0";
  textarea.style.left = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
};

export const shareOrCopyInvite = async (sessionCode: string, joinUrl: string): Promise<string> => {
  if (canUseNavigator() && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: "Join my Quartett game",
        text: `Join with code ${sessionCode}`,
        url: joinUrl
      });
      return "Invite link ready to share.";
    } catch {
      // User canceled or the environment failed. Continue to copy fallback.
    }
  }

  const copied = await copyText(joinUrl);
  if (copied) {
    return "Invite link copied.";
  }

  return `Could not auto-copy. Share this link: ${joinUrl}`;
};

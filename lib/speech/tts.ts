export type SpeakResult = "spoken" | "no_voice" | "unsupported";

function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return [];
  }

  return window.speechSynthesis.getVoices();
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = getVoices();
  const normalized = lang.toLowerCase();
  const prefix = normalized.split("-")[0];

  const exact = voices.find((voice) => voice.lang.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }

  const byPrefix = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(prefix)
  );
  return byPrefix ?? null;
}

export function speak({
  text,
  lang,
}: {
  text: string;
  lang: string;
}): SpeakResult {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return "unsupported";
  }

  const voice = pickVoice(lang);

  if (!voice) {
    return "no_voice";
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return "spoken";
}

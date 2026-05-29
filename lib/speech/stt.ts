function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSupported(): boolean {
  return getSpeechRecognition() !== null;
}

export function recognise({ lang }: { lang: string }): Promise<string> {
  const SpeechRecognition = getSpeechRecognition();

  if (!SpeechRecognition) {
    return Promise.reject(new Error("UNSUPPORTED"));
  }

  return new Promise((resolve, reject) => {
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();

      if (transcript) {
        resolve(transcript);
        return;
      }

      reject(new Error("NO_RESULT"));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      reject(new Error(event.error));
    };

    recognition.onend = () => {};

    recognition.start();
  });
}

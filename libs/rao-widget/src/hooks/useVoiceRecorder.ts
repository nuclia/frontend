import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionEventListener = (event: SpeechRecognitionEvent) => void;

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  error?: string;
};

type SpeechRecognitionResultList = ArrayLike<SpeechRecognitionResult>;

type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative | undefined;
};

type SpeechRecognitionAlternative = {
  transcript: string;
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  addEventListener: (type: string, listener: SpeechRecognitionEventListener) => void;
  removeEventListener: (type: string, listener: SpeechRecognitionEventListener) => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const getSpeechRecognitionCtor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
};

const getTranscriptFromResults = (results: SpeechRecognitionResultList) => {
  const transcript: string[] = [];

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (!result) {
      continue;
    }

    const alternative = result[0];
    if (!alternative) {
      continue;
    }

    transcript.push(alternative.transcript.trim());
  }

  return transcript.join(' ').replace(/\s+/g, ' ').trim();
};

export const useVoiceRecorder = (lang = 'en-US') => {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctor = getSpeechRecognitionCtor();
    if (!ctor) {
      setIsSupported(false);
      return;
    }

    const recognition = new ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    const handleStart: SpeechRecognitionEventListener = () => {
      setIsRecording(true);
      setError(null);
    };

    const handleEnd: SpeechRecognitionEventListener = () => {
      setIsRecording(false);
    };

    const handleResult: SpeechRecognitionEventListener = (event) => {
      const nextTranscript = getTranscriptFromResults(event.results);
      if (nextTranscript) {
        setTranscript(nextTranscript);
      }
    };

    const handleError: SpeechRecognitionEventListener = (event) => {
      setError(event.error ?? 'Voice recording failed');
      setIsRecording(false);
    };

    recognition.addEventListener('start', handleStart);
    recognition.addEventListener('end', handleEnd);
    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      recognition.removeEventListener('start', handleStart);
      recognition.removeEventListener('end', handleEnd);
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('error', handleError);
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [lang]);

  const toggleRecording = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      setError('Speech recognition is not available');
      return;
    }

    setError(null);

    if (isRecording) {
      recognition.stop();
      return;
    }

    setTranscript('');
    setIsRecording(true);
    try {
      recognition.start();
    } catch (startError) {
      setError((startError as Error)?.message ?? 'Unable to start recording');
      recognition.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    recognition.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    error,
    hasSupport: isSupported,
    isRecording,
    resetTranscript,
    stopRecording,
    toggleRecording,
    transcript,
  } as const;
};

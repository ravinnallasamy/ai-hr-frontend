import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, StopIcon } from './icons';

interface VoiceInputProps {
  onTranscriptChange: (transcript: string) => void;
  isAsking: boolean;
}

// @ts-ignore
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscriptChange, isAsking }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Initialize recognition once and use refs to avoid re-initialization
  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      onTranscriptChange(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      // Restart recognition if it ends prematurely while we are still in listening mode.
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Recognition might already be starting
          console.warn('Recognition start error:', e);
        }
      }
    };
    
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            isListeningRef.current = false;
        }
    }

  }, [onTranscriptChange]);
  
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      isListeningRef.current = false;
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  };

  if (!SpeechRecognition) {
    return <p className="text-sm text-red-500">Voice input is not supported by your browser.</p>;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={isAsking}
      className={`p-3 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        isListening
          ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
          : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500'
      } ${isAsking ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
    </button>
  );
};

export default VoiceInput;
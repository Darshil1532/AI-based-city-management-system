/**
 * Google Voice-to-Text Browser Service
 * 
 * Uses the Web Speech API (powered natively by Google Speech Recognition in Chromium browsers)
 * with real-time interim speech transcription so citizens see what they are speaking live on screen.
 */

export interface SpeechRecognitionCallbacks {
  onInterim: (transcript: string) => void;
  onFinal: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

// Typing for Web Speech API
type SpeechRecognitionInstance = any;

class SpeechRecognitionService {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening: boolean = false;
  private interimTranscript: string = '';
  private finalTranscript: string = '';
  private callbacks: SpeechRecognitionCallbacks | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  public startListening(callbacks: SpeechRecognitionCallbacks): boolean {
    if (!this.isSupported()) {
      callbacks.onError?.('Voice-to-text is not supported in this browser. Please use Chrome, Edge, or type your message.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.callbacks = callbacks;
      this.interimTranscript = '';
      this.finalTranscript = '';

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = navigator.language || 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks?.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            this.finalTranscript += ' ' + item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        this.interimTranscript = currentInterim;
        const liveDisplay = (this.finalTranscript + ' ' + this.interimTranscript).trim();
        this.callbacks?.onInterim?.(liveDisplay);
      };

      this.recognition.onerror = (event: any) => {
        // Handle common minor voice events (like 'no-speech' gracefully)
        if (event.error === 'no-speech') {
          return;
        }
        console.warn('[Speech Recognition Error]:', event.error);
        this.callbacks?.onError?.(`Voice error: ${event.error}`);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        const total = (this.finalTranscript + ' ' + this.interimTranscript).trim();
        this.callbacks?.onEnd?.();
        if (total) {
          this.callbacks?.onFinal?.(total);
        }
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.error('[Speech Recognition Start Error]:', err);
      callbacks.onError?.(err?.message || 'Could not access microphone.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Speech recognition stop warning:', err);
      }
    }
    this.isListening = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechService = new SpeechRecognitionService();

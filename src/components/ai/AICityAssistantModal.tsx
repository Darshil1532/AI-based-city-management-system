import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/ai/speechRecognitionService';
import { aiChatService, ChatMessage, GeneratedComplaintDraft } from '../../services/ai/aiChatService';
import { LocationCoordinates } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
  FileText,
  Volume2,
  Shield,
  HelpCircle,
} from 'lucide-react';

export const AICityAssistantModal: React.FC = () => {
  const navigate = useNavigate();
  const { submitComplaint, currentUser } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Hello! I am your SmartCity AI Civic Assistant powered by Gemini 3.1 Flash Lite. You can ask me how municipal services work, ask about city departments, or tell me about any civic issue you are facing. You can type or hold the microphone button below to speak.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);

  // Attached image for complaint
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Drafted AI Complaint Card
  const [draftedComplaint, setDraftedComplaint] = useState<GeneratedComplaintDraft | null>(null);
  const [isSynthesizingDraft, setIsSynthesizingDraft] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [submitSuccessId, setSubmitSuccessId] = useState<string | null>(null);

  // Geolocation
  const [userCoords, setUserCoords] = useState<LocationCoordinates>({
    latitude: 23.2332,
    longitude: 77.4343,
    address: 'Near Municipal Center, City Zone',
    landmark: 'Municipal Square',
    district: 'Central Municipal Zone',
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceTimeoutRef = useRef<any>(null);

  // Check speech recognition support and acquire initial GPS
  useEffect(() => {
    setIsVoiceSupported(speechService.isSupported());

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          }));
        },
        () => {
          // Graceful fallback to default Bhopal coordinates
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, liveTranscript, draftedComplaint, isSending]);

  // Voice Push-to-Talk Handlers
  const handleVoiceStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isVoiceSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or use text chat.');
      return;
    }

    setLiveTranscript('');
    setIsVoiceRecording(true);

    speechService.startListening({
      onInterim: (text) => {
        setLiveTranscript(text);
      },
      onFinal: (finalText) => {
        setLiveTranscript(finalText);
      },
      onError: (err) => {
        console.warn('Voice recognition error:', err);
        setIsVoiceRecording(false);
      },
      onEnd: () => {
        setIsVoiceRecording(false);
      },
    });
  };

  const handleVoiceEnd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isVoiceRecording) return;

    speechService.stopListening();
    setIsVoiceRecording(false);

    // Give a 200ms grace period for final transcript buffer
    clearTimeout(voiceTimeoutRef.current);
    voiceTimeoutRef.current = setTimeout(() => {
      if (liveTranscript.trim()) {
        const spoken = liveTranscript.trim();
        setLiveTranscript('');
        handleSendMessage(spoken);
      }
    }, 250);
  };

  // Send message to Gemini
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText('');
    setLiveTranscript('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsSending(true);

    try {
      const historyPayload = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await aiChatService.sendChatMessage(historyPayload, userCoords);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If the citizen spoke about a problem, proactively offer/prepare complaint draft
      const lower = text.toLowerCase();
      const problemKeywords = [
        'pothole',
        'road',
        'damage',
        'garbage',
        'waste',
        'trash',
        'water',
        'leak',
        'pipe',
        'streetlight',
        'light',
        'dark',
        'traffic',
        'signal',
        'drain',
        'sewage',
        'broken',
        'overflow',
        'hazard',
        'complaint',
        'issue',
        'problem',
      ];

      const hasIssueIntent = problemKeywords.some((k) => lower.includes(k));
      if (hasIssueIntent && !draftedComplaint) {
        // Auto-generate draft proposal
        handleGenerateDraft(newMessages);
      }
    } catch (err: any) {
      console.error('Failed to get AI chat reply:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content:
          'I apologize, I am temporarily having trouble reaching the Gemini service. Please check your internet connection or use the manual "Report an Issue" form.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Generate Complaint from conversation
  const handleGenerateDraft = async (customMessages?: ChatMessage[]) => {
    const msgs = customMessages || messages;
    const conversationText = msgs
      .map((m) => `${m.role === 'user' ? 'Citizen' : 'AI'}: ${m.content}`)
      .join('\n');

    setIsSynthesizingDraft(true);
    try {
      const draft = await aiChatService.generateComplaintFromChat(
        conversationText,
        userCoords,
        !!attachedImage
      );
      setDraftedComplaint(draft);
    } catch (err: any) {
      console.warn('Could not auto-generate draft:', err);
    } finally {
      setIsSynthesizingDraft(false);
    }
  };

  // Submit AI Generated Complaint to Authoritative Backend
  const handleSubmitAIDraft = async () => {
    if (!draftedComplaint || isSubmittingDraft) return;

    setIsSubmittingDraft(true);
    try {
      const created = await submitComplaint({
        title: draftedComplaint.title,
        description: draftedComplaint.description,
        category: draftedComplaint.category,
        severity: draftedComplaint.severity,
        location: {
          latitude: draftedComplaint.location.latitude,
          longitude: draftedComplaint.location.longitude,
          address: draftedComplaint.location.address,
          landmark: draftedComplaint.location.landmark || draftedComplaint.location.address,
          district: draftedComplaint.location.district || 'Municipal Zone',
        },
        image: attachedImage || undefined,
        citizenName: currentUser?.name || 'Citizen User',
        citizenPhone: currentUser?.phone || undefined,
      });

      setSubmitSuccessId(created.id);
      setIsSubmittingDraft(false);

      // Add confirmation message to chat
      const confirmationMsg: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: 'model',
        content: `🎉 Complaint successfully submitted! Tracking ID: **${created.id}**. Redirecting you to the live tracking page now...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, confirmationMsg]);

      // Navigate to tracking after 1.2 seconds so citizen sees the transition
      setTimeout(() => {
        setIsOpen(false);
        navigate(`/track?id=${created.id}`);
      }, 1200);
    } catch (err: any) {
      setIsSubmittingDraft(false);
      alert(err?.message || 'Failed to submit complaint to municipal server. Please try again.');
    }
  };

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content:
          'Conversation reset. I am ready to answer your civic questions or help you draft another complaint!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setDraftedComplaint(null);
    setAttachedImage(null);
    setSubmitSuccessId(null);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right Corner) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full clay-btn clay-btn-primary shadow-xl hover:scale-105 active:scale-95 transition-all text-white"
            aria-label="Open SmartCity AI Civic Assistant"
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-blue-400 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>Ask City AI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-blue-500/30 text-blue-200">
                  Gemini
                </span>
              </span>
              <span className="text-[10px] text-slate-300 font-medium">Voice & Triage Assistant</span>
            </div>
          </button>
        </div>
      )}

      {/* Expanded Floating AI Assistant Box */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] flex flex-col rounded-3xl clay-card overflow-hidden shadow-2xl border border-white/80 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header Bar */}
          <div className="px-4 py-3.5 border-b border-slate-200/60 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight">SmartCity AI Assistant</h3>
                  <span className="text-[9px] font-mono bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded-full font-semibold">
                    Gemini 3.1 Flash Lite
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Municipal Guidance & Auto-Filing</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Context / GPS Notice */}
          <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
              <span className="truncate">Auto-GPS: {userCoords.address || 'Bhopal City Center'}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-semibold shrink-0">GPS Ready</span>
          </div>

          {/* Message Thread Area */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'clay-btn-blue text-white shadow-xs'
                        : 'clay-card text-slate-800 border border-slate-100/90'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{m.timestamp}</span>
                </div>
              );
            })}

            {/* Live Interim Speech Preview Banner (User sees what they are speaking in real time) */}
            {isVoiceRecording && (
              <div className="clay-card p-3 rounded-2xl bg-amber-50/90 border border-amber-200/60 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold text-amber-800">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    <span>Listening live via Google Voice...</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-amber-600">Release to send</span>
                </div>
                <div className="text-xs text-amber-950 font-medium italic min-h-[1.5rem] bg-white/70 p-2 rounded-xl clay-inset">
                  {liveTranscript || 'Start speaking your issue or question...'}
                </div>
              </div>
            )}

            {/* AI Thinking Indicator */}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium p-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Gemini 3.1 Flash Lite is responding...</span>
              </div>
            )}

            {/* Synthesizing Draft Indicator */}
            {isSynthesizingDraft && (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold p-2 bg-blue-50 rounded-xl clay-inset">
                <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
                <span>Extracting category, severity, and map location from your report...</span>
              </div>
            )}

            {/* Interactive AI Generated Complaint Card */}
            {draftedComplaint && !submitSuccessId && (
              <div className="clay-card rounded-2xl p-4 border border-blue-200/80 bg-gradient-to-b from-white to-blue-50/30 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>AI Generated Complaint Ready</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {Math.round(draftedComplaint.confidence * 100)}% Confidence
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2">
                    {draftedComplaint.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg clay-inset">
                      {draftedComplaint.category}
                    </span>
                    <PriorityBadge priority={draftedComplaint.severity} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 bg-white p-2 rounded-xl clay-inset leading-relaxed">
                    {draftedComplaint.description}
                  </p>
                </div>

                {/* Location Badge */}
                <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-100/70 p-2 rounded-xl clay-inset">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <span className="font-bold text-slate-700 block truncate">
                      {draftedComplaint.location.landmark || draftedComplaint.location.address}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {draftedComplaint.location.latitude.toFixed(4)}°N, {draftedComplaint.location.longitude.toFixed(4)}°E
                    </span>
                  </div>
                </div>

                {/* Attached Photo Preview if Present */}
                {attachedImage && (
                  <div className="relative rounded-xl overflow-hidden h-24 border border-slate-200">
                    <img src={attachedImage} alt="Issue Evidence" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                      Attached Photo
                    </span>
                  </div>
                )}

                {/* CTA Action: Submit AI Generated Complaint */}
                <button
                  type="button"
                  onClick={handleSubmitAIDraft}
                  disabled={isSubmittingDraft}
                  className="w-full clay-btn clay-btn-primary py-2.5 px-4 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-98 transition-all"
                >
                  {isSubmittingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Submitting to Municipal Intake Server...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Submit AI Generated Complaint</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Chips & Attached Image preview */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
            <div className="flex items-center gap-1.5">
              {!draftedComplaint && (
                <button
                  type="button"
                  onClick={() => handleGenerateDraft()}
                  disabled={isSynthesizingDraft || messages.length <= 1}
                  className="clay-btn clay-btn-secondary px-2.5 py-1 text-[10px] font-bold text-blue-700 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-blue-500" />
                  <span>Draft Complaint</span>
                </button>
              )}

              {/* Attach Image Trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo of the issue"
                className={`clay-btn clay-btn-secondary px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 ${
                  attachedImage ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600'
                }`}
              >
                <ImageIcon className="w-3 h-3" />
                <span>{attachedImage ? 'Photo Attached' : 'Attach Photo'}</span>
              </button>

              {attachedImage && (
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="text-slate-400 hover:text-rose-500"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <span className="text-[10px] text-slate-400 font-mono">
              {currentUser?.name?.split(' ')[0] || 'Citizen'}
            </span>
          </div>

          {/* Input & Voice Controls Footer */}
          <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask anything or describe an issue..."
                disabled={isVoiceRecording || isSending}
                className="flex-1 clay-inset px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {/* Hold for Voice Input Button (with live speech display) */}
              <button
                type="button"
                onMouseDown={handleVoiceStart}
                onMouseUp={handleVoiceEnd}
                onTouchStart={handleVoiceStart}
                onTouchEnd={handleVoiceEnd}
                title="Hold to speak (Google Voice to Text) / Release to send"
                className={`p-2.5 rounded-xl clay-btn transition-all ${
                  isVoiceRecording
                    ? 'bg-rose-600 text-white scale-110 shadow-lg animate-pulse ring-2 ring-rose-400'
                    : 'clay-btn-secondary text-slate-700 hover:text-blue-600'
                }`}
              >
                {isVoiceRecording ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl clay-btn clay-btn-primary text-white disabled:opacity-40 transition-all"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Hold mic to speak live • Tap Enter to chat</span>
              <span className="font-mono">Gemini 3.1</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

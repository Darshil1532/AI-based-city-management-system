import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/ai/speechRecognitionService';
import { aiChatService, ChatMessage, GeneratedComplaintDraft } from '../../services/ai/aiChatService';
import { LocationCoordinates, ComplaintCategory, PriorityLevel } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import {
  Mic,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  Crosshair,
  Edit3,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Landmark,
} from 'lucide-react';

const CATEGORIES: ComplaintCategory[] = [
  'Pothole / Road',
  'Garbage / Waste',
  'Water Leakage',
  'Streetlight',
  'Traffic',
  'Infrastructure',
  'Other',
];

const PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High'];

/**
 * Reverse geocodes coordinates into a readable address and landmark
 * using Google Maps Geocoder if available, falling back to OSM Nominatim.
 */
async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<{ address: string; landmark?: string; district?: string }> {
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const res = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) resolve(results[0]);
          else reject(new Error('Geocoder status: ' + status));
        });
      });

      const address = res.formatted_address || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
      const landmark =
        res.address_components?.[1]?.long_name ||
        res.address_components?.[0]?.long_name ||
        'Current Location';
      const district =
        res.address_components?.find(
          (c: any) =>
            c.types.includes('sublocality') ||
            c.types.includes('locality') ||
            c.types.includes('administrative_area_level_2')
        )?.long_name || 'Municipal Zone';

      return { address, landmark, district };
    } catch {
      // Fallback below
    }
  }

  // Network fallback to OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      const address =
        data.display_name?.split(',').slice(0, 3).join(', ') ||
        `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
      const landmark =
        data.address?.neighbourhood ||
        data.address?.suburb ||
        data.address?.road ||
        'Current Location';
      const district =
        data.address?.city_district ||
        data.address?.county ||
        data.address?.city ||
        'Municipal Zone';
      return { address, landmark, district };
    }
  } catch {
    // Ignore network error
  }

  return {
    address: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Live Device GPS)`,
    landmark: 'Current Location',
    district: 'Municipal Area',
  };
}

export const AICityAssistantModal: React.FC = () => {
  const navigate = useNavigate();
  const { submitComplaint, currentUser } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showReviewOverlay, setShowReviewOverlay] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Hello! I am your SmartCity AI Civic Assistant. You can ask me how municipal services work, ask about city departments, or tell me about any civic issue you are facing. You can type or hold the microphone button below to speak.',
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
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('Sync GPS');

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceTimeoutRef = useRef<any>(null);

  // Sync GPS Coordinates with High Accuracy & Reverse Geocoding
  const handleSyncLocation = useCallback(async (isSilent = false) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      if (!isSilent) alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsSyncingLocation(true);
    setLocationStatus('Locating...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLocationStatus('Geocoding...');

        const geo = await reverseGeocodeCoords(lat, lng);
        const resolved: LocationCoordinates = {
          latitude: lat,
          longitude: lng,
          address: geo.address,
          landmark: geo.landmark,
          district: geo.district,
        };

        setUserCoords(resolved);

        // If draft complaint is already open, sync its location too
        setDraftedComplaint((prev) =>
          prev
            ? {
                ...prev,
                location: {
                  latitude: lat,
                  longitude: lng,
                  address: geo.address,
                  landmark: geo.landmark || prev.location.landmark,
                  district: geo.district || prev.location.district,
                },
              }
            : null
        );

        setIsSyncingLocation(false);
        setLocationStatus('GPS Synced');
        setTimeout(() => setLocationStatus('Sync GPS'), 3000);
      },
      (err) => {
        setIsSyncingLocation(false);
        setLocationStatus('GPS Offline');
        if (!isSilent) {
          let msg = 'Unable to determine device location.';
          if (err.code === 1) {
            msg = 'Location permission was denied. Please allow location access in your browser settings to pinpoint your issue.';
          } else if (err.code === 3) {
            msg = 'Location request timed out. Please try again.';
          }
          alert(msg);
        }
        setTimeout(() => setLocationStatus('Sync GPS'), 3000);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, []);

  // Check speech recognition support and acquire initial GPS on mount
  useEffect(() => {
    setIsVoiceSupported(speechService.isSupported());
    handleSyncLocation(true);
  }, [handleSyncLocation]);

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

    // Give a 250ms grace period for final transcript buffer
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

      const response = await aiChatService.sendChatMessage(
        historyPayload,
        userCoords,
        currentUser?.id
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedComplaints: response.referencedComplaints,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If the citizen spoke about a problem, proactively synthesize draft
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
        handleGenerateDraft(newMessages);
      }
    } catch (err: any) {
      console.error('Failed to get AI chat reply:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content:
          'I apologize, I am temporarily having trouble reaching the AI assistant service. Please check your internet connection or use the manual "Report an Issue" form.',
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
      // Automatically open the full review overlay so user sees the complete unclipped card
      setShowReviewOverlay(true);
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
      setShowReviewOverlay(false);

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
    setShowReviewOverlay(false);
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
              <ShieldCheck className="w-5 h-5 text-blue-400 group-hover:scale-105 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>Ask City AI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-blue-500/30 text-blue-200">
                  Civic AI
                </span>
              </span>
              <span className="text-[10px] text-slate-300 font-medium">Voice & Triage Assistant</span>
            </div>
          </button>
        </div>
      )}

      {/* Expanded Floating AI Assistant Box */}
      {isOpen && (
        <div
          className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col rounded-3xl clay-card overflow-hidden shadow-2xl border border-white/80 animate-in fade-in slide-in-from-bottom-5 duration-200 transition-all ${
            isMaximized
              ? 'w-[96vw] sm:w-[680px] h-[88vh] max-h-[88vh]'
              : showReviewOverlay
              ? 'w-[94vw] sm:w-[580px] h-[720px] max-h-[92vh]'
              : 'w-[92vw] sm:w-[480px] h-[640px] max-h-[88vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3.5 border-b border-slate-200/60 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight">SmartCity AI Assistant</h3>
                  <span className="text-[9px] font-mono bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded-full font-semibold">
                    Civic AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Voice Triage & Automated Complaint Filing</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? 'Restore size' : 'Maximize window'}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
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

          {/* Quick Context & Device Location Bar with Live Sync Button */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
            <div className="flex items-center gap-1.5 truncate max-w-[70%]">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate font-medium text-slate-700">
                {userCoords.landmark || userCoords.address || 'Locating device...'}
              </span>
            </div>

            {/* Sync Live Location Button */}
            <button
              type="button"
              onClick={() => handleSyncLocation(false)}
              disabled={isSyncingLocation}
              title="Pinpoint your current device location using browser GPS"
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2 py-1 rounded-lg clay-btn transition-all shrink-0 cursor-pointer disabled:opacity-60"
            >
              <Crosshair className={`w-3 h-3 ${isSyncingLocation ? 'animate-spin text-blue-600' : ''}`} />
              <span>{locationStatus}</span>
            </button>
          </div>

          {/* MAIN BODY: Either Full-Screen Review Overlay OR Conversational Thread */}
          {showReviewOverlay && draftedComplaint ? (
            /* FULL-SCREEN REVIEW & EDIT OVERLAY */
            <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-white to-slate-50">
              {/* Overlay Sub-Header */}
              <div className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReviewOverlay(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Chat</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{Math.round(draftedComplaint.confidence * 100)}% Confidence</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Municipal AI</span>
                </div>
              </div>

              {/* Scrollable Form Review Body - 100% UNTRUNCATED TEXT */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    AI Generated Complaint Review
                  </h3>
                  <span className="text-[11px] text-slate-400">Editable before submission</span>
                </div>

                {/* Complaint Title Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Complaint Title
                  </label>
                  <input
                    type="text"
                    value={draftedComplaint.title}
                    onChange={(e) =>
                      setDraftedComplaint({ ...draftedComplaint, title: e.target.value })
                    }
                    className="w-full text-xs font-bold text-slate-900 bg-white clay-inset px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief title of the issue"
                  />
                </div>

                {/* Category & Severity Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Department Category
                    </label>
                    <select
                      value={draftedComplaint.category}
                      onChange={(e) =>
                        setDraftedComplaint({
                          ...draftedComplaint,
                          category: e.target.value as ComplaintCategory,
                        })
                      }
                      className="w-full text-xs font-semibold text-slate-800 bg-white clay-inset px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Assessed Severity
                    </label>
                    <select
                      value={draftedComplaint.severity}
                      onChange={(e) =>
                        setDraftedComplaint({
                          ...draftedComplaint,
                          severity: e.target.value as PriorityLevel,
                        })
                      }
                      className="w-full text-xs font-semibold text-slate-800 bg-white clay-inset px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRIORITIES.map((pri) => (
                        <option key={pri} value={pri}>
                          {pri} Priority
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Full Description - Expansive, Unclipped, Multi-line */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Full Engineering Description
                    </label>
                    <span className="text-[10px] text-slate-400">Synthesized by Civic AI</span>
                  </div>
                  <textarea
                    rows={5}
                    value={draftedComplaint.description}
                    onChange={(e) =>
                      setDraftedComplaint({
                        ...draftedComplaint,
                        description: e.target.value,
                      })
                    }
                    className="w-full text-xs text-slate-800 bg-white clay-inset p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
                    placeholder="Full description of the incident"
                  />
                </div>

                {/* Location Card */}
                <div className="space-y-2 clay-card p-3.5 rounded-2xl bg-white border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>Incident Location Geotag</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSyncLocation(false)}
                      disabled={isSyncingLocation}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>Use Live GPS Pin</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">Landmark / Corridor</span>
                      <input
                        type="text"
                        value={draftedComplaint.location.landmark || ''}
                        onChange={(e) =>
                          setDraftedComplaint({
                            ...draftedComplaint,
                            location: {
                              ...draftedComplaint.location,
                              landmark: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs font-medium text-slate-800 bg-slate-50 clay-inset px-2.5 py-1.5 rounded-lg border border-slate-200 mt-0.5 focus:outline-none"
                        placeholder="Landmark reference"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">Street Address</span>
                      <input
                        type="text"
                        value={draftedComplaint.location.address}
                        onChange={(e) =>
                          setDraftedComplaint({
                            ...draftedComplaint,
                            location: {
                              ...draftedComplaint.location,
                              address: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs text-slate-800 bg-slate-50 clay-inset px-2.5 py-1.5 rounded-lg border border-slate-200 mt-0.5 focus:outline-none"
                        placeholder="Street address"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span>Coordinates:</span>
                      <span className="font-bold text-slate-700">
                        {draftedComplaint.location.latitude.toFixed(6)}°N,{' '}
                        {draftedComplaint.location.longitude.toFixed(6)}°E
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photo Attachment Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Photographic Evidence
                    </label>
                    {attachedImage && (
                      <button
                        type="button"
                        onClick={() => setAttachedImage(null)}
                        className="text-[10px] text-rose-600 font-bold hover:underline"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {attachedImage ? (
                    <div className="relative rounded-2xl overflow-hidden h-36 border border-slate-200 shadow-xs">
                      <img
                        src={attachedImage}
                        alt="Issue Evidence"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] bg-black/75 text-white px-2 py-0.5 rounded-md font-mono">
                        Evidence Attached
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 px-3 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl bg-white hover:bg-blue-50/40 text-slate-500 hover:text-blue-600 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-xs font-bold">Attach photo of issue (optional)</span>
                      <span className="text-[10px] text-slate-400">Supports JPG, PNG up to 5MB</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sticky Submit Action Bar */}
              <div className="p-4 bg-white border-t border-slate-200/80 shrink-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewOverlay(false)}
                  className="clay-btn clay-btn-secondary py-3 px-4 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                >
                  Return to Chat
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAIDraft}
                  disabled={isSubmittingDraft}
                  className="flex-1 clay-btn clay-btn-primary py-3 px-4 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl active:scale-98 transition-all cursor-pointer"
                >
                  {isSubmittingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                      <span>Submitting to Municipal Intake Server...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Submit AI Generated Complaint</span>
                      <ArrowRight className="w-4 h-4 text-slate-200 ml-auto" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* CONVERSATIONAL CHAT THREAD VIEW */
            <>
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

                        {/* Interactive Citizen Issue Status Cards */}
                        {!isUser && m.referencedComplaints && m.referencedComplaints.length > 0 && (
                          <div className="mt-3 space-y-2.5 pt-2.5 border-t border-slate-200/70">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>Verified Municipal Issue Records ({m.referencedComplaints.length})</span>
                              </span>
                            </div>
                            {m.referencedComplaints.map((comp) => (
                              <div
                                key={comp.id}
                                className="bg-white/95 rounded-xl p-3 border border-slate-200/80 shadow-xs space-y-2 text-left"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                                    {comp.id}
                                  </span>
                                  <StatusBadge status={comp.status as any} size="sm" />
                                </div>

                                <div className="space-y-0.5">
                                  <h5 className="font-bold text-slate-900 text-xs leading-tight">
                                    {comp.title}
                                  </h5>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <span className="font-medium text-slate-700">{comp.category}</span>
                                    {comp.department && (
                                      <>
                                        <span>•</span>
                                        <span>{comp.department}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {comp.address && (
                                  <div className="flex items-start gap-1.5 text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{comp.address}</span>
                                  </div>
                                )}

                                {comp.resolutionSummary && (
                                  <div className="text-[10px] text-emerald-800 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200/50">
                                    <span className="font-semibold">Resolution: </span>
                                    {comp.resolutionSummary}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsOpen(false);
                                    navigate(`/track?id=${encodeURIComponent(comp.id)}`);
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shadow-xs"
                                >
                                  <span>Track Live Ticket</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                        {m.timestamp}
                      </span>
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
                      <span className="text-[10px] font-mono font-medium text-amber-600">
                        Release to send
                      </span>
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
                    <span>SmartCity AI is responding...</span>
                  </div>
                )}

                {/* Synthesizing Draft Indicator */}
                {isSynthesizingDraft && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold p-2 bg-blue-50 rounded-xl clay-inset">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Synthesizing category, severity, and location from conversation...</span>
                  </div>
                )}

                {/* IN-CHAT PREVIEW CARD: Clean summary with instant Full Review Overlay Trigger */}
                {draftedComplaint && !submitSuccessId && (
                  <div className="clay-card rounded-2xl p-4 border border-blue-200/90 bg-gradient-to-b from-white to-blue-50/40 space-y-3 shadow-md animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>AI Complaint Draft Ready</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {Math.round(draftedComplaint.confidence * 100)}% Confidence
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xs font-extrabold text-slate-900">
                        {draftedComplaint.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg clay-inset">
                          {draftedComplaint.category}
                        </span>
                        <PriorityBadge priority={draftedComplaint.severity} size="sm" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/70 p-2 rounded-xl clay-inset">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">
                        {draftedComplaint.location.landmark || draftedComplaint.location.address}
                      </span>
                    </div>

                    {/* Action buttons: Full Review & Instant Submit */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReviewOverlay(true)}
                        className="flex-1 clay-btn clay-btn-primary py-2 px-3 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-300" />
                        <span>Open Full Review & Submit</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Action Chips & Attached Image Preview */}
              <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto text-[11px] shrink-0">
                <div className="flex items-center gap-1.5">
                  {!draftedComplaint ? (
                    <button
                      type="button"
                      onClick={() => handleGenerateDraft()}
                      disabled={isSynthesizingDraft || messages.length <= 1}
                      className="clay-btn clay-btn-secondary px-2.5 py-1 text-[10px] font-bold text-blue-700 flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-blue-500" />
                      <span>Draft Complaint</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReviewOverlay(true)}
                      className="clay-btn clay-btn-primary px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-blue-200" />
                      <span>View Full Draft</span>
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
                    {isVoiceRecording ? (
                      <Mic className="w-4 h-4 animate-bounce" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="p-2.5 rounded-xl clay-btn clay-btn-primary text-white disabled:opacity-40 transition-all cursor-pointer"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Hold mic to speak live • Tap Enter to chat</span>
                  <span className="font-mono">SmartCity AI</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

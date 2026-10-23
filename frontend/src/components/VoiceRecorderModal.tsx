import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Mic, Square, Loader2, X, AlertCircle } from 'lucide-react';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptComplete: (transcript: string) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onTranscriptComplete,
}) => {
  const { language, t } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecordingImmediate();
      setErrorMsg(null);
      setRecordingDuration(0);
    }
  }, [isOpen]);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg(
          language === 'hi'
            ? 'आपके ब्राउज़र में माइक्रोफ़ोन रिकॉर्डिंग समर्थित नहीं है।'
            : 'Audio recording is not supported on this browser.'
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg(
        language === 'hi'
          ? 'माइक्रोफ़ोन अनुमति अस्वीकृत या उपलब्ध नहीं है। कृपया ब्राउज़र सेटिंग में अनुमति दें।'
          : 'Microphone permission denied or unavailable. Please enable microphone access.'
      );
    }
  };

  const stopRecordingImmediate = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTranscription = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const res = await api.transcribeVoice(blob, language);
      if (res.success && res.transcript) {
        onTranscriptComplete(res.transcript);
        onClose();
      } else {
        setErrorMsg(
          language === 'hi'
            ? 'आवाज स्पष्ट नहीं सुनाई दी। कृपया दोबारा बोलें या लिखकर पूछें।'
            : 'Could not clearly recognize speech. Please speak again or type.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Voice transcription failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-krishi-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {language === 'hi' ? 'कृषिवाणी वॉयस रिकॉर्डर' : 'KrishiVaani Voice Input'}
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          {language === 'hi'
            ? 'अपनी फसल या मौसम संबंधी समस्या खुलकर बोलें'
            : 'Speak naturally about your crop or weather inquiry'}
        </p>

        {/* Animated Microphone Area */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative">
            {isRecording && (
              <>
                <div className="absolute inset-0 rounded-full bg-krishi-400 animate-ping opacity-30"></div>
                <div className="absolute -inset-3 rounded-full bg-krishi-500/20 animate-pulse"></div>
              </>
            )}

            <button
              onClick={isRecording ? stopRecordingImmediate : startRecording}
              disabled={isProcessing}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-krishi-600 hover:bg-krishi-700'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isRecording ? (
                <Square className="w-9 h-9 fill-current" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          {/* Status Label & Timer */}
          <div className="mt-4">
            {isRecording ? (
              <div className="flex items-center space-x-2 text-red-600 font-semibold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                <span>
                  {t.listening} ({recordingDuration}s)
                </span>
              </div>
            ) : isProcessing ? (
              <p className="text-sm font-semibold text-krishi-700 flex items-center justify-center space-x-1">
                <span>{t.processing}</span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-gray-700">{t.speak_now}</p>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start space-x-2 border border-red-200 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          {isRecording ? (
            <button
              onClick={stopRecordingImmediate}
              className="px-5 py-2.5 bg-krishi-800 text-white text-xs font-semibold rounded-xl hover:bg-krishi-900 transition-colors shadow-sm"
            >
              {t.stop_recording}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              {t.cancel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

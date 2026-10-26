import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play, History, ArrowRight, ArrowLeft, CheckCircle,
  Clock, TrendingUp, MessageSquare, ChevronRight,
  Award, Loader2, BookOpen, AlertCircle, Mic, MicOff,
} from 'lucide-react';

type Step = 'home' | 'setup' | 'interview' | 'feedback' | 'results' | 'history';
type InterviewType = 'technical' | 'behavioral' | 'mixed';

interface AnswerData {
  id: string;
  answer_text: string;
  feedback_text: string;
  score: number;
  strengths: string[];
  improvements: string[];
  suggested_rewrite: string | null;
  confidence_level: 'Low' | 'Medium' | 'High';
  time_taken_seconds: number;
}

interface SessionQuestion {
  id: string;
  question_text: string;
  order_number: number;
  answer?: AnswerData;
}

interface Session {
  id: string;
  career_role: string;
  interview_type: InterviewType;
  started_at: string;
  completed_at: string | null;
  overall_score: number | null;
  questions: SessionQuestion[];
}

const API_BASE = '/api';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
const scoreBg   = (s: number) => s >= 80
  ? 'bg-green-500/10 border-green-500/30'
  : s >= 60
  ? 'bg-yellow-500/10 border-yellow-500/30'
  : 'bg-red-500/10 border-red-500/30';

const fmtTime = (secs: number) =>
  `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

async function convertToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const wav = new ArrayBuffer(44 + length * 2);
  const v = new DataView(wav);
  const w = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + length * 2, true);
  w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true);
  v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, length * 2, true);
  const ch = audioBuffer.getChannelData(0);
  let off = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    off += 2;
  }
  return new Blob([wav], { type: 'audio/wav' });
}

// ─── Home ────────────────────────────────────────────────────────────────────
const HomeScreen: React.FC<{ onStart: () => void; onHistory: () => void; loading: boolean; error: string | null }> = ({
  onStart, onHistory, loading, error,
}) => (
  <div className="min-h-screen bg-transparent p-4 lg:p-8">
    {/* Header */}
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto mb-8 bg-theme-card backdrop-blur-xl border border-theme rounded-2xl p-8 shadow-sm"
    >
      <div className="text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-theme-primary mb-4">
          Mock Interview Simulator
        </h1>
        <p className="text-xl text-theme-muted max-w-3xl mx-auto">
          Practice with AI-curated questions and get instant structured feedback
        </p>
      </div>
    </motion.div>

    <div className="max-w-5xl mx-auto">
      {error && (
        <div className="mb-5 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onClick={onStart}
          className="bg-theme-card border border-theme-accent-primary/30 rounded-xl p-8 hover:shadow-lg hover:shadow-theme-accent-primary/20 hover:border-theme-accent-primary/60 transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 bg-theme-accent-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-theme-accent-primary/30 transition-colors">
            <Play className="w-7 h-7 text-theme-accent-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-theme-primary mb-3">Start New Interview</h2>
          <p className="text-theme-secondary mb-6 leading-relaxed">Choose your target role and interview type. Get 5 tailored questions with scored AI feedback on every answer.</p>
          <div className="flex items-center text-theme-accent-primary font-medium">
            Begin Setup <ArrowRight className="w-5 h-5 ml-2" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onHistory}
          className="bg-theme-card border border-theme rounded-xl p-8 hover:border-theme-accent-primary/60 transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 bg-theme-card-hover rounded-xl flex items-center justify-center mb-6 group-hover:bg-theme-accent-primary/20 transition-colors">
            {loading ? <Loader2 className="w-7 h-7 text-theme-secondary animate-spin" /> : <History className="w-7 h-7 text-theme-secondary" />}
          </div>
          <h2 className="text-2xl font-semibold text-theme-primary mb-3">Past Interviews</h2>
          <p className="text-theme-secondary mb-6 leading-relaxed">Review previous sessions, read detailed feedback, and track your performance over time.</p>
          <div className="flex items-center text-theme-secondary font-medium">
            View History <ArrowRight className="w-5 h-5 ml-2" />
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const MockInterview: React.FC = () => {
  const [step, setStep] = useState<Step>('home');
  const [careerRole, setCareerRole] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('mixed');
  const [session, setSession] = useState<Session | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<AnswerData | null>(null);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (step === 'interview') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (step !== 'feedback') setTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const handleError = (msg: string) => { setError(msg); setSubmitting(false); setHistoryLoading(false); };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true);
    setError(null);
    try {
      const wavBlob = await convertToWav(blob);
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/interview/transcribe/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      });
      const raw = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${raw.substring(0, 120)}`);
      }
      let data: any;
      try { data = JSON.parse(raw); } catch { throw new Error(`Bad response (${res.status}): ${raw.substring(0, 120)}`); }
      if (data.transcript) {
        setAnswerText(prev => (prev ? prev + ' ' + data.transcript : data.transcript).trim());
      } else {
        setError(data.warning || 'Could not understand speech clearly. Tap the mic and try again.');
      }
    } catch (e: any) {
      setError(e.message || 'Transcription failed. Please try again.');
    } finally {
      setTranscribing(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          await transcribeAudio(blob);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      setError(err?.name === 'NotAllowedError'
        ? '🎤 Microphone permission denied. Allow it in your browser address bar.'
        : `🎤 Microphone error: ${err?.message || err}`);
    }
  };

  const startSession = async () => {
    if (!careerRole.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ career_role: careerRole.trim(), interview_type: interviewType }),
      });
      const body = await res.text();
      if (!res.ok) {
        let msg = `Server error ${res.status}`;
        try { const j = JSON.parse(body); msg = JSON.stringify(j); } catch { msg = body || msg; }
        throw new Error(msg);
      }
      const data: Session = JSON.parse(body);
      setSession(data); setQIdx(0); setAnswerText('');
      setStep('interview');
    } catch (e: any) { handleError(e.message || 'Failed to start session.'); }
    finally { setSubmitting(false); }
  };

  const submitAnswer = async () => {
    if (!session || !answerText.trim()) return;
    setSubmitting(true); setError(null);
    const question = session.questions[qIdx];
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/${session.id}/submit/`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ question_id: question.id, answer_text: answerText, time_taken_seconds: timer }),
      });
      const body = await res.text();
      if (!res.ok) {
        let msg = `Server error ${res.status}`;
        try { const j = JSON.parse(body); msg = JSON.stringify(j); } catch { msg = body || msg; }
        throw new Error(msg);
      }
      const feedback: AnswerData = JSON.parse(body);
      setCurrentFeedback(feedback);
      setStep('feedback');
    } catch (e: any) { handleError(e.message || 'Failed to submit answer.'); }
    finally { setSubmitting(false); }
  };

  const nextQuestion = async () => {
    if (!session) return;
    stopRecording();
    const next = qIdx + 1;
    if (next >= session.questions.length) {
      try {
        await fetch(`${API_BASE}/interview/sessions/${session.id}/complete/`, {
          method: 'POST', headers: getAuthHeader(),
        });
        const res = await fetch(`${API_BASE}/interview/sessions/${session.id}/`, { headers: getAuthHeader() });
        const updated: Session = await res.json();
        setSession(updated);
        setStep('results');
      } catch { handleError('Failed to complete session.'); }
    } else {
      setQIdx(next); setAnswerText(''); setCurrentFeedback(null);
      setStep('interview');
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/interview/sessions/`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error();
      setPastSessions(await res.json());
      setStep('history');
    } catch { handleError('Failed to load history. Make sure you are logged in.'); }
    finally { setHistoryLoading(false); }
  };

  const resetToHome = () => {
    stopRecording();
    setStep('home'); setSession(null); setCareerRole('');
    setQIdx(0); setAnswerText(''); setCurrentFeedback(null); setError(null);
  };

  // ── HOME ──
  if (step === 'home') return (
    <HomeScreen onStart={() => { setError(null); setStep('setup'); }} onHistory={loadHistory} loading={historyLoading} error={error} />
  );

  // ── SETUP ──
  if (step === 'setup') return (
    <div className="p-6 max-w-2xl mx-auto bg-theme-card border border-theme rounded-2xl shadow-sm mt-8">
      <button onClick={resetToHome} className="flex items-center text-theme-secondary hover:text-theme-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>
      <h2 className="text-2xl font-bold text-theme-primary mb-1">Interview Setup</h2>
      <p className="text-theme-muted mb-8 text-sm">Configure your 5-question practice session</p>
      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
      <div className="bg-theme-card-hover border border-theme rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-2">Target Career Role</label>
          <input
            type="text"
            value={careerRole}
            onChange={e => setCareerRole(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startSession()}
            placeholder="e.g. Software Engineer, Data Analyst, Civil Engineer, Architect..."
            className="w-full bg-theme-card border border-theme rounded-lg px-4 py-3 text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-3">Interview Type</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'behavioral', label: 'Behavioral', desc: 'STAR-format questions' },
              { value: 'technical',  label: 'Technical',  desc: 'Role-specific questions' },
              { value: 'mixed',      label: 'Mixed',      desc: 'Both types combined' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setInterviewType(opt.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  interviewType === opt.value
                    ? 'border-theme-accent-primary bg-theme-accent-primary/10 text-theme-accent-primary'
                    : 'border-theme bg-theme-card text-theme-secondary hover:border-theme-accent-primary/50'
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs mt-1 opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={startSession}
          disabled={!careerRole.trim() || submitting}
          className="w-full bg-theme-accent-primary hover:bg-theme-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {submitting ? 'Preparing Questions…' : 'Start Interview (5 Questions)'}
        </button>
      </div>
    </div>
  );

  // ── INTERVIEW ──
  if (step === 'interview' && session) {
    const question = session.questions[qIdx];
    const progress = (qIdx / session.questions.length) * 100;
    return (
      <div className="p-6 max-w-3xl mx-auto bg-theme-card border border-theme rounded-2xl shadow-sm mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-theme-muted text-xs uppercase tracking-wider">{session.career_role} · {session.interview_type}</p>
            <p className="text-theme-primary font-semibold text-sm mt-0.5">Question {qIdx + 1} of {session.questions.length}</p>
          </div>
          <div className="flex items-center gap-2 bg-theme-card-hover border border-theme rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 text-theme-accent-primary" />
            <span className={`font-mono text-sm font-semibold ${timer > 120 ? 'text-red-500' : 'text-theme-primary'}`}>{fmtTime(timer)}</span>
          </div>
        </div>
        <div className="w-full bg-theme-card-hover rounded-full h-1 mb-8">
          <div className="bg-theme-accent-primary h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-theme-card-hover border border-theme rounded-xl p-6 mb-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-theme-accent-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4 text-theme-accent-primary" />
            </div>
            <p className="text-theme-primary text-lg leading-relaxed">{question.question_text}</p>
          </div>
        </motion.div>
        <div className="space-y-5">
          {/* Mic button — centred, dominant */}
          <div className="flex flex-col items-center gap-4 py-6">
            <button
              onClick={toggleRecording}
              disabled={transcribing}
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 ${
                transcribing
                  ? 'bg-theme-card-hover cursor-not-allowed opacity-50'
                  : isRecording
                  ? 'bg-red-500 hover:bg-red-400 shadow-2xl shadow-red-500/50'
                  : 'bg-theme-accent-primary hover:bg-theme-accent-secondary shadow-xl shadow-theme-accent-primary/30'
              }`}
            >
              {isRecording && (
                <>
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                  <span className="absolute inset-4 rounded-full bg-red-400 animate-ping opacity-20" />
                </>
              )}
              {isRecording
                ? <MicOff className="w-12 h-12 text-white" />
                : <Mic className="w-12 h-12 text-white" />}
            </button>

            <p className="text-base font-medium">
              {transcribing ? (
                <span className="text-theme-accent-primary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin inline-block" />
                  Transcribing your answer…
                </span>
              ) : isRecording ? (
                <span className="text-red-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse inline-block" />
                  Recording — tap to stop
                </span>
              ) : answerText ? (
                <span className="text-theme-secondary">Tap to record more or submit your answer</span>
              ) : (
                <span className="text-theme-secondary">Tap the mic and speak your answer</span>
              )}
            </p>
          </div>

          {/* Transcript display */}
          {answerText && (
            <div className="bg-theme-card-hover border border-theme rounded-xl px-5 py-4 min-h-[80px]">
              <p className="text-theme-primary text-sm leading-relaxed whitespace-pre-wrap">{answerText}</p>
            </div>
          )}

          {/* Submit */}
          {answerText && !isRecording && !transcribing && (
            <button
              onClick={submitAnswer}
              disabled={submitting}
              className="w-full bg-theme-accent-primary hover:bg-theme-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {submitting ? 'Analysing your answer…' : 'Submit Answer'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── FEEDBACK ──
  if (step === 'feedback' && currentFeedback && session) {
    const isLast = qIdx === session.questions.length - 1;
    const s = currentFeedback.score;
    return (
      <div className="p-6 max-w-3xl mx-auto bg-theme-card border border-theme rounded-2xl shadow-sm mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-theme-primary">Answer Feedback</h2>
          <span className="text-theme-secondary text-sm">Q{qIdx + 1} of {session.questions.length}</span>
        </div>
        <div className="space-y-4">
          <div className={`rounded-xl border p-5 ${scoreBg(s)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-theme-secondary" />
                <span className="text-theme-primary font-semibold">Score</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  currentFeedback.confidence_level === 'High' ? 'bg-green-500/20 text-green-400' :
                  currentFeedback.confidence_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'}`}>
                  {currentFeedback.confidence_level} Confidence
                </span>
              </div>
              <span className={`text-3xl font-bold ${scoreColor(s)}`}>{Math.round(s)}/100</span>
            </div>
            <p className="text-theme-secondary text-sm leading-relaxed">{currentFeedback.feedback_text}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-theme-card-hover border border-green-500/20 rounded-xl p-5">
              <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Strengths
              </h3>
              <ul className="space-y-2">
                {currentFeedback.strengths.map((str, i) => (
                  <li key={i} className="text-theme-secondary text-sm flex items-start gap-2">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>{str}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-theme-card-hover border border-yellow-500/20 rounded-xl p-5">
              <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4" /> Improvements
              </h3>
              <ul className="space-y-2">
                {currentFeedback.improvements.map((imp, i) => (
                  <li key={i} className="text-theme-secondary text-sm flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">•</span>{imp}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {currentFeedback.suggested_rewrite && (
            <div className="bg-theme-card-hover border border-theme-accent-primary/20 rounded-xl p-5">
              <h3 className="text-theme-accent-primary font-semibold mb-2 flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4" /> Suggested Structure
              </h3>
              <p className="text-theme-secondary text-sm leading-relaxed">{currentFeedback.suggested_rewrite}</p>
            </div>
          )}

          <button
            onClick={nextQuestion}
            className="w-full bg-theme-accent-primary hover:bg-theme-accent-secondary text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLast
              ? <><Award className="w-5 h-5" /> View Final Results</>
              : <>Next Question <ChevronRight className="w-5 h-5" /></>}
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (step === 'results' && session) {
    const answered = session.questions.filter(q => q.answer);
    const avg = answered.length > 0
      ? answered.reduce((sum, q) => sum + (q.answer?.score ?? 0), 0) / answered.length
      : 0;

    return (
      <div className="p-6 max-w-3xl mx-auto bg-theme-card border border-theme rounded-2xl shadow-sm mt-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-theme-primary mb-1">Interview Complete!</h2>
          <p className="text-theme-muted text-sm mb-5">{session.career_role} · {session.interview_type}</p>
          <div className={`inline-block px-10 py-5 rounded-2xl border ${scoreBg(avg)}`}>
            <div className={`text-5xl font-bold ${scoreColor(avg)}`}>{Math.round(avg)}</div>
            <div className="text-theme-muted text-xs mt-1 uppercase tracking-wider">Overall Score / 100</div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {session.questions.map((q, i) => (
            <div key={q.id} className="bg-theme-card-hover border border-theme rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-theme-primary text-sm font-medium">Q{i + 1}: {q.question_text}</p>
                {q.answer && (
                  <span className={`flex-shrink-0 font-bold text-lg ${scoreColor(q.answer.score)}`}>
                    {Math.round(q.answer.score)}
                  </span>
                )}
              </div>
              {q.answer && (
                <div className="border-t border-theme pt-3 mt-2">
                  <p className="text-theme-muted text-xs italic mb-1">
                    "{q.answer.answer_text.substring(0, 120)}{q.answer.answer_text.length > 120 ? '…' : ''}"
                  </p>
                  <p className="text-theme-secondary text-xs">{q.answer.feedback_text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setStep('setup'); setSession(null); setQIdx(0); }}
            className="flex-1 bg-theme-accent-primary hover:bg-theme-accent-secondary text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Play className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={loadHistory}
            className="flex-1 bg-theme-card-hover hover:bg-theme-bg text-theme-primary font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <History className="w-4 h-4" /> View History
          </button>
        </div>
      </div>
    );
  }

  // ── HISTORY ──
  if (step === 'history') return (
    <div className="p-6 max-w-3xl mx-auto bg-theme-card border border-theme rounded-2xl shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-primary">Interview History</h2>
          <p className="text-theme-secondary text-sm">{pastSessions.length} session{pastSessions.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setStep('home')}
          className="bg-theme-accent-primary hover:bg-theme-accent-secondary text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Play className="w-4 h-4" /> New Interview
        </button>
      </div>

      {pastSessions.length === 0 ? (
        <div className="text-center py-16 text-theme-secondary">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No interviews yet. Start your first session!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pastSessions.map(s => (
            <div key={s.id} className="bg-theme-card-hover border border-theme rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-theme-primary font-semibold">{s.career_role}</p>
                  <p className="text-theme-secondary text-sm capitalize">
                    {s.interview_type} · {new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' · '}{s.questions.length} questions
                  </p>
                </div>
                {s.overall_score != null ? (
                  <div className={`text-2xl font-bold ${scoreColor(s.overall_score)}`}>
                    {Math.round(s.overall_score)}
                  </div>
                ) : (
                  <span className="text-theme-muted text-xs">Incomplete</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return null;
};

export default MockInterview;

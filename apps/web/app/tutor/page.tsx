"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { ElderButton } from "@repo/ui/elder-button";
import { LoadingState } from "@repo/ui/loading-state";
import { vi } from "@repo/ui/i18n/vi";
import { streamRagQuery, useTelemetry, ensureUser } from "../../lib/api";
import { HeaderAction } from "../../components/header-action";
import { UsageMeter } from "../../components/usage-meter";
import { VoiceButton } from "../../components/voice-button";
import { VoiceInputButton } from "../../components/voice-input-button";
import { TutorFeedback } from "../../components/tutor-feedback";

const QUICK_QUESTIONS = [
  "Tốc độ tối đa trong khu dân cư?",
  "Thắt dây an toàn có bắt buộc không?",
  "Gặp xe cứu thương phải làm gì?",
  "Đèn vàng có nghĩa là gì?",
];

export default function TutorPage() {
  const router = useRouter();
  const { track } = useTelemetry("tutor");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("wa_onboarding_done")) {
      void ensureUser().catch(() => {});
    }
  }, []);

  const ask = async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q) return;
    setQuery(q);
    setStreaming(true);
    setAnswer("");
    setDone(false);
    setRejected(false);
    track("tutor_question");

    try {
      await streamRagQuery(
        q,
        (token) => setAnswer((prev) => prev + token),
        (data) => {
          const d = data as { rejected?: boolean; answerVi?: string };
          setAnswer((prev) => prev || d.answerVi || "");
          setRejected(!!d.rejected);
          setDone(true);
        },
        (message) => {
          setAnswer(message);
          setRejected(true);
          setDone(true);
        },
      );
    } catch {
      setAnswer((prev) => prev || vi.tutor.noAnswer);
      setRejected(true);
      setDone(true);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <ScreenLayout title={vi.tutor.title} subtitle={vi.tutor.subtitle} onBack={() => router.push("/")} headerAction={<HeaderAction />}>
      <UsageMeter show="tutor" compact />
      <label htmlFor="tutor-input" className="question-topic">Câu hỏi của bạn</label>
      <textarea id="tutor-input" className="tutor-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={vi.tutor.placeholder} rows={3} />

      <VoiceInputButton
        onTranscript={(text) => {
          setQuery(text);
          track("tutor_voice_input");
        }}
        disabled={streaming}
      />

      <div className="tutor-chips">
        {QUICK_QUESTIONS.map((q) => (
          <button key={q} type="button" className="tutor-chip" onClick={() => ask(q)} disabled={streaming}>{q}</button>
        ))}
      </div>

      <ElderButton onClick={() => ask()} disabled={streaming || !query.trim()} loading={streaming}>
        {streaming ? vi.tutor.thinking : vi.tutor.ask}
      </ElderButton>

      {streaming && !answer && <LoadingState message="AI đang trả lời..." />}

      {done && answer && !streaming && (
        <TutorFeedback query={query} />
      )}

      {answer && (
        <div className={`tutor-answer ${rejected ? "tutor-answer--fail" : "tutor-answer--ok"}`}>
          <VoiceButton text={answer} label="🔊 Đọc câu trả lời" />
          <p style={{ fontSize: "var(--font-size-lg)", lineHeight: 1.6 }}>
            {answer}
            {streaming && <span className="stream-cursor" />}
          </p>
        </div>
      )}
    </ScreenLayout>
  );
}

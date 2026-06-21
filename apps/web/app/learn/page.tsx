"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { ElderButton } from "@repo/ui/elder-button";
import { OptionCard } from "@repo/ui/option-card";
import { LoadingState } from "@repo/ui/loading-state";
import { FeedbackBanner } from "@repo/ui/feedback-banner";
import { vi } from "@repo/ui/i18n/vi";
import { apiFetch, ensureUser, useTelemetry } from "../../lib/api";
import { recordPracticeAnswer } from "../../lib/study-stats";
import { unlockAudio } from "../../lib/correct-sound";
import { HeaderAction } from "../../components/header-action";
import { UsageMeter } from "../../components/usage-meter";
import { VoiceButton } from "../../components/voice-button";
import { QuestionSignImage } from "../../components/question-sign-image";

interface Question {
  id: string;
  topic: string;
  questionTextVi: string;
  imageUrl?: string | null;
  options: Array<{ id: string; textVi: string }>;
}

interface AttemptResult {
  isCorrect: boolean;
  correctOptionId?: string;
  explanationVi: string | null;
}

const TOPIC_LABELS: Record<string, string> = {
  traffic_signs: "Biển báo",
  right_of_way: "Quyền ưu tiên",
  speed_limits: "Tốc độ",
  parking: "Đỗ xe",
  lane_changes: "Chuyển làn",
  intersections: "Ngã tư",
  pedestrians: "Người đi bộ",
  school_zones: "Khu trường học",
  highway_driving: "Cao tốc",
  night_driving: "Ban đêm",
  weather_conditions: "Thời tiết",
  emergency_vehicles: "Xe ưu tiên",
  dui_laws: "Say rượu",
  seat_belts: "Dây an toàn",
  sharing_the_road: "Chia sẻ đường",
};

export default function LearnPage() {
  const router = useRouter();
  const { track } = useTelemetry("learn");
  const [question, setQuestion] = useState<Question | null>(null);
  const [dueTopics, setDueTopics] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [encouragement, setEncouragement] = useState<{ title: string; subtitle?: string; celebrate?: boolean } | null>(null);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setResult(null);
    setEncouragement(null);
    setStartTime(Date.now());
    try {
      const userId = await ensureUser();
      const data = await apiFetch<{ question: Question; dueTopics?: string[] }>(`/learning/${userId}/next`);
      setQuestion(data.question);
      setDueTopics(data.dueTopics ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : vi.common.error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);

  const submit = async () => {
    if (!selected || !question) return;
    unlockAudio();
    setSubmitting(true);
    try {
      const userId = await ensureUser();
      const attempt = await apiFetch<AttemptResult>("/learning/attempt", {
        method: "POST",
        body: JSON.stringify({
          userId,
          questionId: question.id,
          selectedOptionId: selected,
          responseTimeMs: Date.now() - startTime,
          context: "practice",
        }),
      });
      setResult(attempt);
      const recorded = recordPracticeAnswer(attempt.isCorrect);
      setEncouragement({
        title: recorded.title,
        subtitle: recorded.subtitle,
        celebrate: recorded.celebrate,
      });
      track(attempt.isCorrect ? "answer_correct" : "answer_incorrect", {
        combo: recorded.stats.sessionCombo,
        streak: recorded.stats.streak,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : vi.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  const weakTopicHint =
    dueTopics.length > 0
      ? dueTopics.map((t) => TOPIC_LABELS[t] ?? t).join(", ")
      : null;

  return (
    <ScreenLayout title={vi.learn.title} subtitle={vi.learn.subtitle} onBack={() => router.push("/")} headerAction={<HeaderAction />}>
      <UsageMeter show="practice" compact />
      {loading && <LoadingState message={vi.common.loading} />}
      {error && (
        <>
          <p style={{ color: "var(--color-error)", textAlign: "center", fontSize: "var(--font-size-base)" }}>{error}</p>
          <ElderButton onClick={loadQuestion}>{vi.common.retry}</ElderButton>
        </>
      )}
      {question && !loading && (
        <>
          {weakTopicHint && !result && (
            <div className="weak-topic-banner" role="status">
              🎯 Ôn chủ đề yếu: <strong>{weakTopicHint}</strong>
            </div>
          )}
          <div className="question-card">
            <p className="question-topic">{TOPIC_LABELS[question.topic] ?? question.topic}</p>
            {question.imageUrl && <QuestionSignImage imageUrl={question.imageUrl} />}
            <p className="question-text">{question.questionTextVi}</p>
          </div>
          <VoiceButton text={question.questionTextVi} />
          <div className="options-list">
            {question.options.map((opt, i) => (
              <OptionCard
                key={opt.id}
                id={opt.id}
                text={opt.textVi}
                index={i}
                selected={selected === opt.id}
                onSelect={setSelected}
                disabled={!!result}
                state={
                  result
                    ? opt.id === result.correctOptionId
                      ? "correct"
                      : selected === opt.id && !result.isCorrect
                        ? "wrong"
                        : "default"
                    : "default"
                }
              />
            ))}
          </div>
          {!result && (
            <ElderButton onClick={submit} disabled={!selected} loading={submitting}>
              {vi.learn.submit}
            </ElderButton>
          )}
          {result && (
            <>
              <FeedbackBanner
                type={result.isCorrect ? "success" : "error"}
                title={encouragement?.title ?? (result.isCorrect ? vi.learn.correct : vi.learn.incorrect)}
                subtitle={encouragement?.subtitle}
                celebrate={encouragement?.celebrate}
                explanation={result.explanationVi}
              />
              {result.explanationVi && (
                <VoiceButton text={result.explanationVi} label="🔊 Đọc giải thích" />
              )}
              <ElderButton variant="success" onClick={loadQuestion}>{vi.learn.next}</ElderButton>
            </>
          )}
        </>
      )}
    </ScreenLayout>
  );
}

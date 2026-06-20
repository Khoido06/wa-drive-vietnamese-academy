"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenLayout } from "@repo/ui/screen-layout";
import { ElderButton } from "@repo/ui/elder-button";
import { OptionCard } from "@repo/ui/option-card";
import { StepBar } from "@repo/ui/step-bar";
import { LoadingState } from "@repo/ui/loading-state";
import { vi } from "@repo/ui/i18n/vi";
import { apiFetch, ensureUser, useTelemetry } from "../../lib/api";
import { HeaderAction } from "../../components/header-action";
import { VoiceButton } from "../../components/voice-button";

const EXAM_LENGTH = 5;

interface Question {
  id: string;
  questionTextVi: string;
  options: Array<{ id: string; textVi: string }>;
}

export default function ExamPage() {
  const router = useRouter();
  const { track } = useTelemetry("exam");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const startExam = async () => {
    setLoading(true);
    track("exam_start");
    const userId = await ensureUser();
    const loaded: Question[] = [];
    for (let i = 0; i < EXAM_LENGTH; i++) {
      try {
        const data = await apiFetch<{ question: Question }>(`/learning/${userId}/next`);
        loaded.push(data.question);
      } catch { break; }
    }
    setQuestions(loaded);
    setStarted(true);
    setStartTime(Date.now());
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!selected || !questions[current]) return;
    const q = questions[current];
    try {
      const userId = await ensureUser();
      const result = await apiFetch<{ isCorrect: boolean }>("/learning/attempt", {
        method: "POST",
        body: JSON.stringify({
          userId,
          questionId: q.id,
          selectedOptionId: selected,
          responseTimeMs: Date.now() - startTime,
          context: "exam",
        }),
      });
      const newScore = score + (result.isCorrect ? 1 : 0);
      if (result.isCorrect) setScore(newScore);
      if (current + 1 >= questions.length) {
        setFinished(true);
        track("exam_finish", { score: newScore, total: questions.length });
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setStartTime(Date.now());
      }
    } catch {
      if (current + 1 >= questions.length) setFinished(true);
      else { setCurrent((c) => c + 1); setSelected(null); }
    }
  };

  if (!started) {
    return (
      <ScreenLayout title={vi.exam.title} subtitle={vi.exam.subtitle} onBack={() => router.push("/")} headerAction={<HeaderAction />}>
        <div className="question-card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-sm)" }}>📝</p>
          <p style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>{EXAM_LENGTH} câu hỏi</p>
          <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-xs)" }}>
            Trả lời từng câu · Cần 80% để đậu
          </p>
        </div>
        <ElderButton onClick={startExam} loading={loading}>
          {vi.exam.start}
        </ElderButton>
      </ScreenLayout>
    );
  }

  if (finished) {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const passed = pct >= 80;
    return (
      <ScreenLayout title="Kết quả thi" onBack={() => router.push("/")} headerAction={<HeaderAction />}>
        <div className="exam-result">
          <p className={`exam-result__score ${passed ? "exam-result__score--pass" : "exam-result__score--fail"}`}>
            {pct}%
          </p>
          <p style={{ fontSize: "var(--font-size-xl)", fontWeight: 600 }}>
            {score}/{questions.length} câu đúng
          </p>
          <p className="exam-result__msg">
            {passed ? "🎉 Tuyệt vời! Bạn sẵn sàng thi thật rồi." : "💪 Hãy tiếp tục luyện tập nhé."}
          </p>
          <ElderButton variant="success" onClick={() => router.push("/learn")}>Học thêm</ElderButton>
          <ElderButton variant="secondary" onClick={() => { setStarted(false); setFinished(false); setScore(0); setCurrent(0); }} style={{ marginTop: "var(--space-sm)" }}>
            Thi lại
          </ElderButton>
        </div>
      </ScreenLayout>
    );
  }

  const q = questions[current];
  if (!q) return <LoadingState />;

  return (
    <ScreenLayout title={`${vi.exam.title} · Câu ${current + 1}/${questions.length}`} onBack={() => router.push("/")} headerAction={<HeaderAction />}>
      <StepBar total={questions.length} current={current} />
      <div className="question-card">
        <p className="question-text">{q.questionTextVi}</p>
      </div>
      <VoiceButton text={q.questionTextVi} />
      <div className="options-list">
        {q.options.map((opt, i) => (
          <OptionCard key={opt.id} id={opt.id} text={opt.textVi} index={i} selected={selected === opt.id} onSelect={setSelected} />
        ))}
      </div>
      <ElderButton onClick={submitAnswer} disabled={!selected}>
        {current + 1 >= questions.length ? vi.exam.finish : "Câu tiếp theo →"}
      </ElderButton>
    </ScreenLayout>
  );
}

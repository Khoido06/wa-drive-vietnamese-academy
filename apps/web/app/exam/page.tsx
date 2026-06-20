"use client";

import { useEffect, useState } from "react";
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

interface ExamSet {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  examLength: number;
  passCount: number;
}

interface Question {
  id: string;
  questionTextVi: string;
  options: Array<{ id: string; textVi: string }>;
}

export default function ExamPage() {
  const router = useRouter();
  const { track } = useTelemetry("exam");
  const [sets, setSets] = useState<ExamSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>("wa-set-01");
  const [passCount, setPassCount] = useState(32);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [setName, setSetName] = useState("");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    apiFetch<{ sets: ExamSet[]; dmv: { passCount: number } }>("/learning/exam-sets")
      .then((data) => {
        setSets(data.sets);
        setPassCount(data.dmv.passCount);
        if (data.sets[0]) setSelectedSet(data.sets[0].id);
      })
      .catch(() => {});
  }, []);

  const beginExam = async () => {
    setLoading(true);
    track("exam_start", { setId: selectedSet });
    try {
      const userId = await ensureUser();
      const data = await apiFetch<{
        setName: string;
        examLength: number;
        passCount: number;
        questions: Question[];
      }>(`/learning/${userId}/exam/start?setId=${selectedSet}`);
      setQuestions(data.questions);
      setSetName(data.setName);
      setPassCount(data.passCount);
      setStarted(true);
      setStartTime(Date.now());
    } catch {
      /* keep on picker */
    } finally {
      setLoading(false);
    }
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
      setScore(newScore);
      if (current + 1 >= questions.length) {
        setFinished(true);
        track("exam_finish", { score: newScore, total: questions.length, setId: selectedSet });
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setStartTime(Date.now());
      }
    } catch {
      if (current + 1 >= questions.length) setFinished(true);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
      }
    }
  };

  const resetExam = () => {
    setStarted(false);
    setFinished(false);
    setScore(0);
    setCurrent(0);
    setQuestions([]);
    setSelected(null);
  };

  if (!started) {
    return (
      <ScreenLayout title={vi.exam.title} subtitle={vi.exam.subtitle} onBack={() => router.push("/")} headerAction={<HeaderAction />}>
        <div className="question-card">
          <p style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--space-sm)" }}>
            Thi thử chuẩn DMV Washington
          </p>
          <p style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {sets.find((s) => s.id === selectedSet)?.examLength ?? 40} câu / bộ · Cần <strong>{passCount}/40</strong> câu đúng (80%) để đậu — giống bài thi thật.
          </p>
          <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-xs)", fontSize: "var(--font-size-sm)" }}>
            ✅ Đáp án cố định từ Sổ tay lái xe WA · Không dùng AI bịa câu
          </p>
        </div>

        <p className="question-topic">Chọn bộ đề</p>
        <div className="options-list">
          {sets.map((s) => (
            <OptionCard
              key={s.id}
              id={s.id}
              text={`${s.name} — ${s.description}`}
              index={0}
              selected={selectedSet === s.id}
              onSelect={setSelectedSet}
            />
          ))}
        </div>

        <ElderButton onClick={beginExam} loading={loading} disabled={!selectedSet}>
          {vi.exam.start}
        </ElderButton>
      </ScreenLayout>
    );
  }

  if (finished) {
    const total = questions.length;
    const passed = score >= passCount;
    return (
      <ScreenLayout title="Kết quả thi" onBack={() => router.push("/")} headerAction={<HeaderAction />}>
        <div className="exam-result">
          <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-xs)" }}>{setName}</p>
          <p className={`exam-result__score ${passed ? "exam-result__score--pass" : "exam-result__score--fail"}`}>
            {score}/{total}
          </p>
          <p style={{ fontSize: "var(--font-size-xl)", fontWeight: 600 }}>
            {passed ? "🎉 ĐẬU — Sẵn sàng thi DMV!" : "💪 Chưa đủ — cần " + passCount + " câu đúng"}
          </p>
          <p className="exam-result__msg">
            {passed
              ? "Mẹ làm tốt lắm! Ôn thêm bộ đề khác để chắc chắn hơn."
              : "Hãy luyện thêm ở mục Học bài — mỗi câu có giải thích tiếng Việt."}
          </p>
          <ElderButton variant="success" onClick={() => router.push("/learn")}>
            Học bài (có giải thích)
          </ElderButton>
          <ElderButton variant="secondary" onClick={resetExam} style={{ marginTop: "var(--space-sm)" }}>
            Thi lại
          </ElderButton>
        </div>
      </ScreenLayout>
    );
  }

  const q = questions[current];
  if (!q) return <LoadingState />;

  return (
    <ScreenLayout
      title={`${setName} · Câu ${current + 1}/${questions.length}`}
      onBack={() => router.push("/")}
      headerAction={<HeaderAction />}
    >
      <StepBar total={questions.length} current={current} />
      <div className="question-card">
        <p className="question-text">{q.questionTextVi}</p>
      </div>
      <VoiceButton text={q.questionTextVi} />
      <div className="options-list">
        {q.options.map((opt, i) => (
          <OptionCard
            key={opt.id}
            id={opt.id}
            text={opt.textVi}
            index={i}
            selected={selected === opt.id}
            onSelect={setSelected}
          />
        ))}
      </div>
      <ElderButton onClick={submitAnswer} disabled={!selected}>
        {current + 1 >= questions.length ? vi.exam.finish : "Câu tiếp theo →"}
      </ElderButton>
    </ScreenLayout>
  );
}

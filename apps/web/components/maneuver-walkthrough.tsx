"use client";

import { useState } from "react";
import { ElderButton } from "@repo/ui/elder-button";
import { OptionCard } from "@repo/ui/option-card";
import { StepBar } from "@repo/ui/step-bar";
import { FeedbackBanner } from "@repo/ui/feedback-banner";
import type { PracticalManeuver } from "@repo/learning-engine/wa-practical";
import {
  getManeuverProgress,
  setStepsRead,
  setQuizPassed,
  setPracticedInCar,
} from "../lib/practical-progress";
import { VoiceButton } from "./voice-button";
import { ManeuverSimulation } from "./maneuver-simulation";
import { ManeuverVideoGuide } from "./maneuver-video-guide";
import { DrivingSimulator } from "./driving-simulator";

interface Props {
  maneuver: PracticalManeuver;
  onBack: () => void;
}

type WalkMode = "learn" | "drive";

export function ManeuverWalkthrough({ maneuver, onBack }: Props) {
  const [mode, setMode] = useState<WalkMode>("learn");
  const progress = getManeuverProgress(maneuver.id);
  const initialStep =
    progress.stepsRead >= maneuver.steps.length
      ? maneuver.steps.length
      : progress.stepsRead;
  const [step, setStep] = useState(initialStep);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizDone, setQuizDone] = useState(progress.quizPassed);
  const [practiced, setPracticed] = useState(progress.practicedInCar);

  const atQuiz = step >= maneuver.steps.length;
  const currentStep = atQuiz ? null : maneuver.steps[step];

  const goNext = () => {
    setStepsRead(maneuver.id, step);
    if (step < maneuver.steps.length - 1) {
      setStep(step + 1);
    } else {
      setStepsRead(maneuver.id, maneuver.steps.length - 1);
      setStep(maneuver.steps.length);
    }
  };

  const goPrev = () => {
    if (atQuiz) {
      setStep(maneuver.steps.length - 1);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  const submitQuiz = () => {
    if (!quizAnswer) return;
    setQuizSubmitted(true);
    if (quizAnswer === maneuver.quiz.correctOptionId) {
      setQuizPassed(maneuver.id);
      setQuizDone(true);
    }
  };

  const togglePracticed = () => {
    const next = !practiced;
    setPracticed(next);
    setPracticedInCar(maneuver.id, next);
  };

  return (
    <div className="maneuver-walkthrough">
      <button type="button" className="back-link" onClick={onBack}>
        ← Quay lại danh sách
      </button>

      <header className="maneuver-walkthrough__header">
        <span className="maneuver-walkthrough__icon" aria-hidden>
          {maneuver.icon}
        </span>
        <div>
          <h2 className="maneuver-walkthrough__title">{maneuver.titleVi}</h2>
          <p className="maneuver-walkthrough__subtitle">{maneuver.subtitleVi}</p>
        </div>
      </header>

      <div className="walkthrough-mode" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "learn"}
          className={`walkthrough-mode__btn${mode === "learn" ? " walkthrough-mode__btn--active" : ""}`}
          onClick={() => setMode("learn")}
        >
          📖 Hướng dẫn
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "drive"}
          className={`walkthrough-mode__btn${mode === "drive" ? " walkthrough-mode__btn--active" : ""}`}
          onClick={() => setMode("drive")}
        >
          🎮 Luyện lái xe
        </button>
      </div>

      {mode === "drive" ? (
        <DrivingSimulator scenarioId={maneuver.id} />
      ) : (
        <>
      {maneuver.videoGuide ? (
        <ManeuverVideoGuide
          youtubeId={maneuver.videoGuide.youtubeId}
          title={maneuver.videoGuide.titleVi}
        />
      ) : null}

      {!atQuiz && currentStep ? (
        <>
          <ManeuverSimulation maneuverId={maneuver.id} step={step} />
          <StepBar total={maneuver.steps.length} current={step} />
          <article className="maneuver-step-card">
            <div className="maneuver-step-card__title-row">
              <h3>{currentStep.title}</h3>
              <VoiceButton text={`${currentStep.title}. ${currentStep.body}${currentStep.tip ? ` Mẹo: ${currentStep.tip}` : ""}`} />
            </div>
            <p>{currentStep.body}</p>
            {currentStep.tip ? (
              <p className="maneuver-step-card__tip">💡 {currentStep.tip}</p>
            ) : null}
          </article>
          <div className="maneuver-walkthrough__nav">
            <ElderButton variant="secondary" onClick={goPrev} disabled={step === 0}>
              Trước
            </ElderButton>
            <ElderButton onClick={goNext}>
              {step < maneuver.steps.length - 1 ? "Bước tiếp" : "Làm quiz"}
            </ElderButton>
          </div>
        </>
      ) : (
        <section className="maneuver-quiz">
          <h3>Quiz nhanh</h3>
          <p className="maneuver-quiz__question">{maneuver.quiz.question}</p>
          <div className="option-list">
            {maneuver.quiz.options.map((opt, index) => (
              <OptionCard
                key={opt.id}
                id={opt.id}
                text={opt.text}
                index={index}
                selected={quizAnswer === opt.id}
                disabled={quizDone}
                state={
                  quizSubmitted && quizDone && quizAnswer === opt.id
                    ? "correct"
                    : quizSubmitted && quizAnswer === opt.id && opt.id !== maneuver.quiz.correctOptionId
                      ? "wrong"
                      : quizSubmitted && opt.id === maneuver.quiz.correctOptionId && !quizDone
                        ? "correct"
                        : "default"
                }
                onSelect={(id) => {
                  if (quizDone) return;
                  setQuizAnswer(id);
                  setQuizSubmitted(false);
                }}
              />
            ))}
          </div>
          {!quizSubmitted ? (
            <ElderButton onClick={submitQuiz} disabled={!quizAnswer}>
              Kiểm tra
            </ElderButton>
          ) : (
            <FeedbackBanner
              type={quizAnswer === maneuver.quiz.correctOptionId ? "success" : "error"}
              title={
                quizAnswer === maneuver.quiz.correctOptionId ? "Đúng rồi!" : "Chưa đúng — thử lại"
              }
              explanation={maneuver.quiz.explanation}
              celebrate={quizAnswer === maneuver.quiz.correctOptionId}
            />
          )}
        </section>
      )}

      <section className="maneuver-examiner">
        <h3>Giám khảo chấm gì?</h3>
        <ul>
          {maneuver.examinerLooksFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="maneuver-mistakes">
        <h3>Lỗi thường gặp</h3>
        <ul>
          {maneuver.commonMistakes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <label className="maneuver-practiced">
        <input type="checkbox" checked={practiced} onChange={togglePracticed} />
        <span>✅ Đã luyện thao tác này trên xe thật</span>
      </label>
        </>
      )}
    </div>
  );
}

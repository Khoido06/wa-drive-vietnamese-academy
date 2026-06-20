"use client";

import { useEffect, useState } from "react";
import { getStudyStats, type StudyStats } from "../lib/study-stats";

export function StudyMotivation() {
  const [stats, setStats] = useState<StudyStats | null>(null);

  useEffect(() => {
    const refresh = () => setStats(getStudyStats());
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("wa-study-stats-updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("wa-study-stats-updated", refresh);
    };
  }, []);

  if (!stats) return null;

  const progress = stats.dailyGoalQuestions
    ? Math.min(1, stats.dailyCorrect / stats.dailyGoalQuestions)
    : 0;
  const pct = Math.round(progress * 100);

  return (
    <section className="study-motivation" aria-label="Tiến độ hôm nay">
      <div className="study-motivation__row">
        {stats.streak > 0 && (
          <div className="study-motivation__chip study-motivation__chip--streak">
            <span aria-hidden="true">🔥</span>
            <span>
              <strong>{stats.streak}</strong> ngày liên tiếp
            </span>
          </div>
        )}
        {stats.daysUntilExam !== null && stats.daysUntilExam <= 30 && (
          <div className="study-motivation__chip study-motivation__chip--exam">
            <span aria-hidden="true">📅</span>
            <span>
              Còn <strong>{stats.daysUntilExam}</strong> ngày đến ngày thi
            </span>
          </div>
        )}
      </div>

      <div className="study-motivation__goal">
        <div className="study-motivation__goal-header">
          <span>Mục tiêu hôm nay</span>
          <span>
            {stats.dailyCorrect}/{stats.dailyGoalQuestions} câu đúng
          </span>
        </div>
        <div className="study-motivation__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="study-motivation__bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="study-motivation__hint">
          {pct >= 100
            ? "🎉 Hoàn thành mục tiêu — bạn giỏi lắm!"
            : stats.streak === 0
              ? "Học hôm nay để bắt đầu chuỗi ngày 🔥"
              : `~${stats.dailyGoalMinutes} phút/ngày — cứ 2 phút một câu là đủ`}
        </p>
      </div>
    </section>
  );
}

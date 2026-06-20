/** Local study gamification — streak, daily goal, combo (Duolingo-style). */

export interface StudyStats {
  streak: number;
  bestStreak: number;
  dailyCorrect: number;
  dailyTotal: number;
  dailyGoalQuestions: number;
  dailyGoalMinutes: number;
  sessionCombo: number;
  lastStudyDate: string | null;
  examDate: string | null;
  daysUntilExam: number | null;
}

export interface AnswerRecorded {
  stats: StudyStats;
  title: string;
  subtitle?: string;
  celebrate?: boolean;
  milestone?: "daily_goal" | "streak" | "combo";
}

const KEYS = {
  streak: "wa_streak_count",
  bestStreak: "wa_best_streak",
  lastDate: "wa_last_study_date",
  dailyCorrect: "wa_daily_correct",
  dailyTotal: "wa_daily_total",
  dailyDate: "wa_daily_activity_date",
  sessionCombo: "wa_session_combo",
} as const;

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readNum(key: string, fallback = 0): number {
  if (typeof window === "undefined") return fallback;
  return Number(localStorage.getItem(key) ?? fallback) || fallback;
}

function writeNum(key: string, value: number): void {
  localStorage.setItem(key, String(value));
}

export function getDailyGoalMinutes(): number {
  if (typeof window === "undefined") return 15;
  return Number(localStorage.getItem("wa_daily_goal") ?? 15) || 15;
}

export function questionsForGoal(minutes: number): number {
  return Math.max(5, Math.round(minutes / 2));
}

function resetDailyIfNeeded(): void {
  const today = todayLocal();
  if (localStorage.getItem(KEYS.dailyDate) !== today) {
    localStorage.setItem(KEYS.dailyDate, today);
    writeNum(KEYS.dailyCorrect, 0);
    writeNum(KEYS.dailyTotal, 0);
  }
}

function updateStreakForToday(): number {
  const today = todayLocal();
  const last = localStorage.getItem(KEYS.lastDate);
  let streak = readNum(KEYS.streak);

  if (last === today) return streak;

  if (last === yesterdayLocal()) {
    streak += 1;
  } else if (!last) {
    streak = 1;
  } else {
    streak = 1;
  }

  writeNum(KEYS.streak, streak);
  localStorage.setItem(KEYS.lastDate, today);

  const best = readNum(KEYS.bestStreak);
  if (streak > best) writeNum(KEYS.bestStreak, streak);

  return streak;
}

export function getStudyStats(): StudyStats {
  if (typeof window === "undefined") {
    return {
      streak: 0,
      bestStreak: 0,
      dailyCorrect: 0,
      dailyTotal: 0,
      dailyGoalQuestions: 8,
      dailyGoalMinutes: 15,
      sessionCombo: 0,
      lastStudyDate: null,
      examDate: null,
      daysUntilExam: null,
    };
  }

  resetDailyIfNeeded();
  const goalMin = getDailyGoalMinutes();
  const examDate = localStorage.getItem("wa_exam_date");
  let daysUntilExam: number | null = null;
  if (examDate) {
    const diff = Math.ceil(
      (new Date(examDate + "T12:00:00").getTime() - Date.now()) / 86_400_000,
    );
    daysUntilExam = diff >= 0 ? diff : null;
  }

  return {
    streak: readNum(KEYS.streak),
    bestStreak: readNum(KEYS.bestStreak),
    dailyCorrect: readNum(KEYS.dailyCorrect),
    dailyTotal: readNum(KEYS.dailyTotal),
    dailyGoalQuestions: questionsForGoal(goalMin),
    dailyGoalMinutes: goalMin,
    sessionCombo: readNum(KEYS.sessionCombo),
    lastStudyDate: localStorage.getItem(KEYS.lastDate),
    examDate,
    daysUntilExam,
  };
}

function praiseForCorrect(combo: number, streak: number): { title: string; subtitle?: string; celebrate?: boolean } {
  if (combo >= 10) {
    return { title: "🌟 Xuất sắc!", subtitle: `${combo} câu đúng liên tiếp — bạn giỏi quá!`, celebrate: true };
  }
  if (combo >= 5) {
    return { title: "🔥 Chuỗi đúng!", subtitle: `${combo} câu liên tiếp — tiếp tục nhé!`, celebrate: true };
  }
  if (combo >= 3) {
    return { title: "⭐ Giỏi lắm!", subtitle: `${combo} câu đúng liên tiếp`, celebrate: true };
  }
  if (streak >= 7) {
    const titles = ["🏆 Tuyệt vời!", "💪 Giỏi quá!", "✨ Chính xác!"];
    return { title: titles[combo % titles.length]!, subtitle: `${streak} ngày học liên tiếp` };
  }
  const titles = ["✅ Chính xác!", "👏 Giỏi lắm!", "💚 Đúng rồi!", "🎯 Xuất sắc!", "😊 Tốt lắm!"];
  return { title: titles[combo % titles.length]! };
}

export function recordPracticeAnswer(isCorrect: boolean): AnswerRecorded {
  resetDailyIfNeeded();
  const streak = updateStreakForToday();

  let combo = readNum(KEYS.sessionCombo);
  const dailyTotal = readNum(KEYS.dailyTotal) + 1;
  let dailyCorrect = readNum(KEYS.dailyCorrect);

  writeNum(KEYS.dailyTotal, dailyTotal);

  if (isCorrect) {
    combo += 1;
    dailyCorrect += 1;
    writeNum(KEYS.dailyCorrect, dailyCorrect);
    writeNum(KEYS.sessionCombo, combo);
  } else {
    combo = 0;
    writeNum(KEYS.sessionCombo, 0);
  }

  const stats = getStudyStats();
  const goal = stats.dailyGoalQuestions;
  const hitGoal = dailyCorrect >= goal && dailyCorrect === goal;

  if (!isCorrect) {
    return {
      stats,
      title: "Chưa đúng — xem giải thích nhé",
      subtitle: combo === 0 && dailyTotal > 1 ? "Không sao, học từ sai là cách nhớ lâu nhất!" : undefined,
    };
  }

  const praise = praiseForCorrect(combo, streak);
  if (hitGoal) {
    return {
      stats,
      title: "🎉 Hoàn thành mục tiêu hôm nay!",
      subtitle: `Bạn đã làm đủ ${goal} câu đúng — nghỉ ngơi hoặc học thêm nhé!`,
      celebrate: true,
      milestone: "daily_goal",
    };
  }

  return { stats, ...praise };
}

export function recordExamComplete(passed: boolean, score: number, total: number): AnswerRecorded {
  resetDailyIfNeeded();
  const streak = updateStreakForToday();
  writeNum(KEYS.dailyTotal, readNum(KEYS.dailyTotal) + total);
  if (passed) {
    writeNum(KEYS.dailyCorrect, readNum(KEYS.dailyCorrect) + Math.min(score, 10));
  }
  const stats = getStudyStats();

  if (passed) {
    return {
      stats,
      title: "🎉 ĐẬU bài thi thử!",
      subtitle: `${score}/${total} câu — ${streak > 1 ? `${streak} ngày học liên tiếp!` : "Tiếp tục giữ phong độ nhé!"}`,
      celebrate: true,
      milestone: "streak",
    };
  }
  return {
    stats,
    title: "💪 Chưa đủ điểm — cố lên!",
    subtitle: `Bạn được ${score}/${total}. Ôn câu sai rồi thi lại nhé!`,
  };
}

export function resetSessionCombo(): void {
  writeNum(KEYS.sessionCombo, 0);
}

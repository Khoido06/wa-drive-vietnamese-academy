"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ElderButton } from "@repo/ui/elder-button";
import { isClerkEnabled } from "../lib/clerk-config";
import { ensureUser } from "../lib/api";

const DAILY_GOALS = [
  { value: 10, label: "10 phút / ngày" },
  { value: 15, label: "15 phút / ngày (khuyên dùng)" },
  { value: 20, label: "20 phút / ngày" },
  { value: 30, label: "30 phút / ngày" },
];

const ONBOARD_TIPS = (
  <>
    <li>🔊 Bấm <strong>Đọc to</strong> để nghe câu hỏi và giải thích</li>
    <li>🔤 Bấm <strong>A+</strong> góc màn hình để phóng to chữ</li>
    <li>📖 <strong>Tiếp tục học</strong> — ôn chủ đề yếu tự động</li>
    <li>📝 <strong>Thi thử</strong> — 40 câu, cần 32 câu đúng để đậu</li>
    <li>📴 <strong>Thi không cần WiFi</strong> — Bộ đề 1 tải sẵn trên máy</li>
  </>
);

export function MomOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyGoal, setDailyGoal] = useState(15);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("wa_onboarding_done");
    if (!done) setShow(true);
    else {
      setName(localStorage.getItem("wa_display_name") ?? "");
      setExamDate(localStorage.getItem("wa_exam_date") ?? "");
      setDailyGoal(Number(localStorage.getItem("wa_daily_goal") ?? 15));
    }
  }, []);

  if (!show) return null;

  const finish = (goSignIn = false) => {
    const displayName = name.trim() || "Mẹ";
    localStorage.setItem("wa_display_name", displayName);
    localStorage.setItem("wa_onboarding_done", "1");
    if (examDate) localStorage.setItem("wa_exam_date", examDate);
    localStorage.setItem("wa_daily_goal", String(dailyGoal));
    void ensureUser(displayName).catch(() => {});
    setShow(false);
    if (goSignIn && isClerkEnabled()) {
      router.push("/sign-in");
    } else {
      router.refresh();
    }
  };

  const emoji = step === 0 ? "👋" : step === 1 ? "📅" : step === 2 ? "🎯" : "💾";

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className="onboarding-card">
        <p className="onboarding-emoji" aria-hidden="true">{emoji}</p>

        {step === 0 && (
          <>
            <h2 id="onboard-title" className="onboarding-title">Chào mừng!</h2>
            <p className="onboarding-desc">
              Ứng dụng giúp bạn luyện thi bằng lái xe Washington bằng tiếng Việt.
              Học từng câu có giải thích, rồi thi thử <strong>40 câu</strong> giống bài thi thật.
            </p>
            <label htmlFor="mom-name" className="question-topic">Tên của bạn</label>
            <input
              id="mom-name"
              className="onboarding-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Hạnh"
              autoFocus
            />
            <div className="onboarding-actions">
              <ElderButton variant="success" onClick={() => setStep(1)}>
                Tiếp theo →
              </ElderButton>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 id="onboard-title" className="onboarding-title">Ngày thi dự kiến</h2>
            <p className="onboarding-desc">
              Chọn ngày bạn dự định thi DMV (có thể bỏ qua).
            </p>
            <label htmlFor="exam-date" className="question-topic">Ngày thi</label>
            <input
              id="exam-date"
              type="date"
              className="onboarding-input"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
            <div className="onboarding-actions">
              <ElderButton variant="secondary" onClick={() => setStep(0)}>← Quay lại</ElderButton>
              <ElderButton variant="success" onClick={() => setStep(2)}>Tiếp theo →</ElderButton>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 id="onboard-title" className="onboarding-title">Mục tiêu mỗi ngày</h2>
            <p className="onboarding-desc">Bạn muốn học bao lâu mỗi ngày?</p>
            <div className="onboarding-goals">
              {DAILY_GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`onboarding-goal${dailyGoal === g.value ? " onboarding-goal--active" : ""}`}
                  onClick={() => setDailyGoal(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <details className="onboarding-tips-panel">
              <summary>💡 Xem mẹo sử dụng app</summary>
              <ul className="onboarding-tips">{ONBOARD_TIPS}</ul>
            </details>
            <div className="onboarding-actions">
              <ElderButton variant="secondary" onClick={() => setStep(1)}>← Quay lại</ElderButton>
              {isClerkEnabled() ? (
                <ElderButton variant="success" onClick={() => setStep(3)}>Tiếp theo →</ElderButton>
              ) : (
                <ElderButton variant="success" onClick={() => finish()}>Bắt đầu học →</ElderButton>
              )}
            </div>
          </>
        )}

        {step === 3 && isClerkEnabled() && (
          <>
            <h2 id="onboard-title" className="onboarding-title">Lưu tiến độ</h2>
            <p className="onboarding-desc">
              Đăng nhập <strong>1 lần</strong> bằng email hoặc Google — khi đổi điện thoại, bài đã học vẫn còn.
              Con có thể giúp mẹ tạo tài khoản nếu cần.
            </p>
            <ul className="onboarding-tips">
              <li>✅ Nên đăng nhập nếu sắp đổi máy hoặc muốn backup tiến độ</li>
              <li>⏭️ Có thể bỏ qua — đăng nhập sau qua nút góc màn hình</li>
            </ul>
            <div className="onboarding-actions">
              <ElderButton variant="secondary" onClick={() => setStep(2)}>← Quay lại</ElderButton>
              <ElderButton variant="secondary" onClick={() => finish(false)}>Bỏ qua, học luôn</ElderButton>
              <ElderButton variant="success" onClick={() => finish(true)}>Đăng nhập →</ElderButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

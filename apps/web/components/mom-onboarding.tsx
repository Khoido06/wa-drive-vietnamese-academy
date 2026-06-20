"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ElderButton } from "@repo/ui/elder-button";

export function MomOnboarding() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("wa_onboarding_done");
    if (!done) setShow(true);
  }, []);

  if (!show) return null;

  const finish = () => {
    const displayName = name.trim() || "Mẹ";
    localStorage.setItem("wa_display_name", displayName);
    localStorage.setItem("wa_onboarding_done", "1");
    setShow(false);
    router.refresh();
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className="onboarding-card">
        <p style={{ fontSize: "48px", marginBottom: "16px" }}>👋</p>
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
          placeholder="Ví dụ: Cô Lan"
          autoFocus
        />
        <ul className="onboarding-tips">
          <li>🔊 Bấm <strong>Đọc to</strong> để nghe câu hỏi và giải thích</li>
          <li>🔤 Bấm <strong>A+</strong> góc màn hình để phóng to chữ</li>
          <li>📖 <strong>Tiếp tục học</strong> — ôn chủ đề yếu tự động</li>
          <li>📝 <strong>Thi thử</strong> — 40 câu, cần 32 câu đúng để đậu</li>
        </ul>
        <ElderButton variant="success" onClick={finish}>
          Bắt đầu học →
        </ElderButton>
      </div>
    </div>
  );
}

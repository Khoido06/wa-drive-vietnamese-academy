"use client";

import { useState } from "react";

interface Props {
  youtubeId: string;
  title: string;
}

export function ManeuverVideoGuide({ youtubeId, title }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className="maneuver-video">
      <button
        type="button"
        className="maneuver-video__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        🎬 {open ? "Ẩn video" : "Xem video hướng dẫn DOL"}
        <span className="maneuver-video__title">{title}</span>
      </button>
      {open ? (
        <div className="maneuver-video__embed">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : null}
    </section>
  );
}

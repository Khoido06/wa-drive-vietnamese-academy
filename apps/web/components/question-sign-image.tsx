"use client";

interface QuestionSignImageProps {
  imageUrl: string;
  alt?: string;
}

export function QuestionSignImage({ imageUrl, alt = "Biển báo giao thông" }: QuestionSignImageProps) {
  return (
    <div className="question-sign">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={alt} className="question-sign__img" />
    </div>
  );
}

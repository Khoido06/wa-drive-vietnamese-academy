export const vi = {
  appName: "Học Lái Xe WA",
  appSubtitle: "Luyện thi bằng lái xe Washington",
  home: {
    welcome: "Chào mừng!",
    continueLearning: "Tiếp tục học",
    startLearning: "Bắt đầu học",
    practiceExam: "Thi thử",
    practicalTest: "Thi thực hành",
    askQuestion: "Hỏi thầy giáo AI",
    viewProgress: "Xem tiến độ",
  },
  learn: {
    title: "Học bài",
    subtitle: "Một câu hỏi mỗi lần",
    submit: "Trả lời",
    next: "Câu tiếp theo",
    correct: "Chính xác!",
    incorrect: "Chưa đúng",
    explanation: "Giải thích",
  },
  exam: {
    title: "Thi thử",
    subtitle: "Giống như thi thật",
    start: "Bắt đầu thi",
    finish: "Nộp bài",
  },
  tutor: {
    title: "Hỏi thầy giáo",
    subtitle: "Hỏi bất kỳ câu hỏi nào về luật lái xe",
    placeholder: "Ví dụ: Tốc độ tối đa trong khu dân cư là bao nhiêu?",
    ask: "Hỏi",
    thinking: "Đang tìm câu trả lời...",
    noAnswer: "Không tìm thấy câu trả lời chính xác",
  },
  progress: {
    title: "Tiến độ học",
    subtitle: "Theo dõi quá trình của bạn",
    accuracy: "Độ chính xác",
    mastery: "Mức thành thạo",
    attempts: "Số lần làm bài",
  },
  common: {
    loading: "Đang tải...",
    error: "Có lỗi xảy ra",
    retry: "Thử lại",
  },
} as const;

export type ViStrings = typeof vi;

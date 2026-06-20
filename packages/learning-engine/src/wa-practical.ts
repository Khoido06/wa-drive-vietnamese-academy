/** Washington State DOL driving skills test — practical prep content (Vietnamese). */

export interface PracticalStep {
  title: string;
  body: string;
  tip?: string;
}

export interface PracticalQuiz {
  question: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: string;
}

export interface PracticalManeuver {
  id: string;
  icon: string;
  titleVi: string;
  subtitleVi: string;
  examinerLooksFor: string[];
  steps: PracticalStep[];
  commonMistakes: string[];
  quiz: PracticalQuiz;
  /** Official WA DOL YouTube guide (when available). */
  videoGuide?: {
    youtubeId: string;
    titleVi: string;
  };
}

/** Full DOL drive-test video series (YouTube / WALicensing). */
export const WA_DOL_DRIVE_VIDEOS = [
  { youtubeId: "Qw4-0GfcFYA", titleVi: "Drive Test #1: Trước khi thi (Pre-test)", duration: "2:56" },
  { youtubeId: "Il5KdPDJG98", titleVi: "Drive Test #2: Lùi xe (Backing)", duration: "2:17" },
  { youtubeId: "eRgeq8xrqTg", titleVi: "Drive Test #3: Đỗ song song", duration: "2:26" },
  { youtubeId: "CXl_Ni-mTn8", titleVi: "Drive Test #4: Đổi làn & rẽ", duration: "1:48" },
] as const;

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
}

export const WA_DRIVE_TEST_INFO = {
  passScore: 80,
  maxScore: 100,
  duration: "15–20 phút",
  knowledgePrerequisite: "Đậu bài thi lý thuyết 32/40 trong vòng 2 năm",
  dolUrl: "https://dol.wa.gov/driver-licenses-and-permits/driver-training-and-testing/do-i-need-take-test",
} as const;

export const WA_PRACTICAL_MANEUVERS: PracticalManeuver[] = [
  {
    id: "parallel_parking",
    icon: "🅿️",
    titleVi: "Đỗ xe song song (Parallel parking)",
    subtitleVi: "Thường gặp nhất — nhiều người lo lắng nhưng không phải điểm trừ nặng nhất",
    examinerLooksFor: [
      "Đỗ gọn trong vạch, cách lề tối đa 12 inch (~30 cm)",
      "Xi-nhan trước khi lùi",
      "Quan sát gương và điểm mù",
      "Không đâm lề, cọc hoặc xe khác",
    ],
    steps: [
      {
        title: "1. Tìm chỗ & xi-nhan",
        body: "Chọn chỗ dài hơn xe khoảng 1,5 lần. Dừng song song xe phía trước, cách ~2 feet (60 cm). Bật xi-nhan phải.",
        tip: "Nếu chỗ quá ngắn, giám khảo sẽ chỉ chỗ khác — đừng vội.",
      },
      {
        title: "2. Lùi và quay vô-lăng phải",
        body: "Nhìn gương, quan sát phía sau. Lùi chậm, quay vô-lăng sang phải mạnh để đuôi xe vào chỗ.",
      },
      {
        title: "3. Quay vô-lăng trái",
        body: "Khi xe nghiêng ~45°, quay vô-lăng sang trái để thân xe thẳng hàng với lề.",
      },
      {
        title: "4. Căn chỉnh & dừng",
        body: "Tiếp tục lùi nhẹ, chỉnh vô-lăng để xe song song lề. Dừng, số P (Park), kéo phanh tay.",
        tip: "WA: cách lề không quá 12 inch.",
      },
      {
        title: "5. Rời chỗ đỗ",
        body: "Xi-nhan trái, kiểm tra gương và điểm mù, lùi nhẹ tạo góc nếu cần, hòa nhập làn khi an toàn.",
      },
    ],
    commonMistakes: [
      "Không xi-nhan",
      "Cách lề quá xa (>12 inch)",
      "Không nhìn qua vai khi lùi",
      "Đâm lề hoặc cọc",
    ],
    videoGuide: {
      youtubeId: "eRgeq8xrqTg",
      titleVi: "Video chính thức DOL: Đỗ song song",
    },
    quiz: {
      question: "Khi đỗ song song ở Washington, xe cách lề tối đa bao nhiêu?",
      options: [
        { id: "a", text: "6 inch (~15 cm)" },
        { id: "b", text: "12 inch (~30 cm)" },
        { id: "c", text: "18 inch (~45 cm)" },
        { id: "d", text: "24 inch (~60 cm)" },
      ],
      correctOptionId: "b",
      explanation: "Luật WA: khi đỗ song song, xe không được cách lề quá 12 inch.",
    },
  },
  {
    id: "hill_parking",
    icon: "⛰️",
    titleVi: "Đỗ xe trên dốc (Hill parking)",
    subtitleVi: "Quay bánh xe đúng hướng + phanh tay",
    examinerLooksFor: [
      "Quay bánh xe đúng theo hướng dốc và có/không có lề",
      "Kéo phanh tay (parking brake)",
      "Đặt số P",
    ],
    steps: [
      {
        title: "1. Dốc xuống — có lề",
        body: "Quay bánh xe về phía lề (toward the curb). Nếu xe trượt, bánh chặn vào lề.",
      },
      {
        title: "2. Dốc lên — có lề",
        body: "Quay bánh xe ra xa lề (away from curb). Xe trượt sẽ chui vào lề thay vì ra đường.",
      },
      {
        title: "3. Không có lề",
        body: "Quay bánh về phía rìa đường (xa làn xe) để xe không lăn xuống làn.",
      },
      {
        title: "4. Phanh tay & số P",
        body: "Luôn kéo phanh tay và đặt số P trước khi tắt máy.",
        tip: "Giám khảo có thể hỏi bạn chỉ và giải thích — học thuộc 3 trường hợp.",
      },
    ],
    commonMistakes: [
      "Quay bánh sai hướng",
      "Quên phanh tay",
      "Không giải thích được khi giám khảo hỏi",
    ],
    videoGuide: {
      youtubeId: "Qw4-0GfcFYA",
      titleVi: "Video DOL: Kiểm tra xe trước thi (có phần đỗ dốc)",
    },
    quiz: {
      question: "Đỗ trên dốc xuống CÓ vỉa hè (curb), quay bánh xe hướng nào?",
      options: [
        { id: "a", text: "Về phía vỉa hè (toward curb)" },
        { id: "b", text: "Ra xa vỉa hè (away from curb)" },
        { id: "c", text: "Thẳng, song song vỉa" },
        { id: "d", text: "Không cần quay" },
      ],
      correctOptionId: "a",
      explanation: "Dốc xuống có lề: quay về lề. Dốc lên có lề: quay ra xa lề.",
    },
  },
  {
    id: "backing_corner",
    icon: "↩️",
    titleVi: "Lùi quanh góc (Backing around a corner)",
    subtitleVi: "Lùi chậm, sát lề, nhìn qua cửa sổ sau",
    examinerLooksFor: [
      "Lùi chậm, kiểm soát tốt",
      "Giữ gần lề (không ra giữa đường)",
      "Nhìn qua cửa sổ sau — không chỉ dựa camera lùi",
      "Dừng cho người đi bộ",
    ],
    steps: [
      {
        title: "1. Xi-nhan & quan sát",
        body: "Bật xi-nhan phải (nếu lùi về phía lề phải). Kiểm tra gương, điểm mù, nhìn phía sau.",
        tip: "WA thi thực hành: camera lùi thường KHÔNG được dùng khi thi.",
      },
      {
        title: "2. Lùi chậm quanh góc",
        body: "Quay đầu nhìn qua cửa sổ sau. Lùi rất chậm, giữ xe gần lề.",
      },
      {
        title: "3. Chỉnh vô-lăng",
        body: "Xoay vô-lăng vừa đủ để ôm góc — tránh quay quá sớm hoặc quá muộn.",
      },
      {
        title: "4. Dừng khi được yêu cầu",
        body: "Giám khảo có thể yêu cầu dừng giữa chừng. Dừng hoàn toàn, giữ phanh.",
      },
    ],
    commonMistakes: [
      "Lùi quá nhanh",
      "Chỉ nhìn gương, không quay đầu nhìn sau",
      "Xe cách lề quá xa",
      "Không dừng cho người đi bộ",
    ],
    videoGuide: {
      youtubeId: "Il5KdPDJG98",
      titleVi: "Video chính thức DOL: Lùi quanh góc",
    },
    quiz: {
      question: "Khi lùi xe trong bài thi WA, bạn nên nhìn đâu?",
      options: [
        { id: "a", text: "Chỉ gương chiếu hậu" },
        { id: "b", text: "Chỉ camera lùi" },
        { id: "c", text: "Quay đầu nhìn qua cửa sổ sau" },
        { id: "d", text: "Nhìn màn hình điện thoại" },
      ],
      correctOptionId: "c",
      explanation: "Giám khảo muốn thấy bạn quay đầu kiểm tra phía sau — an toàn hơn chỉ dùng camera.",
    },
  },
  {
    id: "lane_change",
    icon: "↔️",
    titleVi: "Đổi làn (Lane change)",
    subtitleVi: "Xi-nhan → gương → điểm mù → đổi làn mượt",
    examinerLooksFor: [
      "Bật xi-nhan trước ít nhất 100 feet (~30 m)",
      "Kiểm tra gương và nhìn qua vai (blind spot)",
      "Đổi làn mượt, không lấn làn",
      "Giữ tốc độ phù hợp",
    ],
    steps: [
      {
        title: "1. Xi-nhan sớm",
        body: "Bật xi-nhan trước khi đổi làn — ít nhất 100 feet theo luật WA.",
      },
      {
        title: "2. Kiểm tra gương",
        body: "Gương trong + gương ngoài — xem xe phía sau và bên cạnh.",
      },
      {
        title: "3. Nhìn qua vai",
        body: "Quay đầu nhanh kiểm tra điểm mù (blind spot). Không chỉ tin gương.",
      },
      {
        title: "4. Đổi làn mượt",
        body: "Rẽ vô-lăng nhẹ, vào làn mới, tắt xi-nhan sau khi ổn định.",
        tip: "Giám khảo ghi điểm nếu bạn xi-nhan mọi lần — kể cả rẽ vào lề.",
      },
    ],
    commonMistakes: [
      "Không xi-nhan",
      "Không nhìn qua vai",
      "Đổi làn đột ngột",
      "Phanh gấp sau khi đổi làn",
    ],
    videoGuide: {
      youtubeId: "CXl_Ni-mTn8",
      titleVi: "Video chính thức DOL: Đổi làn & rẽ",
    },
    quiz: {
      question: "Trước khi đổi làn trên xa lộ ở Washington, bạn nên bật xi-nhan trước ít nhất bao nhiêu feet?",
      options: [
        { id: "a", text: "50 feet (~15 m)" },
        { id: "b", text: "100 feet (~30 m)" },
        { id: "c", text: "200 feet (~60 m)" },
        { id: "d", text: "Không bắt buộc xi-nhan" },
      ],
      correctOptionId: "b",
      explanation: "Luật WA yêu cầu xi-nhan ít nhất 100 feet trước khi rẽ hoặc đổi làn trên xa lộ.",
    },
  },
  {
    id: "enter_exit_traffic",
    icon: "🛣️",
    titleVi: "Vào / ra giao thông (Entering & exiting)",
    subtitleVi: "Hòa nhập tốc độ, nhường đường, dừng hẳn tại STOP",
    examinerLooksFor: [
      "Dừng hoàn toàn tại biển STOP (kể cả rẽ phải)",
      "Hòa nhập đúng tốc độ dòng xe",
      "Nhường người đi bộ tại vạch",
      "Tuân thủ tốc độ giới hạn",
    ],
    steps: [
      {
        title: "1. Dừng hẳn tại STOP",
        body: "Tại biển STOP: dừng hoàn toàn trước vạch trắng hoặc giao lộ. Cuộn xe nhẹ không được tính.",
        tip: "Đây là lỗi phổ biến nhất — giám khảo trừ điểm nặng.",
      },
      {
        title: "2. Nhường người đi bộ",
        body: "Dừng cho người đi bộ trong vạch và gần vạch qua đường.",
      },
      {
        title: "3. Hòa nhập làn",
        body: "Xi-nhan, tăng tốc trên làn nhập để khớp tốc độ dòng xe, nhìn qua vai, hòa nhập khi có khoảng trống.",
      },
      {
        title: "4. Giữ tốc độ giới hạn",
        body: "Lái đúng tốc độ khu vực (25 mph trong thành phố nếu không có biển). Không đi quá chậm gây cản trở.",
      },
    ],
    commonMistakes: [
      "Cuộn xe tại STOP thay vì dừng hẳn",
      "Vào làn quá chậm gây nguy hiểm",
      "Không nhường người đi bộ",
      "Vượt tốc độ",
    ],
    videoGuide: {
      youtubeId: "CXl_Ni-mTn8",
      titleVi: "Video DOL: Giao thông, STOP & nhập làn",
    },
    quiz: {
      question: "Tại biển STOP, bạn phải làm gì trước khi đi?",
      options: [
        { id: "a", text: "Giảm tốc và cuộn qua nếu không thấy xe" },
        { id: "b", text: "Dừng hoàn toàn, rồi đi khi an toàn" },
        { id: "c", text: "Bấm còi và đi thẳng" },
        { id: "d", text: "Chỉ dừng nếu có xe khác" },
      ],
      correctOptionId: "b",
      explanation: "STOP nghĩa là dừng hoàn toàn — kể cả khi rẽ phải.",
    },
  },
];

export const WA_VEHICLE_CHECKLIST: ChecklistItem[] = [
  { id: "insurance", label: "Bảo hiểm xe hợp lệ (thẻ hoặc app)", detail: "Bắt buộc — không có thì không thi được" },
  { id: "registration", label: "Đăng ký xe, biển số, tab còn hạn" },
  { id: "signals", label: "Xi-nhan trái/phải hoạt động" },
  { id: "brakes", label: "Phanh & đèn phanh" },
  { id: "headlights", label: "Đèn pha/cốt (nếu trời tối hoặc mưa)" },
  { id: "wipers", label: "Gạt mưa hoạt động" },
  { id: "mirrors", label: "Gương trong + ngoài" },
  { id: "seatbelts", label: "Dây an toàn tài xế & hành khách" },
  { id: "tires", label: "Lốp đủ gai, không nứt kính lái" },
  { id: "driver_window", label: "Cửa sổ tài xế mở/đóng được" },
  { id: "horn", label: "Còi hoạt động" },
];

export const WA_DAY_OF_TEST_CHECKLIST: ChecklistItem[] = [
  { id: "knowledge_pass", label: "Đã đậu bài thi lý thuyết trong 2 năm" },
  { id: "photo_id", label: "Giấy tờ tùy thân có ảnh (passport, ID, học sinh…)" },
  { id: "glasses", label: "Đeo kính/contacts nếu giấy phép yêu cầu" },
  { id: "accompany", label: "Người có bằng lái đi cùng (nếu cần đến điểm thi)" },
  { id: "rest", label: "Ngủ đủ, ăn sáng — không lo lắng quá" },
  { id: "early", label: "Đến sớm 10–15 phút" },
  { id: "phone_off", label: "Tắt tiếng điện thoại trong xe" },
  { id: "adjust", label: "Chỉnh ghế, gương, dây an toàn trước khi chạy" },
];

export const WA_SCORING_CATEGORIES = [
  { title: "Điều khiển xe", items: ["Phanh mượt", "Giữ làn", "Tốc độ phù hợp"] },
  { title: "Quan sát", items: ["Gương", "Điểm mù", "Nhìn giao lộ", "Nhìn khi lùi"] },
  { title: "5 thao tác bắt buộc", items: ["Đỗ song song", "Đỗ dốc", "Lùi góc", "Đổi làn", "Vào/ra giao thông"] },
  { title: "Luật giao thông", items: ["STOP hẳn", "Xi-nhan", "Nhường đường", "Tốc độ"] },
];

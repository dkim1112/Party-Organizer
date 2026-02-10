export interface User {
  id: string;
  // For Kakao login
  kakaoId?: string;
  // Phone number collected during profile creation
  phoneNumber?: string;
  // Common fields
  name: string;
  gender: "male" | "female";
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  date: Date;
  time: string; // 예: "오후 8:00 - 11:00"
  title: string; // 예: "꺄르륵 파티"
  location: string; // 예: "강남구 꺄르륵 바"
  address: string; // 상세 주소
  mcName: string; // MC 이름
  description: string; // 이벤트 설명
  rules: string[]; // 참가 규칙들
  price: number; // 참가비
  maxMaleSlots: number; // 최대 남성 슬롯 (기본 5)
  maxFemaleSlots: number; // 최대 여성 슬롯 (기본 5)
  maleCount: number; // 현재 남성 참가자 수
  femaleCount: number; // 현재 여성 참가자 수
  participants: string[]; // User IDs
  status: "open" | "full" | "closed";
  eventPassword: string; // 바 고객 인증용 비밀번호
  createdAt: Date;
  updatedAt: Date;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  paymentStatus: "pending" | "completed" | "failed";
  approvalStatus: "pending" | "approved" | "rejected"; // 관리자 승인 상태
  submittedAt: Date; // 신청 제출 시간 (대기열 순서용)
  questionnaireAnswers: QuestionnaireAnswers;
  registeredAt: Date;
  updatedAt: Date;
}

export interface QuestionnaireAnswers {
  [questionId: string]: string | string[];
}

export interface Question {
  id: string;
  type: "text";
  title: string;
  subtitle?: string;
  options?: string[];
  required: boolean;
  order: number;
}

export interface BankTransferInfo {
  bankName: string; // 은행명
  accountNumber: string; // 계좌번호
  accountHolder: string; // 예금주
  amount: number; // 입금할 금액
}

export interface EventStatus {
  maleSlots: number;
  femaleSlots: number;
  totalSlots: number;
  availableMaleSlots: number;
  availableFemaleSlots: number;
  canJoin: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
}

export interface PendingRegistration {
  id: string;
  registrationId: string;
  user: User;
  event: Event;
  submittedAt: Date;
  approvalStatus: "pending" | "approved" | "rejected";
}

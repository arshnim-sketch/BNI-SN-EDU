export interface Chapter {
  chapterId: string;
  name: string;
}

export interface User {
  phone: string; // PK, ID
  password?: string; // Hashed in real app
  name: string;
  chapterId: string;
  role: 'Member' | 'Coordinator' | 'Master';
  specialty?: string;
  companyName?: string;
  totalScore?: number; // Calculated in leaderboard
  completedTrainingsCount?: number; // Calculated in leaderboard
  depositStatus: 'OK' | 'Pending'; // 보증금 상태 추가
  passwordResetRequired?: boolean; // 비밀번호 강제 변경 여부
}

export interface EducationEvent {
  eventId: string; // PK
  name: string;
  score: number;
  date: string; // Start datetime
  endDate?: string; // End datetime
  instructor?: string;
  location?: string;
  price?: string;
  category: '성남교육' | '트레이닝교육' | '포럼' | '리더십 포럼';
}

export interface EventAttendance {
  attendanceId: string; // PK
  userId: string; // FK to User.phone
  eventId: string; // FK to EducationEvent.eventId
  isAttended: boolean;
  isReviewSubmitted: boolean;
  isApplied: boolean;
  completionDate?: string; // For tracking monthly attendance
}

export interface Book {
  bookId: string; // PK
  title: string;
  author: string;
  dateAdded: string; // datetime
  reportScore: number;
  chapterId: string; // FK to Chapter.chapterId
  price?: string;
  genre?: string;
  publisher?: string;
}

export interface BookCopy {
  registrationNumber: string; // PK
  bookId: string; // FK to Book.bookId
  isLost: boolean;
  status: '대여 가능' | '대여 중' | '대여 불가';
  currentBorrowerId?: string; // FK to User.phone
  loanDate?: string;
  dueDate?: string; // datetime
}

export interface LoanHistory {
  loanId: string; // PK
  registrationNumber: string; // FK to BookCopy.registrationNumber
  userId: string; // FK to User.phone
  checkoutDate: string; // datetime
  returnDate?: string; // datetime
}

export interface BookReport {
  reportId: string; // PK
  userId: string; // FK to User.phone
  bookId: string; // FK to Book.bookId
  isSubmitted: boolean;
  submissionDate?: string;
}

export type ViewType = 'calendar' | 'members' | 'books' | 'admin' | 'leaderboard';
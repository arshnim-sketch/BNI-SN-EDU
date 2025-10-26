import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  User,
  Book,
  BookCopy,
  EducationEvent,
  BookReport,
  EventAttendance,
  ViewType,
  Chapter,
  LoanHistory,
} from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon, TopBadge, BookIcon, CalendarIcon, LeaderboardIcon, UsersIcon, AdminIcon } from './components/icons';

// A new type for leaderboard data that includes detailed scores
interface LeaderboardUser extends User {
  trainingScore: number;
  reportScore: number;
  totalScore: number;
}


// --- CONSTANTS ---
const TOP_12_COURSES = [
  { name: 'MSP 기본', score: 3 },
  { name: 'MSP 심화', score: 3 },
  { name: 'BNI에서의 대화법', score: 2 },
  { name: '리퍼럴마케팅입문', score: 2 },
  { name: '파워팀워크샵', score: 2 },
  { name: '파워팀입문', score: 2 },
  { name: '사업가들의 꿈을 이루는 시간관리법', score: 2 },
  { name: '성공지도그리기', score: 2 },
  { name: '리퍼럴스킬워크샵', score: 2 },
  { name: '위클리프리젠테이션', score: 2 },
  { name: '피쳐프리젠테이션', score: 2 },
  { name: '멘토입문', score: 2 }
];


// --- MOCK DATA ---
const initialChapters: Chapter[] = [
  { chapterId: 'c1', name: '그랜드' },
  { chapterId: 'c2', name: '더유니온' },
  { chapterId: 'c3', name: '드림컴트루' },
];

const initialUsers: User[] = [
  { phone: 'bni.sn', password: '0p9o8i7u!', name: '마스터 관리자', chapterId: 'c3', role: 'Master', companyName: 'BNI Korea', specialty: '관리', depositStatus: 'OK', passwordResetRequired: false },
  { phone: '01011111111', password: 'password', name: '김교육', chapterId: 'c3', role: 'Coordinator', companyName: '교육회사', specialty: '교육', depositStatus: 'OK', passwordResetRequired: false },
  { phone: '01022222222', password: 'password', name: '이회원', chapterId: 'c3', role: 'Member', companyName: '디자인 스튜디오', specialty: '디자인', depositStatus: 'OK', passwordResetRequired: true }, // Password reset test user
  { phone: '01033333333', password: 'password', name: '박참여', chapterId: 'c1', role: 'Member', companyName: '건설', specialty: '건축', depositStatus: 'Pending', passwordResetRequired: false },
  { phone: '01044444444', password: 'password', name: '최성실', chapterId: 'c2', role: 'Member', companyName: '마케팅랩', specialty: '마케팅', depositStatus: 'OK', passwordResetRequired: false },
  { phone: '01055555555', password: 'password', name: '정열심', chapterId: 'c1', role: 'Coordinator', companyName: '금융 컨설팅', specialty: '금융', depositStatus: 'OK', passwordResetRequired: false },
];

const initialEducationEvents: EducationEvent[] = [
    ...TOP_12_COURSES.map((course, index) => ({
      eventId: `e${index + 1}`,
      name: course.name,
      score: course.score,
      date: `2024-07-${10 + index}T09:00:00`,
      endDate: `2024-07-${10 + index}T11:00:00`,
      category: (['성남교육', '트레이닝교육', '포럼'] as const)[index % 3],
      instructor: 'BNI 강사',
      location: '온라인 Zoom',
      price: '유료'
    })),
    { eventId: 'e13', name: '리더십 포럼 1회', score: 5, date: '2024-08-20T10:00:00', endDate: '2024-08-20T12:00:00', category: '리더십 포럼', location: '본사', price: '참가비 없음'},
];

const initialEventAttendances: EventAttendance[] = [
  { attendanceId: 'ea1', userId: 'bni.sn', eventId: 'e1', isAttended: true, isReviewSubmitted: true, isApplied: true, completionDate: '2024-07-11' },
  { attendanceId: 'ea2', userId: '01022222222', eventId: 'e2', isAttended: true, isReviewSubmitted: false, isApplied: true, completionDate: '2024-07-16' },
  { attendanceId: 'ea3', userId: '01033333333', eventId: 'e1', isAttended: true, isReviewSubmitted: false, isApplied: true, completionDate: '2024-07-11' },
  { attendanceId: 'ea4', userId: '01033333333', eventId: 'e2', isAttended: false, isReviewSubmitted: false, isApplied: true },
  ...Array.from({ length: 12 }, (_, i) => ({
    attendanceId: `ea-top-${i + 1}`,
    userId: '01044444444',
    eventId: `e${i + 1}`,
    isAttended: true,
    isReviewSubmitted: true,
    isApplied: true,
    completionDate: `2024-07-1${i > 8 ? '' : '0'}`
  }))
];

const initialBooks: Book[] = [
  { bookId: 'b1', title: '성공하는 사람들의 7가지 습관', author: '스티븐 코비', dateAdded: '2024-01-01', reportScore: 20, chapterId: 'c3', genre: '자기계발', publisher: '김영사', price: '15,000원' },
  { bookId: 'b2', title: '데일 카네기 인간관계론', author: '데일 카네기', dateAdded: '2024-02-01', reportScore: 20, chapterId: 'c1', genre: '자기계발', publisher: '현대지성', price: '11,500원' },
];

const initialBookCopies: BookCopy[] = [
  { registrationNumber: '000001', bookId: 'b1', isLost: false, status: '대여 중', currentBorrowerId: '01011111111', loanDate: '2024-07-01', dueDate: '2024-07-15' }, // Overdue example
  { registrationNumber: '000002', bookId: 'b1', isLost: false, status: '대여 가능' },
  { registrationNumber: '000003', bookId: 'b2', isLost: false, status: '대여 가능' },
];

const initialBookReports: BookReport[] = [
  { reportId: 'br1', userId: '01022222222', bookId: 'b1', isSubmitted: true, submissionDate: '2024-07-20' },
  { reportId: 'br2', userId: '01044444444', bookId: 'b1', isSubmitted: true, submissionDate: '2024-07-21' },
  { reportId: 'br3', userId: '01044444444', bookId: 'b2', isSubmitted: true, submissionDate: '2024-07-22' },
];

const initialLoanHistory: LoanHistory[] = [
    { loanId: 'lh1', registrationNumber: '000001', userId: '01011111111', checkoutDate: '2024-07-01' }
];


// --- APP COMPONENT ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('calendar');
  const [users, setUsers] = useLocalStorage<User[]>('bni-users', initialUsers);
  const [chapters, setChapters] = useLocalStorage<Chapter[]>('bni-chapters', initialChapters);
  const [books, setBooks] = useLocalStorage<Book[]>('bni-books', initialBooks);
  const [bookCopies, setBookCopies] = useLocalStorage<BookCopy[]>('bni-bookCopies', initialBookCopies);
  const [educationEvents, setEducationEvents] = useLocalStorage<EducationEvent[]>('bni-educationEvents', initialEducationEvents);
  const [bookReports, setBookReports] = useLocalStorage<BookReport[]>('bni-bookReports', initialBookReports);
  const [eventAttendances, setEventAttendances] = useLocalStorage<EventAttendance[]>('bni-eventAttendances', initialEventAttendances);
  const [loanHistory, setLoanHistory] = useLocalStorage<LoanHistory[]>('bni-loanHistory', initialLoanHistory);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('bni-currentUser', null);

  useEffect(() => {
    // This effect ensures that if the app is loaded for the first time,
    // the mock data is populated into localStorage.
    const isFirstLoad = localStorage.getItem('bni-users') === null;
    if (isFirstLoad) {
      setUsers(initialUsers);
      setChapters(initialChapters);
      setBooks(initialBooks);
      setBookCopies(initialBookCopies)
      setEducationEvents(initialEducationEvents);
      setBookReports(initialBookReports);
      setEventAttendances(initialEventAttendances);
      setLoanHistory(initialLoanHistory);
    }
  }, []);


  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Derived state and helper functions
  const getUserName = (phone: string) => users.find(u => u.phone === phone)?.name || 'N/A';
  const getBookTitle = (id: string) => books.find(b => b.bookId === id)?.title || 'N/A';
  const getChapterName = (id: string) => chapters.find(c => c.chapterId === id)?.name || 'N/A';
  
  const calculateLeaderboard = useMemo((): LeaderboardUser[] => {
    return users
      .filter(user => user.role !== 'Master') // Exclude Master from leaderboard
      .map(user => {
        const trainingScore = eventAttendances
            .filter(ea => ea.userId === user.phone && ea.isAttended && ea.isReviewSubmitted)
            .reduce((acc, ea) => {
                const event = educationEvents.find(e => e.eventId === ea.eventId);
                return acc + (event?.score || 0);
            }, 0);

        const reportScore = bookReports
            .filter(br => br.userId === user.phone && br.isSubmitted)
            .reduce((acc, br) => {
                const book = books.find(b => b.bookId === br.bookId);
                return acc + (book?.reportScore || 0);
            }, 0);
        
        const completedTopTrainings = new Set(
          eventAttendances
            .filter(ea => ea.userId === user.phone && ea.isAttended)
            .map(ea => educationEvents.find(e => e.eventId === ea.eventId)?.name)
            .filter(name => TOP_12_COURSES.some(c => c.name === name))
        ).size;

        return {
            ...user,
            trainingScore,
            reportScore,
            totalScore: trainingScore + reportScore,
            completedTrainingsCount: completedTopTrainings,
        };
    }).sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [users, eventAttendances, bookReports, educationEvents, books]);


  const renderView = () => {
    if (!currentUser) return null;
    
    switch (activeView) {
      case 'calendar':
        return <CalendarView 
                  currentUser={currentUser} 
                  eventAttendances={eventAttendances}
                  setEventAttendances={setEventAttendances}
                  educationEvents={educationEvents}
                  setEducationEvents={setEducationEvents}
                  users={users}
                  openModal={openModal}
                  closeModal={closeModal}
                  getChapterName={getChapterName}
                  bookCopies={bookCopies}
                  getBookTitle={getBookTitle}
                />;
      case 'members':
        if (currentUser.role === 'Member') return <AccessDenied />;
        return <UserManager users={users} setUsers={setUsers} chapters={chapters} openModal={openModal} closeModal={closeModal} getChapterName={getChapterName} currentUser={currentUser} />;
      case 'books':
        return <BookManager
            currentUser={currentUser}
            books={books} setBooks={setBooks}
            bookCopies={bookCopies} setBookCopies={setBookCopies}
            loanHistory={loanHistory} setLoanHistory={setLoanHistory}
            chapters={chapters}
            openModal={openModal} closeModal={closeModal}
            getUserName={getUserName} getChapterName={getChapterName}
            getBookTitle={getBookTitle}
         />;
      case 'admin':
        if (currentUser.role === 'Member') return <AccessDenied />;
        return <AdminPanel
          currentUser={currentUser}
          users={users}
          setUsers={setUsers}
          chapters={chapters}
          books={books}
          bookCopies={bookCopies}
          setBookCopies={setBookCopies}
          loanHistory={loanHistory}
          setLoanHistory={setLoanHistory}
          educationEvents={educationEvents}
          setEducationEvents={setEducationEvents}
          bookReports={bookReports}
          setBookReports={setBookReports}
          eventAttendances={eventAttendances}
          setEventAttendances={setEventAttendances}
          openModal={openModal}
          closeModal={closeModal}
          getBookTitle={getBookTitle}
          getUserName={getUserName}
          getChapterName={getChapterName}
        />;
      case 'leaderboard':
        return <Leaderboard data={calculateLeaderboard} eventAttendances={eventAttendances} educationEvents={educationEvents} books={books} bookReports={bookReports} openModal={openModal} getChapterName={getChapterName} currentUser={currentUser} chapters={chapters} />;
      default:
        return <CalendarView 
                  currentUser={currentUser} 
                  eventAttendances={eventAttendances}
                  setEventAttendances={setEventAttendances}
                  educationEvents={educationEvents}
                  setEducationEvents={setEducationEvents}
                  users={users}
                  openModal={openModal}
                  closeModal={closeModal}
                  getChapterName={getChapterName}
                  bookCopies={bookCopies}
                  getBookTitle={getBookTitle}
                />;
    }
  };
  
  const handleLogout = () => {
      setCurrentUser(null);
      setActiveView('calendar');
  }

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView('calendar');
  }

  const handleCreateUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  }

  const handleChangePassword = (newPassword: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, password: newPassword, passwordResetRequired: false };
    setUsers(users.map(u => u.phone === currentUser.phone ? updatedUser : u));
    setCurrentUser(updatedUser);
  }

  if (!currentUser) {
    return <AuthContainer users={users} onLogin={handleLogin} onCreateUser={handleCreateUser} chapters={chapters} />;
  }
  
  if (currentUser.passwordResetRequired) {
    return <ChangePasswordScreen currentUser={currentUser} onPasswordChange={handleChangePassword} />
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header 
        activeView={activeView} 
        setActiveView={setActiveView} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        leaderboardData={calculateLeaderboard}
      />
      <main className="p-0 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {renderView()}
      </main>
      {isModalOpen && <Modal onClose={closeModal}>{modalContent}</Modal>}
      <BottomNav 
          activeView={activeView}
          setActiveView={setActiveView}
          currentUser={currentUser}
      />
    </div>
  );
};

// --- CHILD COMPONENTS ---

const AuthContainer: React.FC<{ users: User[], onLogin: (user: User) => void, onCreateUser: (user: User) => void, chapters: Chapter[] }> = ({ users, onLogin, onCreateUser, chapters }) => {
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

    if (authMode === 'signup') {
        return <SignUpScreen users={users} onSignUp={onCreateUser} switchToLogin={() => setAuthMode('login')} chapters={chapters} />;
    }
    return <LoginScreen users={users} onLogin={onLogin} switchToSignUp={() => setAuthMode('signup')} />;
};

const LoginScreen: React.FC<{ users: User[], onLogin: (user: User) => void, switchToSignUp: () => void }> = ({ users, onLogin, switchToSignUp }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.phone === phone);
        if (user && user.password === password) {
            onLogin(user);
        } else {
            setError('전화번호 또는 비밀번호가 일치하지 않습니다.');
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow bni.sn but remove hyphens from numbers
        if (e.target.value.toLowerCase() !== 'bni.sn') {
            setPhone(e.target.value.replace(/-/g, ''));
        } else {
            setPhone(e.target.value);
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-100 flex flex-col justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center space-x-2 mb-6 justify-center">
                    <BookIcon className="h-10 w-10 text-[#e9062a]"/>
                    <h1 className="text-3xl font-bold text-gray-800">BNI 성남 EDU</h1>
                </div>
                <h2 className="text-2xl font-semibold mb-6 text-center text-gray-700">로그인</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">전화번호 (ID)</label>
                        <input type="text" value={phone} onChange={handlePhoneChange} required placeholder="01011112222" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <button type="submit" className="w-full bg-[#e9062a] text-white py-2 rounded-md hover:bg-red-700 transition">로그인</button>
                </form>
                <p className="mt-6 text-center text-sm">
                    계정이 없으신가요? <button onClick={switchToSignUp} className="font-medium text-[#e9062a] hover:underline">회원가입</button>
                </p>
            </div>
        </div>
    );
};

const SignUpScreen: React.FC<{ users: User[], onSignUp: (user: User) => void, switchToLogin: () => void, chapters: Chapter[] }> = ({ users, onSignUp, switchToLogin, chapters }) => {
    const [formData, setFormData] = useState({
        phone: '', password: '', name: '', chapterId: chapters[0]?.chapterId || '', specialty: '', companyName: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            setFormData({ ...formData, [name]: value.replace(/-/g, '') });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (users.some(u => u.phone === formData.phone)) {
            setError('이미 가입된 전화번호입니다.');
            return;
        }
        if(formData.password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }

        const newUser: User = {
            ...formData,
            role: 'Member',
            depositStatus: 'OK',
            passwordResetRequired: false,
        };
        onSignUp(newUser);
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        switchToLogin();
    };

    return (
        <div className="fixed inset-0 bg-gray-100 flex flex-col justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-6 text-center text-gray-700">회원가입</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="이름" required className="block w-full border p-2 rounded" />
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="전화번호 (ID, '-' 제외)" required className="block w-full border p-2 rounded" />
                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="비밀번호 (6자 이상)" required className="block w-full border p-2 rounded" />
                    <select name="chapterId" value={formData.chapterId} onChange={handleChange} required className="block w-full border p-2 rounded">
                        {chapters.map(c => <option key={c.chapterId} value={c.chapterId}>{c.name}</option>)}
                    </select>
                    <input name="specialty" value={formData.specialty} onChange={handleChange} placeholder="전문분야" className="block w-full border p-2 rounded" />
                    <input name="companyName" value={formData.companyName} onChange={handleChange} placeholder="회사명" className="block w-full border p-2 rounded" />
                    <button type="submit" className="w-full bg-[#e9062a] text-white py-2 rounded-md hover:bg-red-700 transition">가입하기</button>
                </form>
                <p className="mt-6 text-center text-sm">
                    이미 계정이 있으신가요? <button onClick={switchToLogin} className="font-medium text-[#e9062a] hover:underline">로그인</button>
                </p>
            </div>
        </div>
    );
};

const ChangePasswordScreen: React.FC<{ currentUser: User, onPasswordChange: (newPassword: string) => void }> = ({ currentUser, onPasswordChange }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('새 비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }
        onPasswordChange(newPassword);
        alert('비밀번호가 성공적으로 변경되었습니다.');
    };

    return (
        <div className="fixed inset-0 bg-gray-100 flex flex-col justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-2 text-center text-gray-700">비밀번호 변경</h2>
                <p className="text-center text-gray-600 mb-6">{currentUser.name}님, 보안을 위해 새 비밀번호를 설정해주세요.</p>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">새 비밀번호</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <button type="submit" className="w-full bg-[#e9062a] text-white py-2 rounded-md hover:bg-red-700 transition">비밀번호 변경</button>
                </form>
            </div>
        </div>
    );
};

const AccessDenied = () => (
    <div className="text-center p-10 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-red-500">접근 불가</h2>
        <p className="mt-2 text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
    </div>
);


const Header: React.FC<{ 
    activeView: ViewType; 
    setActiveView: (view: ViewType) => void; 
    currentUser: User; 
    onLogout: () => void;
    leaderboardData: LeaderboardUser[];
}> = ({ activeView, setActiveView, currentUser, onLogout, leaderboardData }) => {
    
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    
    const baseNavItems: { id: ViewType; label: string }[] = [
        { id: 'calendar', label: '교육 캘린더' },
        { id: 'leaderboard', label: '리더보드' },
        { id: 'books', label: '도서관' },
    ];

    const navItems = [...baseNavItems];

    if (currentUser.role === 'Coordinator' || currentUser.role === 'Master') {
        navItems.push({ id: 'admin', label: '활동 관리' });
        navItems.push({ id: 'members', label: '회원 관리' });
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsPopupOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popupRef]);

    const myScoreData = leaderboardData.find(u => u.phone === currentUser.phone);

    return (
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div onClick={() => setActiveView('calendar')} className="flex items-center space-x-2 cursor-pointer">
                <BookIcon className="h-8 w-8 text-[#e9062a]"/>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">BNI 성남 EDU</h1>
            </div>
             <div className="flex items-center">
                <nav className="hidden md:flex space-x-4">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeView === item.id
                          ? 'bg-[#e9062a] text-white'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
                 <div className="ml-6 relative" ref={popupRef}>
                    <div className="cursor-pointer" onClick={() => setIsPopupOpen(!isPopupOpen)}>
                         <span className="text-gray-700 text-sm">
                             {currentUser.name}
                         </span>
                    </div>
                    {isPopupOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-md shadow-lg border z-20 p-4">
                           <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-lg">{currentUser.name}</h4>
                                <button onClick={onLogout} className="text-xs text-gray-500 hover:underline">(로그아웃)</button>
                           </div>
                           {myScoreData ? (
                            <div className="text-center bg-gray-50 p-2 rounded">
                                <span className="text-sm font-semibold">교육 {myScoreData.trainingScore}</span>
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="text-sm font-semibold">독서 {myScoreData.reportScore}</span>
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="text-sm font-bold">총 {myScoreData.totalScore}</span>
                            </div>
                           ) : <p className="text-sm text-center">점수 정보 없음</p>}
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </header>
    );
};

const BottomNav: React.FC<{
    activeView: ViewType;
    setActiveView: (view: ViewType) => void;
    currentUser: User;
}> = ({ activeView, setActiveView, currentUser }) => {

    const baseNavItems: { id: ViewType; label: string; icon: React.ReactElement<{ className?: string }> }[] = [
        { id: 'calendar', label: '교육 캘린더', icon: <CalendarIcon /> },
        { id: 'leaderboard', label: '리더보드', icon: <LeaderboardIcon /> },
        { id: 'books', label: '도서관', icon: <BookIcon /> },
    ];

    const navItems = [...baseNavItems];

    if (currentUser.role === 'Coordinator' || currentUser.role === 'Master') {
        navItems.push({ id: 'admin', label: '활동 관리', icon: <AdminIcon /> });
        navItems.push({ id: 'members', label: '회원 관리', icon: <UsersIcon /> });
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-t-lg border-t z-30">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex flex-col items-center justify-center w-full text-center transition-colors duration-200 ${
                            activeView === item.id ? 'text-[#e9062a]' : 'text-gray-500 hover:text-[#e9062a]'
                        }`}
                    >
                        {React.cloneElement(item.icon, { className: 'h-6 w-6 mb-1' })}
                        <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

const CalendarView: React.FC<{ 
  currentUser: User;
  eventAttendances: EventAttendance[];
  setEventAttendances: React.Dispatch<React.SetStateAction<EventAttendance[]>>;
  educationEvents: EducationEvent[];
  setEducationEvents: React.Dispatch<React.SetStateAction<EducationEvent[]>>;
  users: User[];
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  getChapterName: (id: string) => string;
  bookCopies: BookCopy[];
  getBookTitle: (id: string) => string;
}> = ({ currentUser, eventAttendances, setEventAttendances, educationEvents, setEducationEvents, users, openModal, closeModal, getChapterName, bookCopies, getBookTitle }) => {
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

    const monthlyCompletions = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return eventAttendances.filter(ea => {
            if (ea.userId !== currentUser.phone || !ea.isAttended) return false;
            if (ea.completionDate) {
                const completionDate = new Date(ea.completionDate);
                return completionDate.getMonth() === currentMonth && completionDate.getFullYear() === currentYear;
            }
            const event = educationEvents.find(e => e.eventId === ea.eventId);
            if (event) {
              const eventDate = new Date(event.date);
              return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
            }
            return false; 
        }).length;
    }, [currentUser, eventAttendances, educationEvents]);

    const myLoan = useMemo(() => {
        return bookCopies.find(copy => copy.currentBorrowerId === currentUser.phone);
    }, [bookCopies, currentUser.phone]);

    const isOverdue = myLoan && myLoan.dueDate && new Date(myLoan.dueDate) < new Date();
    
    const categoryColorMap = {
      '성남교육': 'bg-blue-500',
      '트레이닝교육': 'bg-yellow-500',
      '포럼': 'bg-green-500',
      '리더십 포럼': 'bg-purple-500',
    };

    const handleApplyForEvent = (eventId: string) => {
      const alreadyApplied = eventAttendances.some(ea => ea.userId === currentUser.phone && ea.eventId === eventId);
      if (alreadyApplied) {
        alert("이미 신청한 교육입니다.");
        return;
      }
      const newAttendance: EventAttendance = {
        attendanceId: `ea-${Date.now()}`,
        userId: currentUser.phone,
        eventId,
        isApplied: true,
        isAttended: false,
        isReviewSubmitted: false,
      };
      setEventAttendances(prev => [...prev, newAttendance]);
      alert("신청이 완료되었습니다.");
      closeModal();
    };
    
    const AddEventForm: React.FC<{ date: Date }> = ({ date }) => {
        const [eventData, setEventData] = useState({
            name: '', score: '', instructor: '', location: '', price: '',
            category: '성남교육' as EducationEvent['category'], startTime: '09:00', endTime: '11:00',
        });

        const handleTopCourseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const courseName = e.target.value;
            const topCourse = TOP_12_COURSES.find(c => c.name === courseName);
            if (topCourse) {
                setEventData(prev => ({ ...prev, name: topCourse.name, score: topCourse.score.toString() }));
            } else {
                setEventData(prev => ({ ...prev, name: '', score: '' }));
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            setEventData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        };

        const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const [startHours, startMinutes] = eventData.startTime.split(':').map(Number);
            const [endHours, endMinutes] = eventData.endTime.split(':').map(Number);
            const newEvent: EducationEvent = {
                eventId: `e-${Date.now()}`,
                name: eventData.name,
                score: Number(eventData.score),
                date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHours, startMinutes).toISOString(),
                endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHours, endMinutes).toISOString(),
                instructor: eventData.instructor,
                location: eventData.location,
                price: eventData.price,
                category: eventData.category,
            };
            setEducationEvents(prev => [...prev, newEvent]);
            alert('교육이 추가되었습니다.');
            closeModal();
        };

        return (
            <form onSubmit={handleSubmit}>
              <h3 className="text-xl font-bold mb-4">{date.toLocaleDateString('ko-KR')} 신규 교육 추가</h3>
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">TOP 교육 선택 (선택 시 자동 입력)</label>
                      <select onChange={handleTopCourseSelect} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                          <option value="">일반 교육 (직접 입력)</option>
                          {TOP_12_COURSES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                  </div>
                <div><label className="block text-sm font-medium text-gray-700">교육명</label><input name="name" type="text" value={eventData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700">시작 시간</label><input name="startTime" type="time" value={eventData.startTime} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                  <div><label className="block text-sm font-medium text-gray-700">종료 시간</label><input name="endTime" type="time" value={eventData.endTime} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">점수</label><input name="score" type="number" value={eventData.score} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700">강사</label><input name="instructor" type="text" value={eventData.instructor} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700">장소</label><input name="location" type="text" value={eventData.location} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700">가격</label><input name="price" type="text" value={eventData.price} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700">카테고리</label>
                    <div className="mt-2 space-x-2 md:space-x-4 text-xs md:text-base">
                        <label><input type="radio" name="category" value="성남교육" checked={eventData.category === '성남교육'} onChange={handleChange} /> 성남교육</label>
                        <label><input type="radio" name="category" value="트레이닝교육" checked={eventData.category === '트레이닝교육'} onChange={handleChange} /> 트레이닝교육</label>
                        <label><input type="radio" name="category" value="포럼" checked={eventData.category === '포럼'} onChange={handleChange} /> 포럼</label>
                        <label><input type="radio" name="category" value="리더십 포럼" checked={eventData.category === '리더십 포럼'} onChange={handleChange}/> 리더십 포럼</label>
                    </div>
                </div>
                <button type="submit" className="w-full bg-[#e9062a] text-white py-2 rounded-md hover:bg-red-700">추가하기</button>
              </div>
            </form>
        );
    };
    
    const showAddEventForm = (date: Date) => openModal(<AddEventForm date={date} />);

    const showApplicantListModal = (eventId: string) => {
        const event = educationEvents.find(e => e.eventId === eventId);
        const applicants = eventAttendances.filter(ea => ea.eventId === eventId && ea.isApplied).map(ea => users.find(u => u.phone === ea.userId)).filter(Boolean) as User[];
        openModal(
            <div>
                <h3 className="text-xl font-bold mb-4">'{event?.name}' 신청자 명단</h3>
                {applicants.length > 0 ? (
                    <ul className="space-y-2 max-h-80 overflow-y-auto">{applicants.map(user => (<li key={user.phone} className="p-2 border rounded-md">{user.name} ({getChapterName(user.chapterId)})</li>))}</ul>
                ) : (<p>신청자가 없습니다.</p>)}
            </div>
        );
    }
    
    const showDateDetails = (date: Date) => {
      const eventsOnDate = educationEvents.filter(event => new Date(event.date).toDateString() === date.toDateString());
      const getApplicantsByChapter = (eventId: string) => {
        const chapterCounts = eventAttendances.filter(ea => ea.eventId === eventId && ea.isApplied).reduce((acc, applicant) => {
          const user = users.find(u => u.phone === applicant.userId);
          if (user) {
            const chapterName = getChapterName(user.chapterId);
            acc[chapterName] = (acc[chapterName] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        return Object.entries(chapterCounts).map(([name, count]) => `${name}: ${count}`).join(', ');
      };
      
      openModal(
        <div>
          <h3 className="text-xl font-bold mb-4">{date.toLocaleDateString('ko-KR')} 교육 목록</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {eventsOnDate.length > 0 ? eventsOnDate.map(event => {
              const applicantsInfo = getApplicantsByChapter(event.eventId);
              const alreadyApplied = eventAttendances.some(ea => ea.userId === currentUser.phone && ea.eventId === event.eventId);
              return (
                <div key={event.eventId} className="p-3 border rounded-lg">
                  <p className="font-bold text-lg">{event.name}</p>
                  <p className="text-sm text-gray-600">강사: {event.instructor || '미정'}</p>
                  <p className="text-sm text-gray-600">장소: {event.location || '미정'}</p>
                  <p className="text-sm text-gray-600">시간: {new Date(event.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - {event.endDate ? new Date(event.endDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  <div className="mt-2"><span className={`px-2 py-1 text-xs text-white rounded-full ${categoryColorMap[event.category]}`}>{event.category}</span></div>
                  <div className="mt-2 text-xs text-gray-500"><p className="cursor-pointer hover:underline" onClick={() => showApplicantListModal(event.eventId)}>챕터별 신청 인원: {applicantsInfo || '신청자 없음'}</p></div>
                  <button onClick={() => handleApplyForEvent(event.eventId)} disabled={alreadyApplied} className={`mt-3 w-full px-3 py-2 rounded-md text-sm font-medium text-white ${alreadyApplied ? 'bg-gray-400' : 'bg-[#e9062a] hover:bg-red-700'}`}>{alreadyApplied ? '신청 완료' : '신청하기'}</button>
                </div>
              );
            }) : <p className="text-gray-500">해당 날짜에 교육이 없습니다.</p>}
          </div>
          {(currentUser.role === 'Master' || currentUser.role === 'Coordinator') && ( <button onClick={() => showAddEventForm(date)} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">이 날짜에 교육 추가</button>)}
        </div>
      );
    };

    const filteredEvents = useMemo(() => {
        if (categoryFilter === 'ALL') return educationEvents;
        return educationEvents.filter(e => e.category === categoryFilter);
    }, [educationEvents, categoryFilter]);

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        let firstDayOfWeek = firstDayOfMonth.getDay(); 
        if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Sunday (0) becomes 7
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        
        const categoryStyles: Record<EducationEvent['category'], string> = {
          '성남교육': 'bg-blue-100 border-blue-500', '트레이닝교육': 'bg-yellow-100 border-yellow-500',
          '포럼': 'bg-green-100 border-green-500', '리더십 포럼': 'bg-purple-100 border-purple-500',
        };

        // Fill initial empty cells for weekdays
        for (let i = 1; i < firstDayOfWeek; i++) {
             days.push(<div key={`empty-start-${i}`} className="border h-24 md:h-40 bg-gray-50/50"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dayOfWeek = date.getDay();

            // Skip weekends (Saturday: 6, Sunday: 0)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                continue;
            }

            const eventOnDate = filteredEvents.find(event => new Date(event.date).toDateString() === date.toDateString());

            if (eventOnDate) {
              const startTime = new Date(eventOnDate.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
              days.push(
                  <div key={i} className={`border p-1 md:p-2 h-24 md:h-40 flex flex-col cursor-pointer transition-transform hover:scale-105 ${categoryStyles[eventOnDate.category]}`} onClick={() => showDateDetails(date)}>
                      <div className="font-bold text-gray-800 text-sm md:text-base">{i}</div>
                      <div className="mt-1 text-[10px] md:text-xs flex-grow overflow-hidden text-gray-700">
                          <p className="font-semibold md:text-sm truncate" title={eventOnDate.name}>{eventOnDate.name}</p>
                          <p className="hidden md:block">🕒 {startTime}</p>
                          <p className="truncate hidden md:block">📍 {eventOnDate.location || '미정'}</p>
                          <p className="hidden md:block">🏆 {eventOnDate.score}점</p>
                      </div>
                  </div>
              );
            } else {
                days.push(
                    <div key={i} className="border p-1 md:p-2 h-24 md:h-40 cursor-pointer bg-white hover:bg-gray-100 transition-colors" onClick={() => showDateDetails(date)}>
                        <div className="font-bold text-gray-800 text-sm md:text-base">{i}</div>
                    </div>
                );
            }
        }
        
        return days;
    };

    const renderLoanStatus = () => {
        let statusColor = 'bg-blue-50 border-blue-400'; let statusTitle = '나의 대출 현황'; let statusMessage;
        if (myLoan) {
            if (isOverdue) {
                statusColor = 'bg-red-50 border-red-400'; statusTitle = '🚨 대여 불가 (연체)';
                statusMessage = `'${getBookTitle(myLoan.bookId)}' 반납이 연체되었습니다. (반납 예정일: ${new Date(myLoan.dueDate!).toLocaleDateString()})`;
            } else {
                statusMessage = `'${getBookTitle(myLoan.bookId)}' 대여 중 (반납 예정일: ${new Date(myLoan.dueDate!).toLocaleDateString()})`;
            }
        } else if (currentUser.depositStatus === 'Pending') {
            statusColor = 'bg-yellow-50 border-yellow-400'; statusTitle = '⚠️ 대여 불가 (보증금)';
            statusMessage = '보증금 입금 상태를 확인해주세요. 입금 전까지 대여가 불가능합니다.';
        } else {
            statusMessage = '현재 대여 중인 도서가 없습니다. 도서관에서 원하는 책을 찾아보세요!';
        }

        return (
            <div className={`p-4 rounded-lg mt-4 ${statusColor} border-l-4`}>
                <h3 className="text-xl font-semibold">{statusTitle}</h3>
                <p className="mt-2">{statusMessage}</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-0 md:p-6 rounded-lg shadow-none md:shadow">
            <div className="p-4 md:p-0">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{currentUser.name}님, 환영합니다.</h2>
                <div className={`p-4 rounded-lg ${monthlyCompletions === 0 ? 'bg-red-50 border-l-4 border-red-400' : 'bg-green-50 border-l-4 border-green-400'}`}>
                    <h3 className="text-lg md:text-xl font-semibold">이달의 교육 이수 현황</h3>
                    <p className="mt-2 text-lg"><span className="font-bold text-2xl">{monthlyCompletions}</span> 회</p>
                    {monthlyCompletions === 0 && (<p className="mt-1 text-red-700 font-semibold">이번 달 교육을 이수하지 않으셨어요!</p>)}
                </div>
                {renderLoanStatus()}
            </div>
            <div className="mt-8">
               <div className="flex items-center justify-center space-x-1 md:space-x-2 mb-4 flex-wrap">
                  <button onClick={() => setCategoryFilter('ALL')} className={`px-2 py-1 rounded-full text-xs md:text-sm font-semibold ${categoryFilter === 'ALL' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>ALL</button>
                  <button onClick={() => setCategoryFilter('트레이닝교육')} className={`px-2 py-1 rounded-full text-xs md:text-sm font-semibold ${categoryFilter === '트레이닝교육' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`}>트레이닝교육</button>
                  <button onClick={() => setCategoryFilter('성남교육')} className={`px-2 py-1 rounded-full text-xs md:text-sm font-semibold ${categoryFilter === '성남교육' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>성남교육</button>
                  <button onClick={() => setCategoryFilter('포럼')} className={`px-2 py-1 rounded-full text-xs md:text-sm font-semibold ${categoryFilter === '포럼' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}>포럼</button>
                  <button onClick={() => setCategoryFilter('리더십 포럼')} className={`px-2 py-1 rounded-full text-xs md:text-sm font-semibold ${categoryFilter === '리더십 포럼' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-800'}`}>리더십 포럼</button>
              </div>
              <div className="flex justify-between items-center mb-4 px-2 md:px-0">
                  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="px-4 py-2 bg-gray-200 rounded">이전 달</button>
                  <span className="text-lg md:text-xl font-semibold">{`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}</span>
                  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="px-4 py-2 bg-gray-200 rounded">다음 달</button>
              </div>
              <div className="grid grid-cols-5 gap-0 text-center font-semibold mb-1 text-xs md:text-base">
                <div>월</div><div>화</div><div>수</div><div>목</div><div>금</div>
              </div>
              <div className="grid grid-cols-5 gap-0">
                {renderCalendar()}
              </div>
            </div>
        </div>
    );
};

const Leaderboard: React.FC<{ data: LeaderboardUser[], chapters: Chapter[], currentUser: User, eventAttendances: EventAttendance[], educationEvents: EducationEvent[], books: Book[], bookReports: BookReport[], openModal: (content: React.ReactNode) => void, getChapterName: (id: string) => string }> = ({ data, chapters, currentUser, eventAttendances, educationEvents, books, bookReports, openModal, getChapterName }) => {
    const [leaderboardChapterFilter, setLeaderboardChapterFilter] = useState('ALL');

    const showMemberDetails = (user: LeaderboardUser) => {
      const attendedEvents = eventAttendances.filter(ea => ea.userId === user.phone && ea.isAttended && ea.isReviewSubmitted).map(ea => { const event = educationEvents.find(e => e.eventId === ea.eventId); return { name: event?.name || '알 수 없는 교육', score: event?.score || 0 }; });
      const submittedReports = bookReports.filter(br => br.userId === user.phone && br.isSubmitted).map(br => { const book = books.find(b => b.bookId === br.bookId); return { name: book?.title || '알 수 없는 책', score: book?.reportScore || 0 }; });
      openModal(
        <div className="w-full">
          <h3 className="text-xl font-bold mb-4">{user.name}님의 활동 내역</h3>
          <table className="w-full text-left table-auto border-collapse">
              <thead className="bg-[#e9062a] text-white"><tr><th className="p-3">구분</th><th className="p-3 whitespace-nowrap">내용</th><th className="p-3 text-right">획득 점수</th></tr></thead>
              <tbody>
                  {attendedEvents.map((event, index) => (<tr key={`event-${index}`} className="border-b"><td className="p-2 text-sm text-gray-500">교육</td><td className="p-2 whitespace-nowrap">{event.name}</td><td className="p-2 text-right font-semibold">{event.score}점</td></tr>))}
                  {submittedReports.map((report, index) => (<tr key={`report-${index}`} className="border-b"><td className="p-2 text-sm text-gray-500">독후감</td><td className="p-2 whitespace-nowrap">{report.name}</td><td className="p-2 text-right font-semibold">{report.score}점</td></tr>))}
                  {(attendedEvents.length === 0 && submittedReports.length === 0) && (<tr><td colSpan={3} className="p-4 text-center text-gray-500">활동 내역이 없습니다.</td></tr>)}
              </tbody>
              <tfoot className="font-bold">
                  <tr className="border-t-2"><td colSpan={2} className="p-2 text-right">교육 점수 합계:</td><td className="p-2 text-right">{user.trainingScore}점</td></tr>
                   <tr><td colSpan={2} className="p-2 text-right">독서 점수 합계:</td><td className="p-2 text-right">{user.reportScore}점</td></tr>
                   <tr className="bg-gray-100 text-lg"><td colSpan={2} className="p-3 text-right">총 합산 점수:</td><td className="p-3 text-right">{user.totalScore}점</td></tr>
              </tfoot>
          </table>
        </div>
      );
    };

    const filteredData = useMemo(() => {
        if (leaderboardChapterFilter === 'ALL') return data;
        return data.filter(user => user.chapterId === leaderboardChapterFilter);
    }, [data, leaderboardChapterFilter]);
    
    const myRankData = useMemo(() => {
        const rank = data.findIndex(u => u.phone === currentUser.phone);
        if (rank === -1) return null;
        return { ...data[rank], rank: rank + 1 };
    }, [data, currentUser.phone]);
    
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">리더보드</h2>
            <div className="flex items-center gap-2 mb-6 flex-wrap">
                <button onClick={() => setLeaderboardChapterFilter('ALL')} className={`px-3 py-1 text-sm rounded ${leaderboardChapterFilter === 'ALL' ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}>전체</button>
                {chapters.map(c => ( <button key={c.chapterId} onClick={() => setLeaderboardChapterFilter(c.chapterId)} className={`px-3 py-1 text-sm rounded ${leaderboardChapterFilter === c.chapterId ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}>{c.name}</button>))}
            </div>
            {myRankData && (
                <div className="bg-[#e9062a] text-white rounded-lg p-4 mb-6 shadow-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => showMemberDetails(myRankData)}>
                    <div className="flex justify-between items-center text-center">
                        <div className="w-1/4 font-extrabold text-3xl">{myRankData.rank}위</div>
                        <div className="w-1/2 text-left"><div className="flex items-center"><span className="font-semibold text-xl">{myRankData.name}</span><span className="text-sm text-gray-200 ml-2">({getChapterName(myRankData.chapterId)})</span>{(myRankData.completedTrainingsCount || 0) >= 11 && <TopBadge />}</div></div>
                    </div>
                     <div className="mt-3 text-center bg-red-800 bg-opacity-50 p-2 rounded-md flex justify-around">
                        <div><span className="text-xs opacity-80">교육</span><p className="font-semibold">{myRankData.trainingScore}</p></div>
                        <div><span className="text-xs opacity-80">독서</span><p className="font-semibold">{myRankData.reportScore}</p></div>
                        <div><span className="text-xs opacity-80">총점</span><p className="font-bold text-lg">{myRankData.totalScore}</p></div>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                     <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3 w-[10%]">순위</th>
                            <th className="p-3 w-[40%]">이름 / 상호명</th>
                            <th className="p-3 w-[15%] text-right">교육점수</th>
                            <th className="p-3 w-[15%] text-right">독서점수</th>
                            <th className="p-3 w-[20%] text-right">총 점수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((user, index) => {
                            const rank = data.findIndex(u => u.phone === user.phone);
                            return (
                            <tr key={user.phone} onClick={() => showMemberDetails(user)} className={`border-b hover:bg-gray-50 cursor-pointer ${user.phone === currentUser.phone ? 'bg-red-50' : ''} ${rank < 3 ? 'font-bold' : ''}`}>
                                <td className="p-3 flex items-center">
                                    {rank === 0 && <GoldMedalIcon />}
                                    {rank === 1 && <SilverMedalIcon />}
                                    {rank === 2 && <BronzeMedalIcon />}
                                    <span className="ml-2">{rank + 1}</span>
                                </td>
                                <td className="p-3">
                                    <div>
                                        <span className="font-semibold">{user.name}</span>
                                        <span className="text-sm text-gray-500 ml-2">({getChapterName(user.chapterId)})</span>
                                        {(user.completedTrainingsCount || 0) >= 11 && <TopBadge />}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {user.companyName || ''} / {user.specialty || ''}
                                    </div>
                                </td>
                                <td className="p-3 text-right text-sm text-gray-600">{user.trainingScore}</td>
                                <td className="p-3 text-right text-sm text-gray-600">{user.reportScore}</td>
                                <td className="p-3 text-right font-semibold">{user.totalScore}</td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UserManager: React.FC<{ currentUser: User, users: User[], setUsers: React.Dispatch<React.SetStateAction<User[]>>, chapters: Chapter[], openModal: (content: React.ReactNode) => void, closeModal: () => void, getChapterName: (id: string) => string }> = ({ currentUser, users, setUsers, chapters, openModal, closeModal, getChapterName }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [chapterFilter, setChapterFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  useEffect(() => {
    if (currentUser.role === 'Coordinator') {
      setChapterFilter(currentUser.chapterId);
    }
  }, [currentUser]);

  const handleSaveUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = (formData.get('phone') as string).replace(/-/g, '');
    
    const userData: Partial<User> = { name: formData.get('name') as string, phone: phone, chapterId: formData.get('chapterId') as string, role: formData.get('role') as User['role'], specialty: formData.get('specialty') as string, companyName: formData.get('companyName') as string, depositStatus: formData.get('depositStatus') as User['depositStatus'] };
    
    if (editingUser) { 
        setUsers(users.map(u => u.phone === editingUser.phone ? { ...u, ...userData } : u)); 
    } else {
      if (users.some(u => u.phone === userData.phone)) { alert('이미 존재하는 전화번호입니다.'); return; }
      setUsers([...users, { ...userData, password: 'password', depositStatus: 'OK' } as User]);
    }
    closeModal(); setEditingUser(null);
  };
  
  const handleDeleteUser = (phone: string) => { if (window.confirm('정말로 이 회원을 삭제하시겠습니까?')) { setUsers(users.filter(u => u.phone !== phone)); } }

  const handleResetPassword = (userToReset: User) => {
    if (window.confirm(`${userToReset.name}님의 비밀번호를 초기화하시겠습니까?`)) {
        setUsers(users.map(u => u.phone === userToReset.phone ? { ...u, password: 'password', passwordResetRequired: true } : u));
        alert(`${userToReset.name}님의 비밀번호가 초기화 되었습니다`);
    }
  };

  const handleTransferMaster = (userToPromote: User) => {
    if (window.confirm(`${userToPromote.name}님에게 마스터 권한을 양도하시겠습니까? 현재 마스터 계정은 일반 회원으로 변경됩니다.`)) {
        setUsers(users.map(u => {
            if (u.phone === currentUser.phone) return { ...u, role: 'Member' };
            if (u.phone === userToPromote.phone) return { ...u, role: 'Master' };
            return u;
        }));
        alert('마스터 권한이 양도되었습니다. 변경사항을 확인하려면 다시 로그인해야 할 수 있습니다.');
        closeModal();
    }
  }

  const showUserForm = (user: User | null) => {
    setEditingUser(user);
    openModal(
      <form onSubmit={handleSaveUser}>
        <h3 className="text-xl font-bold mb-4">{user ? '회원 정보 수정' : '신규 회원 추가'}</h3>
        <div className="space-y-4">
          <div><label>이름</label><input name="name" defaultValue={user?.name} required className="mt-1 block w-full border p-2 rounded" /></div>
          <div><label>전화번호 (ID)</label><input name="phone" defaultValue={user?.phone} disabled={!!user} required className="mt-1 block w-full border p-2 rounded bg-gray-100 disabled:cursor-not-allowed" /></div>
          <div><label>챕터</label><select name="chapterId" defaultValue={user?.chapterId} required className="mt-1 block w-full border p-2 rounded">{chapters.map(c => <option key={c.chapterId} value={c.chapterId}>{c.name}</option>)}</select></div>
          <div><label>역할</label><select name="role" defaultValue={user?.role} required className="mt-1 block w-full border p-2 rounded"><option value="Member">Member</option><option value="Coordinator">Coordinator</option></select></div>
          <div><label>보증금 상태</label><select name="depositStatus" defaultValue={user?.depositStatus} required className="mt-1 block w-full border p-2 rounded"><option value="OK">OK</option><option value="Pending">Pending</option></select></div>
          <div><label>전문분야</label><input name="specialty" defaultValue={user?.specialty} className="mt-1 block w-full border p-2 rounded" /></div>
          <div><label>회사명</label><input name="companyName" defaultValue={user?.companyName} className="mt-1 block w-full border p-2 rounded" /></div>
        </div>
        <div className="mt-6 flex justify-between">
            <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">{user ? '저장' : '추가'}</button>
            {user && user.phone !== currentUser.phone && currentUser.role === 'Master' && ( <button type="button" onClick={() => handleTransferMaster(user)} className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600">마스터 양도</button> )}
        </div>
      </form>
    );
  };
  
  const sortedAndFilteredUsers = useMemo(() => {
      let filteredUsers = users;
      if (currentUser.role === 'Master' && chapterFilter !== 'ALL') {
          filteredUsers = users.filter(u => u.chapterId === chapterFilter);
      } else if (currentUser.role === 'Coordinator') {
          filteredUsers = users.filter(u => u.chapterId === currentUser.chapterId);
      }
      
      if (sortConfig !== null) {
          filteredUsers.sort((a, b) => {
              const aValue = a[sortConfig.key];
              const bValue = b[sortConfig.key];
              if (aValue === undefined || bValue === undefined) return 0;
              if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return filteredUsers;
  }, [users, chapterFilter, currentUser, sortConfig]);

  const requestSort = (key: keyof User) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof User) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">회원 관리</h2>
        <div className="flex items-center gap-2 flex-wrap justify-end">
            {currentUser.role === 'Master' && (
                <>
                <button onClick={() => setChapterFilter('ALL')} className={`px-3 py-1 text-sm rounded ${chapterFilter === 'ALL' ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}>전체</button>
                {chapters.map(c => (<button key={c.chapterId} onClick={() => setChapterFilter(c.chapterId)} className={`px-3 py-1 text-sm rounded ${chapterFilter === c.chapterId ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}>{c.name}</button>))}
                </>
            )}
            {currentUser.role === 'Master' && <button onClick={() => showUserForm(null)} className="bg-[#e9062a] text-white py-2 px-4 rounded hover:bg-red-700">신규 회원 추가</button>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="bg-gray-100">
            <th className="p-3 cursor-pointer" onClick={() => requestSort('name')}>이름 {getSortIndicator('name')}</th>
            <th className="p-3 cursor-pointer" onClick={() => requestSort('chapterId')}>챕터 {getSortIndicator('chapterId')}</th>
            <th className="p-3">전화번호</th>
            <th className="p-3 cursor-pointer" onClick={() => requestSort('role')}>역할 {getSortIndicator('role')}</th>
            <th className="p-3">보증금</th>
            <th className="p-3">관리</th></tr></thead>
          <tbody>
            {sortedAndFilteredUsers.map(user => (
              <tr key={user.phone} className="border-b hover:bg-gray-50">
                <td className="p-3">{user.name}</td><td className="p-3">{getChapterName(user.chapterId)}</td><td className="p-3">{user.phone}</td>
                <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'Master' ? 'bg-red-100 text-red-800' : user.role === 'Coordinator' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{user.role}</span></td>
                <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.depositStatus === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.depositStatus}</span></td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                    <button onClick={() => handleResetPassword(user)} className="text-gray-600 hover:underline">비밀번호 초기화</button>
                    {currentUser.role === 'Master' && <>
                        <button onClick={() => showUserForm(user)} className="text-blue-600 hover:underline">수정</button>
                        {user.phone !== currentUser.phone && <button onClick={() => handleDeleteUser(user.phone)} className="text-red-600 hover:underline">삭제</button>}
                    </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BookManager: React.FC<{ currentUser: User, books: Book[], setBooks: React.Dispatch<React.SetStateAction<Book[]>>, bookCopies: BookCopy[], setBookCopies: React.Dispatch<React.SetStateAction<BookCopy[]>>, loanHistory: LoanHistory[], setLoanHistory: React.Dispatch<React.SetStateAction<LoanHistory[]>>, chapters: Chapter[], openModal: (content: React.ReactNode) => void, closeModal: () => void, getUserName: (phone: string) => string, getChapterName: (id: string) => string, getBookTitle: (id: string) => string }> = ({ currentUser, books, setBooks, bookCopies, setBookCopies, chapters, openModal, closeModal, getUserName, getChapterName, getBookTitle, setLoanHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('title');
  const [chapterFilter, setChapterFilter] = useState('ALL');
  
  const handleAddNewBook = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const formData = new FormData(event.currentTarget); const bookId = `b-${Date.now()}`;
    const newBook: Book = { bookId, title: formData.get('title') as string, author: formData.get('author') as string, reportScore: Number(formData.get('reportScore')), chapterId: currentUser.role === 'Coordinator' ? currentUser.chapterId : formData.get('chapterId') as string, dateAdded: new Date().toISOString(), genre: formData.get('genre') as string, publisher: formData.get('publisher') as string, price: formData.get('price') as string, };
    const quantity = Number(formData.get('quantity'));
    setBooks((prev: Book[]) => [...prev, newBook]);
    if (quantity > 0) {
        const lastRegNum = bookCopies.length > 0 ? Math.max(...bookCopies.map(c => parseInt(c.registrationNumber, 10))) : 0;
        const newCopies: BookCopy[] = Array.from({ length: quantity }, (_, i) => ({ registrationNumber: String(lastRegNum + i + 1).padStart(6, '0'), bookId: bookId, isLost: false, status: '대여 가능' }));
        setBookCopies((prev: BookCopy[]) => [...prev, ...newCopies]);
    }
    closeModal();
  };
  
    const handleUpdateBookInfo = (event: React.FormEvent<HTMLFormElement>, bookId: string) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const updatedInfo = {
            title: formData.get('title') as string,
            author: formData.get('author') as string,
            publisher: formData.get('publisher') as string,
            genre: formData.get('genre') as string,
            price: formData.get('price') as string,
            reportScore: Number(formData.get('reportScore')),
        };
        setBooks(prev => prev.map(book => book.bookId === bookId ? { ...book, ...updatedInfo } : book));
        alert('도서 정보가 수정되었습니다.');
        closeModal();
    };

    const handleDeleteBook = (bookId: string) => {
        if(window.confirm('이 도서 정보를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')){
            setBooks(prev => prev.filter(b => b.bookId !== bookId));
            alert('도서 정보가 삭제되었습니다.');
            closeModal();
        }
    }
  
    const handleToggleCopyLostStatus = (regNum: string) => {
        setBookCopies(prev => prev.map(copy => copy.registrationNumber === regNum ? {...copy, isLost: !copy.isLost, status: !copy.isLost ? '대여 불가' : '대여 가능'} : copy));
    }
    
    const handleDeleteCopy = (regNum: string) => {
        if(window.confirm('이 도서 사본을 삭제하시겠습니까?')){
            setBookCopies(prev => prev.filter(copy => copy.registrationNumber !== regNum));
        }
    }


  const showAddBookForm = () => {
    openModal(
        <form onSubmit={handleAddNewBook}>
            <h3 className="text-xl font-bold mb-4">신규 도서 추가</h3>
            <div className="space-y-3"><input name="title" placeholder="제목" required className="w-full border p-2 rounded" /><input name="author" placeholder="저자" required className="w-full border p-2 rounded" /><input name="publisher" placeholder="출판사" className="w-full border p-2 rounded" /><input name="genre" placeholder="장르" className="w-full border p-2 rounded" /><input name="price" placeholder="가격" className="w-full border p-2 rounded" /><input name="reportScore" type="number" placeholder="독후감 점수" required className="w-full border p-2 rounded" />
                {currentUser.role === 'Master' && (<select name="chapterId" required className="w-full border p-2 rounded"><option value="">보유 챕터 선택</option>{chapters.map(c => <option key={c.chapterId} value={c.chapterId}>{c.name}</option>)}</select>)}
                {currentUser.role === 'Coordinator' && <p className="p-2 bg-gray-100 rounded">소속 챕터: {getChapterName(currentUser.chapterId)}</p>}
                <input name="quantity" type="number" placeholder="구입 수량 (대여용 아니면 0)" required min="0" className="w-full border p-2 rounded" />
            </div><button type="submit" className="mt-4 w-full bg-[#e9062a] text-white py-2 rounded hover:bg-red-700">추가하기</button>
        </form>
    );
  }
  
    const showEditBookInfoModal = (book: Book) => {
        const copiesOfThisBook = bookCopies.filter(c => c.bookId === book.bookId);
        openModal(
            <form onSubmit={(e) => handleUpdateBookInfo(e, book.bookId)}>
                <h3 className="text-xl font-bold mb-4">도서 정보 수정</h3>
                <div className="space-y-3">
                    <input name="title" defaultValue={book.title} placeholder="제목" required className="w-full border p-2 rounded" />
                    <input name="author" defaultValue={book.author} placeholder="저자" required className="w-full border p-2 rounded" />
                    <input name="publisher" defaultValue={book.publisher} placeholder="출판사" className="w-full border p-2 rounded" />
                    <input name="genre" defaultValue={book.genre} placeholder="장르" className="w-full border p-2 rounded" />
                    <input name="price" defaultValue={book.price} placeholder="가격" className="w-full border p-2 rounded" />
                    <input name="reportScore" type="number" defaultValue={book.reportScore} placeholder="독후감 점수" required className="w-full border p-2 rounded" />
                </div>
                <div className="mt-6 flex justify-between items-center">
                    <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">정보 저장</button>
                    {copiesOfThisBook.length === 0 && (
                       <button type="button" onClick={() => handleDeleteBook(book.bookId)} className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">도서 완전 삭제</button>
                    )}
                </div>
                 {copiesOfThisBook.length > 0 && <p className="text-xs text-gray-500 mt-2">도서 정보를 완전히 삭제하려면, '사본 관리'에서 모든 사본을 먼저 삭제해야 합니다.</p>}
            </form>
        )
    };
    
    const showManageCopiesModal = (book: Book) => {
        const copiesOfThisBook = bookCopies.filter(c => c.bookId === book.bookId);
        openModal(
            <div>
                <h3 className="text-xl font-bold mb-4">'{book.title}' 사본 관리</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {copiesOfThisBook.length > 0 ? copiesOfThisBook.map(copy => (
                        <div key={copy.registrationNumber} className="flex flex-wrap justify-between items-center p-3 border rounded-md gap-2">
                            <div>
                                <p>관리 번호: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{copy.registrationNumber}</span></p>
                                <p className="text-sm">상태: <span className={`font-semibold ${copy.isLost ? 'text-yellow-600' : copy.status === '대여 중' ? 'text-red-600' : 'text-green-600'}`}>{copy.isLost ? '분실' : copy.status}</span></p>
                                {copy.status === '대여 중' && <p className="text-xs text-gray-500">대여자: {getUserName(copy.currentBorrowerId!)}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggleCopyLostStatus(copy.registrationNumber)} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded hover:bg-yellow-600">{copy.isLost ? '복구' : '분실 처리'}</button>
                                <button disabled={copy.status === '대여 중'} onClick={() => handleDeleteCopy(copy.registrationNumber)} className="bg-red-500 text-white px-3 py-1 text-sm rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-red-600">삭제</button>
                            </div>
                        </div>
                    )) : <p>등록된 사본이 없습니다.</p>}
                </div>
            </div>
        )
    }

  const handleUserLoanBook = (copyToLoan: BookCopy) => {
    const hasExistingLoan = bookCopies.some(c => c.currentBorrowerId === currentUser.phone);
    if(hasExistingLoan) { alert('1인 1권만 대여 가능합니다. 기존 도서를 반납 후 이용해주세요.'); return; }
    if (currentUser.depositStatus === 'Pending') { alert('보증금 상태가 PENDING입니다. 대여가 불가능합니다.'); return; }
    const loanDate = new Date(); const dueDate = new Date(); dueDate.setDate(loanDate.getDate() + 14);
    setBookCopies((prev: BookCopy[]) => prev.map(copy => copy.registrationNumber === copyToLoan.registrationNumber ? { ...copy, status: '대여 중', currentBorrowerId: currentUser.phone, loanDate: loanDate.toISOString(), dueDate: dueDate.toISOString() } : copy ));
    const newLoan: LoanHistory = { loanId: `lh-${Date.now()}`, registrationNumber: copyToLoan.registrationNumber, userId: currentUser.phone, checkoutDate: loanDate.toISOString(), };
    setLoanHistory((prev: LoanHistory[]) => [...prev, newLoan]);
    alert(`${currentUser.name}님에게 '${getBookTitle(copyToLoan.bookId)}'이(가) 대출 처리되었습니다.`); closeModal();
  }

  const showAvailableCopiesModal = (book: Book) => {
    const availableCopies = bookCopies.filter(c => c.bookId === book.bookId && c.status === '대여 가능');
    openModal(
      <div>
        <h3 className="text-xl font-bold mb-4">'{book.title}' 대여 가능 목록</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {availableCopies.length > 0 ? availableCopies.map(copy => (
            <div key={copy.registrationNumber} className="flex justify-between items-center p-2 border rounded-md">
              <p>관리 번호: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{copy.registrationNumber}</span></p>
              <button onClick={() => handleUserLoanBook(copy)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">대출하기</button>
            </div>
          )) : <p>현재 대여 가능한 도서가 없습니다.</p>}
        </div>
      </div>
    );
  };

  const sortedAndFilteredBooks = useMemo(() => {
    const chapterFiltered = books.filter(book => {
        if (currentUser.role === 'Master') { return chapterFilter === 'ALL' || book.chapterId === chapterFilter; }
        return book.chapterId === currentUser.chapterId;
    });
    return chapterFiltered.filter(book => book.title.toLowerCase().includes(searchTerm.toLowerCase()) || book.author.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
        if (sortOrder === 'title') return a.title.localeCompare(b.title, 'ko-KR');
        if (sortOrder === 'author') return a.author.localeCompare(b.author, 'ko-KR');
        if (sortOrder === 'score') return b.reportScore - a.reportScore;
        return 0;
    });
  }, [books, searchTerm, sortOrder, currentUser, chapterFilter]);
  
  const isAdmin = currentUser.role === 'Master' || currentUser.role === 'Coordinator';

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">도서관</h2>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {currentUser.role === 'Master' && (
            <div className="flex items-center gap-2">
                <button onClick={() => setChapterFilter('ALL')} className={`px-3 py-1 text-sm rounded ${chapterFilter === 'ALL' ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}>전체</button>
                {chapters.map(c => (<button key={c.chapterId} onClick={() => setChapterFilter(c.chapterId)} className={`px-3 py-1 text-sm rounded ${chapterFilter === c.chapterId ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}>{c.name}</button>))}
            </div>
          )}
          <input type="text" placeholder="제목 또는 저자 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border p-2 rounded-md" />
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="border p-2 rounded-md">
            <option value="title">제목순</option><option value="author">저자순</option><option value="score">독후감 점수순</option>
          </select>
          {isAdmin && <button onClick={showAddBookForm} className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">신규 도서 추가</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAndFilteredBooks.map(book => {
          const copies = bookCopies.filter(c => c.bookId === book.bookId); const availableCopiesCount = copies.filter(c => c.status === '대여 가능').length; const onLoanCopies = copies.filter(c => c.status === '대여 중');
          return (
            <div key={book.bookId} className="p-4 border rounded-lg shadow-sm bg-gray-50 flex flex-col justify-between">
              <div><h3 className="font-bold text-lg text-gray-800">{book.title}</h3><p className="text-sm text-gray-600 mb-2">{book.author}</p><p className="text-sm text-gray-500 mb-1">보유 챕터: {getChapterName(book.chapterId)}</p><p className="text-sm font-semibold text-blue-600">독후감 점수: {book.reportScore}점</p></div>
              <div className="p-3 bg-white rounded-md border mt-2">
                <p className={`font-semibold text-center mb-2 ${availableCopiesCount > 0 ? 'cursor-pointer hover:underline' : ''}`} onClick={() => availableCopiesCount > 0 && showAvailableCopiesModal(book)}>총 {copies.length}권 중 <span className={availableCopiesCount > 0 ? 'text-green-600' : 'text-red-600'}>{' '}{availableCopiesCount}권 대여 가능</span></p>
                {onLoanCopies.length > 0 && (<div className="text-xs text-gray-700 space-y-1 mt-2 border-t pt-2"><p className="font-semibold">대여 현황:</p><ul className="list-disc list-inside">{onLoanCopies.map(copy => (<li key={copy.registrationNumber}>{getUserName(copy.currentBorrowerId || '')} (반납 예정: {copy.dueDate ? new Date(copy.dueDate).toLocaleDateString() : '미정'})</li>))}</ul></div>)}
              </div>
               {isAdmin && (
                  <div className="mt-4 flex gap-2 justify-end">
                      <button onClick={() => showEditBookInfoModal(book)} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">정보 수정</button>
                      <button onClick={() => showManageCopiesModal(book)} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">사본 관리</button>
                  </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminPanel: React.FC<{ 
  currentUser: User, users: User[], setUsers: Function, chapters: Chapter[], books: Book[], bookCopies: BookCopy[], setBookCopies: Function, loanHistory: LoanHistory[], setLoanHistory: Function, educationEvents: EducationEvent[], setEducationEvents: Function, bookReports: BookReport[], setBookReports: Function, eventAttendances: EventAttendance[], setEventAttendances: Function, openModal: Function, closeModal: Function, getBookTitle: (id: string) => string, getUserName: (id: string) => string, getChapterName: (id: string) => string 
}> = ({ currentUser, users, setUsers, chapters, books, bookCopies, setBookCopies, loanHistory, setLoanHistory, educationEvents, bookReports, setBookReports, eventAttendances, setEventAttendances, getBookTitle, getUserName, getChapterName, openModal }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(currentUser.role === 'Coordinator' ? currentUser.chapterId : null);
  const [adminViewMode, setAdminViewMode] = useState<'member' | 'education'>('member');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const handleGridAttendanceChange = (userId: string, topCourseName: string, field: 'isAttended' | 'isReviewSubmitted', value: boolean) => {
      const relevantEvent = educationEvents.find(e => e.name === topCourseName);
      if (!relevantEvent) return;

      const attendanceIndex = eventAttendances.findIndex(ea => ea.userId === userId && ea.eventId === relevantEvent.eventId);

      if (attendanceIndex > -1) {
          setEventAttendances((prev: EventAttendance[]) => prev.map((ea, index) => {
              if (index === attendanceIndex) {
                  const updated = { ...ea, [field]: value };
                  if (field === 'isReviewSubmitted' && value) updated.isAttended = true;
                  if (field === 'isAttended' && value && !updated.completionDate) updated.completionDate = new Date().toISOString().split('T')[0];
                  return updated;
              }
              return ea;
          }));
      } else {
          // If no attendance record, create one (this assumes an "application" was implicitly made)
          const newAttendance: EventAttendance = {
              attendanceId: `ea-grid-${Date.now()}`, userId, eventId: relevantEvent.eventId, isApplied: true,
              isAttended: field === 'isAttended' || field === 'isReviewSubmitted' ? value : false,
              isReviewSubmitted: field === 'isReviewSubmitted' ? value : false,
              completionDate: (field === 'isAttended' && value) ? new Date().toISOString().split('T')[0] : undefined,
          };
          setEventAttendances((prev: EventAttendance[]) => [...prev, newAttendance]);
      }
  };

  const handleAttendanceChange = (attendanceId: string, field: 'isAttended' | 'isReviewSubmitted', value: boolean) => {
    setEventAttendances((prev: EventAttendance[]) => prev.map(ea => {
      if (ea.attendanceId === attendanceId) {
        const updated = { ...ea, [field]: value };
        if (field === 'isAttended' && value && !updated.completionDate) updated.completionDate = new Date().toISOString().split('T')[0];
        return updated;
      }
      return ea;
    }));
  };
  
  const handleReportSubmit = (userId: string, bookId: string) => {
      if (bookReports.some(br => br.userId === userId && br.bookId === bookId)) { alert('이미 독후감을 제출했습니다.'); return; }
      const newReport: BookReport = { reportId: `br-${Date.now()}`, userId, bookId, isSubmitted: true, submissionDate: new Date().toISOString(), };
      setBookReports((prev: BookReport[]) => [...prev, newReport]);
      alert('독후감 제출이 기록되었습니다.');
  };

  const handleReturnBook = (copyToReturn: BookCopy) => {
    const isOverdue = copyToReturn.dueDate && new Date(copyToReturn.dueDate) < new Date();
    setBookCopies((prev: BookCopy[]) => prev.map(copy => copy.registrationNumber === copyToReturn.registrationNumber ? { ...copy, status: '대여 가능', currentBorrowerId: undefined, loanDate: undefined, dueDate: undefined } : copy));
    setLoanHistory((prev: LoanHistory[]) => prev.map(loan => loan.registrationNumber === copyToReturn.registrationNumber && !loan.returnDate ? { ...loan, returnDate: new Date().toISOString() } : loan));
    if (isOverdue && copyToReturn.currentBorrowerId) {
        setUsers((prevUsers: User[]) => prevUsers.map(u => u.phone === copyToReturn.currentBorrowerId ? { ...u, depositStatus: 'Pending' } : u));
        setSelectedUser(prev => prev ? { ...prev, depositStatus: 'Pending'} : null);
        alert(`${getUserName(copyToReturn.currentBorrowerId || '')}님의 연체 도서가 반납 처리되었으며, 보증금 상태가 'Pending'으로 변경되었습니다.`);
    } else {
        alert(`${getUserName(copyToReturn.currentBorrowerId || '')}님의 '${getBookTitle(copyToReturn.bookId)}'이(가) 반납 처리되었습니다.`);
    }
  }
  
  const handleDepositPaid = (userId: string) => {
    setUsers((prevUsers: User[]) => prevUsers.map(u => (u.phone === userId ? { ...u, depositStatus: 'OK' } : u)));
    setSelectedUser(prev => (prev ? { ...prev, depositStatus: 'OK' } : null));
    alert('보증금 입금 처리가 완료되었습니다.');
  };

  const showNonAttendeesModal = () => {
    const currentMonth = new Date().getMonth(); const currentYear = new Date().getFullYear();
    const attendedUserIds = new Set(eventAttendances.filter(ea => {
        if (!ea.isAttended) return false;
        const event = educationEvents.find(e => e.eventId === ea.eventId); if (!event) return false;
        const eventDate = new Date(event.date); return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).map(ea => ea.userId));
    const relevantUsers = currentUser.role === 'Coordinator' ? users.filter(u => u.chapterId === currentUser.chapterId) : users;
    const nonAttendees = relevantUsers.filter(user => !attendedUserIds.has(user.phone));
    openModal(
        <div>
            <h3 className="text-xl font-bold mb-4">이달의 교육 미이수자</h3>
            {nonAttendees.length > 0 ? ( <ul className="space-y-2 max-h-80 overflow-y-auto">{nonAttendees.map(user => (<li key={user.phone} className="p-2 border rounded-md">{user.name} ({getChapterName(user.chapterId)}) - {user.phone}</li>))}</ul>) : (<p>이번 달 모든 회원이 교육을 이수했습니다!</p>)}
        </div>
    );
  };

  const usersInChapter = useMemo(() => { return selectedChapterId ? users.filter(u => u.chapterId === selectedChapterId) : []; }, [users, selectedChapterId]);
  const getMemberStats = (userId: string) => {
    const isOverdue = bookCopies.some(copy => copy.currentBorrowerId === userId && copy.dueDate && new Date(copy.dueDate) < new Date());
    const currentMonth = new Date().getMonth(); const currentYear = new Date().getFullYear();
    const hasAttendedThisMonth = eventAttendances.some(ea => {
        if (ea.userId !== userId || !ea.isAttended) return false;
        const event = educationEvents.find(e => e.eventId === ea.eventId); if (!event) return false;
        const eventDate = new Date(event.date); return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
    return { isOverdue, hasAttendedThisMonth };
  };

  const sortedUsersInChapter = useMemo(() => {
    let sortableItems = [...usersInChapter];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const aStats = getMemberStats(a.phone); const bStats = getMemberStats(b.phone);
            let aValue: string | boolean;
            let bValue: string | boolean;
            if (sortConfig.key === 'name') { aValue = a.name; bValue = b.name; } 
            else if (sortConfig.key === 'isOverdue') { aValue = aStats.isOverdue; bValue = bStats.isOverdue; } 
            else if (sortConfig.key === 'hasAttendedThisMonth') { aValue = aStats.hasAttendedThisMonth; bValue = bStats.hasAttendedThisMonth; } 
            else { return 0; }
            if (aValue < bValue) { return sortConfig.direction === 'asc' ? -1 : 1; }
            if (aValue > bValue) { return sortConfig.direction === 'asc' ? 1 : -1; }
            return 0;
        });
    }
    return sortableItems;
  }, [usersInChapter, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') { direction = 'desc'; }
    setSortConfig({ key, direction });
  };
  
  const MemberDetails = () => {
    if (!selectedUser) return null;
    const currentLoan = bookCopies.find(c => c.currentBorrowerId === selectedUser.phone);
    const isOverdue = currentLoan && currentLoan.dueDate && new Date(currentLoan.dueDate) < new Date();
    return (
    <div>
      <button onClick={() => setSelectedUser(null)} className="mb-4 text-blue-600 hover:underline">&lt; 회원 목록으로 돌아가기</button>
      <h3 className="text-2xl font-bold mb-4">{selectedUser.name}님 활동 내역</h3>
      <div className="mb-6 p-4 border rounded-lg"><h4 className="text-xl font-semibold mb-3">보증금 관리</h4><div className="flex items-center"><p className="mr-4">현재 상태: <span className={`font-bold ${selectedUser.depositStatus === 'OK' ? 'text-green-600' : 'text-red-600'}`}>{selectedUser.depositStatus}</span></p>{selectedUser.depositStatus === 'Pending' && (<button onClick={() => handleDepositPaid(selectedUser.phone)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">보증금 입금 처리</button>)}</div></div>
      <div className="mb-6 p-4 border rounded-lg"><h4 className="text-xl font-semibold mb-3">도서 반납 관리</h4>{currentLoan ? (<div className={`flex justify-between items-center p-2 rounded ${isOverdue ? 'bg-red-100' : 'bg-gray-50'}`}><div><p>{getBookTitle(currentLoan.bookId)}</p><p className={`text-xs ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{isOverdue ? '연체됨! ' : ''}반납 예정일: {currentLoan.dueDate ? new Date(currentLoan.dueDate).toLocaleDateString() : '미정'}</p></div><button onClick={() => handleReturnBook(currentLoan)} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">반납하기</button></div>) : <p className="text-sm text-gray-500">대여 중인 도서가 없습니다.</p>}</div>
      <div className="mb-6 p-4 border rounded-lg"><h4 className="text-xl font-semibold mb-3">교육 이수/후기 관리</h4><div className="space-y-2 max-h-60 overflow-y-auto">{eventAttendances.filter(ea => ea.userId === selectedUser.phone).map(ea => { const event = educationEvents.find(e => e.eventId === ea.eventId); return (<div key={ea.attendanceId} className="p-3 border rounded"><p className="font-bold">{event?.name}</p><div className="flex items-center space-x-4 mt-2"><label className="flex items-center"><input type="checkbox" checked={ea.isAttended} onChange={e => handleAttendanceChange(ea.attendanceId, 'isAttended', e.target.checked)} className="mr-2 h-4 w-4" /> 수강 완료</label><label className="flex items-center"><input type="checkbox" checked={ea.isReviewSubmitted} onChange={e => handleAttendanceChange(ea.attendanceId, 'isReviewSubmitted', e.target.checked)} className="mr-2 h-4 w-4" /> 후기 완료</label></div></div>)})}</div></div>
      <div className="p-4 border rounded-lg"><h4 className="text-xl font-semibold mb-3">독후감 제출 관리</h4><div className="space-y-2 max-h-60 overflow-y-auto">{books.map(book => { const hasSubmitted = bookReports.some(br => br.userId === selectedUser.phone && br.bookId === book.bookId); return (<div key={book.bookId} className="flex justify-between items-center p-3 border rounded"><p>{book.title}</p><button onClick={() => handleReportSubmit(selectedUser.phone, book.bookId)} disabled={hasSubmitted} className={`px-3 py-1 text-sm rounded text-white ${hasSubmitted ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>{hasSubmitted ? '제출 완료' : '제출 체크'}</button></div>)})}</div></div>
    </div>
  )};

  const EducationGrid = () => {
    if (!selectedChapterId) return null;
    const stats = TOP_12_COURSES.map(course => {
        const totalMembersInChapter = usersInChapter.length; if (totalMembersInChapter === 0) return { courseName: course.name, attendedCount: 0, attendanceRate: '0.00', reviewCount: 0, reviewRate: '0.00' };
        const attendedCount = usersInChapter.reduce((count, user) => eventAttendances.some(ea => { const event = educationEvents.find(e => e.eventId === ea.eventId); return ea.userId === user.phone && event?.name === course.name && ea.isAttended; }) ? count + 1 : count, 0);
        const reviewCount = usersInChapter.reduce((count, user) => eventAttendances.some(ea => { const event = educationEvents.find(e => e.eventId === ea.eventId); return ea.userId === user.phone && event?.name === course.name && ea.isReviewSubmitted; }) ? count + 1 : count, 0);
        return { courseName: course.name, attendanceRate: ((attendedCount / totalMembersInChapter) * 100).toFixed(2), reviewRate: ((reviewCount / totalMembersInChapter) * 100).toFixed(2), attendedCount, reviewCount };
    });
    return (
    <div className="overflow-x-auto"><h3 className="text-2xl font-bold mb-4">{getChapterName(selectedChapterId)} 챕터 TOP 교육 현황</h3>
        <table className="w-full border-collapse text-sm text-center">
            <thead><tr className="bg-gray-100"><th className="border p-2 sticky left-0 bg-gray-100 z-10 w-40 min-w-[10rem]">이름</th>{TOP_12_COURSES.map(course => (<th key={course.name} className="border p-2 min-w-[10rem]">{course.name}</th>))}</tr></thead>
            <tbody>
                {usersInChapter.map(user => (<tr key={user.phone} className="hover:bg-gray-50"><td className="border p-2 sticky left-0 bg-white hover:bg-gray-50 z-10 font-semibold whitespace-nowrap">{user.name}</td>{TOP_12_COURSES.map(course => { const attendance = eventAttendances.find(ea => { const event = educationEvents.find(e => e.eventId === ea.eventId); return ea.userId === user.phone && event?.name === course.name; }); return (<td key={`${user.phone}-${course.name}`} className="border p-2"><div className="flex flex-col justify-center items-center gap-y-2"><label title="교육 이수" className="flex items-center cursor-pointer"><input type="checkbox" className="h-4 w-4" checked={attendance?.isAttended || false} onChange={e => handleGridAttendanceChange(user.phone, course.name, 'isAttended', e.target.checked)} /><span className="ml-1 text-xs">교육</span></label><label title="후기 작성" className="flex items-center cursor-pointer"><input type="checkbox" className="h-4 w-4" checked={attendance?.isReviewSubmitted || false} onChange={e => handleGridAttendanceChange(user.phone, course.name, 'isReviewSubmitted', e.target.checked)} /><span className="ml-1 text-xs">후기</span></label></div></td>); })}</tr>))}
            </tbody>
            <tfoot className="font-bold text-sm"><tr className="bg-blue-50"><td className="border p-2 sticky left-0 bg-blue-50 z-10">교육 이수율 (%)</td>{stats.map(stat => (<td key={`att-rate-${stat.courseName}`} className="border p-2">{stat.attendanceRate}% ({stat.attendedCount})</td>))}</tr><tr className="bg-yellow-50"><td className="border p-2 sticky left-0 bg-yellow-50 z-10">후기 제출률 (%)</td>{stats.map(stat => (<td key={`rev-rate-${stat.courseName}`} className="border p-2">{stat.reviewRate}% ({stat.reviewCount})</td>))}</tr></tfoot>
        </table>
    </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-gray-800">활동 관리</h2><button onClick={showNonAttendeesModal} className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600">이달의 교육 미이수자 확인</button></div>
       <div className="flex border-b mb-4"><button onClick={() => setAdminViewMode('member')} className={`py-2 px-4 -mb-px ${adminViewMode === 'member' ? 'border-b-2 border-[#e9062a] text-[#e9062a]' : 'text-gray-500'}`}>회원별 관리</button><button onClick={() => setAdminViewMode('education')} className={`py-2 px-4 -mb-px ${adminViewMode === 'education' ? 'border-b-2 border-[#e9062a] text-[#e9062a]' : 'text-gray-500'}`}>교육별 관리</button></div>
      {currentUser.role === 'Master' && !selectedChapterId && (<div><h3 className="text-xl font-semibold mb-4">챕터를 선택하세요</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{chapters.map(chapter => (<div key={chapter.chapterId} onClick={() => setSelectedChapterId(chapter.chapterId)} className="p-6 border rounded-lg text-center cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all"><p className="text-2xl font-bold">{chapter.name}</p></div>))}</div></div>)}
      {selectedChapterId && (
        <div>
          {currentUser.role === 'Master' && <button onClick={() => {setSelectedChapterId(null); setSelectedUser(null);}} className="mb-4 text-blue-600 hover:underline">&lt; 챕터 선택으로 돌아가기</button>}
          {adminViewMode === 'member' ? ( selectedUser ? <MemberDetails /> : (<div className="overflow-x-auto"><h3 className="text-2xl font-bold mb-4">{getChapterName(selectedChapterId)} 챕터 회원</h3>
                  <table className="w-full text-left table-auto"><thead><tr className="bg-gray-100"><th className="p-3 cursor-pointer" onClick={() => requestSort('name')}>이름 {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th><th className="p-3 cursor-pointer" onClick={() => requestSort('isOverdue')}>도서 연체 {sortConfig?.key === 'isOverdue' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th><th className="p-3 cursor-pointer" onClick={() => requestSort('hasAttendedThisMonth')}>이달 교육 이수 {sortConfig?.key === 'hasAttendedThisMonth' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th><th className="p-3">상세 보기</th></tr></thead>
                    <tbody>{sortedUsersInChapter.map(user => { const { isOverdue, hasAttendedThisMonth } = getMemberStats(user.phone); return (<tr key={user.phone} className="border-b hover:bg-gray-50"><td className="p-3 font-semibold">{user.name}</td><td className="p-3">{isOverdue ? '🔴 연체' : '🟢 정상'}</td><td className="p-3">{hasAttendedThisMonth ? '✅ 이수' : '❌ 미이수'}</td><td className="p-3"><button onClick={() => setSelectedUser(user)} className="text-blue-600 hover:underline">활동 내역 보기</button></td></tr>)})}</tbody>
                  </table></div>)) : (<EducationGrid />)}
        </div>
      )}
    </div>
  );
};

const Modal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
         <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl z-10">&times;</button>
        {children}
      </div>
    </div>
  );
};

export default App;
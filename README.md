# 🎉 꺄르륵 파티 플랫폼

바에서 진행하는 소셜 파티 이벤트를 디지털화한 모바일 최적화 플랫폼입니다.

## ✨ 주요 기능

### 🔐 보안 인증 시스템
- 바 고객 전용 비밀번호 인증
- 핸드폰 번호 기반 SMS 인증
- Firebase Authentication 연동

### 📊 실시간 참가 현황
- 남성/여성 각 5명 제한
- 실시간 슬롯 확인
- 자동 마감 관리

### 💳 간편 결제
- 토스페이먼츠 연동
- 카카오페이 지원
- 신용카드/체크카드 결제

### 📱 사용자 대시보드
- 이벤트 정보 제공
- 개인 정보 관리
- 참가 취소 기능
- 질문지 작성 (예정)

## 🛠️ 기술 스택

### Frontend
- **Next.js 16** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **shadcn/ui** - UI 컴포넌트

### Backend & Database
- **Firebase Auth** - 인증 시스템
- **Firestore** - NoSQL 데이터베이스
- **Firebase Security Rules** - 데이터 보안

### Payment
- **토스페이먼츠** - 결제 처리
- **카카오페이** - 간편 결제

## 🚀 빠른 시작

### 1. 설치
```bash
git clone <repository-url>
cd kyareureuk-party
npm install
```

### 2. 환경 설정
`.env.local` 파일 생성:
```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 바 인증 비밀번호
NEXT_PUBLIC_BAR_PASSWORD=kyareureuk2024

# 토스페이먼츠 설정
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_your_key
TOSS_SECRET_KEY=test_sk_your_key
```

### 3. 개발 서버 실행
```bash
npm run dev
```

서버가 실행되면 http://localhost:3000 에서 확인할 수 있습니다.

## 📱 사용자 플로우

1. **QR 스캔** → 플랫폼 접속
2. **바 고객 인증** → 비밀번호 입력 (`kyareureuk2024`)
3. **참가 현황 확인** → 남/녀 슬롯 확인
4. **핸드폰 인증** → SMS 인증 (테스트: `123456`)
5. **프로필 입력** → 이름, 성별, 나이
6. **결제** → 토스페이/카카오페이/카드
7. **대시보드** → 이벤트 정보 및 관리

## 🎮 개발/테스트 모드

### 개발 모드 (기본)
- Firebase 없이 테스트 가능
- Mock 데이터 사용
- 인증번호: `123456`

### Firebase 모드
- 실제 Firebase 연동
- 실제 SMS 전송
- 데이터베이스 저장

인증 페이지에서 토글로 모드 전환 가능합니다.

## 📂 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
│   ├── page.tsx      # 메인 (비밀번호 입력)
│   ├── status/       # 참가 현황
│   ├── auth/         # 인증 및 회원가입
│   ├── payment/      # 결제
│   └── dashboard/    # 대시보드
├── components/       # 재사용 컴포넌트
│   ├── ui/          # shadcn/ui 컴포넌트
│   ├── layout/      # 레이아웃 컴포넌트
│   └── common/      # 공통 컴포넌트
├── lib/             # 유틸리티 및 서비스
│   ├── firebase.ts  # Firebase 설정
│   ├── firestore.ts # 데이터베이스 작업
│   ├── auth.ts      # 인증 서비스
│   └── payment.ts   # 결제 서비스
└── types/           # TypeScript 타입 정의
```

## 🔧 배포

### Vercel (권장)
1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com/)에 연결
3. 환경 변수 설정

### Firebase Hosting
```bash
npm run build
firebase deploy
```

자세한 배포 가이드는 `DEPLOYMENT_GUIDE.md`를 참조하세요.

## 🛡️ 보안

- Firebase 보안 규칙 적용
- 환경 변수로 민감한 정보 관리
- HTTPS 강제 사용
- 사용자 인증 및 권한 관리

## 📊 데이터 구조

### Users Collection
```typescript
{
  phoneNumber: string,
  name: string,
  gender: 'male' | 'female',
  age: number,
  createdAt: timestamp
}
```

### Events Collection
```typescript
{
  date: timestamp,
  maleCount: number,      // 0-5
  femaleCount: number,    // 0-5
  participants: string[], // User IDs
  status: 'open' | 'full' | 'closed',
  eventPassword: string
}
```

### Registrations Collection
```typescript
{
  userId: string,
  eventId: string,
  paymentStatus: 'pending' | 'completed' | 'failed',
  questionnaireAnswers: object,
  registeredAt: timestamp
}
```

## 🚧 추가 예정 기능

- [ ] 질문지 시스템 완성
- [ ] 어드민 대시보드
- [ ] 푸시 알림
- [ ] 이벤트 히스토리
- [ ] 매칭 알고리즘
- [ ] PWA 지원

## 📞 지원

문의사항이 있으시면 이슈를 등록해주세요.

## 📄 라이센스

MIT License

---

**💡 Tip**: 모바일에서 최적화된 경험을 위해 모바일 브라우저에서 테스트해보세요!

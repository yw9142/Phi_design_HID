# 질문 북마크 타임라인 (Question Bookmark Timeline)

HID 2주차 과제 프로토타입 — **Next.js (App Router)** 버전.
듣는 흐름을 끊지 않고 ‘막힌 순간’의 시간 맥락을 먼저 저장한 뒤, 질문은 나중에 그 맥락 위에서 고르는 LLM 채팅 인터랙션을 검증한다.

🔗 **라이브 데모: https://question-bookmark-timeline.vercel.app** (Vercel 배포, 공개 접속 가능)

> 같은 프로토타입의 단일 HTML 버전은 `../질문북마크_타임라인_과제/prototype.html` 에 있다.
> 이 폴더는 Vercel에 그대로 올려 공유 URL을 만들기 위한 Next.js 프로젝트다.

## 한 줄 정의
실시간으로 흐르는 강의/회의를 들으며 LLM을 쓸 때, **막힌 순간을 한 번 탭**하면 시스템이
**직전 20~30초 맥락을 자동 저장**하고, 질문은 나중에 그 **시간 맥락 카드** 위에서 고르거나 다듬는다.

## v0.2에서 다듬은 점
- 문제를 “질문 입력이 번거롭다”가 아니라 “질문이 발생한 시간 맥락을 채팅 UX가 보존하지 못한다”로 좁혔다.
- 카드에 개념 라벨, 맥락 요약, 저장 구간을 추가해 Encoding Specificity 원칙처럼 입력 시점의 단서를 복습 시점에도 다시 보여준다.
- 상단 검증 지표로 놓친 자막 수, 저장된 맥락 초, 해결률을 드러내 before/after 차이를 바로 확인하게 했다.
- 질문 후보는 3개로 유지해 선택 부담을 제한하고, 필요할 때만 직접 수정 입력을 열어 둔다.

## 로컬 실행
```bash
npm install
npm run dev      # http://localhost:3000
# 프로덕션 빌드 확인
npm run build && npm start
```
요구 환경: Node.js ≥ 20.9 (Next.js 16). 의존성 취약점 0건.

## Vercel 배포

### 방법 A — GitHub + Vercel 대시보드 (권장)
1. 이 `question-bookmark-timeline` 폴더를 GitHub 저장소로 푸시한다.
   - 저장소 루트가 이 폴더면 그대로, 상위 폴더(HID) 전체를 올렸다면 아래 Root Directory를 지정한다.
2. https://vercel.com → **Add New… → Project** → 해당 저장소 **Import**.
3. **Framework Preset**: Next.js (자동 감지됨).
4. **Root Directory**: 저장소 안에서 이 폴더 경로(`question-bookmark-timeline`)로 설정.
   (저장소 루트가 이미 이 폴더면 비워둔다.)
5. **Deploy** → 발급된 `https://<프로젝트명>.vercel.app` 이 공유 링크.

### 방법 B — Vercel CLI
```bash
npm i -g vercel
cd question-bookmark-timeline
vercel          # 최초 1회 프로젝트 연결(프롬프트 따라가기)
vercel --prod   # 프로덕션 배포 → URL 출력
```

배포 후 별도 설정은 필요 없다(서버리스/정적 자동 처리). 환경변수 없음.

## 테스트 순서 (before / after 체감)
1. 강의 재생(▶) — ‘A/B 테스트 기초: 통계적 유의성’ 더미 transcript.
2. **기존 채팅 방식**으로 전환 → 질문 입력 중 자막이 계속 흘러 ‘**놓친 자막 N줄**’이 집계됨(마찰 체감).
3. **질문 북마크 방식**으로 전환 → 막히는 순간 **‘막힘 핀 찍기’(또는 `Q`)** 탭. 흐름은 멈추지 않고 맥락 카드가 핀으로 고정.
4. 카드에서 맥락 요약 + 질문 후보 3개 확인 → 선택하거나 직접 다듬어 전송. 답변이 해당 타임스탬프에 붙음.
5. **복습 모드(⟲)** → 막힌 지점·해결 여부·Q&A가 시간순으로 정리.

단축키: `Q` 막힘 표시 · `K` 재생/정지.

## 구조
```
app/
  layout.js     # 루트 레이아웃 + 메타데이터
  page.js       # 프로토타입 전체 (client component)
  data.js       # 더미 강의 transcript + 질문/답변 지식베이스
  globals.css   # 스타일
next.config.mjs # turbopack.root 고정
```

상태 전이: `Listening → Marked → Question Candidate → Answered → Review`

import type {Chat, ContextCard} from '../lib/context';

export const initialTitle = 'AI 협업 브리프 베타 출시안';

export const initialPrompt =
  '6주 안에 AI 협업 브리프 기능을 베타 출시할지 결정하는 1페이지 의사결정안을 작성해줘. 고객 인터뷰, 경쟁 분석, 사용성 테스트, 운영 자동화 수치, 보안 검토와 파일럿 성공 기준을 근거로 문제, 차별점, MVP 범위와 실행 순서를 정리해줘.';

export const initialFollowUp =
  '추천된 근거를 바탕으로 Go/No-Go 결론, 핵심 근거 3개, 6주 실행안과 성공 지표를 작성해줘.';

export const demoPrompt =
  'AI 협업 브리프 기능의 베타 MVP 범위와 의사결정 기준을 정리해줘.';

export const chats: Chat[] = [
  {
    id: 'feature-proposal',
    title: 'AI 협업 브리프 기능 정의',
    date: '2026-07-09',
    tags: ['제품기획', '의사결정'],
    summary:
      '흩어진 대화에서 결정 근거와 후속 작업을 회수해 한 장의 협업 브리프로 만드는 기능의 대상, 핵심 가치와 제외 범위를 정리했다.',
    keywords: ['AI', '협업', '브리프', '베타', '기능', '의사결정', 'MVP'],
    relationshipReason:
      '현재 출시안과 동일한 기능의 문제 정의, 대상 사용자와 MVP 원칙이 정리되어 있습니다.',
    messages: [
      {
        id: 'feature-proposal-user-1',
        role: 'user',
        body: '여러 채팅에 흩어진 결정 근거를 한 장으로 묶는 기능의 핵심 사용자를 정의해줘.',
        timestamp: '오후 2:12',
      },
      {
        id: 'feature-proposal-assistant-1',
        role: 'assistant',
        body: '여러 프로젝트를 병행하며 인터뷰, 회의, 분석 결과를 다시 조합하는 PM과 기획자를 1차 사용자로 정의했습니다.',
        timestamp: '오후 2:13',
      },
      {
        id: 'feature-proposal-user-2',
        role: 'user',
        body: '첫 버전에서 반드시 해결할 문제와 제외할 기능도 구분해줘.',
        timestamp: '오후 2:18',
      },
      {
        id: 'feature-proposal-assistant-2',
        role: 'assistant',
        body: '관련 대화 추천, 명시적 첨부, 답변 출처 확인에 집중하고 자동 분류 규칙 편집과 전사 지식 그래프는 제외하기로 했습니다.',
        timestamp: '오후 2:20',
      },
    ],
  },
  {
    id: 'customer-interviews',
    title: 'PM 고객 인터뷰 12명 종합',
    date: '2026-07-07',
    tags: ['사용자리서치', '인터뷰'],
    summary:
      '프로덕트 매니저 12명을 인터뷰해 과거 결정 근거 탐색, 반복 설명, 잘못된 맥락 재사용이 실제 업무에 미치는 영향을 정리했다.',
    keywords: ['고객', '인터뷰', '협업', '맥락', '베타', '의사결정', '문제'],
    relationshipReason:
      '출시 필요성을 뒷받침하는 사용자 수, 탐색 시간과 반복 설명 패턴을 직접 인용할 수 있습니다.',
    messages: [
      {
        id: 'customer-interviews-user-1',
        role: 'user',
        body: '12명 인터뷰에서 과거 맥락을 다시 찾을 때 반복된 행동을 묶어줘.',
        timestamp: '오전 11:04',
      },
      {
        id: 'customer-interviews-assistant-1',
        role: 'assistant',
        body: '9명이 채팅 검색, 문서 검색, 동료 확인을 순서대로 반복했고 필요한 결정 근거를 찾는 데 평균 18분이 걸렸습니다.',
        timestamp: '오전 11:05',
      },
      {
        id: 'customer-interviews-user-2',
        role: 'user',
        body: '답변 신뢰와 관련해 가장 강하게 나온 불안도 정리해줘.',
        timestamp: '오전 11:12',
      },
      {
        id: 'customer-interviews-assistant-2',
        role: 'assistant',
        body: '자동으로 모든 기록을 섞는 것보다 사용자가 근거를 고르고 어떤 대화가 쓰였는지 확인할 수 있어야 한다는 요구가 8명에게서 나왔습니다.',
        timestamp: '오전 11:14',
      },
    ],
  },
  {
    id: 'competitor-analysis',
    title: '협업 AI 5개 서비스 비교',
    date: '2026-07-05',
    tags: ['시장조사', '경쟁분석'],
    summary:
      '대화 검색, 프로젝트 지식, 출처 표시, 그래프 탐색을 기준으로 협업 AI 5개 서비스를 비교하고 비어 있는 사용자 흐름을 찾았다.',
    keywords: ['경쟁', '분석', '협업', 'AI', '맥락', '기능', '차별점'],
    relationshipReason:
      '기존 서비스가 검색이나 자동 기억 중 하나에 치우친다는 비교 결과가 차별화 논리를 제공합니다.',
    messages: [
      {
        id: 'competitor-analysis-user-1',
        role: 'user',
        body: '협업 AI 5개를 과거 대화 재사용 관점에서 비교해줘.',
        timestamp: '오후 4:20',
      },
      {
        id: 'competitor-analysis-assistant-1',
        role: 'assistant',
        body: '세 서비스는 검색 결과를 제공하지만 현재 질문에 바로 첨부하는 흐름이 없고, 두 서비스는 프로젝트 안에서만 기억을 재사용합니다.',
        timestamp: '오후 4:22',
      },
      {
        id: 'competitor-analysis-user-2',
        role: 'user',
        body: '우리 기능이 한 문장으로 차별화될 지점을 골라줘.',
        timestamp: '오후 4:28',
      },
      {
        id: 'competitor-analysis-assistant-2',
        role: 'assistant',
        body: '현재 질문에 필요한 과거 대화를 설명과 함께 추천하고, 사용자가 선택한 근거만 답변에 쓰게 한다는 점이 가장 분명합니다.',
        timestamp: '오후 4:30',
      },
    ],
  },
  {
    id: 'roadmap-meeting',
    title: '6주 베타 로드맵 결정',
    date: '2026-07-03',
    tags: ['로드맵', '리소스계획'],
    summary:
      '프론트엔드 2명, 백엔드 1명으로 6주 안에 베타를 만들기 위한 범위, 주차별 마일스톤과 제외 기능을 확정했다.',
    keywords: ['6주', '베타', 'MVP', '로드맵', '기능', '출시', '실행'],
    relationshipReason:
      '현재 요청의 6주 실행안과 Go/No-Go 판단에 필요한 리소스 제약과 마일스톤이 있습니다.',
    messages: [
      {
        id: 'roadmap-meeting-user-1',
        role: 'user',
        body: '프론트 2명, 백엔드 1명 기준으로 6주 MVP를 쪼개줘.',
        timestamp: '오전 9:32',
      },
      {
        id: 'roadmap-meeting-assistant-1',
        role: 'assistant',
        body: '1~2주는 추천과 첨부, 3~4주는 출처 이동과 로컬 그래프, 5주는 품질 조정, 6주는 파일럿 계측으로 나눴습니다.',
        timestamp: '오전 9:34',
      },
      {
        id: 'roadmap-meeting-user-2',
        role: 'user',
        body: '일정 리스크를 줄이기 위해 무엇을 제외해야 해?',
        timestamp: '오전 9:40',
      },
      {
        id: 'roadmap-meeting-assistant-2',
        role: 'assistant',
        body: '전사 그래프, 수동 링크 편집, 외부 문서 자동 수집은 제외하고 현재 대화와 과거 채팅 연결에만 집중해야 합니다.',
        timestamp: '오전 9:42',
      },
    ],
  },
  {
    id: 'ops-automation',
    title: '주간 운영보고 자동화 성과',
    date: '2026-07-01',
    tags: ['운영', '업무자동화'],
    summary:
      '주간 운영보고에 필요한 맥락 수집을 자동화해 작성 시간을 90분에서 15분으로 줄이고 누락률을 18%에서 3%로 낮춘 사례다.',
    keywords: ['운영', '자동화', '협업', '시간', '지표', '베타', '문제'],
    relationshipReason:
      '맥락 회수 비용을 줄였을 때 기대할 수 있는 시간 절감과 누락 감소 효과를 수치로 보여줍니다.',
    messages: [
      {
        id: 'ops-automation-user-1',
        role: 'user',
        body: '주간 운영보고 자동화 전후를 같은 기준으로 비교해줘.',
        timestamp: '오후 1:40',
      },
      {
        id: 'ops-automation-assistant-1',
        role: 'assistant',
        body: '4주 평균 작성 시간은 90분에서 15분으로, 이슈 누락률은 18%에서 3%로 감소했습니다.',
        timestamp: '오후 1:42',
      },
      {
        id: 'ops-automation-user-2',
        role: 'user',
        body: '시간 절감 외에 팀 행동이 어떻게 달라졌어?',
        timestamp: '오후 1:48',
      },
      {
        id: 'ops-automation-assistant-2',
        role: 'assistant',
        body: '담당자들은 자료를 모으는 대신 예외 상황을 검토했고, 보고서 수정 요청도 주당 6건에서 2건으로 줄었습니다.',
        timestamp: '오후 1:50',
      },
    ],
  },
  {
    id: 'usability-test',
    title: '컨텍스트 첨부 사용성 테스트',
    date: '2026-06-29',
    tags: ['사용성테스트', 'UX리서치'],
    summary:
      '프로토타입 사용성 테스트 6명에서 추천 이유, 첨부 상태와 답변 출처를 발견하고 이해하는 과정을 관찰했다.',
    keywords: ['사용성', '테스트', '추천', '출처', '맥락', '베타', '문제'],
    relationshipReason:
      '베타 전에 해결해야 할 발견성 문제와 출처 신뢰에 대한 사용성 근거가 포함되어 있습니다.',
    messages: [
      {
        id: 'usability-test-user-1',
        role: 'user',
        body: '6명 테스트에서 가장 많이 막힌 지점을 우선순위로 정리해줘.',
        timestamp: '오후 3:05',
      },
      {
        id: 'usability-test-assistant-1',
        role: 'assistant',
        body: '4명은 그래프를 먼저 탐색하느라 첨부 행동을 늦게 발견했고, 3명은 추천 이유를 본 뒤에야 맥락을 선택했습니다.',
        timestamp: '오후 3:07',
      },
      {
        id: 'usability-test-user-2',
        role: 'user',
        body: '출처 표시가 실제 신뢰에 영향을 줬는지도 알려줘.',
        timestamp: '오후 3:12',
      },
      {
        id: 'usability-test-assistant-2',
        role: 'assistant',
        body: '6명 모두 답변 아래 출처를 열어 원문을 확인했고, 5명은 자동 기억보다 선택한 대화만 쓰는 방식이 더 안심된다고 답했습니다.',
        timestamp: '오후 3:14',
      },
    ],
  },
  {
    id: 'pilot-plan',
    title: '3개 팀 파일럿 성공 기준',
    date: '2026-06-27',
    tags: ['실험설계', '파일럿'],
    summary:
      '기획, 디자인, 운영 3개 팀이 4주 동안 사용할 파일럿의 대상 업무, 계측 이벤트와 성공·중단 기준을 정의했다.',
    keywords: ['파일럿', '성공', '기준', '지표', '베타', '협업', '의사결정'],
    relationshipReason:
      '출시안의 성공 지표와 베타 중단 기준을 모호한 만족도가 아니라 행동 데이터로 제시할 수 있습니다.',
    messages: [
      {
        id: 'pilot-plan-user-1',
        role: 'user',
        body: '4주 파일럿에서 반드시 측정할 행동 지표를 정해줘.',
        timestamp: '오전 10:15',
      },
      {
        id: 'pilot-plan-assistant-1',
        role: 'assistant',
        body: '맥락 추천 확인률, 첨부율, 출처 열람률, 과거 대화 탐색 시간, 같은 설명 반복 횟수를 측정하기로 했습니다.',
        timestamp: '오전 10:17',
      },
      {
        id: 'pilot-plan-user-2',
        role: 'user',
        body: '성공과 중단 기준을 숫자로 정리해줘.',
        timestamp: '오전 10:22',
      },
      {
        id: 'pilot-plan-assistant-2',
        role: 'assistant',
        body: '탐색 시간 30% 감소와 주 2회 이상 재사용을 성공 기준으로, 잘못된 맥락 첨부가 세션의 10%를 넘으면 중단 기준으로 잡았습니다.',
        timestamp: '오전 10:24',
      },
    ],
  },
  {
    id: 'security-review',
    title: '대화 데이터 권한·보안 검토',
    date: '2026-06-25',
    tags: ['정보보호', '권한설계'],
    summary:
      '개인 대화, 프로젝트 공유 대화와 제한 문서가 추천될 때 지켜야 할 권한 상속, 데이터 노출과 감사 로그 원칙을 검토했다.',
    keywords: ['보안', '권한', '데이터', '베타', '맥락', '검토', '출처'],
    relationshipReason:
      '베타 출시 전에 반드시 지켜야 할 추천 범위, 권한 상속과 민감 대화 제외 원칙을 제공합니다.',
    messages: [
      {
        id: 'security-review-user-1',
        role: 'user',
        body: '관련 대화를 추천할 때 가장 위험한 권한 시나리오를 정리해줘.',
        timestamp: '오후 5:10',
      },
      {
        id: 'security-review-assistant-1',
        role: 'assistant',
        body: '사용자가 현재 접근할 수 없는 프로젝트 대화의 제목이나 요약이 추천 화면에 노출되는 경우가 가장 위험합니다.',
        timestamp: '오후 5:12',
      },
      {
        id: 'security-review-user-2',
        role: 'user',
        body: '베타에서 적용할 최소 안전장치를 정해줘.',
        timestamp: '오후 5:18',
      },
      {
        id: 'security-review-assistant-2',
        role: 'assistant',
        body: '조회 시점 권한 재검증, 개인 대화 기본값, 민감 태그 제외, 첨부와 출처 열람 감사 로그를 필수로 두기로 했습니다.',
        timestamp: '오후 5:20',
      },
    ],
  },
  {
    id: 'launch-comms',
    title: '베타 참여자 안내 메시지',
    date: '2026-06-23',
    tags: ['출시커뮤니케이션', '온보딩'],
    summary:
      '베타 참여자가 기능의 범위와 데이터 사용 방식을 오해하지 않도록 첫 화면 안내, 초대 메시지와 피드백 질문을 작성했다.',
    keywords: ['출시', '메시지', '가치', '베타', '협업', '사용자', '기능'],
    relationshipReason:
      '의사결정안의 사용자 가치 문장과 베타 참여자에게 약속할 기능 범위를 구체화할 수 있습니다.',
    messages: [
      {
        id: 'launch-comms-user-1',
        role: 'user',
        body: '베타 초대 메시지에서 사용자가 바로 이해해야 할 가치를 한 문장으로 써줘.',
        timestamp: '오전 10:02',
      },
      {
        id: 'launch-comms-assistant-1',
        role: 'assistant',
        body: '이전에 나눈 대화에서 지금 필요한 근거만 골라 붙이고, 다시 설명하지 않고 일을 이어가세요로 정리했습니다.',
        timestamp: '오전 10:04',
      },
      {
        id: 'launch-comms-user-2',
        role: 'user',
        body: '자동으로 모든 대화를 읽는다는 오해를 막는 문장도 필요해.',
        timestamp: '오전 10:08',
      },
      {
        id: 'launch-comms-assistant-2',
        role: 'assistant',
        body: '추천된 대화 중 직접 첨부한 맥락만 답변에 사용되며 언제든 제거하고 원문을 확인할 수 있다고 명시했습니다.',
        timestamp: '오전 10:10',
      },
    ],
  },
];

export const contextCards: ContextCard[] = [
  {
    id: 'customer-evidence',
    title: '12명 인터뷰의 반복 손실',
    sourceChatId: 'customer-interviews',
    sourceChatTitle: 'PM 고객 인터뷰 12명 종합',
    summary:
      '인터뷰 참여자 12명 중 9명이 결정 근거를 찾기 위해 채팅·문서·동료 확인을 반복했고, 필요한 맥락을 찾는 데 평균 18분을 사용했다.',
    reason:
      '출시안의 문제 정의를 추상적인 불편이 아니라 사용자 수와 실제 탐색 시간으로 설명할 수 있다.',
    keywords: ['고객', '인터뷰', '문제', '근거', '베타'],
    relevanceScore: 0,
  },
  {
    id: 'competitor-gap',
    title: '검색과 기억 사이의 빈틈',
    sourceChatId: 'competitor-analysis',
    sourceChatTitle: '협업 AI 5개 서비스 비교',
    summary:
      '비교한 5개 서비스는 검색 결과 제공 또는 프로젝트 자동 기억에는 강했지만, 현재 질문에 필요한 과거 대화를 이유와 함께 추천하고 선택적으로 첨부하는 흐름은 없었다.',
    reason:
      '기존 검색이나 자동 기억과 다른 제품 차별점을 한 문장으로 명확하게 제시할 수 있다.',
    keywords: ['경쟁', '분석', '차별점', '기능', '근거'],
    relevanceScore: 0,
  },
  {
    id: 'automation-impact',
    title: '맥락 수집 자동화의 효과',
    sourceChatId: 'ops-automation',
    sourceChatTitle: '주간 운영보고 자동화 성과',
    summary:
      '주간 보고의 맥락 수집을 자동화한 뒤 평균 작성 시간이 90분에서 15분으로 줄고, 이슈 누락률은 18%에서 3%로 감소했다.',
    reason:
      '맥락 회수 자동화가 편의 기능을 넘어 시간 절감과 누락 감소로 이어질 수 있음을 보여준다.',
    keywords: ['운영', '자동화', '수치', '지표', '근거'],
    relevanceScore: 0,
  },
  {
    id: 'mvp-scope',
    title: '6주 MVP 범위와 제외선',
    sourceChatId: 'roadmap-meeting',
    sourceChatTitle: '6주 베타 로드맵 결정',
    summary:
      '프론트엔드 2명과 백엔드 1명으로 6주 동안 추천·첨부·출처·로컬 그래프를 구현하고, 전사 그래프와 외부 문서 자동 수집은 제외하기로 했다.',
    reason:
      'Go 결정이 가능한 현실적인 리소스 범위와 주차별 실행 순서를 의사결정안에 넣을 수 있다.',
    keywords: ['6주', '베타', 'MVP', '범위', '실행'],
    relevanceScore: 0,
  },
  {
    id: 'usability-findings',
    title: '첨부 행동과 출처 신뢰',
    sourceChatId: 'usability-test',
    sourceChatTitle: '컨텍스트 첨부 사용성 테스트',
    summary:
      '사용성 테스트 6명 중 4명이 그래프보다 첨부 행동을 늦게 발견했지만, 6명 모두 답변 출처를 열어 원문을 확인했고 선택적 첨부 방식을 선호했다.',
    reason:
      '베타 전에 추천과 첨부를 주 흐름으로 강조하고 그래프를 보조 탐색으로 유지해야 한다는 근거가 된다.',
    keywords: ['사용성', '테스트', '출처', '추천', '베타'],
    relevanceScore: 0,
  },
  {
    id: 'pilot-success',
    title: '4주 파일럿 성공·중단 기준',
    sourceChatId: 'pilot-plan',
    sourceChatTitle: '3개 팀 파일럿 성공 기준',
    summary:
      '기획·디자인·운영 3개 팀의 4주 파일럿에서 탐색 시간 30% 감소를 성공 기준으로, 잘못된 맥락 첨부가 세션의 10%를 넘으면 중단 기준으로 정했다.',
    reason:
      '베타 승인 이후 무엇을 측정하고 어떤 조건에서 개선 또는 중단할지 명확하게 제시할 수 있다.',
    keywords: ['파일럿', '성공', '기준', '지표', '베타'],
    relevanceScore: 0,
  },
  {
    id: 'security-guardrails',
    title: '권한 상속과 민감 대화 보호',
    sourceChatId: 'security-review',
    sourceChatTitle: '대화 데이터 권한·보안 검토',
    summary:
      '추천 시점마다 조회 권한을 재검증하고 민감 태그 대화를 제외하며, 맥락 첨부와 출처 열람을 감사 로그로 남기는 것을 베타 필수 조건으로 정했다.',
    reason:
      '기능 가치뿐 아니라 출시 전에 충족해야 할 정보 노출 방지와 운영 안전 조건을 함께 판단할 수 있다.',
    keywords: ['보안', '검토', '권한', '데이터', '베타'],
    relevanceScore: 0,
  },
  {
    id: 'launch-positioning',
    title: '베타 사용자 가치 문장',
    sourceChatId: 'launch-comms',
    sourceChatTitle: '베타 참여자 안내 메시지',
    summary:
      '베타 가치는 이전 대화에서 지금 필요한 근거만 골라 붙이고 다시 설명하지 않고 일을 이어간다는 문장으로 정리했으며, 직접 첨부한 맥락만 사용한다고 안내한다.',
    reason:
      '의사결정안의 핵심 제안과 사용자 약속을 내부 기능 설명이 아니라 이해하기 쉬운 결과 중심 언어로 바꿀 수 있다.',
    keywords: ['출시', '메시지', '가치', '베타', '협업'],
    relevanceScore: 0,
  },
  {
    id: 'proposal-core-flow',
    title: '의사결정 브리프 구성 원칙',
    sourceChatId: 'feature-proposal',
    sourceChatTitle: 'AI 협업 브리프 기능 정의',
    summary:
      '1페이지 출시안은 사용자 문제, 검증된 근거, 제품 차별점, 6주 MVP 범위, 위험 조건과 성공 지표 순서로 구성하기로 했다.',
    reason:
      '현재 답변을 단순 아이디어 요약이 아니라 Go/No-Go 판단이 가능한 의사결정 문서 구조로 정리할 수 있다.',
    keywords: ['의사결정', '1페이지', '문제', '차별점', '실행'],
    relevanceScore: 0,
  },
];

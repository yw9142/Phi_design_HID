export type ChatMessageRecord = {
  id: string;
  role: 'user' | 'assistant';
  body: string;
  timestamp: string;
};

export type Chat = {
  id: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  keywords: string[];
  relationshipReason: string;
  messages: ChatMessageRecord[];
};

export type ContextCard = {
  id: string;
  title: string;
  sourceChatId: string;
  sourceChatTitle: string;
  summary: string;
  reason: string;
  keywords: string[];
  relevanceScore: number;
};

export type RankedChat = Chat & {
  relevanceScore: number;
  matchedKeywords: string[];
};

export type RankedContextCard = ContextCard & {
  relevanceScore: number;
  matchedKeywords: string[];
};

export type RelevanceTier = 'high' | 'medium' | 'low';

export type GraphNode = {
  id: string;
  chatId: string | null;
  label: string;
  type: 'current' | 'past';
  relevanceScore?: number;
  relevanceTier?: RelevanceTier;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  reason: string;
  kind: 'current' | 'related';
};

export type ContextGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphConversation = {
  nodeId: string;
  chatId: string | null;
  title: string;
  text: string;
  keywords: string[];
  relationshipReason?: string;
};

export type GeneratedAnswer = {
  body: string;
  usedContextTitles: string[];
  usedContexts: Pick<ContextCard, 'id' | 'title' | 'sourceChatId'>[];
};

const normalize = (value: string) => value.toLocaleLowerCase('ko-KR');

export const getRelevanceTier = (score: number): RelevanceTier => {
  if (score >= 60) {
    return 'high';
  }

  if (score >= 25) {
    return 'medium';
  }

  return 'low';
};

export const toggleContextSelection = (
  selectedIds: string[],
  contextId: string,
) =>
  selectedIds.includes(contextId)
    ? selectedIds.filter((id) => id !== contextId)
    : [...selectedIds, contextId];

export const getMatchedKeywords = (prompt: string, keywords: string[]) => {
  const normalizedPrompt = normalize(prompt);

  return keywords.filter((keyword) =>
    normalizedPrompt.includes(normalize(keyword)),
  );
};

const scoreKeywords = (prompt: string, keywords: string[]) => {
  if (keywords.length === 0) {
    return {matchedKeywords: [], relevanceScore: 0};
  }

  const matchedKeywords = getMatchedKeywords(prompt, keywords);
  const relevanceScore = Math.round(
    (matchedKeywords.length / keywords.length) * 100,
  );

  return {matchedKeywords, relevanceScore};
};

const byScoreThenTitle = <
  T extends {relevanceScore: number; title: string; matchedKeywords: string[]},
>(
  a: T,
  b: T,
) =>
  b.relevanceScore - a.relevanceScore ||
  b.matchedKeywords.length - a.matchedKeywords.length ||
  a.title.localeCompare(b.title, 'ko-KR');

export const rankChats = (prompt: string, chats: Chat[], limit = 5) =>
  chats
    .map((chat) => ({...chat, ...scoreKeywords(prompt, chat.keywords)}))
    .sort(byScoreThenTitle)
    .slice(0, limit);

export const rankContextCards = ({
  prompt,
  cards,
  activeChatId,
  limit = 3,
}: {
  prompt: string;
  cards: ContextCard[];
  activeChatId?: string | null;
  limit?: number;
}) =>
  cards
    .filter((card) => !activeChatId || card.sourceChatId === activeChatId)
    .map((card) => ({...card, ...scoreKeywords(prompt, card.keywords)}))
    .filter((card) => card.relevanceScore > 0)
    .sort(byScoreThenTitle)
    .slice(0, limit);

export const buildFocusedGraph = ({
  center,
  candidates,
  pinnedNodeIds = [],
  limit = 5,
}: {
  center: GraphConversation;
  candidates: GraphConversation[];
  pinnedNodeIds?: string[];
  limit?: number;
}): ContextGraph => {
  const scoredCandidates = candidates
    .filter((candidate) => candidate.nodeId !== center.nodeId)
    .map((candidate) => ({
      ...candidate,
      ...scoreKeywords(center.text, candidate.keywords),
    }))
    .filter((candidate) => candidate.relevanceScore > 0)
    .sort(byScoreThenTitle);
  const pinnedNodeIdSet = new Set(pinnedNodeIds);
  const rankedCandidates = [
    ...scoredCandidates.filter((candidate) =>
      pinnedNodeIdSet.has(candidate.nodeId),
    ),
    ...scoredCandidates.filter(
      (candidate) => !pinnedNodeIdSet.has(candidate.nodeId),
    ),
  ]
    .slice(0, limit)
    .sort(byScoreThenTitle);
  const currentEdges: GraphEdge[] = rankedCandidates.map((candidate) => ({
    id: `${center.nodeId}-${candidate.nodeId}`,
    source: center.nodeId,
    target: candidate.nodeId,
    reason:
      candidate.relationshipReason ??
      `두 대화 모두 ${candidate.matchedKeywords.slice(0, 3).join(', ')} 주제를 다룹니다.`,
    kind: 'current',
  }));
  const relatedEdges: GraphEdge[] = [];

  for (
    let firstIndex = 0;
    firstIndex < rankedCandidates.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < rankedCandidates.length;
      secondIndex += 1
    ) {
      const firstConversation = rankedCandidates[firstIndex];
      const secondConversation = rankedCandidates[secondIndex];
      const sharedKeywords = firstConversation.keywords.filter((keyword) =>
        secondConversation.keywords.some(
          (candidate) => normalize(candidate) === normalize(keyword),
        ),
      );

      if (sharedKeywords.length < 2) {
        continue;
      }

      const [source, target] = [
        firstConversation.nodeId,
        secondConversation.nodeId,
      ].sort();
      relatedEdges.push({
        id: `${source}-${target}`,
        source,
        target,
        reason: `두 대화 모두 ${sharedKeywords.slice(0, 3).join(', ')} 주제를 다룹니다.`,
        kind: 'related',
      });
    }
  }

  return {
    nodes: [
      {
        id: center.nodeId,
        chatId: center.chatId,
        label: center.title,
        type: 'current',
      },
      ...rankedCandidates.map((candidate) => ({
        id: candidate.nodeId,
        chatId: candidate.chatId,
        label: candidate.title,
        type: 'past' as const,
        relevanceScore: candidate.relevanceScore,
        relevanceTier: getRelevanceTier(candidate.relevanceScore),
      })),
    ],
    edges: [...currentEdges, ...relatedEdges],
  };
};

export const buildGraph = (
  prompt: string,
  chats: Chat[],
  limit = 5,
) =>
  buildFocusedGraph({
    center: {
      nodeId: 'current',
      chatId: null,
      title: 'Current prompt',
      text: prompt,
      keywords: [],
    },
    candidates: chats.map((chat) => ({
      nodeId: chat.id,
      chatId: chat.id,
      title: chat.title,
      text: [chat.title, chat.summary, ...chat.tags].join(' '),
      keywords: chat.keywords,
      relationshipReason: chat.relationshipReason,
    })),
    limit,
  });

export const generateDummyAnswer = (
  selectedCards: Pick<
    ContextCard,
    'id' | 'title' | 'summary' | 'sourceChatId'
  >[],
): GeneratedAnswer => {
  const usedContextTitles = selectedCards.map((card) => card.title);
  const usedContexts = selectedCards.map(({id, title, sourceChatId}) => ({
    id,
    title,
    sourceChatId,
  }));

  if (selectedCards.length === 0) {
    return {
      body: [
        '핵심 제안',
        '첨부된 맥락 없이 현재 대화만 기준으로 판단하면, 6주 베타의 범위와 위험 조건을 먼저 확정한 뒤 사용자 검증을 시작하는 것이 적합합니다.',
        '',
        '다음 행동',
        '고객 근거, 일정 제약, 성공 지표가 담긴 이전 대화를 첨부하면 Go/No-Go 결론과 실행안을 더 구체화할 수 있습니다.',
      ].join('\n'),
      usedContextTitles,
      usedContexts,
    };
  }

  const evidenceLines = selectedCards
    .map((card, index) => `${index + 1}. ${card.title}: ${card.summary}`)
    .join('\n');

  return {
    body: [
      '핵심 제안',
      `제한된 6주 베타로 진행하는 Go 결정을 권고합니다. ${usedContextTitles.join(', ')} 근거를 기준으로, 자동 기억보다 사용자가 필요한 과거 대화를 직접 첨부하고 출처를 확인하는 흐름에 범위를 집중해야 합니다.`,
      '',
      '근거',
      evidenceLines,
      '',
      '실행 순서',
      '1. 1~2주차: 관련 대화 추천, 추천 이유, 명시적 첨부와 제거를 완성합니다.',
      '2. 3~4주차: 답변 출처 이동, 권한 재검증, 현재 대화 중심 로컬 그래프를 연결합니다.',
      '3. 5~6주차: 3개 팀 파일럿을 운영하고 추천 정확도와 잘못된 맥락 첨부 사례를 조정합니다.',
      '',
      '성공 지표',
      '과거 맥락 탐색 시간 30% 감소, 주 2회 이상 맥락 재사용, 답변 출처 확인 가능, 잘못된 맥락 첨부율 10% 미만을 베타 통과 기준으로 둡니다.',
    ].join('\n'),
    usedContextTitles,
    usedContexts,
  };
};

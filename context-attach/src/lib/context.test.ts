import {describe, expect, it} from 'vitest';

import {
  chats as chatFixtures,
  contextCards as contextCardFixtures,
} from '../data/contextData';
import * as contextFixtures from '../data/contextData';

import {
  buildGraph,
  buildFocusedGraph,
  generateDummyAnswer,
  getRelevanceTier,
  rankChats,
  rankContextCards,
  toggleContextSelection,
} from './context';

const chats = [
  {
    id: 'proposal',
    title: '신규 협업 기능 제안서',
    date: '2026-06-01',
    tags: ['제안서', '협업'],
    summary: '협업 기능의 문제와 범위를 정리했다.',
    keywords: ['제안서', '협업', '기능', '고객'],
    relationshipReason: '제안서, 협업, 기능',
    messages: [
      {
        id: 'proposal-user',
        role: 'user' as const,
        body: '협업 기능의 범위를 정리해줘.',
        timestamp: '10:10',
      },
      {
        id: 'proposal-assistant',
        role: 'assistant' as const,
        body: '핵심 범위를 정리했습니다.',
        timestamp: '10:11',
      },
    ],
  },
  {
    id: 'design',
    title: '디자인 리뷰 피드백',
    date: '2026-06-02',
    tags: ['디자인'],
    summary: '화면 구성 피드백을 정리했다.',
    keywords: ['디자인', '피드백', 'ux'],
    relationshipReason: '화면 구성과 사용자 피드백이 연결됩니다.',
    messages: [
      {
        id: 'design-user',
        role: 'user' as const,
        body: '디자인 피드백을 정리해줘.',
        timestamp: '11:10',
      },
      {
        id: 'design-assistant',
        role: 'assistant' as const,
        body: '주요 피드백을 정리했습니다.',
        timestamp: '11:11',
      },
    ],
  },
];

const cards = [
  {
    id: 'customer',
    title: '고객 인터뷰 핵심 문제',
    sourceChatId: 'proposal',
    sourceChatTitle: '신규 협업 기능 제안서',
    summary: '고객은 업무 맥락을 다시 찾는 데 시간이 든다고 말했다.',
    reason: '제안서의 문제 정의로 활용 가능하다.',
    keywords: ['고객', '인터뷰', '협업', '제안서'],
    relevanceScore: 0,
  },
  {
    id: 'design-focus',
    title: '한 화면에서 보여야 할 정보',
    sourceChatId: 'design',
    sourceChatTitle: '디자인 리뷰 피드백',
    summary: '현재 상태와 다음 행동이 한 화면에 보여야 한다.',
    reason: '기능 설명의 UX 원칙으로 활용 가능하다.',
    keywords: ['디자인', '피드백', 'ux'],
    relevanceScore: 0,
  },
];

describe('context ranking', () => {
  it('ranks chats by prompt keyword overlap and limits visible graph candidates', () => {
    const ranked = rankChats('협업 기능 제안서 자동화', chats, 1);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({
      id: 'proposal',
      relevanceScore: 75,
      matchedKeywords: ['제안서', '협업', '기능'],
    });
  });

  it('filters context cards by an active graph node after scoring', () => {
    const ranked = rankContextCards({
      prompt: '디자인 피드백 UX',
      cards,
      activeChatId: 'design',
      limit: 5,
    });

    expect(ranked.map((card) => card.id)).toEqual(['design-focus']);
    expect(ranked[0].relevanceScore).toBe(100);
  });

  it('returns no recommendation when the prompt has no related keywords', () => {
    const ranked = rankContextCards({
      prompt: '완전히 다른 주제',
      cards,
    });

    expect(ranked).toEqual([]);
  });

  it('limits the default recommendation set to three items', () => {
    const repeatedCards = Array.from({length: 5}, (_, index) => ({
      ...cards[0],
      id: `customer-${index}`,
      title: `고객 맥락 ${index}`,
    }));

    const ranked = rankContextCards({
      prompt: '고객 인터뷰 협업 제안서',
      cards: repeatedCards,
    });

    expect(ranked).toHaveLength(3);
  });

  it('builds a current-centered graph with at most five past nodes', () => {
    const graph = buildGraph('협업 기능 제안서', chats, 5);

    expect(graph.nodes[0]).toMatchObject({id: 'current', type: 'current'});
    expect(graph.nodes.filter((node) => node.type === 'past')).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({
      source: 'current',
      target: 'proposal',
      reason: '제안서, 협업, 기능',
    });
    expect(graph.nodes[1]).toMatchObject({relevanceTier: 'high'});
  });

  it('ships a demo prompt that builds five meaningful graph connections', () => {
    const demoPrompt = (contextFixtures as {demoPrompt?: string}).demoPrompt;

    expect(demoPrompt).toBe(
      'AI 협업 브리프 기능의 베타 MVP 범위와 의사결정 기준을 정리해줘.',
    );

    const graph = buildGraph(demoPrompt ?? '', chatFixtures, 5);

    expect(graph.nodes.filter((node) => node.type === 'past')).toHaveLength(5);
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({id: 'feature-proposal'}),
    );
  });

  it('rebuilds the graph around a stored conversation and keeps the working chat navigable', () => {
    const graph = buildFocusedGraph({
      center: {
        nodeId: 'design',
        chatId: 'design',
        title: '디자인 리뷰 피드백',
        text: '디자인 협업 기능 피드백',
        keywords: ['디자인', '협업', '기능', '피드백'],
      },
      candidates: [
        {
          nodeId: 'design',
          chatId: 'design',
          title: '디자인 리뷰 피드백',
          text: '디자인 피드백',
          keywords: ['디자인', '피드백'],
        },
        {
          nodeId: 'proposal',
          chatId: 'proposal',
          title: '신규 협업 기능 제안서',
          text: '협업 기능 제안서',
          keywords: ['협업', '기능'],
        },
        {
          nodeId: 'current',
          chatId: null,
          title: '작성 중인 협업 기능 검토',
          text: '협업 기능 베타 검토',
          keywords: ['협업', '기능', '베타'],
        },
      ],
    });

    expect(graph.nodes[0]).toMatchObject({
      id: 'design',
      chatId: 'design',
      label: '디자인 리뷰 피드백',
      type: 'current',
    });
    expect(graph.nodes).not.toContainEqual(
      expect.objectContaining({id: 'design', type: 'past'}),
    );
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({id: 'current', chatId: null, type: 'past'}),
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({source: 'design', target: 'proposal'}),
        expect.objectContaining({source: 'design', target: 'current'}),
      ]),
    );
  });

  it('caps focused graphs at five related conversations', () => {
    const graph = buildFocusedGraph({
      center: {
        nodeId: 'current',
        chatId: null,
        title: '새 대화',
        text: '협업 기능',
        keywords: ['협업', '기능'],
      },
      candidates: Array.from({length: 7}, (_, index) => ({
        nodeId: `related-${index}`,
        chatId: `related-${index}`,
        title: `관련 대화 ${index}`,
        text: '협업 기능',
        keywords: ['협업', '기능'],
      })),
      limit: 5,
    });

    expect(graph.nodes.filter((node) => node.type === 'past')).toHaveLength(5);
  });

  it('reserves a related slot for a pinned working conversation', () => {
    const graph = buildFocusedGraph({
      center: {
        nodeId: 'stored-focus',
        chatId: 'stored-focus',
        title: '기존 대화',
        text: '협업 베타 의사결정',
        keywords: ['협업', '베타', '의사결정'],
      },
      candidates: [
        ...Array.from({length: 5}, (_, index) => ({
          nodeId: `strong-${index}`,
          chatId: `strong-${index}`,
          title: `강한 관련 대화 ${index}`,
          text: '협업',
          keywords: ['협업'],
        })),
        {
          nodeId: 'current',
          chatId: null,
          title: '작성 중인 대화',
          text: '협업 베타 기능 MVP',
          keywords: ['협업', '베타', '기능', 'MVP'],
        },
      ],
      pinnedNodeIds: ['current'],
      limit: 5,
    });

    expect(graph.nodes.filter((node) => node.type === 'past')).toHaveLength(5);
    expect(graph.nodes).toContainEqual(
      expect.objectContaining({id: 'current', chatId: null, type: 'past'}),
    );
  });

  it('connects related chats to each other when they share multiple topics', () => {
    const followUpChat = {
      ...chats[0],
      id: 'proposal-follow-up',
      title: '협업 기능 후속 검토',
      keywords: ['협업', '기능', '검토'],
      relationshipReason: '후속 검토 내용이 현재 요청과 연결됩니다.',
    };
    const graph = buildGraph('협업 기능', [chats[0], followUpChat]);

    expect(graph.edges).toContainEqual(
      expect.objectContaining({
        source: 'proposal',
        target: 'proposal-follow-up',
        kind: 'related',
      }),
    );
  });

  it('maps relevance scores to broad, readable tiers', () => {
    expect(getRelevanceTier(75)).toBe('high');
    expect(getRelevanceTier(40)).toBe('medium');
    expect(getRelevanceTier(0)).toBe('low');
  });

  it('toggles selected context ids without mutating the previous selection', () => {
    const initial = ['customer'];
    const attached = toggleContextSelection(initial, 'design-focus');
    const detached = toggleContextSelection(attached, 'customer');

    expect(initial).toEqual(['customer']);
    expect(attached).toEqual(['customer', 'design-focus']);
    expect(detached).toEqual(['design-focus']);
  });

  it('generates an answer with navigable provenance for every used context', () => {
    const answer = generateDummyAnswer(cards.slice(0, 1));

    expect(answer.body).toContain('고객 인터뷰 핵심 문제');
    expect(answer.usedContextTitles).toEqual(['고객 인터뷰 핵심 문제']);
    expect(answer.usedContexts).toEqual([
      {
        id: 'customer',
        title: '고객 인터뷰 핵심 문제',
        sourceChatId: 'proposal',
      },
    ]);
  });

  it('still answers when no context is attached and exposes no provenance', () => {
    const answer = generateDummyAnswer([]);

    expect(answer.body).toContain('첨부된 맥락 없이');
    expect(answer.usedContextTitles).toEqual([]);
    expect(answer.usedContexts).toEqual([]);
  });

  it('provides a usable transcript and relationship reason for every past chat', () => {
    expect(chatFixtures.length).toBeGreaterThanOrEqual(8);

    for (const chat of chatFixtures) {
      expect(chat.messages.length).toBeGreaterThanOrEqual(3);
      expect(chat.relationshipReason.length).toBeGreaterThan(0);
    }
  });

  it('provides diverse, source-valid context evidence with concrete metrics', () => {
    const sourceChatIds = new Set(chatFixtures.map((chat) => chat.id));
    const distinctDomains = new Set(chatFixtures.flatMap((chat) => chat.tags));
    const metricBearingCards = contextCardFixtures.filter((card) =>
      /\d/.test(card.summary),
    );

    expect(distinctDomains.size).toBeGreaterThanOrEqual(6);
    expect(contextCardFixtures.length).toBeGreaterThanOrEqual(8);
    expect(metricBearingCards.length).toBeGreaterThanOrEqual(4);

    for (const card of contextCardFixtures) {
      expect(sourceChatIds.has(card.sourceChatId)).toBe(true);
      expect(card.summary.length).toBeGreaterThan(45);
      expect(card.reason.length).toBeGreaterThan(35);
    }
  });

  it('generates a decision-ready answer with evidence and execution sections', () => {
    const answer = generateDummyAnswer(contextCardFixtures.slice(0, 3));

    expect(answer.body).toContain('핵심 제안');
    expect(answer.body).toContain('근거');
    expect(answer.body).toContain('실행 순서');
    expect(answer.body).toContain('성공 지표');
    expect(answer.body.split('\n').length).toBeGreaterThanOrEqual(7);
  });

  it('keeps rejected employment and finance application topics out of fixtures', () => {
    const serializedFixtures = JSON.stringify({
      chats: chatFixtures,
      contextCards: contextCardFixtures,
    });
    const rejectedPhrases = [
      'ABL생명',
      '동양생명',
      '자기소개서',
      '금융권 지원동기',
      'AI 숏폼',
      'LLM 채팅 UX 과제',
    ];

    for (const phrase of rejectedPhrases) {
      expect(serializedFixtures).not.toContain(phrase);
    }
  });
});

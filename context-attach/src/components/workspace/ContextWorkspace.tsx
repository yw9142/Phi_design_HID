'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {AppShell} from '@astryxdesign/core/AppShell';

import {
  chats,
  contextCards,
  initialFollowUp,
  initialPrompt,
  initialTitle,
} from '@/data/contextData';
import {
  buildFocusedGraph,
  generateDummyAnswer,
  rankChats,
  rankContextCards,
  toggleContextSelection,
  type GraphConversation,
  type RankedChat,
} from '@/lib/context';

import {
  ConversationPanel,
  type AnswerTurn,
} from './ConversationPanel';
import {ConversationSidebar} from './ConversationSidebar';
import {ContextGraphPanel} from './ContextGraphPanel';

const deriveConversationTitle = (prompt: string) => {
  const normalized = prompt.replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
  return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized;
};

const graphKeywordCorpus = Array.from(
  new Set(chats.flatMap((chat) => chat.keywords)),
);

const storedGraphConversations: GraphConversation[] = chats.map((chat) => ({
  nodeId: chat.id,
  chatId: chat.id,
  title: chat.title,
  text: [
    chat.title,
    chat.summary,
    ...chat.tags,
    ...chat.keywords,
    ...chat.messages.map((message) => message.body),
  ].join(' '),
  keywords: chat.keywords,
  relationshipReason: chat.relationshipReason,
}));

const storedGraphConversationById = new Map(
  storedGraphConversations.map((conversation) => [
    conversation.nodeId,
    conversation,
  ]),
);

const getWorkingGraphKeywords = (prompt: string) => {
  const normalizedPrompt = prompt.toLocaleLowerCase('ko-KR');

  return graphKeywordCorpus.filter((keyword) =>
    normalizedPrompt.includes(keyword.toLocaleLowerCase('ko-KR')),
  );
};

export function ContextWorkspace() {
  const [rootPrompt, setRootPrompt] = useState(initialPrompt);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [analysisPrompt, setAnalysisPrompt] = useState(initialPrompt);
  const [draft, setDraft] = useState(initialFollowUp);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
  const [answerTurns, setAnswerTurns] = useState<AnswerTurn[]>([]);
  const [viewedChatId, setViewedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    const wideViewport = window.matchMedia('(min-width: 1181px)');
    const syncGraphToViewport = (matches: boolean) => {
      setIsGraphOpen(matches);
      if (!matches) {
        setIsGraphExpanded(false);
      }
    };
    const handleViewportChange = (event: MediaQueryListEvent) => {
      syncGraphToViewport(event.matches);
    };

    syncGraphToViewport(wideViewport.matches);
    wideViewport.addEventListener('change', handleViewportChange);

    return () => {
      wideViewport.removeEventListener('change', handleViewportChange);
    };
  }, []);

  const rankedContextCards = useMemo(
    () =>
      analysisPrompt
        ? rankContextCards({prompt: analysisPrompt, cards: contextCards})
        : [],
    [analysisPrompt],
  );

  const rankedChats = useMemo(() => {
    const ranked = rankChats(analysisPrompt, chats, chats.length);
    const rankingById = new Map(ranked.map((chat) => [chat.id, chat]));
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR');

    return chats
      .map(
        (chat) =>
          rankingById.get(chat.id) ??
          ({
            ...chat,
            relevanceScore: 0,
            matchedKeywords: [],
          } satisfies RankedChat),
      )
      .filter((chat) => {
        if (!normalizedQuery) {
          return true;
        }

        return [chat.title, chat.summary, ...chat.tags]
          .join(' ')
          .toLocaleLowerCase('ko-KR')
          .includes(normalizedQuery);
      });
  }, [analysisPrompt, searchQuery]);

  const selectedCards = useMemo(
    () => contextCards.filter((card) => selectedContextIds.includes(card.id)),
    [selectedContextIds],
  );
  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === viewedChatId) ?? null,
    [viewedChatId],
  );
  const workingGraphConversation = useMemo<GraphConversation>(
    () => ({
      nodeId: 'current',
      chatId: null,
      title: currentTitle,
      text: analysisPrompt,
      keywords: getWorkingGraphKeywords(analysisPrompt),
      relationshipReason:
        '현재 작성 중인 대화와 같은 주제를 이어서 다루고 있습니다.',
    }),
    [analysisPrompt, currentTitle],
  );
  const graph = useMemo(() => {
    const focusedGraphConversation = activeChat
      ? (storedGraphConversationById.get(activeChat.id) ??
        workingGraphConversation)
      : workingGraphConversation;
    const candidates = activeChat
      ? [
          ...storedGraphConversations.map((conversation) => ({
            ...conversation,
            relationshipReason: undefined,
          })),
          ...(rootPrompt ? [workingGraphConversation] : []),
        ]
      : storedGraphConversations;

    return buildFocusedGraph({
      center: focusedGraphConversation,
      candidates,
      pinnedNodeIds: activeChat ? ['current'] : [],
    });
  }, [activeChat, rootPrompt, workingGraphConversation]);
  const activeChatContext = useMemo(
    () => contextCards.find((card) => card.sourceChatId === viewedChatId) ?? null,
    [viewedChatId],
  );

  const handleToggleContext = useCallback((contextId: string) => {
    setSelectedContextIds((current) =>
      toggleContextSelection(current, contextId),
    );
  }, []);

  const handleAnalyze = useCallback(() => {
    const prompt = draft.trim() || rootPrompt.trim();

    if (!prompt || isAnalyzing || isGenerating) {
      return;
    }

    setIsAnalyzing(true);
    schedule(() => {
      setAnalysisPrompt(prompt);
      setIsAnalyzing(false);
    }, 520);
  }, [draft, isAnalyzing, isGenerating, rootPrompt, schedule]);

  const handleSubmit = useCallback(
    (value: string) => {
      const prompt = value.trim();

      if (!prompt || isAnalyzing || isGenerating) {
        return;
      }

      setDraft('');

      if (!rootPrompt) {
        setRootPrompt(prompt);
        setCurrentTitle(deriveConversationTitle(prompt));
        setIsAnalyzing(true);
        schedule(() => {
          setAnalysisPrompt(prompt);
          setIsAnalyzing(false);
        }, 620);
        return;
      }

      const contextSnapshot = [...selectedCards];
      setIsGenerating(true);
      schedule(() => {
        setAnswerTurns((current) => [
          ...current,
          {
            id: `answer-${Date.now()}`,
            prompt,
            answer: generateDummyAnswer(contextSnapshot),
          },
        ]);
        setIsGenerating(false);
      }, 680);
    }, [isAnalyzing, isGenerating, rootPrompt, schedule, selectedCards],
  );

  const handleNewChat = useCallback(() => {
    clearTimers();
    setRootPrompt('');
    setCurrentTitle('새 대화');
    setAnalysisPrompt('');
    setDraft('');
    setSelectedContextIds([]);
    setAnswerTurns([]);
    setViewedChatId(null);
    setIsAnalyzing(false);
    setIsGenerating(false);
    setIsGraphExpanded(false);
  }, [clearTimers]);

  const handleOpenChat = useCallback((chatId: string | null) => {
    setViewedChatId(chatId);
  }, []);

  const handleGraphNodeSelect = useCallback((chatId: string | null) => {
    setViewedChatId(chatId);
    if (window.matchMedia('(max-width: 1180px)').matches) {
      setIsGraphOpen(false);
    }
  }, []);

  const handleToggleActiveChatContext = useCallback(() => {
    if (activeChatContext) {
      handleToggleContext(activeChatContext.id);
    }
  }, [activeChatContext, handleToggleContext]);

  return (
    <AppShell
      className="contextAppShell"
      variant="section"
      height="fill"
      contentPadding={0}
      mobileNav={{hasToggle: false, breakpoint: 'md'}}
      sideNav={
        <ConversationSidebar
          chats={rankedChats}
          query={searchQuery}
          viewedChatId={viewedChatId}
          currentTitle={currentTitle}
          hasCurrentConversation={Boolean(rootPrompt)}
          onQueryChange={setSearchQuery}
          onNewChat={handleNewChat}
          onSelectChat={handleOpenChat}
        />
      }>
      <div
        className={[
          'workspaceMain',
          isGraphOpen ? 'workspaceMainWithGraph' : 'workspaceMainWithoutGraph',
          isGraphExpanded ? 'workspaceMainGraphExpanded' : '',
        ]
          .filter(Boolean)
          .join(' ')}>
        <ConversationPanel
          activeChat={activeChat}
          currentTitle={currentTitle}
          rootPrompt={rootPrompt}
          draft={draft}
          recommendations={rankedContextCards}
          selectedCards={selectedCards}
          selectedContextIds={selectedContextIds}
          answerTurns={answerTurns}
          isAnalyzing={isAnalyzing}
          isGenerating={isGenerating}
          isGraphOpen={isGraphOpen}
          activeChatContext={activeChatContext}
          onDraftChange={setDraft}
          onAnalyze={handleAnalyze}
          onSubmit={handleSubmit}
          onToggleContext={handleToggleContext}
          onToggleActiveChatContext={handleToggleActiveChatContext}
          onOpenSource={(chatId) => setViewedChatId(chatId)}
          onReturnToCurrent={() => setViewedChatId(null)}
          onToggleGraph={() => setIsGraphOpen((current) => !current)}
        />

        <ContextGraphPanel
          graph={graph}
          chats={chats}
          viewedChatId={viewedChatId}
          isExpanded={isGraphExpanded}
          isOpen={isGraphOpen}
          onNodeSelect={handleGraphNodeSelect}
          onExpandedChange={setIsGraphExpanded}
          onClose={() => setIsGraphOpen(false)}
        />
      </div>
    </AppShell>
  );
}

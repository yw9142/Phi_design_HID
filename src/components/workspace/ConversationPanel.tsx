'use client';

import {
  ArrowLeft,
  Check,
  History,
  LoaderCircle,
  Network,
  Paperclip,
  Search,
  Sparkles,
} from 'lucide-react';

import {useAppShellMobile} from '@astryxdesign/core/AppShell';
import {Button} from '@astryxdesign/core/Button';
import {
  ChatComposer,
  ChatComposerDrawer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatSendButton,
} from '@astryxdesign/core/Chat';
import {Heading} from '@astryxdesign/core/Heading';
import {Icon} from '@astryxdesign/core/Icon';
import {Text} from '@astryxdesign/core/Text';
import {Token} from '@astryxdesign/core/Token';

import {demoPrompt} from '@/data/contextData';
import type {
  Chat,
  ContextCard,
  GeneratedAnswer,
  RankedContextCard,
} from '@/lib/context';

import {ContextRecommendationList} from './ContextRecommendationList';

export type AnswerTurn = {
  id: string;
  prompt: string;
  answer: GeneratedAnswer;
};

type ConversationPanelProps = {
  activeChat: Chat | null;
  currentTitle: string;
  rootPrompt: string;
  draft: string;
  recommendations: RankedContextCard[];
  selectedCards: ContextCard[];
  activeChatContext: ContextCard | null;
  selectedContextIds: string[];
  answerTurns: AnswerTurn[];
  isAnalyzing: boolean;
  isGenerating: boolean;
  isGraphOpen: boolean;
  onDraftChange: (value: string) => void;
  onAnalyze: () => void;
  onSubmit: (value: string) => void;
  onToggleContext: (contextId: string) => void;
  onToggleActiveChatContext: () => void;
  onOpenSource: (chatId: string) => void;
  onReturnToCurrent: () => void;
  onToggleGraph: () => void;
};

function AssistantAvatar() {
  return (
    <span className="messageAvatar assistantMessageAvatar" aria-hidden="true">
      <Icon icon={Sparkles} size="sm" color="inherit" />
    </span>
  );
}

function UserAvatar() {
  return (
    <span className="messageAvatar userMessageAvatar" aria-hidden="true">
      Y
    </span>
  );
}

function SourceButtons({
  answer,
  onOpenSource,
}: {
  answer: GeneratedAnswer;
  onOpenSource: (chatId: string) => void;
}) {
  if (answer.usedContexts.length === 0) {
    return null;
  }

  return (
    <div className="answerSources" aria-label="답변에 사용된 맥락">
      <Text type="supporting" weight="semibold" as="p">
        참고한 맥락
      </Text>
      <div className="sourceButtons">
        {answer.usedContexts.map((context, index) => (
          <button
            key={context.id}
            type="button"
            className="answerSourceButton"
            onClick={() => onOpenSource(context.sourceChatId)}>
            <span>{index + 1}</span>
            {context.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function CurrentConversation({
  rootPrompt,
  recommendations,
  selectedContextIds,
  answerTurns,
  isAnalyzing,
  isGenerating,
  onToggleContext,
  onOpenSource,
  onDraftChange,
}: Pick<
  ConversationPanelProps,
  | 'rootPrompt'
  | 'recommendations'
  | 'selectedContextIds'
  | 'answerTurns'
  | 'isAnalyzing'
  | 'isGenerating'
  | 'onToggleContext'
  | 'onOpenSource'
  | 'onDraftChange'
>) {
  if (!rootPrompt) {
    return (
      <div className="chatEmptyState">
        <span className="emptyStateIcon" aria-hidden="true">
          <Icon icon={Sparkles} size="lg" color="accent" />
        </span>
        <Heading level={2}>무엇을 이어서 작업할까요?</Heading>
        <Text type="body" color="secondary" as="p">
          첫 질문을 보내면 관련된 이전 대화를 찾아 첨부할 수 있게 제안합니다.
        </Text>
        <div className="demoPrompt">
          <Text type="supporting" weight="semibold" as="p">
            데모로 시작하기
          </Text>
          <Text type="body" as="p">{demoPrompt}</Text>
          <Button
            label="예시 질문 넣기"
            variant="secondary"
            size="sm"
            icon={<Icon icon={Sparkles} size="sm" />}
            onClick={() => onDraftChange(demoPrompt)}
          />
        </div>
      </div>
    );
  }

  return (
    <ChatMessageList
      className="conversationMessages"
      density="balanced"
      gap={5}
      isStreaming={isGenerating}>
      <ChatMessage sender="user" avatar={<UserAvatar />}>
        <ChatMessageBubble metadata={<Text type="supporting">오후 3:24</Text>}>
          {rootPrompt}
        </ChatMessageBubble>
      </ChatMessage>

      {isAnalyzing ? (
        <ChatMessage sender="assistant" avatar={<AssistantAvatar />}>
          <ChatMessageBubble variant="ghost">
            <div className="assistantStatus" role="status">
              <Icon className="spinIcon" icon={LoaderCircle} size="sm" color="accent" />
              <Text type="body">관련 대화에서 이어질 맥락을 찾고 있습니다.</Text>
            </div>
          </ChatMessageBubble>
        </ChatMessage>
      ) : (
        <ChatMessage sender="assistant" avatar={<AssistantAvatar />}>
          <ChatMessageBubble
            variant="ghost"
            metadata={<Text type="supporting">대화 내용과 주제의 연결을 기준으로 추천</Text>}>
            <ContextRecommendationList
              cards={recommendations}
              selectedIds={selectedContextIds}
              onToggle={onToggleContext}
              onOpenSource={onOpenSource}
            />
          </ChatMessageBubble>
        </ChatMessage>
      )}

      {answerTurns.map((turn) => (
        <div className="answerTurn" key={turn.id}>
          <ChatMessage sender="user" avatar={<UserAvatar />}>
            <ChatMessageBubble>{turn.prompt}</ChatMessageBubble>
          </ChatMessage>
          <ChatMessage sender="assistant" avatar={<AssistantAvatar />}>
            <ChatMessageBubble variant="ghost">
              <div className="assistantAnswer">
                <Text type="body" as="p">{turn.answer.body}</Text>
                <SourceButtons answer={turn.answer} onOpenSource={onOpenSource} />
              </div>
            </ChatMessageBubble>
          </ChatMessage>
        </div>
      ))}

      {isGenerating ? (
        <ChatMessage sender="assistant" avatar={<AssistantAvatar />}>
          <ChatMessageBubble variant="ghost">
            <div className="assistantStatus" role="status">
              <Icon className="spinIcon" icon={LoaderCircle} size="sm" color="accent" />
              <Text type="body">첨부된 맥락을 읽고 답변을 구성하고 있습니다.</Text>
            </div>
          </ChatMessageBubble>
        </ChatMessage>
      ) : null}
    </ChatMessageList>
  );
}

function PastConversation({chat}: {chat: Chat}) {
  return (
    <ChatMessageList
      className="conversationMessages pastConversationMessages"
      density="balanced"
      gap={5}>
      <div className="pastConversationIntro">
        <Text type="supporting" as="p">{chat.date}</Text>
        <Text type="body" color="secondary" as="p">{chat.summary}</Text>
      </div>
      {chat.messages.map((message) => (
        <ChatMessage
          key={message.id}
          sender={message.role}
          avatar={message.role === 'assistant' ? <AssistantAvatar /> : <UserAvatar />}>
          <ChatMessageBubble
            variant={message.role === 'assistant' ? 'ghost' : 'filled'}
            metadata={<Text type="supporting">{message.timestamp}</Text>}>
            {message.body}
          </ChatMessageBubble>
        </ChatMessage>
      ))}
    </ChatMessageList>
  );
}

export function ConversationPanel({
  activeChat,
  currentTitle,
  rootPrompt,
  draft,
  recommendations,
  selectedCards,
  activeChatContext,
  selectedContextIds,
  answerTurns,
  isAnalyzing,
  isGenerating,
  isGraphOpen,
  onDraftChange,
  onAnalyze,
  onSubmit,
  onToggleContext,
  onToggleActiveChatContext,
  onOpenSource,
  onReturnToCurrent,
  onToggleGraph,
}: ConversationPanelProps) {
  const {isMobile, openMobileNav} = useAppShellMobile();
  const isActiveChatContextSelected = activeChatContext
    ? selectedContextIds.includes(activeChatContext.id)
    : false;
  const busy = isAnalyzing || isGenerating;
  const title = activeChat?.title ?? currentTitle;

  const composer = activeChat ? (
    <div className="pastChatDock">
      <div>
        <Text type="label" as="p">이전 대화를 보고 있습니다</Text>
        <Text type="supporting" as="p">현재 대화의 작성 내용과 첨부 맥락은 그대로 유지됩니다.</Text>
      </div>
      <div className="pastChatActions">
        <Button
          label={isActiveChatContextSelected ? '맥락 첨부 해제' : '이 대화의 맥락 첨부'}
          variant={isActiveChatContextSelected ? 'secondary' : 'primary'}
          size="sm"
          icon={<Icon icon={isActiveChatContextSelected ? Check : Paperclip} size="sm" />}
          isDisabled={!activeChatContext}
          onClick={onToggleActiveChatContext}
        />
        <Button
          label="현재 대화로 돌아가기"
          variant="secondary"
          size="sm"
          icon={<Icon icon={ArrowLeft} size="sm" />}
          onClick={onReturnToCurrent}
        />
      </div>
    </div>
  ) : (
    <div className="composerWrap">
      <ChatComposer
        className="conversationComposer"
        value={draft}
        onChange={onDraftChange}
        onSubmit={onSubmit}
        placeholder={rootPrompt ? '첨부한 맥락을 바탕으로 질문하세요' : '새 질문을 입력하세요'}
        isDisabled={busy}
        density="balanced"
        drawer={
          selectedCards.length > 0 ? (
            <ChatComposerDrawer count={selectedCards.length} label="첨부된 맥락">
              <div className="attachedContexts">
                {selectedCards.map((card) => (
                  <Token
                    key={card.id}
                    label={card.title}
                    color="blue"
                    size="sm"
                    description={`${card.sourceChatTitle}에서 첨부됨`}
                    onClick={() => onOpenSource(card.sourceChatId)}
                    onRemove={() => onToggleContext(card.id)}
                  />
                ))}
              </div>
            </ChatComposerDrawer>
          ) : undefined
        }
        footerActions={
          <Button
            label="관련 맥락 찾기"
            variant="ghost"
            size="sm"
            icon={<Icon icon={Search} size="sm" />}
            isDisabled={!draft.trim() && !rootPrompt}
            onClick={onAnalyze}
          />
        }
        headerContext={
          busy ? (
            <span className="composerBusy" role="status">
              <Icon className="spinIcon" icon={LoaderCircle} size="xsm" />
              처리 중
            </span>
          ) : selectedCards.length > 0 ? (
            <Text type="supporting">맥락 {selectedCards.length}개 사용</Text>
          ) : null
        }
        sendButton={<ChatSendButton isDisabled={!draft.trim() || busy} />}
      />
      <Text className="composerHint" type="supporting" as="p">
        첨부한 대화만 답변 맥락으로 사용됩니다.
      </Text>
    </div>
  );

  return (
    <section className="conversationPanel" aria-label="채팅">
      <header className="conversationHeader">
        <div className="conversationHeaderStart">
          {isMobile ? (
            <Button
              label="대화 기록 열기"
              variant="ghost"
              size="sm"
              isIconOnly
              icon={<Icon icon={History} size="md" />}
              tooltip="대화 기록"
              onClick={openMobileNav}
            />
          ) : null}
          {activeChat ? (
            <Button
              label="현재 대화로 돌아가기"
              variant="ghost"
              size="sm"
              isIconOnly
              icon={<Icon icon={ArrowLeft} size="md" />}
              tooltip="현재 대화로 돌아가기"
              onClick={onReturnToCurrent}
            />
          ) : null}
          <div className="conversationTitle">
            <Heading level={1} maxLines={1}>{title}</Heading>
            <Text type="supporting">
              {activeChat ? '이전 대화' : selectedCards.length > 0 ? `맥락 ${selectedCards.length}개 첨부됨` : '개인 작업공간'}
            </Text>
          </div>
        </div>

        <Button
          label={isGraphOpen ? '컨텍스트 맵 닫기' : '컨텍스트 맵 열기'}
          variant={isGraphOpen ? 'secondary' : 'ghost'}
          size="sm"
          isIconOnly
          icon={<Icon icon={Network} size="md" color={isGraphOpen ? 'accent' : 'primary'} />}
          tooltip={isGraphOpen ? '컨텍스트 맵 닫기' : '컨텍스트 맵 열기'}
          onClick={onToggleGraph}
        />
      </header>

      <ChatLayout className="chatLayout" density="balanced" composer={composer}>
        {activeChat ? (
          <PastConversation chat={activeChat} />
        ) : (
          <CurrentConversation
            rootPrompt={rootPrompt}
            recommendations={recommendations}
            selectedContextIds={selectedContextIds}
            answerTurns={answerTurns}
            isAnalyzing={isAnalyzing}
            isGenerating={isGenerating}
            onToggleContext={onToggleContext}
            onOpenSource={onOpenSource}
            onDraftChange={onDraftChange}
          />
        )}
      </ChatLayout>
    </section>
  );
}

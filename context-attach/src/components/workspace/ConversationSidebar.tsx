'use client';

import {MessageSquarePlus, Search, Sparkles} from 'lucide-react';

import {useAppShellMobile} from '@astryxdesign/core/AppShell';
import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from '@astryxdesign/core/SideNav';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';

import type {RankedChat} from '@/lib/context';

type ConversationSidebarProps = {
  chats: RankedChat[];
  query: string;
  viewedChatId: string | null;
  currentTitle: string;
  hasCurrentConversation: boolean;
  onQueryChange: (value: string) => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string | null) => void;
};

const relativeDates = [
  '2시간 전',
  '어제',
  '2일 전',
  '3일 전',
  '5일 전',
  '지난주',
  '2주 전',
  '2주 전',
  '3주 전',
];

export function ConversationSidebar({
  chats,
  query,
  viewedChatId,
  currentTitle,
  hasCurrentConversation,
  onQueryChange,
  onNewChat,
  onSelectChat,
}: ConversationSidebarProps) {
  const {closeMobileNav} = useAppShellMobile();
  const handleNewChat = () => {
    onNewChat();
    closeMobileNav();
  };
  const handleSelectChat = (chatId: string | null) => {
    onSelectChat(chatId);
    closeMobileNav();
  };

  return (
    <SideNav
      className="conversationSidebar"
      header={
        <SideNavHeading
          heading="Context"
          icon={<span className="brandMark" aria-hidden="true">C</span>}
        />
      }
      topContent={
        <div className="sidebarActions">
          <Button
            label="새 대화"
            variant="secondary"
            size="sm"
            icon={<Icon icon={MessageSquarePlus} size="sm" />}
            onClick={handleNewChat}
          />
          <TextInput
            label="대화 검색"
            isLabelHidden
            value={query}
            placeholder="대화 검색"
            startIcon={<Icon icon={Search} size="sm" color="secondary" />}
            hasClear
            width="100%"
            onChange={onQueryChange}
          />
        </div>
      }
      collapsible={{buttonLabel: '대화 목록 접기'}}
      resizable={{defaultWidth: 264, minWidth: 224, maxWidth: 340}}>
      <SideNavSection title="작업 중">
        <SideNavItem
          label={currentTitle}
          icon={Sparkles}
          isSelected={viewedChatId === null}
          onClick={() => handleSelectChat(null)}
          endContent={
            hasCurrentConversation ? (
              <Text type="supporting" color="primary">현재</Text>
            ) : null
          }
        />
      </SideNavSection>

      <SideNavSection
        title="최근 대화"
        subtitle={query ? `${chats.length}개 검색됨` : undefined}>
        {chats.length > 0 ? (
          chats.map((chat, index) => (
            <SideNavItem
              key={chat.id}
              label={chat.title}
              isSelected={viewedChatId === chat.id}
              onClick={() => handleSelectChat(chat.id)}
              endContent={
                <span className="sidebarItemMeta">
                  {chat.relevanceScore > 0 ? (
                    <span className="relatedSignal">관련</span>
                  ) : null}
                  <Text type="supporting">
                    {relativeDates[index] ?? chat.date}
                  </Text>
                </span>
              }
            />
          ))
        ) : (
          <Text className="sidebarEmpty" type="supporting" as="p">
            일치하는 대화가 없습니다.
          </Text>
        )}
      </SideNavSection>
    </SideNav>
  );
}

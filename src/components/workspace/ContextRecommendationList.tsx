'use client';

import {Check, FileText, Plus, Sparkles} from 'lucide-react';

import {Button} from '@astryxdesign/core/Button';
import {Icon} from '@astryxdesign/core/Icon';
import {Item} from '@astryxdesign/core/Item';
import {Text} from '@astryxdesign/core/Text';

import {getRelevanceTier, type RankedContextCard} from '@/lib/context';

type ContextRecommendationListProps = {
  cards: RankedContextCard[];
  selectedIds: string[];
  onToggle: (contextId: string) => void;
  onOpenSource: (chatId: string) => void;
};

const tierLabels = {
  high: '높은 관련성',
  medium: '관련 있음',
  low: '참고 가능',
};

export function ContextRecommendationList({
  cards,
  selectedIds,
  onToggle,
  onOpenSource,
}: ContextRecommendationListProps) {
  if (cards.length === 0) {
    return (
      <div className="recommendationEmpty">
        <Icon icon={Sparkles} size="sm" color="secondary" />
        <Text type="supporting" as="p">
          이 요청과 직접 연결되는 이전 대화를 찾지 못했습니다.
        </Text>
      </div>
    );
  }

  return (
    <section className="recommendationBlock" aria-labelledby="recommendation-title">
      <header className="recommendationHeader">
        <span className="sectionIcon" aria-hidden="true">
          <Icon icon={Sparkles} size="sm" color="accent" />
        </span>
        <div>
          <Text id="recommendation-title" type="label" as="p">
            이어서 쓰기 좋은 맥락
          </Text>
          <Text type="supporting" as="p">
            이전 대화에서 현재 요청과 연결되는 내용만 골랐습니다.
          </Text>
        </div>
      </header>

      <div className="recommendationRows">
        {cards.map((card, index) => {
          const isSelected = selectedIds.includes(card.id);
          const tier = getRelevanceTier(card.relevanceScore);

          return (
            <Item
              key={card.id}
              className="recommendationRow"
              align="start"
              density="spacious"
              data-selected={isSelected ? 'true' : undefined}
              startContent={
                <span className="contextRank" aria-hidden="true">
                  {index + 1}
                </span>
              }
              label={
                <span className="recommendationLabel">
                  <Text className="recommendationTitle" type="label">
                    {card.title}
                  </Text>
                  <span className={`relevanceLabel relevanceLabel-${tier}`}>
                    {tierLabels[tier]}
                  </span>
                </span>
              }
              description={
                <span className="recommendationDescription">
                  <Text type="body" as="span">{card.summary}</Text>
                  <span className="recommendationReason">
                    <Text type="supporting" color="secondary">
                      추천 이유 · {card.reason}
                    </Text>
                  </span>
                  <button
                    type="button"
                    className="sourceChatLink"
                    onClick={() => onOpenSource(card.sourceChatId)}>
                    <Icon icon={FileText} size="xsm" />
                    {card.sourceChatTitle}
                  </button>
                </span>
              }
              endContent={
                <Button
                  label={isSelected ? '첨부됨' : '첨부'}
                  variant={isSelected ? 'secondary' : 'ghost'}
                  size="sm"
                  icon={<Icon icon={isSelected ? Check : Plus} size="sm" />}
                  onClick={() => onToggle(card.id)}
                />
              }
            />
          );
        })}
      </div>
    </section>
  );
}

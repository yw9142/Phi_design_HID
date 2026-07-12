import {readFileSync} from 'node:fs';

import {describe, expect, it} from 'vitest';

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
const recommendationSource = readFileSync(
  new URL('../components/workspace/ContextRecommendationList.tsx', import.meta.url),
  'utf8',
);
const graphSource = readFileSync(
  new URL('../components/workspace/ContextGraphPanel.tsx', import.meta.url),
  'utf8',
);
const workspaceSource = readFileSync(
  new URL('../components/workspace/ContextWorkspace.tsx', import.meta.url),
  'utf8',
);
const conversationSource = readFileSync(
  new URL('../components/workspace/ConversationPanel.tsx', import.meta.url),
  'utf8',
);

const getRuleBody = (selector: string) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};

describe('knowledge graph hover styles', () => {
  it('keeps the node hit area stationary while hovered', () => {
    const hoverRule = getRuleBody('.knowledgeNodeButton:hover');

    expect(hoverRule).not.toMatch(/\btransform\s*:/);
  });

  it('keeps the collapsed scroll control icon-only', () => {
    const labelRule = getRuleBody(
      ".chatLayout button[aria-label='Scroll to bottom'] > span:first-child > span:last-child",
    );

    expect(labelRule).toMatch(/display\s*:\s*none/);
  });

  it('does not apply aria-selected to a non-selectable recommendation row', () => {
    expect(recommendationSource).not.toContain('isSelected={isSelected}');
    expect(recommendationSource).toContain(
      "data-selected={isSelected ? 'true' : undefined}",
    );
  });

  it('gives attached-context actions a 24px minimum hit area', () => {
    const tokenButtonRule = getRuleBody('.attachedContexts .astryx-token > button');
    const removeButtonRule = getRuleBody(
      '.attachedContexts .astryx-token > button:last-child',
    );

    expect(tokenButtonRule).toMatch(/min-block-size\s*:\s*1\.5rem/);
    expect(removeButtonRule).toMatch(/min-inline-size\s*:\s*1\.5rem/);
  });

  it('keeps source links readable on a selected recommendation', () => {
    const selectedLinkRule = getRuleBody(
      ".recommendationRow[data-selected='true'] .sourceChatLink",
    );

    expect(selectedLinkRule).toMatch(/color\s*:\s*var\(--color-text-blue\)/);
  });

  it('keeps transient hover out of the controlled React Flow model', () => {
    expect(graphSource).not.toContain('hoveredNodeId');
    expect(graphSource).not.toContain('onMouseEnter');
    expect(graphSource).not.toContain('onMouseLeave');
    expect(graphSource).not.toContain('onHover:');
  });

  it('keeps node dimensions initialized while React Flow updates the model', () => {
    expect(graphSource).toContain('initialWidth: NODE_WIDTH');
    expect(graphSource).toContain('initialHeight: CURRENT_NODE_HEIGHT');
    expect(graphSource).toContain('initialHeight: RELATED_NODE_HEIGHT');
  });

  it('memoizes the controlled node and edge arrays', () => {
    expect(graphSource).toContain('const nodes = useMemo<ContextFlowNode[]>');
    expect(graphSource).toContain('const edges = useMemo<Edge[]>');
  });

  it('derives the graph from the conversation currently shown in the workspace', () => {
    expect(workspaceSource).toContain('buildFocusedGraph');
    expect(workspaceSource).toContain(
      'const focusedGraphConversation = activeChat',
    );
    expect(workspaceSource).not.toContain(
      '() => buildGraph(analysisPrompt, chats)',
    );
  });

  it('keeps the working conversation available from a stored-chat graph', () => {
    expect(workspaceSource).toContain(
      'const workingGraphConversation = useMemo<GraphConversation>',
    );
    expect(workspaceSource).toContain(
      '...(rootPrompt ? [workingGraphConversation] : [])',
    );
    expect(workspaceSource).toContain(
      "pinnedNodeIds: activeChat ? ['current'] : []",
    );
  });

  it('renders the focused conversation as the graph center', () => {
    expect(graphSource).toContain('chatId: graphModel.currentNode.chatId');
    expect(graphSource).toContain('label: graphModel.currentNode.label');
    expect(graphSource).toContain('chatId: node.chatId');
    expect(graphSource).toContain('보고 있는 대화 기준 · 연결');
  });

  it('does not dim every related node when a stored conversation is centered', () => {
    expect(graphSource).not.toContain(
      'isDimmed: Boolean(viewedChatId && viewedChatId !== node.id)',
    );
    expect(graphSource).toContain('selected: true');
  });

  it('keeps the center node accessible name aligned with its visible label', () => {
    expect(graphSource).not.toContain('`${data.label}, 현재 보고 있음`');
  });

  it('fills the new-chat composer with a demo prompt without submitting it', () => {
    expect(conversationSource).toContain('label="예시 질문 넣기"');
    expect(conversationSource).toContain(
      'onClick={() => onDraftChange(demoPrompt)}',
    );
    expect(conversationSource).not.toContain('onSubmit(demoPrompt)');
  });
});

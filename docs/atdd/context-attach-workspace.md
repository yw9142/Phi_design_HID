# Feature: Context Attach Workspace

## Background / Policy

- Recommendations are derived from the latest analyzed prompt.
- The initial result shows at most three context recommendations.
- The local graph shows the current conversation plus at most five related past chats.
- The local graph is centered on the conversation currently shown in the main pane.
- Context selection is explicit and reversible.
- A generated answer must expose the selected contexts it used.
- Opening a past chat must not destroy the current draft or attached contexts.

## Scenario 1: Analyze a prompt and recommend related chats

- Given the user is in the current conversation with a non-empty prompt
- When the user activates `관련 맥락 찾기`
- Then an analyzing status appears immediately
- And the recommendation result updates within the conversation
- And no more than three recommendation rows are visible
- And each row includes a source title and a relevance reason

## Scenario 2: Attach and detach recommended context

- Given recommendation rows are visible
- When the user activates `첨부` on one recommendation
- Then that row displays an attached state
- And a removable source token appears in the composer
- When the user removes the source token
- Then the row and composer both return to the unselected state

## Scenario 3: Generate a grounded follow-up answer

- Given at least one context is attached
- And the user has entered a follow-up question
- When the user sends the question
- Then the question appears in the chat
- And a generating status appears immediately
- And the resulting answer references the selected context
- And the answer exposes a source control for every used context

## Scenario 4: Open a past chat from the local graph and return

- Given the local graph is visible
- When the user activates a related past-chat node
- Then the node and its connecting edge become selected
- And the center pane opens the corresponding past chat
- And a `현재 대화로 돌아가기` action is visible
- When the user returns to the current conversation
- Then the previous draft and attached contexts are preserved

## Scenario 5: Open a source from answer provenance

- Given a grounded answer is visible
- When the user activates one of its source controls
- Then the center pane opens the source chat
- And the graph selects the matching node

## Scenario 6: Recover from no recommendations

- Given a prompt has no keyword overlap with stored chats
- When the user analyzes the prompt
- Then the interface shows a calm empty result rather than a warning wall
- And the user can still send the prompt without attached context

## Scenario 7: Keyboard and responsive operation

- Given the interface is used with a keyboard
- When focus moves through history rows, recommendation actions, graph nodes, source controls, and composer actions
- Then every interactive element has a visible focus indicator and an accessible name
- Given the viewport is narrower than 900px
- Then history and graph are available through labeled overlay controls
- And the conversation and composer have no horizontal overflow or obscured focus target

## Scenario 8: Build graph connections for a new conversation

- Given the user has opened an empty new conversation
- When the user submits the first prompt
- Then the graph initially keeps the new conversation as its center
- When prompt analysis completes
- Then up to five related stored conversations appear around that center
- And unrelated fallback conversations are not added

## Scenario 9: Recenter the graph on the visible stored conversation

- Given the working conversation has analyzed content
- When the user opens a stored conversation from history or the graph
- Then that stored conversation becomes the graph center
- And its related conversations are recalculated from its own content
- And the working conversation appears as a related node when their topics overlap

## Scenario 10: Return to the preserved working conversation from the graph

- Given a stored conversation is the graph center
- And the working conversation is visible as a related node
- When the user activates the working-conversation node
- Then the main pane returns to the working conversation
- And its draft, attached contexts, and generated turns are preserved
- And the graph is rebuilt around the working conversation

## Scenario 11: Start the graph demo from an example prompt

- Given the user has opened an empty new conversation
- When the user activates `예시 질문 넣기`
- Then the example prompt is placed in the composer without being submitted
- And the graph remains centered on an unconnected new conversation
- When the user sends the example prompt
- Then analysis completes and five related stored conversations appear in the graph

## Automation Boundary

- Vitest covers ranking, recommendation limits, context selection, focus-centered graph construction, navigation targets, and provenance helpers.
- Browser acceptance checks cover the complete chat-to-context-to-answer flow, source navigation, focus behavior, and responsive overlays.

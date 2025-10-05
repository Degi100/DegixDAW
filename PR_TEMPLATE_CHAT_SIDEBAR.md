Chat Sidebar refactor — PR summary

What changed
- Extracted presentational components: `ChatItem`, `ChatList`, `ExpandedChat` from `ChatSidebar.tsx`.
- Added unit tests for components and hooks using Jest + Testing Library.
- Improved typing for messages and added `error` states to `useConversations` and `useFriends`.
- Configured test environment (ts-jest, jest.config.ts, tsconfig.jest.json) and polyfills for test runtime.

Files touched
- `src/components/chat/*` — new components and tests
- `src/hooks/*` — types and tests changed/added
- `jest.config.ts`, `tsconfig.jest.json`, `src/setupTests.ts`

Checklist for reviewers
- [ ] Build succeeds: `tsc --noEmit` ✔️
- [ ] Lint passes (minor test helper eslint-disables ok)
- [ ] Unit tests pass (`npm test`) ✔️
- [ ] Behavior: Sidebar renders list, opens expanded chat, quick-send & upload handlers wired
- [ ] Realtime subscriptions remain functional (manual smoke test recommended)

Notes
- I mocked Supabase in tests to avoid network calls; the real client is unchanged.
- Kept changes minimal and incremental to make review easier.

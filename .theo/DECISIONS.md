2026-05-16 | ENTER ROOM button always visible, label changes when already current | Hiding it on current room meant display could never be re-broadcast; "↺ REBROADCAST TO DISPLAY" label makes the intent clear
2026-05-16 | currentRoomData persisted as jsonb in floor_state | Display needs to restore correct room on reconnect without the GM re-entering it; DB is the source of truth
2026-05-16 | session_start/stop handled in both applyPatch (GM hook) and DisplayScreen raw WS | Two separate WS consumers — the shared hook patches GM client state; display has its own connection and needs its own switch cases
2026-05-19 | Realtime presence tracking for Character Bar | Prevents test characters from cluttering GM view; uses graceful 'offline' state during active sessions.
2026-05-19 | Session Map removed ReactFlow during active play | Replaced with list/tree view for instant navigation; ReactFlow canvas is too clunky for fast-paced gameplay and only needed for setup.

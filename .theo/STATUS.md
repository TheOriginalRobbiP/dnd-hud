# DnD HUD Status

## Session checkpoint 2026-05-29T16:15:00Z
- **Focus**: Character creation data calibration, dynamic level mapping, and GM login navigation.
- **Done this session**:
  - Fixed backend portrait database column dropping in `/api/characters` Hono route, resolving hidden names and portraits on character creation.
  - Added dynamic character level mapping to the desktop PlayerHUD header.
  - Patched `SavedCrawlerLibrary.tsx` to dynamically render crawler levels instead of a hardcoded "LVL 2" string.
  - Added a "← Back to Selection" button in `GMPinGate.tsx` to let users escape back to role selection if they click GM by accident.
- **Open / Next**:
  - Integrate local ComfyUI text-to-speech generation pipeline (e.g. Kokoro-82M or F5-TTS) to generate free custom voice lines.
  - Set up workflow to save generated audio directly to the client's public sound assets.
- **Blockers**: None.

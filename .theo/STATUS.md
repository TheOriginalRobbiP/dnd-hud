# Project Status: dnd-hud

## Session Checkpoint 2026-05-29T14:15:00Z
- **Focus:** Switched to local AI image generation (Flux 2 & Flux 1 Dev with LoRAs) and voice generation (Kokoro-82M TTS) to completely remove cloud dependency.
- **Done this session:**
  - **Audio Pipeline:** Integrated `Kokoro-82M` (via customized `kokoro-onnx` handler to bypass NumPy pickle vulnerabilities) and exposed over a secure, authenticated ngrok tunnel to generate zero-cost, studio-quality soundboard voice lines in real-time. Added a **"DYNAMIC AI"** category on the GM Soundboard.
  - **Portrait Generation:** Added Hono API backend and Astro Wizard UI forms to generate native 9:16 player portraits using `illustriousXL_v01.safetensors`, `dreamshaperXL_lightningDPMSDE.safetensors`, and standard SDXL checkpoints.
  - **Flux 2 & Flux 1 Dev Integration:** Added state-of-the-art UNET-based Flux pipelines (`flux2-klein-9b.safetensors`, `flux1-dev.safetensors`) into ComfyUI prompts, supporting dynamic `LoraLoader` injection (e.g. `Flux_2-Turbo-LoRA_comfyui.safetensors`, `j_3dgame_flux.safetensors`), guidance tuning, and custom KSampler configuration. Resolved Flux 2 Klein shape-dimension multiplier mismatches inside ComfyUI's PyTorch stack using custom CLIPLoader structures.
  - **Portrait Display & Game Calibration:** Fixed player HUD StatusTab, InspectModal, and SavedCrawlerLibrary to cleanly render dynamic custom portraits from character database strings rather than falling back to name-based arrays. Adjusted character leveling defaults so that newly forged souls correctly spawn at Level 1 instead of falling back to Level 2.
  - **Network Stability:** Patched client-side Nginx proxy configurations to expand `proxy_read_timeout` to `300s` (5 minutes), completely eliminating 504 Gateway Time-out exceptions during intensive model loads.
  - **Workspace Compilation:** Verified 100% build compatibility of the shared multi-workspace structure (`server` + `client`).
- **Open / Next:**
  - Game-time live testing with players.
  - Additional LoRA style mappings for player classes.
- **Blockers:** None.

## Session checkpoint 2026-05-23T18:00:00Z
- **Focus**: DCC Storyline Integration, Display Overhaul, and Mechanics Calibration.
- **Done this session**:
  * Upgraded Player Status, TV Display screen, VTT Tactical Board, and GM Active Mob tracker with visual Heart representations (filled `❤️`, cracked/half `💔`, empty `🖤`) and fractional values.
  * Verified rules database on Rules tab matches ICRPG + DCC specifications perfectly.
  * Implemented fully client-side iterative geometric token collision/radial dispersion math in `Battlemap.tsx` to handle close or overlapping tokens smoothly and dynamically.
  * Completely re-aligned Floor 1 ("The Antechamber") with the Dungeon Crawler Carl Book 1 storyline. Designed a 5-sector topological progression focusing on finding the Class Selection Tutorial Guild first, followed by exploring/leveling before reaching the final Subway Platform exit stairwell.
  * Generated and seeded 10 highly immersive Czepeku-style Scene and Battlemap pairs representing collapsed elevator caverns, yellow corporate vending machines, glowing terminal platforms, trash nests, and rusted subway trains.
  * Integrated direct narrative and mechanical connection: early goblin kills (Gryla's Babes, Goblin Scouts) populate the floor's dead database, and are dynamically summoned as skeletal minions mid-fight by the floor boss, the Bone Collector, at the subway platform.
  * Overhauled the shared TV Display Screen (`DisplayScreen.tsx`) to be completely full-width. Removed the redundant right-hand sidebar and bottom card, expanding the tactical maps/images to fill 100% of the screen. Moved the Room Target to the top header bar, and overlayed room data in a sleek, floating glassmorphism HUD card at the bottom-left corner of the map.
  * Verified all workspaces compile perfectly (exit code 0).
- **Open / Next**:
  * Refine CSS transitions for view switching.
  * Implement active viewport sizing adjustment for varying monitor dimensions.
- **Blockers**: None.

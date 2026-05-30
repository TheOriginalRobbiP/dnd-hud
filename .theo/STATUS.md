# DnD HUD Status

## Session checkpoint 2026-05-29T16:45:00Z
- **Focus**: Game-Night Quickstart core system slideshow presentation on the TV Display.
- **Done this session**:
  - Extracted the entire Core Quickstart Rules section (Pages 5-19) from the local `ICRPG_Master_Edition_Quickstart_Core_Update_1.3.pdf` file.
  - Implemented an interactive **Tutorial Presentation Mode** inside `DisplayScreen.tsx` which transforms the TV display into a high-end sci-fi game show slideshow.
  - Formulated 10 beautifully themed slides covering: Core Mindset, Turns structure, Actions, Room Targets, Hearts/Effort, Movement/Distance, Death/Dying, Hero Coins, and an interactive playthrough of "The Grey Hill Inferno".
  - Created a seamless, sleek **Slideshow Controller** inside the GM Dashboard under the **Rules** reference tab (`GMRulesPanel.tsx`), letting the GM trigger, navigate, and close the presentation live.
  - Handled the slides state by overloading the text-based `displayViewMode` database column with state-encoded strings (e.g. `tutorial_0`, `tutorial_1`), avoiding any database schema modifications or migrations.
- **Open / Next**:
  - Integrate local ComfyUI text-to-speech generation pipeline (e.g. Kokoro-82M or F5-TTS) to generate free custom voice lines.
  - Set up workflow to save generated audio directly to the client's public sound assets.
- **Blockers**: None.

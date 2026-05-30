# DnD HUD Decisions

2026-05-29 | Add Back Button to GM Login Gate | Added an onBack callback to GMPinGate to allow users to return to role/crawler selection screen if they select GM by mistake.
2026-05-29 | Interactive Rules Presentation on TV Display | Integrated a multi-slide tutorial into DisplayScreen.tsx powered by a GM dashboard controller, avoiding DB schema changes by overloading the text-based displayViewMode column with tutorial state strings (e.g. tutorial_0, tutorial_1).
2026-05-29 | Dynamic Details Toggle on Rules Presentation | Extended rules slideshow to support on-demand detailed mechanics overlays on the TV, controlled live by a GM toggle checkbox.

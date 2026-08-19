# مصروفاتي mobile design system

This file and `tokens.ts` are the single source of truth for Phase 7 UI decisions.

- **Direction:** Arabic-first RTL presentation, with English-ready component and API naming.
- **Tone:** calm, trustworthy, minimal, fast to scan; no decorative gradients or dashboard clutter.
- **Palette:** deep navy for trust and primary balance surfaces, emerald for actions and positive finance states, mint for supportive surfaces, gold for small emphasis, and restrained red for destructive/error states.
- **Typography:** large high-contrast titles, readable 16px body text, and compact 13px labels.
- **Spacing:** 6/10/16/24/32/48 rhythm; cards use 16–24px radii.
- **States:** startup loading, auth validation/error, empty account state, and signed-out state are implemented in this phase.
- **Accessibility:** semantic button roles, labels for icon actions, visible focus/pressed feedback, and readable contrast are required for new components.
- **Scope:** Phase 7 intentionally contains startup, authentication, root navigation, authenticated shell, and account/settings only. Finance feature screens remain for later phases.

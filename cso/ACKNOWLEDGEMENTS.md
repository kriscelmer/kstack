# Acknowledgements

/cso v2 was informed by research across the security audit landscape. Credits to:

- **[Sentry Security Review](https://github.com/getsentry/skills)** — The confidence-based reporting system (only HIGH confidence findings get reported) and the "research before reporting" methodology (trace data flow, check upstream validation) validated our 8/10 daily confidence gate. TimOnWeb rated it the only security skill worth installing out of 5 tested.
- **[Trail of Bits Skills](https://github.com/trailofbits/skills)** — The audit-context-building methodology (build a mental model before hunting bugs) directly inspired Phase 0. Their variant analysis concept (found one vuln? Search the whole codebase for the same pattern) inspired Phase 12's variant analysis step.
- **[Shannon by Keygraph](https://github.com/KeygraphHQ/shannon)** — Autonomous AI pentester achieving 96.15% on the XBOW benchmark (100/104 exploits). Validated that AI can do real security testing, not just checklist scanning. Our Phase 12 active verification is the static-analysis version of what Shannon does live.
- **[Snyk ToxicSkills Research](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)** — The finding that 36% of AI agent skills have security flaws and 13.4% are malicious inspired Phase 8 (Skill Supply Chain scanning).
- **[Daniel Miessler's Personal AI Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure)** — The incident response playbooks and protection file concept informed the remediation and LLM security phases.
- **Community AI agent security audits** — Multiple public audit packs and agent-security writeups influenced the AI/LLM-specific checks in Phase 7, the split between supply-chain and application risk, and the move toward shareable, action-oriented report summaries.
- **[@gus_argon](https://x.com/gus_aragon/status/2035841289602904360)** — Identified critical v1 blind spots: no stack detection (runs all-language patterns), over-reliance on shell grep, silently truncated results, and preamble bloat. These directly shaped v2's stack-first approach and stronger repo-native search guidance.

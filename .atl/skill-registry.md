# Skill Registry — incidencias-it

**Project**: incidencias-it  
**Generated**: 2026-04-29  
**Mode**: engram (no openspec/ directory)

---

## User-Level Skills

Skills loaded from `~/.config/opencode/skills/`:

| Skill Name | Description | Trigger | Path |
|------------|-------------|---------|------|
| `go-testing` | Go testing patterns for Gentleman.Dots, including Bubbletea TUI testing | When writing Go tests, using teatest, or adding test coverage | `C:/Users/Familia Becerra/.config/opencode/skills/go-testing/SKILL.md` |
| `sdd-apply` | Implement tasks from the change, writing actual code following the specs and design | When the orchestrator launches you to implement one or more tasks from a change | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-apply/SKILL.md` |
| `sdd-archive` | Sync delta specs to main specs and archive a completed change | When the orchestrator launches you to archive a change after implementation and verification | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-archive/SKILL.md` |
| `sdd-design` | Create technical design document with architecture decisions and approach | When the orchestrator launches you to write or update the technical design for a change | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-design/SKILL.md` |
| `sdd-explore` | Explore and investigate ideas before committing to a change | When the orchestrator launches you to think through a feature, investigate the codebase, or clarify requirements | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-explore/SKILL.md` |
| `sdd-init` | Initialize Spec-Driven Development context in any project | When user wants to initialize SDD in a project, or says "sdd init", "iniciar sdd", "openspec init" | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-init/SKILL.md` |
| `sdd-propose` | Create a change proposal with intent, scope, and approach | When the orchestrator launches you to create or update a proposal for a change | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-propose/SKILL.md` |
| `sdd-spec` | Write specifications with requirements and scenarios (delta specs for changes) | When the orchestrator launches you to write or update specs for a change | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-spec/SKILL.md` |
| `sdd-tasks` | Break down a change into an implementation task checklist | When the orchestrator launches you to create or update the task breakdown for a change | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-tasks/SKILL.md` |
| `sdd-verify` | Validate that implementation matches specs, design, and tasks | When the orchestrator launches you to verify a completed (or partially completed) change | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-verify/SKILL.md` |
| `skill-creator` | Creates new AI agent skills following the Agent Skills spec | When user asks to create a new skill, add agent instructions, or document patterns for AI | `C:/Users/Familia Becerra/.config/opencode/skills/skill-creator/SKILL.md` |

---

## Project-Level Skills

No project-level skills found. Checked:
- `.agent/skills/` — Not found
- `.claude/skills/` — Not found
- `.gemini/skills/` — Not found
- `skills/` — Not found

---

## Project Convention Files

Checked for convention files in project root (`C:\Users\oskar\Documents\MIO\incidencias-it\`):

| File | Status |
|------|--------|
| `AGENTS.md` | Not found |
| `CLAUDE.md` | Not found |
| `.cursorrules` | Not found |
| `GEMINI.md` | Not found |
| `copilot-instructions.md` | Not found |
| `.agent/rules/` | Not found |

---

## Shared Skills

Located at `~/.config/opencode/skills/_shared/`:

- `engram-convention.md` — Engram persistence naming conventions
- `persistence-contract.md` — Persistence contract details
- `openspec-convention.md` — OpenSpec file-based conventions
- `sdd-phase-common.md` — Common SDD phase return envelope format

---

## Skill Load Order (Orchestrator Reference)

When launching sub-agents, the orchestrator resolves skill paths ONCE per session, then passes exact paths:

```
SKILL: Load `C:/Users/Familia Becerra/.config/opencode/skills/{skill-name}/SKILL.md` before starting.
```

**SDD Phase → Skill Mapping:**

| Phase | Skill Path |
|-------|------------|
| `sdd-init` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-init/SKILL.md` |
| `sdd-explore` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-explore/SKILL.md` |
| `sdd-propose` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-propose/SKILL.md` |
| `sdd-spec` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-spec/SKILL.md` |
| `sdd-design` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-design/SKILL.md` |
| `sdd-tasks` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-tasks/SKILL.md` |
| `sdd-apply` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-apply/SKILL.md` |
| `sdd-verify` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-verify/SKILL.md` |
| `sdd-archive` | `C:/Users/Familia Becerra/.config/opencode/skills/sdd-archive/SKILL.md` |

**Context-Specific Skills:**

| Context | Skill Path |
|---------|------------|
| Go testing / Bubbletea | `C:/Users/Familia Becerra/.config/opencode/skills/go-testing/SKILL.md` |
| Creating new skills | `C:/Users/Familia Becerra/.config/opencode/skills/skill-creator/SKILL.md` |

---

## Notes

- **Persistence Mode**: `engram` — artifacts stored in Engram memory system
- **No `openspec/` directory** created (engram mode)
- **Project-type**: Vanilla JavaScript (no build tools, no package.json)
- **Capstone target**: React + Backend + JWT + 3rd party API + Online deployment

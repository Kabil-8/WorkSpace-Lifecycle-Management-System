# EDEN AI — Tool Registry & Security Specification

## Overview
All EDEN AI tools are declared in `ToolRegistry.ts` and categorized across domain files under `backend/src/ai/tools/`.

## Registered Tools

| Tool Name | Scope / Function | Auth Required | Identity Source |
|---|---|---|---|
| `get_my_profile` | Student profile & CGPA | Yes | JWT `req.user._id` |
| `get_my_attendance` | Student attendance telemetry | Yes | JWT `req.user._id` |
| `get_my_assignments` | Student assignments & due dates | Yes | JWT `req.user._id` |
| `get_my_digital_twin` | Student Neural Digital Twin | Yes | JWT `req.user._id` |
| `get_my_placement_readiness` | Placement likelihood & gap analysis | Yes | JWT `req.user._id` |
| `search_college_courses` | Private institutional courses | Yes | JWT Student Enrollment |
| `search_public_courses` | Open video learning catalog | No | Public Search Index |
| `web_search` | Real-time external web search | No | Tavily / Serper API |
| `open_web_page` | Webpage inspector | No | HTTP Reader (SSRF Safe) |
| `execute_code` | Code execution sandbox | Yes | JWT User Context |
| `open_module` | Frontend module navigation | Yes | User Context |

## Security Rules
1. User identity is derived **strictly from authenticated JWT** (`req.user._id`).
2. Parameters containing `userId` from request body or prompt string are explicitly ignored.
3. Tool execution returns `{ hasData: false, status: 'INSUFFICIENT_DATA' }` when records are missing; dummy fallback metrics are forbidden.

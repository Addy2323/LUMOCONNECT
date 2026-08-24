# ADR 0001: Start with a modular monolith

- **Status:** Accepted
- **Date:** 2026-08-24

## Context
LUMO has many domains, but the initial product needs a coherent transaction, attribution, commission, and audit model. Splitting those concerns into microservices too early would multiply deployment, consistency, and observability risk.

## Decision
Build a modular monolith in Next.js with explicit domain module boundaries, repository interfaces, service functions, provider interfaces, and versioned APIs. Extract high-volume modules later only when measured load and ownership boundaries justify it.

## Consequences
This keeps local development and transactional workflows simple while preserving seams for future extraction. It requires discipline: domain rules must not leak into React components, and tenant checks must remain in every server data path.

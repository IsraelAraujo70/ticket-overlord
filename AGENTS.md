# Ticket Overlord project instructions

## Scope

These instructions apply only to this repository.

Ticket Overlord is an event and ticketing platform for the Verzel Elite Dev 2026 technical challenge. The delivery window is seven calendar days, so a complete and demonstrable end-to-end flow takes priority over optional infrastructure or feature volume.

## Language

- Communicate with the developer and write product documentation in Brazilian Portuguese.
- Write code, identifiers, comments, tests and commit messages in English.
- Preserve official product terms when they are required by the challenge.

## Sources of truth

Use the repository documentation in this order:

1. `challenge.md` defines the challenge requirements and success criteria.
2. `docs/decisoes/` records approved technical decisions and their consequences.
3. `README.md` summarizes the project and indexes the documentation.
4. The current implementation and tests provide evidence of what actually works.

Do not treat plans, README text or an agent completion message as evidence that behavior is implemented, deployed or validated.

## Approved technical direction

- Use a pnpm workspace with `apps/web` and `apps/api`.
- Use Next.js, React and TypeScript for the frontend.
- Use NestJS and TypeScript on a Node.js LTS release for the backend.
- Use PostgreSQL as the system of record and Drizzle ORM for database access.
- Keep critical locking and transactional behavior explicit in SQL when needed.
- Apply ports and adapters only at real boundaries such as catalog, search, payment and ticket-code generation.
- Start event search with PostgreSQL Full Text Search behind a port.
- Consider outbox, a worker and Elasticsearch only after the required flow is complete and deployed.
- Use Railway as the planned deployment platform.

## Product priorities

Implement and validate the required flow before optional work:

1. Authentication and authorization for organizer, customer and gate staff.
2. External catalog integration and organizer event management.
3. Reservation with concurrency-safe inventory handling.
4. Simulated payment confirmation and refusal.
5. Non-forgeable ticket generation, My Tickets and sharing.
6. QR camera scanning, manual fallback and atomic gate validation.
7. Seeds, setup documentation and end-to-end evaluation data.

Elasticsearch, Debezium, streaming infrastructure and other scaling demonstrations are not part of the initial implementation scope.

## Technical decisions

Record every approved technical decision in `docs/decisoes/`.

- Use the filename format `YYYY-MM-DD-HHmm-<slug>.md` with the decision time in `America/Sao_Paulo`.
- Include status, exact decision timestamp with UTC offset, context, decision, alternatives and consequences.
- Add every record to `docs/decisoes/index.md` in chronological order.
- Never rewrite an accepted decision to hide a later change. Create a new record that supersedes it and update the index.
- Do not create a record for an idea that has not been approved.

## Implementation workflow

- Before implementation, state the observable behavior that will change and how it will be validated.
- Ask before making an assumption that changes product behavior, security, data contracts, architecture or deployment.
- Keep framework code outside the domain layer.
- Prefer existing platform features and standard APIs over unnecessary dependencies.
- Add regression tests for bugs and focused tests for critical behavior.
- Update `docs/api/openapi.json` in the same change whenever an HTTP contract changes, including methods, paths, parameters, authentication, request bodies, response status codes or response schemas.
- Test inventory concurrency, payment idempotency and single-use gate validation against a real PostgreSQL instance.
- Keep known limitations explicit and separate from implemented behavior.

## Documentation and completion

- Keep `README.md` concise and use it as an index, not as a substitute for detailed documents.
- Add setup commands only after running them successfully.
- Never publish credentials or secrets.
- Do not claim that an environment is live without checking the deployed application.
- Report whether a restart, migration, seed or redeploy is required after a change.
- Do not commit or push from a protected branch without immediate confirmation.

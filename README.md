# MebelLegal KZ

> **The AI legal and document workspace for Kazakhstan’s furniture businesses.**

**MebelLegal KZ** is a specialized AI workspace for furniture manufacturers, custom furniture studios, and individual entrepreneurs in Kazakhstan.

It helps business owners prepare commercial and accounting documents, connect orders with invoices and payments, track closing-document obligations, review imported company archives, and work with business records through a guided AI assistant.

**MebelLegal KZ has been submitted to OpenAI Day on Product Hunt.**

---

## The problem

Small furniture businesses often manage contracts, invoices, specifications, acts, delivery notes, payments, and electronic invoice obligations across disconnected Word, Excel, PDF, messaging, banking, and government systems.

This creates recurring problems:

- the same customer and order data is entered several times;
- invoices, payments, acts, delivery notes, and electronic invoices are not reliably connected;
- document versions with and without stamps or signatures are mixed together;
- deadlines and required closing documents are easy to miss;
- business owners depend on scattered files and manual checks;
- general-purpose AI tools do not understand the full workflow of a Kazakhstan furniture order.

MebelLegal KZ is being built specifically around this operational reality.

---

## The solution

MebelLegal KZ turns a furniture order into a controlled document workflow:

```text
customer order
    → invoice
    → confirmed sale
    → specification / delivery note / act
    → electronic invoice obligation
    → payment and reconciliation
    → audit history
```

The system does not treat every generated document as a completed accounting event. Drafting, confirmation, posting, cancellation, payment matching, and compliance checks are handled as separate controlled steps.

The product is designed to assist the owner, accountant, or administrator without replacing professional legal or accounting judgment.

---

## Who it is for

- Custom furniture manufacturers
- Cabinet and kitchen furniture studios
- Small furniture factories
- Furniture-focused individual entrepreneurs in Kazakhstan
- Business owners who personally manage sales, documents, and accounting coordination
- Accountants and administrators working with furniture orders

The first pilot company is **Grand Mebel**, using real furniture-business workflows. Sensitive source documents remain outside Git and are processed only in protected local or private environments.

---

## Core product experience

A user should be able to describe an operation in Russian by text or voice, for example:

> Create an advance invoice for a kitchen cabinet, connect it to the customer and order, prepare the specification, and show which closing documents will be required.

MebelLegal KZ converts the request into a structured draft, shows the extracted fields, requests confirmation, and then creates the relevant records and documents.

Important actions remain human-controlled.

---

## Current capabilities

The current prototype already includes:

- Company profile management
- Counterparty and product catalog summaries
- Order and line-item creation
- Invoice generation from an order
- PDF export in A4 format
- Draft, confirmed, posted, and cancelled document states
- Imported-document review queues
- Detection and grouping of probable document versions
- Electronic invoice status normalization
- Initial invoice-to-payment matching
- Safe pilot-data summaries
- Append-only audit history
- Idempotent review decisions
- AI assistant panel in the web application
- Internal sandbox mode without external actions
- Automated tests, TypeScript checks, and production build validation

The repository currently reports:

- 103 automated tests
- 89 unit tests
- 6 integration tests
- 3 PDF tests
- successful TypeScript validation
- successful production build across 19 routes

---

## AI assistant

The AI assistant is designed as a persistent workspace panel rather than a one-time chatbot.

Its planned responsibilities include:

1. Guiding a new company through onboarding
2. Explaining how to prepare a ZIP archive of existing records
3. Reviewing imported documents in quarantine
4. Identifying counterparties, products, invoices, payments, stamps, and signatures
5. Proposing structured records for confirmation
6. Explaining inconsistencies and missing information
7. Preparing document drafts from natural-language commands
8. Suggesting corrective actions without modifying original source files
9. Citing the source document behind important findings

AI suggestions are not applied automatically when they affect legal, accounting, or financial records.

---

## Kazakhstan-specific focus

MebelLegal KZ is not a generic document generator.

The product is being adapted for:

- Kazakhstan business entities and identifiers
- KZT accounting workflows
- Russian-language business operations
- Furniture-specific orders and specifications
- Invoice, act, and delivery-note relationships
- Electronic invoice obligations
- Local document naming and operational practice
- Controlled use of stamps and signatures
- Auditability and confirmation of important actions

Future Kazakh-language support is part of the product direction.

---

## What makes it different

### Furniture-specific context

The system understands that a furniture order may include products, installation, delivery, custom dimensions, materials, hardware, staged payments, and multiple closing documents.

### Local compliance context

The workflow is designed around Kazakhstan document and electronic-invoice processes instead of generic international templates.

### Human confirmation by design

The AI prepares and explains. The user confirms.

### Connected records

Orders, invoices, payments, document versions, closing documents, and obligations are designed to remain linked.

### Archive-first onboarding

A new company should be able to upload its existing business archive and turn it into a reviewed working knowledge base instead of rebuilding everything manually.

### Original files remain unchanged

Imported source documents are preserved. Corrections and decisions are stored as separate events with an audit trail.

---

## Safety and trust principles

MebelLegal KZ follows several core rules:

- no autonomous legal decisions;
- no automatic electronic invoice submission in the first MVP;
- no storage of electronic-signature passwords;
- mandatory confirmation before important operations;
- original imported documents are not overwritten;
- sensitive files are excluded from the public repository;
- every important decision should be traceable;
- deterministic rules are preferred for calculations, states, and deadlines;
- AI is used for extraction, explanation, classification, and draft preparation.

---

## Product status

MebelLegal KZ is currently an active private pilot and prototype.

### Completed foundation

- Repository and project documentation
- Protected data structure
- Initial domain model
- Pilot archive inventory
- Document-chain reconstruction
- Invoice generation
- PDF export
- Review workflow
- Audit history
- AI assistant interface
- Automated validation and tests

### In progress

- Closing-document generation
- Payment reconciliation, including partial payments
- AI command extraction
- Confidence scoring for extracted fields
- Voice input
- Guided onboarding for new companies
- Source-cited company knowledge base
- Deadline and obligation calendar
- Cloudflare pilot deployment
- Public demo environment

### Future scope

- Multi-company SaaS architecture
- Russian and Kazakh interfaces
- Telegram reminders
- Electronic invoice draft preparation
- Controlled electronic-signature workflow
- Billing and usage limits

---

## Pilot goals

The pilot is measured against practical business outcomes:

- 30 real operations processed
- 95% accuracy for recognized company details and line items
- 100% mathematical accuracy
- complete document package prepared in under 60 seconds
- zero missed tracked deadlines
- measurable cost per AI-assisted operation

---

## Business model hypothesis

The initial commercial model is a subscription for one company.

The working hypothesis is:

- **14,900 KZT per month**
- company workspace
- document generation
- AI review
- natural-language commands
- reminders
- archive onboarding
- controlled AI-operation limits

This pricing is a hypothesis and may change after pilot validation.

---

## Technology direction

The current web prototype is built with a TypeScript-based web stack and server-side data access.

The architecture separates:

- source files;
- normalized business records;
- document generation;
- review decisions;
- audit events;
- AI-assisted operations;
- deterministic accounting and workflow rules.

The planned pilot deployment target is Cloudflare, using private storage and database services appropriate for sensitive business data.

---

## Local development

```bash
cd apps/web
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The interface runs in sandbox mode and does not perform external submissions.

The pilot API returns anonymized aggregates when protected local pilot data is available. Otherwise, the interface falls back to safe demo data.

---

## Project documentation

The repository includes a structured project foundation:

- `PROJECT.md` — canonical project passport
- `PRODUCT.md` — product vision, users, MVP, and metrics
- `ROADMAP.md` — implementation stages and release criteria
- `CHECKLISTS.md` — stage-level verification checklists
- `ARCHITECTURE.md` — target architecture
- `DATA_SOURCES.md` — import sources and processing rules
- `COMPLIANCE.md` — compliance boundaries and controls
- `SECURITY.md` — data-protection rules
- `AI_INFRA_DECISION.md` — AI versus deterministic-rule decisions
- `DESIGN.md` — interface and sandbox principles
- `AGENTS.md` — instructions for AI coding agents
- `SESSION_NOTES.md` — project activity log

---

## OpenAI Day and Product Hunt

MebelLegal KZ was submitted to **OpenAI Day on Product Hunt** as an example of a vertical AI product built for a specific industry, country, and operational workflow.

The project demonstrates how AI can become more useful when it is combined with:

- deep domain context;
- local business requirements;
- structured workflows;
- deterministic validation;
- human approval;
- traceable source documents;
- real small-business operations.

Instead of acting as a generic chatbot, MebelLegal KZ is designed to become an operating workspace for a furniture business.

---

## Current limitations

The following capabilities are not yet available as production-ready features:

- autonomous legal advice;
- tax-return filing;
- automatic electronic invoice submission;
- production payroll accounting;
- complete warehouse and manufacturing management;
- full multi-tenant SaaS isolation;
- production electronic-signature integration.

These limitations are intentional and help keep the pilot safe and verifiable.

---

## Vision

Our long-term goal is to give every furniture entrepreneur in Kazakhstan access to an AI workspace that understands their orders, documents, customers, payments, and obligations.

MebelLegal KZ should reduce repetitive paperwork, prevent avoidable errors, and let furniture makers spend more time designing, producing, and serving customers.

---

## Project naming

- **Product name:** MebelLegal KZ
- **Repository name:** MebelDocs AI
- **Market:** Kazakhstan
- **Industry:** Furniture manufacturing and custom furniture
- **Product category:** Vertical AI, legal operations, document automation, accounting workflow

---

## Disclaimer

MebelLegal KZ is an assistive software product and does not replace a licensed lawyer, accountant, tax consultant, or official government information system.

Users remain responsible for reviewing and approving documents and actions before they are used in business operations.

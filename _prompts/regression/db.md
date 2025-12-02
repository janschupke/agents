# Database Architecture Analysis Prompt

## Role

You are a senior database architect and DBA conducting a comprehensive database audit of this codebase. Your task is to analyze the database schema, evaluate normalization, assess data integrity, review indexing strategies, and identify areas for improvement in database design and interaction patterns.

## Project Structure

This is a monorepo with the following structure:

- **apps/**
  - `api` - NestJS backend server with Prisma ORM (PostgreSQL database)
  - `client` - Frontend application for OpenAI chat (React + Vite)
  - `admin` - Frontend application for system administration (React + Vite)
- **packages/**
  - `i18n` - Internationalization package with translation management
  - `utils` - Generic utility functions (parsing, formatting, validation, etc.)

The database uses:

- **PostgreSQL** as the database engine
- **Prisma** as the ORM (schema in `apps/api/prisma/schema.prisma`)
- **Migrations** in `apps/api/prisma/migrations/`
- **pgvector extension** for vector similarity search (used in `AgentMemory` for embeddings)
- **Clerk authentication** integration (users synced from Clerk, `User.id` is Clerk user ID)
- **PrismaService** as a global NestJS service for database access

## Analysis Scope

Analyze the database architecture focusing on:

- Database schema normalization and relational database best practices
- Data integrity, constraints, and referential integrity
- Indexing strategies and query performance optimization
- User data isolation patterns and security
- Consistency between database schema and application code
- Vector search optimization (pgvector)
- Performance and scalability considerations
- Security and sensitive data handling

## Key Areas to Investigate

### 1. Schema Normalization

- **Normal form compliance**: Evaluate adherence to 1NF, 2NF, 3NF and identify denormalization decisions
- **JSON fields**: Evaluate JSON columns (`metadata`, `rawRequest`, `rawResponse`, `context`, `configValue`, `roles`) - are they appropriately used or should they be normalized?
- **Data duplication**: Check for redundant data storage
- **Composite keys**: Review use of composite unique constraints vs. surrogate keys
- **Array fields in JSON**: Review JSON fields that contain arrays (e.g., `roles` in User) - should they be normalized into separate tables?

### 2. Data Integrity & Constraints

- **Primary keys**: Verify all tables have proper primary keys
  - `User.id` uses Clerk ID (String) - is this appropriate?
  - Other tables use auto-increment integers - consider UUIDs for distributed systems?
- **Unique constraints**: Review unique constraints (`@@unique([userId, provider])` in UserApiCredential, `@@unique([agentId, configKey])` in AgentConfig, etc.) - are there missing ones?
- **Check constraints**: Evaluate enum-like string fields (e.g., `role` in Message, `provider` in UserApiCredential) - should they use PostgreSQL ENUM types?
- **Not null constraints**: Review nullable fields and whether they should be required or have defaults
  - `sessionName` in ChatSession - should it have a default?
  - `description` in Agent - is nullable appropriate?
- **Foreign key constraints**: Verify all relationships have proper foreign key constraints
- **Cascade rules**: Review `onDelete: Cascade` usage - are they appropriate?
  - User deletion cascades to agents, sessions, messages, memories - is this correct?
  - Agent deletion cascades to sessions, configs, memories - is this correct?
- **Validation**: Should there be check constraints for valid ranges or formats?

### 3. Indexing Strategy

- **User isolation queries**: All queries filter by `userId` - are indexes optimal for this pattern?
- **Composite indexes**: Review composite indexes (e.g., `@@index([agentId, userId])` in AgentMemory) - are they ordered correctly for query patterns?
- **Foreign key indexes**: Foreign keys should typically be indexed - verify coverage
  - `sessionId` in Message - has index
  - `agentId` in ChatSession - has index
  - `userId` in ChatSession - has index
- **Missing indexes**: Identify frequently queried fields without indexes
  - Message queries by `sessionId` and `createdAt` - has composite index
  - AgentMemory queries by `agentId` and `userId` - has composite index
- **Vector search indexes**: Evaluate pgvector indexes for `AgentMemory.vectorEmbedding`
  - Is the vector index properly configured for similarity search?
  - Are vector dimensions correct (1536 for text-embedding-3-small)?
- **Covering indexes**: Evaluate opportunities for covering indexes
- **Partial indexes**: Consider partial indexes for common filtered queries
- **Expression indexes**: Consider indexes on expressions if needed
- **Unused indexes**: Identify potentially unused indexes that could be removed

### 4. User Isolation & Security

- **User isolation**:
  - Verify all user-scoped tables properly isolate data by `userId`
  - Check that Clerk user IDs are properly linked to database users
  - Verify `User.id` matches Clerk user ID format
- **Row-Level Security**: Consider PostgreSQL RLS policies as defense-in-depth
- **Application-level filtering**:
  - Verify application always filters by `userId` in queries via Prisma
  - Check NestJS services use proper filtering patterns
  - Verify user ownership validation in services
- **Admin access**:
  - How are admin users handled? Should they bypass user filtering?
  - Check `RolesGuard` and role-based access patterns
  - Verify admin endpoints properly handle multi-tenant data access
  - Review `roles` JSON field in User - is this the right approach?
- **Clerk integration**:
  - Verify user sync from Clerk webhooks
  - Check user creation/update patterns
  - Review user ID format consistency
- **Sensitive data**: Review handling of PII and sensitive data
  - API credentials are encrypted (`encryptedKey`) - verify encryption implementation
  - User email, names, image URLs - are they handled securely?
- **Data encryption**: Evaluate encryption at rest for sensitive fields
- **Storage patterns**: Should large binary data (e.g., avatars) be in database or object storage?

### 5. Application Code Consistency

- **Type alignment**:
  - Compare Prisma schema types to TypeScript types in application code
  - Verify Prisma-generated types match application DTOs
  - Check for type mismatches between schema and application code
- **Enum consistency**:
  - Verify string fields that should use Prisma enums (e.g., `role` in Message: 'user' | 'assistant' | 'system')
  - Check enum-like string fields that should use Prisma enums
  - Verify enum values in application code match schema
- **Field usage**:
  - Check if all schema fields are used in application code
  - Identify unused fields that could be deprecated
  - `rawRequest` and `rawResponse` in Message - are they used?
  - `metadata` in Message - is it used?
- **Missing fields**: Identify fields used in application but not in schema
- **Default values**: Verify application respects schema defaults
- **Query patterns**:
  - Evaluate N+1 queries in NestJS services
  - Check eager loading usage with Prisma `include`/`select`
  - Review transaction patterns (`$transaction` usage)
  - Verify proper use of Prisma query optimization
- **Raw queries**:
  - Check for `$queryRaw` usage and whether they're necessary (especially for vector search)
  - Verify raw queries are parameterized (SQL injection prevention)
  - Review migration scripts for raw SQL patterns
- **PrismaService usage**:
  - Verify consistent use of `PrismaService` across NestJS services
  - Check for proper error handling with Prisma errors
  - Review error handling utilities

### 6. Vector Search & Memory

- **Vector embedding storage**:
  - Verify `AgentMemory.vectorEmbedding` uses correct dimension (1536)
  - Check pgvector extension is properly enabled
  - Evaluate vector index configuration
- **Similarity search queries**:
  - Review vector similarity search implementation
  - Verify query performance for large memory datasets
  - Check similarity threshold usage
- **Memory data model**:
  - Evaluate `keyPoint` and `context` fields in AgentMemory
  - Review memory update patterns (`updateCount`, `updatedAt`)
  - Check memory lifecycle management
- **Memory indexing**: Verify indexes support common memory query patterns

### 7. Seed Data & Migrations

- **Seed completeness**:
  - Does seed data cover all major tables and relationships?
  - Are all enum values represented in seed data?
- **Data realism**: Is seed data realistic enough for development and testing?
- **User seeding**:
  - Are multiple users seeded to test user isolation?
  - Are Clerk users properly seeded with correct ID format?
  - Do seed users have proper role assignments?
- **Edge cases**: Should seed data include edge cases and boundary conditions?
- **Migration organization**:
  - Are migrations in `apps/api/prisma/migrations/` properly organized and named?
  - Do migration names follow conventions?
- **Rollback strategy**: Can migrations be safely rolled back?
- **Data migrations**:
  - Are data migrations handled separately from schema changes?
  - Are migration scripts properly used?
- **Migration testing**: How are migrations tested?
- **Prisma migration commands**: Verify proper use of `prisma migrate` commands

### 8. Performance & Scalability

- **Large tables**: Identify tables that will grow large
  - `Message` - will grow with chat usage
  - `AgentMemory` - will grow with memory accumulation
- **Join complexity**: Review complex queries with multiple joins
  - Chat history queries joining Message, ChatSession, Agent
  - Memory retrieval queries
- **Aggregation queries**: Evaluate queries that aggregate large datasets
- **Pagination**: Are large result sets properly paginated?
  - Message history pagination
  - Session list pagination
  - Memory list pagination
- **Query optimization**: Are queries optimized for existing indexes?
- **Vector search performance**: Evaluate vector similarity search performance at scale
- **Archival strategy**: Should old messages or memories be archived?
- **Partitioning**: Should large tables be partitioned by date?
- **Data retention**: Are there data retention policies?
- **Soft deletes**: Should deletes be soft deletes for audit trails?

### 9. Schema Maintainability

- **Documentation**: Are Prisma schema comments clear and comprehensive?
- **Naming conventions**: Do field names follow consistent naming conventions?
  - Snake_case in database (`@map`) vs camelCase in Prisma
- **Business rules**: Are business rules documented?
  - Message role constraints
  - Agent-user relationships
  - Session lifecycle
- **Schema evolution**: How are breaking schema changes handled?
- **Deprecation strategy**: Are deprecated fields properly marked?
- **Change management**: How are schema changes reviewed and approved?

### 10. Domain-Specific Considerations

- **Chat sessions**:
  - Evaluate session naming and lifecycle
  - Review session-agent-user relationships
  - Check session message ordering
- **Messages**:
  - Review message role constraints
  - Evaluate raw request/response storage
  - Check message translation relationships
- **Agents**:
  - Evaluate agent configuration storage (JSON in AgentConfig)
  - Review agent-user relationships
  - Check agent memory relationships
- **Translations**:
  - Review message translation relationships
  - Evaluate word translation storage patterns
- **API credentials**:
  - Review encryption implementation
  - Evaluate credential storage patterns
  - Check provider uniqueness

## Output Requirements

Create a comprehensive database audit document that includes:

1. **Executive Summary**: High-level overview of findings, priority areas, and overall database health assessment

2. **Detailed Findings**: For each issue identified, provide:
   - **Category**: Which area it falls under (normalization, integrity, indexing, etc.)
   - **Severity**: Critical, High, Medium, or Low
   - **Location**: Specific table/field names, file paths (schema.prisma, migrations), or query locations
   - **Description**: Clear explanation of the issue
   - **Example**: Schema snippet or query example showing the problem
   - **Impact**: Why this matters (performance, data integrity, security, maintainability)
   - **Recommendation**: Specific, actionable improvement with rationale

3. **Schema Analysis**:
   - **Normalization Assessment**: Document normalization violations and intentional denormalization decisions
   - **Relationship Review**: Evaluate foreign key relationships and cascade rules
   - **Constraint Evaluation**: Missing constraints, inappropriate constraints, constraint improvements

4. **Index Analysis**:
   - **Current Indexes**: List all indexes with their purpose
   - **Missing Indexes**: Identify indexes needed for common query patterns
   - **Vector Search Optimization**: Evaluate pgvector index configuration
   - **Optimization Opportunities**: Suggest index improvements (composite, partial, covering indexes)

5. **Application Consistency Report**:
   - **Schema-Code Mismatches**: Type mismatches, enum inconsistencies, unused/missing fields
   - **Query Pattern Issues**: N+1 queries, missing eager loading, transaction usage
   - **Vector Search Implementation**: Review vector similarity search patterns
   - **Alignment Recommendations**: How to align schema and application code

6. **Performance Assessment**:
   - **Query Performance**: Identify potential bottlenecks
   - **Scalability Considerations**: Tables that will need special handling as they grow
   - **Vector Search Performance**: Evaluate vector similarity search at scale
   - **Optimization Recommendations**: Query optimizations, indexing improvements, archival strategies

7. **Security Review**:
   - **User Isolation Patterns**: User isolation verification, RLS recommendations
   - **Data Isolation**: Verify proper data separation between users
   - **Sensitive Data Handling**: Encryption recommendations, storage patterns
   - **Clerk Integration**: Review user ID format and sync patterns

8. **Refactoring Plan**: Organized by priority:
   - **Phase 1 (Critical)**: Data integrity issues, security vulnerabilities, performance issues affecting core functionality
   - **Phase 2 (High)**: Normalization violations, missing indexes, inappropriate cascade rules
   - **Phase 3 (Medium)**: Seed data improvements, documentation enhancements, optimization opportunities
   - **Phase 4 (Low)**: Naming consistency, schema documentation improvements

   For each phase, include:
   - Estimated effort and complexity
   - Migration strategy for schema changes
   - Risk assessment
   - Testing requirements
   - Dependencies between changes

9. **Recommendations**:
   - Database best practices to adopt
   - Patterns to establish (soft deletes, archival, etc.)
   - Tools or processes (query analyzers, migration testing, etc.)
   - Monitoring and maintenance recommendations
   - Vector search optimization strategies

## Key Database Patterns to Consider

When analyzing, be aware of the following established patterns:

- **User Isolation**:
  - All user-scoped tables use `userId` for data isolation
  - Clerk authentication provides user IDs which are stored as `User.id`
  - Application-level filtering via Prisma queries (not database-level RLS)
- **Prisma Patterns**:
  - `PrismaService` is a global NestJS service for database access
  - Auto-increment integer primary keys (except User which uses Clerk ID)
  - Timestamps use `@default(now())` and `@updatedAt`
  - Snake_case database names mapped with `@map()`
- **NestJS Integration**:
  - Services use dependency injection for `PrismaService`
  - Error handling via Prisma error utilities
  - User ownership validation in services
- **Schema Organization**:
  - Models organized by domain (User, Agent, ChatSession, Message, AgentMemory, etc.)
  - Relationships use Prisma relation syntax
  - Table names mapped with `@@map()` for naming conventions
- **Vector Search**:
  - pgvector extension for similarity search
  - 1536-dimensional embeddings for text-embedding-3-small
  - Vector storage in `AgentMemory.vectorEmbedding`

## Instructions

- **Do NOT perform any schema changes** - this is analysis only
- Be thorough and specific - include table/field names, file paths, and line numbers where possible
- Prioritize actionable findings over theoretical improvements
- Consider the Prisma ORM context when making recommendations
- Focus on data integrity, performance, security, and maintainability as end goals
- Compare schema to application code to identify inconsistencies
- Evaluate trade-offs between normalization and performance
- Consider user isolation requirements throughout the analysis
- Pay special attention to Clerk integration patterns and user isolation
- Verify Prisma query patterns in NestJS services
- Evaluate vector search implementation and performance
- Consider OpenAI chat domain-specific patterns (agents, sessions, messages, memory)
- Output the analysis as a new markdown document in the `_prompts/audits/` folder

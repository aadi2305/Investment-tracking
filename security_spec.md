# Security Spec - Portfolio Tracker

## Data Invariants
1. A user can only access their own goals, funds, and transactions.
2. Every transaction must be linked to a valid fund owned by the user.
3. If a transaction is linked to a goal, it must be a goal owned by the user.
4. Timestamps (`createdAt`, `lastUpdated`) must be valid ISO strings (or server-side managed).
5. Numerical values like `amount`, `targetAmount`, `currentNAV` must be non-negative.

## The Dirty Dozen Payloads

1. **Identity Theft (Create Goal for another user):**
   Attempt to create a goal in `/users/attacker/goals/1` using victim's credentials.
   *Result: PERMISSION_DENIED*

2. **Cross-User Injection (Transaction with victim's fund ID):**
   Attacker creates a transaction in their own space but sets `fundId` to a victim's fund.
   Rules should verify existence of fund in user's own collection.
   *Result: PERMISSION_DENIED*

3. **Schema Poisoning (Excessive string size):**
   Goal name with 1MB of data.
   *Result: PERMISSION_DENIED* (due to .size() check)

4. **Resource Exhaustion (Negative Amount):**
   Transaction with amount `-999999`.
   *Result: PERMISSION_DENIED*

5. **Privilege Escalation (Shadow field):**
   Adding `isAdmin: true` to a user document (if we had one) or any document.
   *Result: PERMISSION_DENIED* (due to .hasOnly() or strict schema)

6. **ID Spoofing (Special characters in ID):**
   Document ID with scripts or path traversal like `..%2F..%2Fsys`.
   *Result: PERMISSION_DENIED* (due to isValidId)

7. **Temporal Fraud (Future Timestamp):**
   Setting `createdAt` to a year from now.
   *Result: PERMISSION_DENIED*

8. **Orphaned Write (Transaction without Fund):**
   Creating a transaction referencing a fund that doesn't exist.
   *Result: PERMISSION_DENIED* (using exists())

9. **PII Leak (Global List):**
   An authenticated user trying to list `/users` collection.
   *Result: PERMISSION_DENIED*

10. **State Corruption (Change goal createdAt):**
    Updating an immutable field like `createdAt`.
    *Result: PERMISSION_DENIED*

11. **Type Poisoning (Setting targetAmount to a string):**
    Changing `targetAmount` from number to string "Infinite".
    *Result: PERMISSION_DENIED*

12. **Ghost Update (Adding fields during update):**
    Updating a fund name but also adding `verified: true`.
    *Result: PERMISSION_DENIED* (due to .hasOnly())

## Test Runner (Draft)
```ts
// firestore.rules.test.ts (logic plan)
// 1. Setup authenticated user A and B.
// 2. User A cannot read User B's goals.
// 3. User A cannot create a transaction with User B's fundId.
// 4. Goal name cannot exceed 100 characters.
// 5. Transaction amount must be > 0.
```

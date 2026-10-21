Current issues:

- Adding recurring transactions

- Adding budgets

- All issues where schema mismatches gets a default error message, format it so we can show it to the frontend.

- When i select an expense category and switch to income, the expense category is still the currently selected one

- Add a delete category + delete tag
- - Add a menu beside each category to show menu.
- - Add backend routes

# Fixed

## 1. Date Issue

- In recent transaction on dashboard I am not seeing transactions for expense
- When selecting current date we get an error. Most probably the issue is that we are checking transaction_date >= today.

#### Solution:

I was doing `date.now()` but date.now() depends on device machine. It worked on my local machine but in production it was using UTC so i had to fix everywhere.
**Fix**:

```python
    from zoneinfo import ZoneInfo
    today = datetime.now(ZoneInfo("Asia/Karachi")).date()
```

Fixed this everywhere

## 2. Too much api fetching happening on dashboard:

- Whenever we go to a different page and come back to dashboard, we refetch the data. I don't think we need auto refetching, only fetch after transaction is added.

### Solution:

My inital plan was doing this:

```js
useQuery({
  queryKey: queryKeys.transactions.byProfileId.all(profileId),
  queryFn: () => fetchTransactions(profileId),
  enabled: !!profileId,
  refetchOnMount: false,
});
```

But this has a issue.

When i invalidate query from add transaction page. I thought react query auto refetches in background but what it does is mark value as stale. It doesnt handle refetching itself. It just marks stale and when that component is rendered and has observers it decides weather to fetch or not.

So doing this, when we add transaction, our query data is stale but dashboard mounts and see its stale but then refetchOnMount : false and doesnt refetch.

So a valid solution was this:

```js
useQuery({
  queryKey: queryKeys.transactions.byProfileId.all(profileId),
  queryFn: () => fetchTransactions(profileId),
  enabled: !!profileId,
  staleTime: Infinity,
});
```

This works but this has a flaw, suppose i add transaction from one device and then see my device on other it never updates.

So a better way is this:

```js
useQuery({
  queryKey: queryKeys.transactions.byProfileId.all(profileId),
  queryFn: () => fetchTransactions(profileId),
  enabled: !!profileId,
  staleTime: 5 * 60 * 1000,
  refetchOnReconnect: true,
});
```

How does refetchOnMount works:

```
Mount
   │
   ▼
Is there cached data?
      │
      ├── No
      │      ▼
      │   Fetch
      │
      └── Yes
             │
             ▼
      Is it stale?
             │
      Yes ─────► Fetch
      No  ─────► Use cache
```

## 3. Categories under different parent name

#### Before:

All categories for a profile name has to be distinct even if they had different parent.

#### Now:

Categories with different parent can use duplicate names as long as they are not on same heirarichal level

## 4: Moved modal from bottom to middle

Used shadcn Dialog instead of Sheet

## 5: Limits and date filters on transactions page

Added a date filter to filter transactions based on a date.
Also added filters that allows you to filter transactions based on categories and tags.

## 6: Added a transaction Detail page.

Added both backend and frontend routes + complete frontend page

## 7: Delete Transaction

## 8: Delete Category

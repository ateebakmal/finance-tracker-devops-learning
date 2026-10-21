export const queryKeys = {
  transactions: {
    byProfileId: {
      byProfile: (profileId) => ["transactions", profileId], //Invalidation prefix
      // prettier-ignore
      all: (profileId, filters = null) => ["transactions", profileId,"all",filters,],
      summary: (profileId) => ["transactions", profileId, "summary"],
      detail: (profileId, transactionId) => [
        "transactions",
        profileId,
        "detail",
        transactionId,
      ],
    },
  },
  categories: {
    byProfileId: {
      all: (profileId) => ["categories", "all", profileId],
    },
  },
  tags: {
    byProfileId: {
      all: (profileId) => ["tags", "all", profileId],
    },
  },
};

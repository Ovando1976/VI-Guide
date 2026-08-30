import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type IndexField = Readonly<{
  fieldPath: string;
  order?: "ASCENDING" | "DESCENDING";
  arrayConfig?: "CONTAINS";
}>;

type FirestoreIndex = Readonly<{
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: readonly IndexField[];
}>;

const manifest = JSON.parse(
  readFileSync(new URL("../firestore.indexes.json", import.meta.url), "utf8"),
) as { indexes?: readonly FirestoreIndex[] };

const indexes = manifest.indexes ?? [];

function expectIndex(
  collectionGroup: string,
  expectedFields: readonly IndexField[],
) {
  const found = indexes.some(
    (index) =>
      index.collectionGroup === collectionGroup &&
      index.queryScope === "COLLECTION" &&
      JSON.stringify(index.fields) === JSON.stringify(expectedFields),
  );

  assert.ok(
    found,
    `Missing Firestore index for ${collectionGroup}: ${JSON.stringify(expectedFields)}`,
  );
}

expectIndex("socialComments", [
  { fieldPath: "postId", order: "ASCENDING" },
  { fieldPath: "createdAt", order: "ASCENDING" },
]);

expectIndex("socialNotifications", [
  { fieldPath: "userId", order: "ASCENDING" },
  { fieldPath: "createdAt", order: "DESCENDING" },
]);

expectIndex("socialReports", [
  { fieldPath: "status", order: "ASCENDING" },
  { fieldPath: "createdAt", order: "ASCENDING" },
]);

console.log("Social Firestore index contract passed.");

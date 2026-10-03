export interface ClaimRecord {
  reference: string;
  claimantName: string;
  phone: string;
  householdId: string;
  villageId: string;
  villageName: string;
  category: string;
  requestedAmount: number;
  details: string;
  latitude: number;
  longitude: number;
  evidenceName: string;
  evidence: Blob;
  submittedAt: string;
}

const DATABASE = "innovision-claims";
const STORE = "claims";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "reference" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveClaim(record: ClaimRecord): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }).finally(() => database.close());
}

export async function listAllClaims(): Promise<ClaimRecord[]> {
  const database = await openDatabase();
  try {
    const records = await new Promise<ClaimRecord[]>((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as ClaimRecord[]);
      request.onerror = () => reject(request.error);
    });
    return records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  } finally {
    database.close();
  }
}

export async function listClaims(villageId: string): Promise<ClaimRecord[]> {
  return (await listAllClaims()).filter((record) => record.villageId === villageId);
}
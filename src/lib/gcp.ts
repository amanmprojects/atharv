import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { PubSub } from '@google-cloud/pubsub';

let storage: Storage | null = null;
let firestore: Firestore | null = null;
let secretManager: SecretManagerServiceClient | null = null;
let pubsub: PubSub | null = null;

function getProjectId(): string {
  return process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT || '';
}

export function getStorage(): Storage {
  if (!storage) {
    storage = new Storage({
      projectId: getProjectId(),
    });
  }
  return storage;
}

export function getFirestore(): Firestore {
  if (!firestore) {
    firestore = new Firestore({
      projectId: getProjectId(),
    });
  }
  return firestore;
}

export function getSecretManager(): SecretManagerServiceClient {
  if (!secretManager) {
    secretManager = new SecretManagerServiceClient({
      projectId: getProjectId(),
    });
  }
  return secretManager;
}

export function getPubSub(): PubSub {
  if (!pubsub) {
    pubsub = new PubSub({
      projectId: getProjectId(),
    });
  }
  return pubsub;
}

export const BUCKETS = {
  DOCUMENTS: `${getProjectId()}-documents`,
  THUMBNAILS: `${getProjectId()}-thumbnails`,
};

export const PUBSUB_TOPICS = {
  AI_PROCESSING: 'ai-document-processing',
  DOCUMENT_EVENTS: 'document-events',
  AUDIT_LOG: 'audit-log',
};

export const SECRET_NAMES = {
  DOCUMENT_ENCRYPTION_KEY: 'doc-encryption-key',
  JWT_SIGNING_KEY: 'jwt-signing-key',
};

export async function getSecret(secretName: string): Promise<string> {
  const client = getSecretManager();
  const name = `projects/${getProjectId()}/secrets/${secretName}/versions/latest`;
  const [version] = await client.accessSecretVersion({ name });
  return version.payload?.data?.toString() || '';
}

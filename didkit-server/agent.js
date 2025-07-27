// agent.js
import { createAgent } from '@veramo/core';
import { DIDManager } from '@veramo/did-manager';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { KeyDIDProvider } from '@veramo/did-provider-key';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getResolver as getDidKeyResolver } from 'key-did-resolver';
import { CredentialPlugin } from '@veramo/credential-w3c';

import {
  DataStore,
  DataStoreORM,
  KeyStore,
  DIDStore,
  PrivateKeyStore,
  Entities,
  migrations,
} from '@veramo/data-store';

import { DataSource } from 'typeorm'; // ✅ TypeORM 0.3+
const DB_FILE = './database.sqlite';
const DB_ENC_KEY =
  process.env.DB_ENCRYPTION_KEY ||
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; // 32 bytes (64 hex)

export async function setupAgent() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: DB_FILE,
    synchronize: false,
    migrationsRun: true,
    entities: Entities,
    migrations,
    logging: false,
  });
  await dataSource.initialize();
  await dataSource.runMigrations();

  const privateKeyStore = new PrivateKeyStore(dataSource, new SecretBox(DB_ENC_KEY));

  return createAgent({
    plugins: [
      new KeyManager({
        store: new KeyStore(dataSource),
        kms: { local: new KeyManagementSystem(privateKeyStore) },
      }),
      new DIDManager({
        store: new DIDStore(dataSource),
        defaultProvider: 'did:key',
        providers: {
          'did:key': new KeyDIDProvider({ defaultKms: 'local' }),
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver(getDidKeyResolver()),
      }),
      new DataStore(dataSource),
      new DataStoreORM(dataSource),
      new CredentialPlugin(),
    ],
  });
}

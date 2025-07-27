// agent.js
import dotenv from 'dotenv'
dotenv.config()

/**
 * Veramo 에이전트를 초기화합니다. 이 파일은 DID, 키, 데이터 저장소 등을 관리하는 핵심
 * 설정을 담당합니다. 환경 변수에서 데이터베이스 암호화 키를 반드시 주입받아야 하며,
 * 기본값을 사용하지 않습니다. 키가 없으면 서버를 시작하지 않고 오류를 발생시킵니다.
 */

import { createAgent } from '@veramo/core'
import { DIDManager } from '@veramo/did-manager'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { KeyDIDProvider } from '@veramo/did-provider-key'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as getDidKeyResolver } from 'key-did-resolver'
import { CredentialPlugin } from '@veramo/credential-w3c'

import {
  DataStore,
  DataStoreORM,
  KeyStore,
  DIDStore,
  PrivateKeyStore,
  Entities,
  migrations,
} from '@veramo/data-store'

import { DataSource } from 'typeorm'

// SQLite 데이터베이스 파일 경로. 환경변수를 통해 변경할 수 있습니다.
const DB_FILE = process.env.DB_FILE || './database.sqlite'

// 데이터베이스 암호화 키는 반드시 환경변수로 지정해야 합니다. 지정되지 않으면 오류 발생
const DB_ENC_KEY = process.env.DB_ENCRYPTION_KEY
if (!DB_ENC_KEY) {
  throw new Error(
    'DB_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다. 보안상의 이유로 기본 암호화 키를 제공하지 않습니다.',
  )
}

/**
 * Veramo 에이전트를 생성합니다. DataSource 초기화 및 마이그레이션을 수행한 뒤
 * 필요한 플러그인을 주입합니다.
 */
export async function setupAgent() {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: DB_FILE,
    synchronize: false,
    migrationsRun: true,
    entities: Entities,
    migrations,
    logging: false,
  })

  await dataSource.initialize()
  await dataSource.runMigrations()

  const privateKeyStore = new PrivateKeyStore(dataSource, new SecretBox(DB_ENC_KEY))

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
  })
}
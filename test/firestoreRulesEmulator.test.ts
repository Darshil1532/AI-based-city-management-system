import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

/**
 * Firestore Emulator Security Rules Test Suite
 * 
 * Verifies live Firestore Security Rules behavior using @firebase/rules-unit-testing.
 * When FIRESTORE_EMULATOR_HOST is present, tests run live against the emulator.
 * When absent, gracefully documents requirement and skips without breaking CI.
 */
describe('Firestore Security Rules Emulator Verification Suite', () => {
  let testEnv: RulesTestEnvironment | null = null;
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  const hasEmulator = !!emulatorHost;

  before(async () => {
    if (!hasEmulator) {
      console.info(
        '[FirestoreRulesTest] Note: FIRESTORE_EMULATOR_HOST environment variable is not set. Live emulator tests will be skipped. To run against local emulator, start `firebase emulators:start --only firestore`.'
      );
      return;
    }

    const rules = fs.readFileSync('firestore.rules', 'utf8');
    const [host, portStr] = emulatorHost.split(':');
    testEnv = await initializeTestEnvironment({
      projectId: 'smart-city-test-proj',
      firestore: {
        rules,
        host: host || 'localhost',
        port: parseInt(portStr || '8080', 10),
      },
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it('RULE-1: Citizen A cannot read Citizen B complaint', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');

    // Seed Citizen B complaint as administrative override context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('complaints').doc('COMP-B01').set({
        citizenId: 'CITIZEN-B',
        title: 'Citizen B Water Leak',
        category: 'Water Leakage',
        status: 'submitted',
        createdAt: new Date().toISOString(),
      });
    });

    const citizenA = testEnv.authenticatedContext('CITIZEN-A');
    const citizenB = testEnv.authenticatedContext('CITIZEN-B');

    await assertFails(citizenA.firestore().collection('complaints').doc('COMP-B01').get());
    await assertSucceeds(citizenB.firestore().collection('complaints').doc('COMP-B01').get());
  });

  it('RULE-2: Citizen A cannot update Citizen B complaint', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');

    const citizenA = testEnv.authenticatedContext('CITIZEN-A');
    await assertFails(
      citizenA.firestore().collection('complaints').doc('COMP-B01').update({
        description: 'Tampered description by Citizen A',
      })
    );
  });

  it('RULE-3: Citizen cannot change administrative fields (e.g. status, finalCategory, resolutionDetails)', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');

    const citizenB = testEnv.authenticatedContext('CITIZEN-B');
    await assertFails(
      citizenB.firestore().collection('complaints').doc('COMP-B01').update({
        status: 'resolved',
        finalCategory: 'Sanitation',
        resolutionDetails: 'Citizen self-resolved',
      })
    );
  });

  it('RULE-4: Citizen cannot create notification for Citizen B', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');

    const citizenA = testEnv.authenticatedContext('CITIZEN-A');
    // Citizen A tries to create notification targeted at Citizen B
    await assertFails(
      citizenA.firestore().collection('notifications').doc('NOTIF-001').set({
        userId: 'CITIZEN-B',
        title: 'Spam alert',
        message: 'Forged message',
        read: false,
        createdAt: new Date().toISOString(),
      })
    );

    // Citizen A creating notification targeted at self succeeds
    await assertSucceeds(
      citizenA.firestore().collection('notifications').doc('NOTIF-002').set({
        userId: 'CITIZEN-A',
        title: 'Valid alert',
        message: 'Own notification',
        read: false,
        createdAt: new Date().toISOString(),
      })
    );
  });

  it('RULE-5: Citizen cannot read admin insights', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('insights').doc('INSIGHT-01').set({
        title: 'Systemic Infrastructure Pattern',
        status: 'new',
        createdAt: new Date().toISOString(),
      });
    });

    const citizenA = testEnv.authenticatedContext('CITIZEN-A');
    await assertFails(citizenA.firestore().collection('insights').doc('INSIGHT-01').get());
    await assertFails(citizenA.firestore().collection('insights').get());
  });

  it('RULE-6: Admin can perform authorized administrative operations', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');

    const admin = testEnv.authenticatedContext('ADMIN-01', {
      email: 'darshiljha1532@gmail.com',
      admin: true,
    });

    // Admin can read insights
    await assertSucceeds(admin.firestore().collection('insights').doc('INSIGHT-01').get());

    // Admin can update complaint administrative fields
    await assertSucceeds(
      admin.firestore().collection('complaints').doc('COMP-B01').update({
        status: 'assigned',
        assignedDepartment: 'Water Supply Department',
      })
    );
  });

  it('RULE-7: Anonymous user cannot access protected collections', async (t) => {
    if (!testEnv) return t.skip('Firestore emulator not running');

    const unauthenticated = testEnv.unauthenticatedContext();
    await assertFails(unauthenticated.firestore().collection('complaints').doc('COMP-B01').get());
    await assertFails(unauthenticated.firestore().collection('notifications').get());
    await assertFails(unauthenticated.firestore().collection('insights').get());
  });
});

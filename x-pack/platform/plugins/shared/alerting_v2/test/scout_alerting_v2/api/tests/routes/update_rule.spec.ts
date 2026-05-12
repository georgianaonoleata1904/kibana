/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { expect } from '@kbn/scout/api';
import type { RoleApiCredentials } from '@kbn/scout';
import { ID_MAX_LENGTH, MAX_NAME_LENGTH } from '@kbn/alerting-v2-schemas';
import {
  ALL_ROLE,
  apiTest,
  buildCreateRuleData,
  NO_ACCESS_ROLE,
  READ_ROLE,
  ruleUrl,
  testData,
} from '../../fixtures';

apiTest.describe('Update rule API', { tag: '@local-stateful-classic' }, () => {
  let writerCredentials: RoleApiCredentials;
  let writerHeaders: Record<string, string>;

  apiTest.beforeAll(async ({ requestAuth }) => {
    writerCredentials = await requestAuth.getApiKeyForCustomRole(ALL_ROLE);
    writerHeaders = { ...testData.COMMON_HEADERS, ...writerCredentials.apiKeyHeader };
  });

  apiTest.beforeEach(async ({ apiServices }) => {
    await apiServices.alertingV2.rules.cleanUp();
  });

  apiTest.afterAll(async ({ apiServices }) => {
    await apiServices.alertingV2.rules.cleanUp();
  });

  apiTest(
    'update: should partially update the rule and refresh audit fields',
    async ({ apiClient, apiServices }) => {
      const createData = buildCreateRuleData({
        metadata: { name: 'original-name', description: 'original description', tags: ['cpu'] },
      });
      const created = await apiServices.alertingV2.rules.create(createData);
      const response = await apiClient.patch(ruleUrl(created.id), {
        headers: writerHeaders,
        body: { metadata: { name: 'renamed' } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(200);
      // Patched field reflects the new value.
      expect(response.body.metadata.name).toBe('renamed');
      // Other metadata fields are preserved (PATCH is non-destructive).
      expect(response.body.metadata.description).toBe('original description');
      expect(response.body.metadata.tags).toStrictEqual(['cpu']);
      // Non-touched top-level fields are preserved.
      expect(response.body.kind).toBe(created.kind);
      expect(response.body.schedule).toStrictEqual(created.schedule);
      expect(response.body.evaluation).toStrictEqual(created.evaluation);
      // Audit fields: createdAt/createdBy preserved, updatedAt/updatedBy refreshed.
      expect(response.body.id).toBe(created.id);
      expect(response.body.createdAt).toBe(created.createdAt);
      expect(response.body.createdBy).toBe(created.createdBy);
      expect(response.body.updatedAt).not.toBe(created.updatedAt);
    }
  );

  apiTest('update: should toggle the enabled field', async ({ apiClient, apiServices }) => {
    const created = await apiServices.alertingV2.rules.create(
      buildCreateRuleData({ metadata: { name: 'rule-to-disable' } })
    );
    expect(created.enabled).toBe(true);
    const response = await apiClient.patch(ruleUrl(created.id), {
      headers: writerHeaders,
      body: { enabled: false },
      responseType: 'json',
    });
    expect(response).toHaveStatusCode(200);
    expect(response.body.enabled).toBe(false);
  });

  apiTest('status: should return 404 when the rule does not exist', async ({ apiClient }) => {
    const response = await apiClient.patch(ruleUrl('does-not-exist'), {
      headers: writerHeaders,
      body: { metadata: { name: 'whatever' } },
      responseType: 'json',
    });
    expect(response).toHaveStatusCode(404);
    expect(response.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
  });

  apiTest(
    'validation: should reject ids longer than ID_MAX_LENGTH with a 400',
    async ({ apiClient }) => {
      const tooLongId = 'a'.repeat(ID_MAX_LENGTH + 1);
      const response = await apiClient.patch(ruleUrl(tooLongId), {
        headers: writerHeaders,
        body: { metadata: { name: 'whatever' } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(400);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    }
  );

  apiTest(
    'validation: should reject body when metadata.name exceeds MAX_NAME_LENGTH',
    async ({ apiClient, apiServices }) => {
      const created = await apiServices.alertingV2.rules.create(
        buildCreateRuleData({ metadata: { name: 'rule-to-rename' } })
      );
      const response = await apiClient.patch(ruleUrl(created.id), {
        headers: writerHeaders,
        body: { metadata: { name: 'a'.repeat(MAX_NAME_LENGTH + 1) } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(400);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    }
  );

  apiTest(
    'validation: should reject body with unknown metadata keys (strict schema)',
    async ({ apiClient, apiServices }) => {
      const created = await apiServices.alertingV2.rules.create(
        buildCreateRuleData({ metadata: { name: 'rule-strict-metadata' } })
      );
      const response = await apiClient.patch(ruleUrl(created.id), {
        headers: writerHeaders,
        body: { metadata: { unknownField: 'nope' } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(400);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    }
  );

  apiTest(
    'validation: should reject body when schedule.every is below the minimum interval',
    async ({ apiClient, apiServices }) => {
      const created = await apiServices.alertingV2.rules.create(
        buildCreateRuleData({ metadata: { name: 'rule-bad-schedule' } })
      );
      const response = await apiClient.patch(ruleUrl(created.id), {
        headers: writerHeaders,
        body: { schedule: { every: '1s' } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(400);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    }
  );

  apiTest(
    'validation: should reject state_transition updates on non-alert rules',
    async ({ apiClient, apiServices }) => {
      const created = await apiServices.alertingV2.rules.create(
        buildCreateRuleData({ kind: 'signal', metadata: { name: 'signal-rule' } })
      );
      const response = await apiClient.patch(ruleUrl(created.id), {
        headers: writerHeaders,
        body: { state_transition: { pending_count: 3, pending_timeframe: '5m' } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(400);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    }
  );

  apiTest(
    'authorization: should return 200 for a user with full alerting_v2 privileges',
    async ({ apiClient, apiServices }) => {
      const created = await apiServices.alertingV2.rules.create(
        buildCreateRuleData({ metadata: { name: 'writer-can-update' } })
      );
      const response = await apiClient.patch(ruleUrl(created.id), {
        headers: writerHeaders,
        body: { metadata: { name: 'writer-renamed' } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(200);
      expect(response.body.metadata.name).toBe('writer-renamed');
    }
  );

  apiTest(
    'authorization: should return 403 for a user with read-only alerting_v2 privileges',
    async ({ apiClient, apiServices, requestAuth }) => {
      const created = await apiServices.alertingV2.rules.create(
        buildCreateRuleData({ metadata: { name: 'reader-cannot-update' } })
      );
      const readerCredentials = await requestAuth.getApiKeyForCustomRole(READ_ROLE);
      const response = await apiClient.patch(ruleUrl(created.id), {
        headers: { ...testData.COMMON_HEADERS, ...readerCredentials.apiKeyHeader },
        body: { metadata: { name: 'attempted-rename' } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(403);
      // Verify the rule was not modified.
      const stored = await apiServices.alertingV2.rules.get(created.id);
      expect(stored.metadata.name).toBe('reader-cannot-update');
    }
  );

  apiTest(
    'authorization: should return 403 for a user without alerting_v2 privileges',
    async ({ apiClient, apiServices, requestAuth }) => {
      const created = await apiServices.alertingV2.rules.create(
        buildCreateRuleData({ metadata: { name: 'noaccess-cannot-update' } })
      );
      const noAccessCredentials = await requestAuth.getApiKeyForCustomRole(NO_ACCESS_ROLE);
      const response = await apiClient.patch(ruleUrl(created.id), {
        headers: { ...testData.COMMON_HEADERS, ...noAccessCredentials.apiKeyHeader },
        body: { metadata: { name: 'attempted-rename' } },
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(403);
      const stored = await apiServices.alertingV2.rules.get(created.id);
      expect(stored.metadata.name).toBe('noaccess-cannot-update');
    }
  );
});

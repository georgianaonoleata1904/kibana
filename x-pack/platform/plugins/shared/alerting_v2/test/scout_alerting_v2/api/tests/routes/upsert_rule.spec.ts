/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { expect } from '@kbn/scout/api';
import type { RoleApiCredentials } from '@kbn/scout';
import { ID_MAX_LENGTH } from '@kbn/alerting-v2-schemas';
import {
  ALL_ROLE,
  apiTest,
  buildCreateRuleData,
  NO_ACCESS_ROLE,
  READ_ROLE,
  ruleUrl,
  testData,
} from '../../fixtures';

apiTest.describe('Upsert rule API', { tag: '@local-stateful-classic' }, () => {
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
    'upsert: should return 201 and create the rule when the id does not exist',
    async ({ apiClient, apiServices }) => {
      const id = 'rule-to-create';
      const body = buildCreateRuleData({
        metadata: { name: 'created-via-upsert', description: 'created', tags: ['cpu'] },
      });
      const response = await apiClient.put(ruleUrl(id), {
        headers: writerHeaders,
        body,
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(201);
      expect(response.body.id).toBe(id);
      expect(response.body.metadata).toStrictEqual(body.metadata);
      const persisted = await apiServices.alertingV2.rules.get(id);
      expect(persisted.id).toBe(id);
      expect(persisted.metadata.name).toBe('created-via-upsert');
    }
  );

  apiTest(
    'upsert: should return 200 and replace the rule when the id exists',
    async ({ apiClient, apiServices }) => {
      const id = 'rule-to-replace';
      const initialBody = buildCreateRuleData({
        metadata: { name: 'initial-name', description: 'initial', tags: ['cpu'] },
      });
      // Seed an existing rule with the target id via the upsert service helper.
      const { rule: created } = await apiServices.alertingV2.rules.upsert(id, initialBody);
      const replacementBody = buildCreateRuleData({
        metadata: { name: 'replaced-name', description: 'replaced', tags: ['memory'] },
      });
      const response = await apiClient.put(ruleUrl(id), {
        headers: writerHeaders,
        body: replacementBody,
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(200);
      expect(response.body.id).toBe(id);
      // Body is replaced wholesale.
      expect(response.body.metadata).toStrictEqual(replacementBody.metadata);
      expect(response.body.schedule).toStrictEqual(replacementBody.schedule);
      expect(response.body.evaluation).toStrictEqual(replacementBody.evaluation);
      // createdAt / createdBy / enabled are preserved across an upsert-replace.
      expect(response.body.createdAt).toBe(created.createdAt);
      expect(response.body.createdBy).toBe(created.createdBy);
      expect(response.body.enabled).toBe(created.enabled);
      // updatedAt is refreshed on every replace.
      expect(response.body.updatedAt).not.toBe(created.updatedAt);
    }
  );

  apiTest(
    'upsert: should return 409 when attempting to change an immutable field (kind)',
    async ({ apiClient, apiServices }) => {
      const id = 'rule-immutable-kind';
      const { rule: created } = await apiServices.alertingV2.rules.upsert(
        id,
        buildCreateRuleData({ kind: 'alert', metadata: { name: 'alert-rule' } })
      );
      const response = await apiClient.put(ruleUrl(id), {
        headers: writerHeaders,
        body: buildCreateRuleData({ kind: 'signal', metadata: { name: 'alert-rule' } }),
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(409);
      expect(response.body).toMatchObject({ statusCode: 409, error: 'Conflict' });
      // Verify the rule was not modified.
      const stored = await apiServices.alertingV2.rules.get(id);
      expect(stored.kind).toBe(created.kind);
    }
  );

  apiTest(
    'validation: should reject ids longer than ID_MAX_LENGTH with a 400',
    async ({ apiClient }) => {
      const tooLongId = 'a'.repeat(ID_MAX_LENGTH + 1);
      const response = await apiClient.put(ruleUrl(tooLongId), {
        headers: writerHeaders,
        body: buildCreateRuleData(),
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(400);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    }
  );

  apiTest('validation: should reject body with missing metadata.name', async ({ apiClient }) => {
    const body = buildCreateRuleData();
    const invalidBody = { ...body, metadata: { description: 'no name here' } };
    const response = await apiClient.put(ruleUrl('any-id'), {
      headers: writerHeaders,
      body: invalidBody,
      responseType: 'json',
    });
    expect(response).toHaveStatusCode(400);
    expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
  });

  apiTest(
    'validation: should reject body when schedule.every is below the minimum interval',
    async ({ apiClient }) => {
      const response = await apiClient.put(ruleUrl('any-id'), {
        headers: writerHeaders,
        body: buildCreateRuleData({ schedule: { every: '1s' } }),
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(400);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    }
  );

  apiTest(
    'validation: should reject body with empty evaluation.query.base',
    async ({ apiClient }) => {
      const response = await apiClient.put(ruleUrl('any-id'), {
        headers: writerHeaders,
        body: buildCreateRuleData({ evaluation: { query: { base: '' } } }),
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(400);
      expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    }
  );

  apiTest(
    'authorization: should return 201 for a user with full alerting_v2 privileges',
    async ({ apiClient }) => {
      const response = await apiClient.put(ruleUrl('writer-can-upsert'), {
        headers: writerHeaders,
        body: buildCreateRuleData({ metadata: { name: 'writer-can-upsert' } }),
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(201);
      expect(response.body.id).toBe('writer-can-upsert');
    }
  );

  apiTest(
    'authorization: should return 403 for a user with read-only alerting_v2 privileges',
    async ({ apiClient, apiServices, requestAuth }) => {
      const readerCredentials = await requestAuth.getApiKeyForCustomRole(READ_ROLE);
      const id = 'reader-cannot-upsert';
      const response = await apiClient.put(ruleUrl(id), {
        headers: { ...testData.COMMON_HEADERS, ...readerCredentials.apiKeyHeader },
        body: buildCreateRuleData({ metadata: { name: 'attempted' } }),
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(403);
      // Verify no rule was created.
      const remaining = await apiServices.alertingV2.rules.find({ perPage: 100 });
      expect(remaining.items.map((rule) => rule.id)).not.toContain(id);
    }
  );

  apiTest(
    'authorization: should return 403 for a user without alerting_v2 privileges',
    async ({ apiClient, apiServices, requestAuth }) => {
      const noAccessCredentials = await requestAuth.getApiKeyForCustomRole(NO_ACCESS_ROLE);
      const id = 'noaccess-cannot-upsert';
      const response = await apiClient.put(ruleUrl(id), {
        headers: { ...testData.COMMON_HEADERS, ...noAccessCredentials.apiKeyHeader },
        body: buildCreateRuleData({ metadata: { name: 'attempted' } }),
        responseType: 'json',
      });
      expect(response).toHaveStatusCode(403);
      const remaining = await apiServices.alertingV2.rules.find({ perPage: 100 });
      expect(remaining.items.map((rule) => rule.id)).not.toContain(id);
    }
  );
});

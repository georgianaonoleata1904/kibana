/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KbnClient, ScoutLogger } from '@kbn/scout';
import { measurePerformanceAsync } from '@kbn/scout';
import { expect } from '@kbn/scout/api';
import type {
  BulkOperationParams,
  BulkOperationResponse,
  CreateRuleData,
  FindRulesParams,
  FindRulesResponse,
  RuleResponse,
  UpdateRuleData,
} from '@kbn/alerting-v2-schemas';
import { COMMON_HEADERS, POLL_INTERVAL_MS, POLL_TIMEOUT_MS, RULE_API_PATH } from '../constants';

export interface WaitForEnabledStateParams {
  id: string;
  enabled: boolean;
}

export interface UpsertResult {
  rule: RuleResponse;
  created: boolean;
}

export interface RulesApiService {
  create: (data: CreateRuleData, options?: { id?: string }) => Promise<RuleResponse>;
  update: (id: string, data: UpdateRuleData) => Promise<RuleResponse>;
  upsert: (id: string, data: CreateRuleData) => Promise<UpsertResult>;
  get: (id: string) => Promise<RuleResponse>;
  bulkGet: (ids: string[]) => Promise<FindRulesResponse>;
  getTags: () => Promise<string[]>;
  find: (query?: FindRulesParams) => Promise<FindRulesResponse>;
  delete: (id: string) => Promise<void>;
  bulkDelete: (params: BulkOperationParams) => Promise<BulkOperationResponse>;
  bulkDisable: (params: BulkOperationParams) => Promise<BulkOperationResponse>;
  bulkEnable: (params: BulkOperationParams) => Promise<BulkOperationResponse>;
  waitForEnabledState: (params: WaitForEnabledStateParams) => Promise<void>;
  cleanUp: () => Promise<void>;
}

const stripUndefined = <T extends Record<string, unknown>>(query: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

export const getRulesApiService = ({
  log,
  kbnClient,
}: {
  log: ScoutLogger;
  kbnClient: KbnClient;
}): RulesApiService => {
  const bulkDelete = (params: BulkOperationParams) =>
    measurePerformanceAsync(log, 'rules.bulkDelete', async () => {
      const response = await kbnClient.request<BulkOperationResponse>({
        method: 'POST',
        path: `${RULE_API_PATH}/_bulk_delete`,
        headers: COMMON_HEADERS,
        body: params,
      });
      return response.data;
    });

  const get = (id: string) =>
    measurePerformanceAsync(log, 'rules.get', async () => {
      const response = await kbnClient.request<RuleResponse>({
        method: 'GET',
        path: `${RULE_API_PATH}/${encodeURIComponent(id)}`,
      });
      return response.data;
    });

  return {
    create: (data, options) =>
      measurePerformanceAsync(log, 'rules.create', async () => {
        const path = options?.id
          ? `${RULE_API_PATH}/${encodeURIComponent(options.id)}`
          : RULE_API_PATH;
        const response = await kbnClient.request<RuleResponse>({
          method: 'POST',
          path,
          headers: COMMON_HEADERS,
          body: data,
        });
        return response.data;
      }),

    update: (id, data) =>
      measurePerformanceAsync(log, 'rules.update', async () => {
        const path = `${RULE_API_PATH}/${encodeURIComponent(id)}`;
        const response = await kbnClient.request<RuleResponse>({
          method: 'PATCH',
          path,
          headers: COMMON_HEADERS,
          body: data,
        });
        return response.data;
      }),

    upsert: (id, data) =>
      measurePerformanceAsync(log, 'rules.upsert', async () => {
        const path = `${RULE_API_PATH}/${encodeURIComponent(id)}`;
        const response = await kbnClient.request<RuleResponse>({
          method: 'PUT',
          path,
          headers: COMMON_HEADERS,
          body: data,
        });
        return { rule: response.data, created: response.status === 201 };
      }),

    get,

    bulkGet: (ids) =>
      measurePerformanceAsync(log, 'rules.bulkGet', async () => {
        const response = await kbnClient.request<FindRulesResponse>({
          method: 'GET',
          path: `${RULE_API_PATH}/_bulk`,
          query: { ids },
        });
        return response.data;
      }),

    getTags: () =>
      measurePerformanceAsync(log, 'rules.getTags', async () => {
        const response = await kbnClient.request<{ tags: string[] }>({
          method: 'GET',
          path: `${RULE_API_PATH}/_tags`,
        });
        return response.data.tags;
      }),

    find: (query = {}) =>
      measurePerformanceAsync(log, 'rules.find', async () => {
        const response = await kbnClient.request<FindRulesResponse>({
          method: 'GET',
          path: RULE_API_PATH,
          query: stripUndefined(query),
        });
        return response.data;
      }),

    delete: (id) =>
      measurePerformanceAsync(log, 'rules.delete', async () => {
        await kbnClient.request({
          method: 'DELETE',
          path: `${RULE_API_PATH}/${encodeURIComponent(id)}`,
          headers: COMMON_HEADERS,
          ignoreErrors: [404],
          retries: 0,
        });
      }),
    bulkDelete,
    bulkDisable: (params: BulkOperationParams) =>
      measurePerformanceAsync(log, 'rules.bulkDisable', async () => {
        const response = await kbnClient.request<BulkOperationResponse>({
          method: 'POST',
          path: `${RULE_API_PATH}/_bulk_disable`,
          headers: COMMON_HEADERS,
          body: params,
        });
        return response.data;
      }),
    bulkEnable: (params: BulkOperationParams) =>
      measurePerformanceAsync(log, 'rules.bulkEnable', async () => {
        const response = await kbnClient.request<BulkOperationResponse>({
          method: 'POST',
          path: `${RULE_API_PATH}/_bulk_enable`,
          headers: COMMON_HEADERS,
          body: params,
        });
        return response.data;
      }),
    waitForEnabledState: ({ id, enabled }) =>
      measurePerformanceAsync(log, 'rules.waitForEnabledState', async () => {
        await expect
          .poll(async () => (await get(id)).enabled, {
            timeout: POLL_TIMEOUT_MS,
            intervals: [POLL_INTERVAL_MS],
          })
          .toBe(enabled);
      }),
    cleanUp: () =>
      measurePerformanceAsync(log, 'rules.cleanUp', async () => {
        await bulkDelete({ match_all: true });
      }),
  };
};

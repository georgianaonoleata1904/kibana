/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { KbnClient, ScoutLogger } from '@kbn/scout';
import { measurePerformanceAsync } from '@kbn/scout';

import type { ActionPolicyResponse, CreateActionPolicyDataInput } from '@kbn/alerting-v2-schemas';

import {
  ACTION_POLICY_API_PATH,
  ACTION_POLICY_SAVED_OBJECT_TYPE,
  COMMON_HEADERS,
} from '../constants';

export interface ActionPoliciesApiService {
  create: (
    data: CreateActionPolicyDataInput,
    options?: { id?: string }
  ) => Promise<ActionPolicyResponse>;
  get: (id: string) => Promise<ActionPolicyResponse>;
  enable: (id: string) => Promise<ActionPolicyResponse>;
  disable: (id: string) => Promise<ActionPolicyResponse>;
  snooze: (id: string, snoozedUntil: string) => Promise<ActionPolicyResponse>;
  cleanUp: () => Promise<void>;
}

export const getActionPoliciesApiService = ({
  log,
  kbnClient,
}: {
  log: ScoutLogger;
  kbnClient: KbnClient;
}): ActionPoliciesApiService => {
  const get = (id: string) =>
    measurePerformanceAsync(log, 'actionPolicies.get', async () => {
      const response = await kbnClient.request<ActionPolicyResponse>({
        method: 'GET',
        path: `${ACTION_POLICY_API_PATH}/${encodeURIComponent(id)}`,
      });
      return response.data;
    });

  return {
    create: (data, options) =>
      measurePerformanceAsync(log, 'actionPolicies.create', async () => {
        const method = options?.id ? 'PUT' : 'POST';
        const path = options?.id
          ? `${ACTION_POLICY_API_PATH}/${encodeURIComponent(options.id)}`
          : ACTION_POLICY_API_PATH;
        const response = await kbnClient.request<ActionPolicyResponse>({
          method,
          path,
          headers: COMMON_HEADERS,
          body: data,
        });
        return response.data;
      }),

    get,
    enable: (id) =>
      measurePerformanceAsync(log, 'actionPolicies.enable', async () => {
        const response = await kbnClient.request<ActionPolicyResponse>({
          method: 'POST',
          path: `${ACTION_POLICY_API_PATH}/${encodeURIComponent(id)}/_enable`,
          headers: COMMON_HEADERS,
        });
        return response.data;
      }),
    disable: (id) =>
      measurePerformanceAsync(log, 'actionPolicies.disable', async () => {
        const response = await kbnClient.request<ActionPolicyResponse>({
          method: 'POST',
          path: `${ACTION_POLICY_API_PATH}/${encodeURIComponent(id)}/_disable`,
          headers: COMMON_HEADERS,
        });
        return response.data;
      }),
    snooze: (id, snoozedUntil) =>
      measurePerformanceAsync(log, 'actionPolicies.snooze', async () => {
        const response = await kbnClient.request<ActionPolicyResponse>({
          method: 'POST',
          path: `${ACTION_POLICY_API_PATH}/${encodeURIComponent(id)}/_snooze`,
          headers: COMMON_HEADERS,
          body: { snoozedUntil },
        });
        return response.data;
      }),
    cleanUp: () =>
      measurePerformanceAsync(log, 'actionPolicies.cleanUp', async () => {
        await kbnClient.savedObjects.clean({ types: [ACTION_POLICY_SAVED_OBJECT_TYPE] });
      }),
  };
};

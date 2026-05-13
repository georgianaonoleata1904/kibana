/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EsClient, ScoutLogger } from '@kbn/scout';
import { measurePerformanceAsync } from '@kbn/scout';
import type { AlertEvent } from '../../../../server/resources/datastreams/alert_events';
import type { AlertAction } from '../../../../server/resources/datastreams/alert_actions';
import {
  ALERT_ACTIONS_DATA_STREAM,
  ALERT_EVENTS_DATA_STREAM,
  DISPATCHER_SYSTEM_ACTION_TYPES,
} from '../constants';
import { getDataStreamApiService } from './data_stream_api_service';

/**
 * Shape accepted by `seedEvents`. Callers always provide `group_hash` (the
 * alert-action endpoints look events up by it); every other field is filled
 * in with sensible defaults so a typical seed is one line.
 */
export interface SeedAlertEventInput extends Partial<AlertEvent> {
  group_hash: string;
}

export interface AlertActionsApiService {
  /**
   * Bulk-index events into `.rule-events` so alert-action endpoints can
   * resolve them by `group_hash` (and `episode.id` for typed actions). Defaults
   * `@timestamp = now`, `type = 'alert'`, `status = 'breached'`,
   * `space_id = 'default'`, `rule.version = 1`.
   */
  seedEvents: (events: SeedAlertEventInput[]) => Promise<void>;
  /**
   * Returns user-written actions in `.alert-actions` for the given rule_ids,
   * sorted by `@timestamp` ascending. Dispatcher-written action_types
   * (`fire`/`suppress`/`unmatched`/`notified`) are filtered out so assertions
   * about user actions remain deterministic.
   */
  findActions: (ruleIds: string[]) => Promise<AlertAction[]>;
  /** Wipes both `.rule-events` and `.alert-actions`. */
  cleanUp: () => Promise<void>;
}

const buildAlertEvent = (input: SeedAlertEventInput): AlertEvent => {
  const now = new Date().toISOString();
  return {
    '@timestamp': now,
    scheduled_timestamp: now,
    rule: { id: 'scout-rule-id', version: 1 },
    data: {},
    status: 'breached',
    source: 'scout-test',
    type: 'alert',
    space_id: 'default',
    ...input,
  };
};

export const getAlertActionsApiService = ({
  log,
  esClient,
}: {
  log: ScoutLogger;
  esClient: EsClient;
}): AlertActionsApiService => {
  const eventsDataStream = getDataStreamApiService({
    log,
    esClient,
    dataStreamName: ALERT_EVENTS_DATA_STREAM,
  });
  const actionsDataStream = getDataStreamApiService({
    log,
    esClient,
    dataStreamName: ALERT_ACTIONS_DATA_STREAM,
  });
  return {
    seedEvents: (events) =>
      measurePerformanceAsync(log, 'alertActions.seedEvents', async () => {
        if (events.length === 0) return;
        const docs = events.map(buildAlertEvent);
        await esClient.bulk({
          operations: docs.flatMap((doc) => [
            { create: { _index: ALERT_EVENTS_DATA_STREAM } },
            doc,
          ]),
          refresh: 'wait_for',
        });
      }),
    findActions: (ruleIds) =>
      measurePerformanceAsync(log, 'alertActions.findActions', async () => {
        await esClient.indices.refresh({ index: ALERT_ACTIONS_DATA_STREAM });
        const result = await esClient.search<AlertAction>({
          index: ALERT_ACTIONS_DATA_STREAM,
          query: {
            bool: {
              must_not: [{ terms: { action_type: [...DISPATCHER_SYSTEM_ACTION_TYPES] } }],
              filter: [{ terms: { rule_id: ruleIds } }],
            },
          },
          sort: [{ '@timestamp': 'asc' }],
          size: 100,
        });
        return result.hits.hits.map((hit) => hit._source as AlertAction);
      }),
    cleanUp: async () => {
      await eventsDataStream.cleanUp();
      await actionsDataStream.cleanUp();
    },
  };
};

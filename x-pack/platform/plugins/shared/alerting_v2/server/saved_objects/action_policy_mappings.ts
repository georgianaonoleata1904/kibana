/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsTypeMappingDefinition } from '@kbn/core-saved-objects-server';

/**
 * Mappings for the action policy saved object.
 */
export const actionPolicyMappings: SavedObjectsTypeMappingDefinition = {
  dynamic: false,
  properties: {
    name: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
    description: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
    type: { type: 'keyword' },
    ruleId: { type: 'keyword' },
    enabled: { type: 'boolean' },
    groupBy: { type: 'keyword' },
    tags: { type: 'keyword' },
    groupingMode: { type: 'keyword' },
    destinations: {
      type: 'object',
      properties: {
        type: { type: 'keyword' },
        id: { type: 'keyword' },
      },
    },
    throttle: {
      type: 'object',
      properties: {
        strategy: { type: 'keyword' },
      },
    },
    snoozedUntil: { type: 'date' },
    auth: {
      type: 'object',
      properties: {
        apiKey: { type: 'binary' },
        owner: { type: 'keyword' },
        createdByUser: { type: 'boolean' },
      },
    },
    createdBy: { type: 'keyword' },
    // `createdByUsername` is no longer populated by writes (see action policy model version 2).
    // The mapping is preserved to satisfy the SO mapping-removal guardrail and to keep older
    // documents readable until they are migrated forward by the `data_removal` change.
    createdByUsername: { type: 'keyword' },
    createdAt: { type: 'date' },
    updatedBy: { type: 'keyword' },
    // `updatedByUsername` is no longer populated by writes (see action policy model version 2).
    updatedByUsername: { type: 'keyword' },
    updatedAt: { type: 'date' },
  },
};

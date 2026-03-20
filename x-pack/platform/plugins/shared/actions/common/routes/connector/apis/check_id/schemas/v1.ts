/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';

export const checkConnectorIdParamsSchema = schema.object({
  connector_id: schema.string({
    minLength: 1,
    meta: { description: 'An identifier for the connector.' },
  }),
});

export const checkConnectorIdResponseSchema = schema.object({
  is_available: schema.boolean({
    meta: {
      description: 'Indicates whether the connector ID is available for use.',
    },
  }),
});

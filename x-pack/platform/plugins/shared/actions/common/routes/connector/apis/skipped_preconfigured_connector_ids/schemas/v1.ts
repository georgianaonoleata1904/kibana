/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';

export const getSkippedPreconfiguredConnectorIdsResponseSchema = schema.object({
  skipped_preconfigured_connector_ids: schema.arrayOf(schema.string(), {
    meta: {
      description:
        'Preconfigured connector IDs that were skipped because they conflict with existing saved connectors.',
    },
  }),
});

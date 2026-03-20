/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export { checkConnectorIdParamsSchema, checkConnectorIdResponseSchema } from './schemas/latest';
export type { CheckConnectorIdParams, CheckConnectorIdResponse } from './types/latest';

export {
  checkConnectorIdParamsSchema as checkConnectorIdParamsSchemaV1,
  checkConnectorIdResponseSchema as checkConnectorIdResponseSchemaV1,
} from './schemas/v1';
export type {
  CheckConnectorIdParams as CheckConnectorIdParamsV1,
  CheckConnectorIdResponse as CheckConnectorIdResponseV1,
} from './types/v1';

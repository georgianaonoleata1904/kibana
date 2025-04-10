/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Update Saved Query Schema
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';

import {
  SavedQueryId,
  SavedQueryDescriptionOrUndefined,
  QueryOrUndefined,
  ECSMappingOrUndefined,
  VersionOrUndefined,
  PlatformOrUndefined,
  IntervalOrUndefined,
  SnapshotOrUndefined,
  RemovedOrUndefined,
} from '../model/schema/common_attributes.gen';

export type UpdateSavedQueryRequestBody = z.infer<typeof UpdateSavedQueryRequestBody>;
export const UpdateSavedQueryRequestBody = z.object({
  id: SavedQueryId.optional(),
  description: SavedQueryDescriptionOrUndefined.optional(),
  query: QueryOrUndefined.optional(),
  ecs_mapping: ECSMappingOrUndefined.optional(),
  version: VersionOrUndefined.optional(),
  platform: PlatformOrUndefined.optional(),
  interval: IntervalOrUndefined.optional(),
  snapshot: SnapshotOrUndefined.optional(),
  removed: RemovedOrUndefined.optional(),
});

export type UpdateSavedQueryResponse = z.infer<typeof UpdateSavedQueryResponse>;
export const UpdateSavedQueryResponse = z.object({});

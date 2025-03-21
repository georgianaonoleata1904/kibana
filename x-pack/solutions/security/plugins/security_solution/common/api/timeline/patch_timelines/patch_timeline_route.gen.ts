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
 *   title: Elastic Security - Timeline - Patch Timeline API
 *   version: 2023-10-31
 */

import { z } from '@kbn/zod';

import { SavedTimeline, PersistTimelineResponse } from '../model/components.gen';

export type PatchTimelineRequestBody = z.infer<typeof PatchTimelineRequestBody>;
export const PatchTimelineRequestBody = z.object({
  /**
   * The `savedObjectId` of the Timeline or Timeline template that you’re updating.
   */
  timelineId: z.string().nullable(),
  /**
   * The version of the Timeline or Timeline template that you’re updating.
   */
  version: z.string().nullable(),
  /**
   * The timeline object of the Timeline or Timeline template that you’re updating.
   */
  timeline: SavedTimeline,
});
export type PatchTimelineRequestBodyInput = z.input<typeof PatchTimelineRequestBody>;

export type PatchTimelineResponse = z.infer<typeof PatchTimelineResponse>;
export const PatchTimelineResponse = PersistTimelineResponse;

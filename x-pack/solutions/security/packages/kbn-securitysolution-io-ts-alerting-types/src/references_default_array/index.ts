/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';
import { Either } from 'fp-ts/Either';

/**
 * Types the ReferencesDefaultArray as:
 *   - If null or undefined, then a default array will be set
 */
export const ReferencesDefaultArray = new t.Type<string[], string[] | undefined, unknown>(
  'referencesWithDefaultArray',
  t.array(t.string).is,
  (input, context): Either<t.Errors, string[]> =>
    input == null ? t.success([]) : t.array(t.string).validate(input, context),
  t.identity
);

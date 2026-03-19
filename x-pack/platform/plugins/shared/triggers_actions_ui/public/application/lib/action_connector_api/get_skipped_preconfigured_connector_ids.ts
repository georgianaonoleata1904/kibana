/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { HttpSetup } from '@kbn/core/public';
import { BASE_ACTION_API_PATH } from '../../constants';

interface SkippedPreconfiguredConnectorIdsResponse {
  skippedPreconfiguredConnectorIds: string[];
}

export const getSkippedPreconfiguredConnectorIds = ({
  http,
}: {
  http: HttpSetup;
}): Promise<SkippedPreconfiguredConnectorIdsResponse> => {
  return http.get<SkippedPreconfiguredConnectorIdsResponse>(
    `${BASE_ACTION_API_PATH}/connector/_conflicted_ids`
  );
};

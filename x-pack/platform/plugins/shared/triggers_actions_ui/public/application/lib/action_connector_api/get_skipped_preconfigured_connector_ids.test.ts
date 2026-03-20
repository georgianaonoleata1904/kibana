/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { httpServiceMock } from '@kbn/core/public/mocks';
import { getSkippedPreconfiguredConnectorIds } from './get_skipped_preconfigured_connector_ids';

const http = httpServiceMock.createStartContract();

beforeEach(() => jest.resetAllMocks());

describe('getSkippedPreconfiguredConnectorIds', () => {
  it('calls the correct endpoint', async () => {
    http.get.mockResolvedValueOnce({ skipped_preconfigured_connector_ids: [] });

    await getSkippedPreconfiguredConnectorIds({ http });

    expect(http.get).toHaveBeenCalledWith('/api/actions/connector/_conflicted_ids');
  });

  it('returns the mapped skipped connector IDs', async () => {
    http.get.mockResolvedValueOnce({
      skipped_preconfigured_connector_ids: ['connector-a', 'connector-b'],
    });

    const result = await getSkippedPreconfiguredConnectorIds({ http });

    expect(result).toEqual({
      skippedPreconfiguredConnectorIds: ['connector-a', 'connector-b'],
    });
  });

  it('returns an empty array when there are no skipped connectors', async () => {
    http.get.mockResolvedValueOnce({ skipped_preconfigured_connector_ids: [] });

    const result = await getSkippedPreconfiguredConnectorIds({ http });

    expect(result).toEqual({ skippedPreconfiguredConnectorIds: [] });
  });
});

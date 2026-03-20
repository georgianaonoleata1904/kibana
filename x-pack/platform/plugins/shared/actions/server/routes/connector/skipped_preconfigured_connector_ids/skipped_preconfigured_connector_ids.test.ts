/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getSkippedPreconfiguredConnectorIdsRoute } from './skipped_preconfigured_connector_ids';
import { httpServiceMock } from '@kbn/core/server/mocks';
import { licenseStateMock } from '../../../lib/license_state.mock';
import { mockHandlerArguments } from '../../_mock_handler_arguments';
import { verifyAccessAndContext } from '../../verify_access_and_context';

jest.mock('../../verify_access_and_context', () => ({
  verifyAccessAndContext: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
  (verifyAccessAndContext as jest.Mock).mockImplementation((license, handler) => handler);
});

describe('getSkippedPreconfiguredConnectorIdsRoute', () => {
  it('registers the route at the correct path', async () => {
    const licenseState = licenseStateMock.create();
    const router = httpServiceMock.createRouter();

    getSkippedPreconfiguredConnectorIdsRoute(router, licenseState);

    const [config] = router.get.mock.calls[0];
    expect(config.path).toMatchInlineSnapshot(`"/api/actions/connector/_conflicted_ids"`);
  });

  it('returns skipped preconfigured connector IDs from context', async () => {
    const licenseState = licenseStateMock.create();
    const router = httpServiceMock.createRouter();

    getSkippedPreconfiguredConnectorIdsRoute(router, licenseState);

    const [, handler] = router.get.mock.calls[0];

    const skippedIds = new Set(['connector-a', 'connector-b']);

    const [context, req, res] = mockHandlerArguments(
      { getSkippedPreconfiguredConnectorIds: () => skippedIds },
      {},
      ['ok']
    );

    await handler(context, req, res);

    expect(res.ok).toHaveBeenCalledWith({
      body: { skipped_preconfigured_connector_ids: ['connector-a', 'connector-b'] },
    });
  });

  it('returns empty array when no preconfigured connectors were skipped', async () => {
    const licenseState = licenseStateMock.create();
    const router = httpServiceMock.createRouter();

    getSkippedPreconfiguredConnectorIdsRoute(router, licenseState);

    const [, handler] = router.get.mock.calls[0];

    const [context, req, res] = mockHandlerArguments({}, {}, ['ok']);

    await handler(context, req, res);

    expect(res.ok).toHaveBeenCalledWith({
      body: { skipped_preconfigured_connector_ids: [] },
    });
  });

  it('ensures the license allows getting skipped preconfigured connector ids', async () => {
    const licenseState = licenseStateMock.create();
    const router = httpServiceMock.createRouter();

    getSkippedPreconfiguredConnectorIdsRoute(router, licenseState);

    const [, handler] = router.get.mock.calls[0];

    const [context, req, res] = mockHandlerArguments({}, {}, ['ok']);

    await handler(context, req, res);

    expect(verifyAccessAndContext).toHaveBeenCalledWith(licenseState, expect.any(Function));
  });
});

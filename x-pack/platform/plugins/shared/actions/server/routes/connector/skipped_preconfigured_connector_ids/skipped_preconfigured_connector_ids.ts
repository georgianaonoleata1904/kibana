/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IRouter } from '@kbn/core/server';
import { schema } from '@kbn/config-schema';
import type { ILicenseState } from '../../../lib';
import { BASE_ACTION_API_PATH } from '../../../../common';
import type { ActionsRequestHandlerContext } from '../../../types';
import { verifyAccessAndContext } from '../../verify_access_and_context';
import { DEFAULT_ACTION_ROUTE_SECURITY } from '../../constants';

const responseSchema = schema.object({
  skippedPreconfiguredConnectorIds: schema.arrayOf(schema.string(), {
    meta: {
      description:
        'Preconfigured connector IDs that were skipped because they conflict with existing saved connectors.',
    },
  }),
});

export const getSkippedPreconfiguredConnectorIdsRoute = (
  router: IRouter<ActionsRequestHandlerContext>,
  licenseState: ILicenseState
) => {
  router.get(
    {
      path: `${BASE_ACTION_API_PATH}/connector/_conflicted_ids`,
      security: DEFAULT_ACTION_ROUTE_SECURITY,
      options: {
        access: 'public',
        summary: 'Get preconfigured connector IDs that were skipped due to conflicts',
        description:
          'Returns preconfigured connector IDs that were skipped because they conflict with existing connectors.',
        tags: ['oas-tag:connectors'],
      },
      validate: {
        request: {},
        response: {
          200: {
            body: () => responseSchema,
            description:
              'Returns preconfigured connector IDs that were skipped because they conflict with existing connectors.',
          },
        },
      },
    },
    router.handleLegacyErrors(
      verifyAccessAndContext(licenseState, async function (context, req, res) {
        const skippedIds = (await context.actions).getSkippedPreconfiguredConnectorIds();
        return res.ok({
          body: { skippedPreconfiguredConnectorIds: Array.from(skippedIds) },
        });
      })
    )
  );
};

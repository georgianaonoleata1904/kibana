/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IRouter } from '@kbn/core/server';
import type { ILicenseState } from '../../../lib';
import type { ActionsRequestHandlerContext } from '../../../types';
import { verifyAccessAndContext } from '../../verify_access_and_context';
import { DEFAULT_ACTION_ROUTE_SECURITY } from '../../constants';
import {
  checkConnectorIdParamsSchemaV1,
  checkConnectorIdResponseSchemaV1,
} from '../../../../common/routes/connector/apis/check_id';
import type { CheckConnectorIdParamsV1 } from '../../../../common/routes/connector/apis/check_id';

export const checkConnectorIdRoute = (
  router: IRouter<ActionsRequestHandlerContext>,
  licenseState: ILicenseState
) => {
  router.get(
    {
      path: `${INTERNAL_BASE_ACTION_API_PATH}/connector/{connector_id}/_availability`,
      security: DEFAULT_ACTION_ROUTE_SECURITY,
      options: {
        access: 'internal',
        summary: 'Check if a connector ID is available',
        tags: ['oas-tag:connectors'],
      },
      validate: {
        request: {
          params: checkConnectorIdParamsSchemaV1,
        },
        response: {
          200: {
            body: () => checkConnectorIdResponseSchemaV1,
            description: 'Returns whether the connector ID is available.',
          },
        },
      },
    },
    router.handleLegacyErrors(
      verifyAccessAndContext(licenseState, async function (context, req, res) {
        const actionsClient = (await context.actions).getActionsClient();
        const { connector_id }: CheckConnectorIdParamsV1 = req.params;

        try {
          await actionsClient.get({ id: connector_id, throwIfSystemAction: false });
          return res.ok({
            body: { is_available: false },
          });
        } catch (error) {
          if (error?.output?.statusCode === 404) {
            return res.ok({
              body: { is_available: true },
            });
          }
          throw error;
        }
      })
    )
  );
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { savedObjectsClientMock } from '@kbn/core-saved-objects-api-server-mocks';
import { actionsAuthorizationMock } from '../../../../authorization/actions_authorization.mock';
import type { ActionsAuthorization } from '../../../../authorization/actions_authorization';
import { elasticsearchServiceMock } from '@kbn/core-elasticsearch-server-mocks';
import { httpServerMock } from '@kbn/core-http-server-mocks';
import { auditLoggerMock } from '@kbn/security-plugin/server/audit/mocks';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import type { Logger } from '@kbn/logging';
import type { ActionTypeRegistry } from '../../../../action_type_registry';
import type { AuthTypeRegistry } from '../../../../auth_types/auth_type_registry';
import { authTypeRegistryMock } from '../../../../auth_types/auth_type_registry.mock';
import { update } from './update';
import { getConnectorType } from '../../../../fixtures';
import type { ActionsClientContext } from '../../../../actions_client';
import { actionExecutorMock } from '../../../../lib/action_executor.mock';
import { connectorTokenClientMock } from '../../../../lib/connector_token_client.mock';
import { encryptedSavedObjectsMock } from '@kbn/encrypted-saved-objects-plugin/server/mocks';
import { z } from '@kbn/zod';

const unsecuredSavedObjectsClient = savedObjectsClientMock.create();
const scopedClusterClient = elasticsearchServiceMock.createScopedClusterClient();
const authorization = actionsAuthorizationMock.create();
const request = httpServerMock.createKibanaRequest();
const auditLogger = auditLoggerMock.create();
const logger = loggingSystemMock.create().get() as jest.Mocked<Logger>;
const preSaveHook = jest.fn();
const postSaveHook = jest.fn();
const actionExecutor = actionExecutorMock.create();
const connectorTokenClient = connectorTokenClientMock.create();
const encryptedSavedObjectsClient = encryptedSavedObjectsMock.createClient();
const bulkExecutionEnqueuer = jest.fn();
const getEventLogClient = jest.fn();
const getAxiosInstanceWithAuth = jest.fn();

const actionTypeRegistry: ActionTypeRegistry = {
  get: jest.fn(),
  isSystemActionType: jest.fn().mockReturnValue(false),
  ensureActionTypeEnabled: jest.fn(),
  isDeprecated: jest.fn().mockReturnValue(false),
  getUtils: jest.fn().mockReturnValue({
    isHostnameAllowed: jest.fn().mockReturnValue(true),
    isUriAllowed: jest.fn().mockReturnValue(true),
    getMicrosoftGraphApiUrl: jest.fn(),
    getProxySettings: jest.fn(),
  }),
} as unknown as ActionTypeRegistry;

const authTypeRegistry = authTypeRegistryMock.create() as unknown as AuthTypeRegistry;

const mockContext: ActionsClientContext = {
  actionTypeRegistry,
  authTypeRegistry,
  authorization: authorization as unknown as ActionsAuthorization,
  unsecuredSavedObjectsClient,
  scopedClusterClient,
  request,
  auditLogger,
  logger,
  inMemoryConnectors: [],
  kibanaIndices: ['.kibana'],
  actionExecutor,
  bulkExecutionEnqueuer,
  connectorTokenClient,
  getEventLogClient,
  encryptedSavedObjectsClient,
  isESOCanEncrypt: true,
  getAxiosInstanceWithAuth,
};

const existingRawAction = {
  id: 'connector-id',
  type: 'action',
  attributes: {
    actionTypeId: 'my-connector-type',
    name: 'old name',
    isMissingSecrets: false,
    config: { oldField: 'old' },
    secrets: { oldSecret: 'old' },
    authMode: 'shared',
  },
  references: [],
  version: '1',
};

const savedObjectCreateResult = {
  id: 'connector-id',
  type: 'action',
  attributes: {
    actionTypeId: 'my-connector-type',
    name: 'new name',
    isMissingSecrets: false,
    config: { field: 'value' },
    authMode: 'shared',
  },
  references: [],
};

describe('update()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    unsecuredSavedObjectsClient.get.mockResolvedValue(existingRawAction as never);
    unsecuredSavedObjectsClient.create.mockResolvedValue(savedObjectCreateResult as never);
    (actionTypeRegistry.get as jest.Mock).mockReturnValue(
      getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
        },
      })
    );
    authorization.ensureAuthorized.mockResolvedValue(undefined);
    connectorTokenClient.deleteConnectorTokens.mockResolvedValue(undefined);
  });

  describe('authorization', () => {
    test('ensures user is authorised to update this type of action', async () => {
      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: {}, secrets: {} },
      });

      expect(authorization.ensureAuthorized).toHaveBeenCalledWith({ operation: 'update' });
    });

    test('throws when user is not authorised to update', async () => {
      authorization.ensureAuthorized.mockRejectedValue(new Error('Unauthorized to update'));

      await expect(
        update({
          context: mockContext,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: {} },
        })
      ).rejects.toThrow('Unauthorized to update');
    });
  });

  describe('preconfigured and system action guards', () => {
    test('throws when updating a system action', async () => {
      const contextWithSystemAction = {
        ...mockContext,
        inMemoryConnectors: [
          {
            id: 'connector-id',
            actionTypeId: 'my-connector-type',
            name: 'System Action',
            isSystemAction: true,
            isPreconfigured: false,
            config: {},
            secrets: {},
            isDeprecated: false,
            isConnectorTypeDeprecated: false,
          },
        ],
      };

      await expect(
        update({
          context: contextWithSystemAction,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: {} },
        })
      ).rejects.toThrow('System action connector-id can not be updated.');
    });

    test('throws when updating a preconfigured connector', async () => {
      const contextWithPreconfigured = {
        ...mockContext,
        inMemoryConnectors: [
          {
            id: 'connector-id',
            actionTypeId: 'my-connector-type',
            name: 'Preconfigured Connector',
            isPreconfigured: true,
            isSystemAction: false,
            config: {},
            secrets: {},
            isDeprecated: false,
            isConnectorTypeDeprecated: false,
          },
        ],
      };

      await expect(
        update({
          context: contextWithPreconfigured,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: {} },
        })
      ).rejects.toThrow('Preconfigured action connector-id can not be updated.');
    });
  });

  describe('schema validation', () => {
    test('validates config with the connector type schema and persists transformed value', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any().transform(() => ({ validated: true })) },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
        },
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: { raw: true }, secrets: {} },
      });

      expect(unsecuredSavedObjectsClient.create).toHaveBeenCalledWith(
        'action',
        expect.objectContaining({ config: { validated: true } }),
        expect.anything()
      );
    });

    test('validates secrets with the connector type schema and persists transformed value', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.any().transform(() => ({ validatedSecret: true })) },
          params: { schema: z.object({}) },
        },
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: {}, secrets: { raw: 'secret' } },
      });

      expect(unsecuredSavedObjectsClient.create).toHaveBeenCalledWith(
        'action',
        expect.objectContaining({ secrets: { validatedSecret: true } }),
        expect.anything()
      );
    });

    test('throws when config fails schema validation', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.object({ requiredField: z.string() }) },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
        },
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await expect(
        update({
          context: mockContext,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: {} },
        })
      ).rejects.toThrow(/error validating connector type config/);
    });

    test('throws when secrets fail schema validation', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.object({ apiKey: z.string() }) },
          params: { schema: z.object({}) },
        },
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await expect(
        update({
          context: mockContext,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: {} },
        })
      ).rejects.toThrow(/error validating connector type secrets/);
    });

    test('calls validateConnector when connector validator is defined', async () => {
      const connectorValidator = jest.fn().mockReturnValue(null);
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
          connector: connectorValidator,
        },
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: { url: 'https://example.com' }, secrets: { key: 'k' } },
      });

      expect(connectorValidator).toHaveBeenCalledWith({ url: 'https://example.com' }, { key: 'k' });
    });

    test('throws when connector validator returns an error', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
          connector: () => 'config and secrets are incompatible',
        },
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await expect(
        update({
          context: mockContext,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: {} },
        })
      ).rejects.toThrow(
        /error validating action type connector.*config and secrets are incompatible/
      );
    });

    test('throws when config has wrong type for Zod schema', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.object({ port: z.number() }) },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
        },
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await expect(
        update({
          context: mockContext,
          id: 'connector-id',
          action: { name: 'new name', config: { port: 'not-a-number' }, secrets: {} },
        })
      ).rejects.toThrow(/error validating connector type config/);
    });

    test('throws when secrets have wrong type for Zod schema', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.object({ apiKey: z.string() }) },
          params: { schema: z.object({}) },
        },
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await expect(
        update({
          context: mockContext,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: { apiKey: 12345 } },
        })
      ).rejects.toThrow(/error validating connector type secrets/);
    });
  });

  describe('successful update', () => {
    test('returns the updated connector', async () => {
      const result = await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: { field: 'value' }, secrets: {} },
      });

      expect(result).toEqual({
        id: 'connector-id',
        actionTypeId: 'my-connector-type',
        name: 'new name',
        isMissingSecrets: false,
        config: { field: 'value' },
        isPreconfigured: false,
        isSystemAction: false,
        isDeprecated: false,
        isConnectorTypeDeprecated: false,
      });
    });

    test('persists the validated config and secrets to saved objects', async () => {
      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: { field: 'value' }, secrets: { key: 'secret' } },
      });

      expect(unsecuredSavedObjectsClient.create).toHaveBeenCalledWith(
        'action',
        expect.objectContaining({
          name: 'new name',
          isMissingSecrets: false,
        }),
        expect.objectContaining({ id: 'connector-id', overwrite: true })
      );
    });

    test('ensures action type is enabled before saving', async () => {
      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: {}, secrets: {} },
      });

      expect(actionTypeRegistry.ensureActionTypeEnabled).toHaveBeenCalledWith('my-connector-type');
    });

    test('deletes connector tokens after a successful update', async () => {
      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: {}, secrets: {} },
      });

      expect(connectorTokenClient.deleteConnectorTokens).toHaveBeenCalledWith(
        expect.objectContaining({ connectorId: 'connector-id' })
      );
    });
  });

  describe('auditLogger', () => {
    test('logs audit event on successful update', async () => {
      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: {}, secrets: {} },
      });

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.objectContaining({
            action: 'connector_update',
            outcome: 'unknown',
          }),
          kibana: { saved_object: { id: 'connector-id', type: 'action' } },
        })
      );
    });

    test('logs audit event when not authorised to update', async () => {
      authorization.ensureAuthorized.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        update({
          context: mockContext,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: {} },
        })
      ).rejects.toThrow();

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.objectContaining({ action: 'connector_update' }),
          error: { code: 'Error', message: 'Unauthorized' },
        })
      );
    });
  });

  describe('hooks', () => {
    test('calls preSaveHook before saving when defined', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
        },
        preSaveHook,
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: { url: 'https://example.com' }, secrets: {} },
      });

      expect(preSaveHook).toHaveBeenCalledWith(
        expect.objectContaining({
          connectorId: 'connector-id',
          isUpdate: true,
          config: { url: 'https://example.com' },
        })
      );
    });

    test('throws when preSaveHook throws', async () => {
      preSaveHook.mockRejectedValue(new Error('pre-save failed'));
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
        },
        preSaveHook,
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await expect(
        update({
          context: mockContext,
          id: 'connector-id',
          action: { name: 'new name', config: {}, secrets: {} },
        })
      ).rejects.toThrow('pre-save failed');
    });

    test('calls postSaveHook after saving when defined', async () => {
      const actionType = getConnectorType({
        id: 'my-connector-type',
        validate: {
          config: { schema: z.any() },
          secrets: { schema: z.any() },
          params: { schema: z.object({}) },
        },
        postSaveHook,
      });
      (actionTypeRegistry.get as jest.Mock).mockReturnValue(actionType);

      await update({
        context: mockContext,
        id: 'connector-id',
        action: { name: 'new name', config: {}, secrets: {} },
      });

      expect(postSaveHook).toHaveBeenCalledWith(
        expect.objectContaining({
          connectorId: 'connector-id',
          isUpdate: true,
          wasSuccessful: true,
        })
      );
    });
  });
});

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Prevent any breaking changes to context requirement from breaking the alert form/actions
 */

import React, { Fragment, lazy } from 'react';
import { nextTick } from '@kbn/test-jest-helpers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { coreMock } from '@kbn/core/public/mocks';
import { actionTypeRegistryMock } from '@kbn/triggers-actions-ui-plugin/public/application/action_type_registry.mock';
import { ruleTypeRegistryMock } from '@kbn/triggers-actions-ui-plugin/public/application/rule_type_registry.mock';
import {
  ValidationResult,
  Rule,
  GenericValidationResult,
  RuleTypeModel,
} from '@kbn/triggers-actions-ui-plugin/public/types';
import ActionForm from '@kbn/triggers-actions-ui-plugin/public/application/sections/action_connector_form/action_form';
import { Legacy } from '../legacy_shims';
import { I18nProvider } from '@kbn/i18n-react';
import { createKibanaReactContext } from '@kbn/kibana-react-plugin/public';

jest.mock('@kbn/triggers-actions-ui-plugin/public/application/lib/action_connector_api', () => ({
  loadAllActions: jest.fn(),
  loadActionTypes: jest.fn(),
}));
const { loadActionTypes } = jest.requireMock(
  '@kbn/triggers-actions-ui-plugin/public/application/lib/action_connector_api'
);

jest.mock('@kbn/kibana-react-plugin/public/ui_settings/use_ui_setting', () => ({
  useUiSetting: jest.fn().mockImplementation((_, defaultValue) => defaultValue),
}));

const initLegacyShims = () => {
  const triggersActionsUi = {
    actionTypeRegistry: actionTypeRegistryMock.create(),
    ruleTypeRegistry: ruleTypeRegistryMock.create(),
  };
  const data = { query: { timefilter: { timefilter: {} } } } as any;
  Legacy.init({
    core: coreMock.createStart(),
    data,
    isCloud: false,
    triggersActionsUi,
    usageCollection: {},
  } as any);
};

const ALERTS_FEATURE_ID = 'alerts';
const validationMethod = (): ValidationResult => ({ errors: {} });
const actionTypeRegistry = actionTypeRegistryMock.create();

describe('alert_form', () => {
  beforeEach(() => {
    initLegacyShims();
    jest.resetAllMocks();
  });

  const ruleType: RuleTypeModel = {
    id: 'alert-type',
    iconClass: 'test',
    description: 'Testing',
    documentationUrl: 'https://...',
    validate: validationMethod,
    ruleParamsExpression: () => <Fragment />,
    requiresAppContext: false,
  };

  const mockedActionParamsFields = lazy(async () => ({
    default() {
      return <Fragment />;
    },
  }));

  const actionType = {
    id: 'alert-action-type',
    iconClass: '',
    selectMessage: '',
    validateParams: (): Promise<GenericValidationResult<unknown>> => {
      const validationResult = { errors: {} };
      return Promise.resolve(validationResult);
    },
    actionConnectorFields: null,
    actionParamsFields: mockedActionParamsFields,
  };

  describe('alert_form > action_form', () => {
    describe('action_form in alert', () => {
      async function setup() {
        initLegacyShims();
        const { loadAllActions } = jest.requireMock(
          '@kbn/triggers-actions-ui-plugin/public/application/lib/action_connector_api'
        );
        loadAllActions.mockResolvedValueOnce([
          {
            secrets: {},
            id: 'test',
            actionTypeId: actionType.id,
            name: 'Test connector',
            config: {},
            isPreconfigured: false,
          },
        ]);

        actionTypeRegistry.list.mockReturnValue([actionType]);
        actionTypeRegistry.has.mockReturnValue(true);
        actionTypeRegistry.get.mockReturnValue(actionType);

        const initialAlert = {
          name: 'test',
          alertTypeId: ruleType.id,
          params: {},
          consumer: ALERTS_FEATURE_ID,
          schedule: {
            interval: '1m',
          },
          actions: [
            {
              group: 'default',
              id: 'test',
              actionTypeId: actionType.id,
              params: {
                message: '',
              },
            },
          ],
          tags: [],
          muteAll: false,
          enabled: false,
          mutedInstanceIds: [],
        } as unknown as Rule;

        loadActionTypes.mockResolvedValue([
          {
            id: actionType.id,
            name: 'Test',
            enabled: true,
            enabledInConfig: true,
            enabledInLicense: true,
            minimumLicenseRequired: 'basic',
            supportedFeatureIds: ['alerting'],
          },
        ]);

        const KibanaReactContext = createKibanaReactContext(Legacy.shims.kibanaServices);

        const actionWrapper = mount(
          <I18nProvider>
            <KibanaReactContext.Provider>
              <QueryClientProvider client={new QueryClient()}>
                <ActionForm
                  actions={initialAlert.actions}
                  defaultActionGroupId={'default'}
                  setActionIdByIndex={(id: string, index: number) => {
                    initialAlert.actions[index].id = id;
                  }}
                  setActions={() => {}}
                  setActionParamsProperty={(key: string, value: unknown, index: number) =>
                    (initialAlert.actions[index] = { ...initialAlert.actions[index], [key]: value })
                  }
                  setActionFrequencyProperty={(key: string, value: unknown, index: number) =>
                    (initialAlert.actions[index] = { ...initialAlert.actions[index], [key]: value })
                  }
                  setActionAlertsFilterProperty={(key: string, value: unknown, index: number) =>
                    (initialAlert.actions[index] = { ...initialAlert.actions[index], [key]: value })
                  }
                  actionTypeRegistry={actionTypeRegistry}
                  featureId="alerting"
                  producerId="alerting"
                  ruleTypeId=".es-query"
                />
              </QueryClientProvider>
            </KibanaReactContext.Provider>
          </I18nProvider>
        );

        // Wait for active space to resolve before requesting the component to update
        await act(async () => {
          await nextTick();
          actionWrapper.update();
        });

        return actionWrapper;
      }

      it('renders available action cards', async () => {
        const wrapperTwo = await setup();
        const actionOption = wrapperTwo.find(
          `[data-test-subj="${actionType.id}-alerting-ActionTypeSelectOption"]`
        );
        expect(actionOption.exists()).toBeTruthy();
      });
    });
  });
});

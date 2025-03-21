/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiErrorBoundary } from '@elastic/eui';
import { mount } from 'enzyme';
import { createObservabilityRuleTypeRegistryMock } from '@kbn/observability-plugin/public';
import { observabilityAIAssistantPluginMock } from '@kbn/observability-ai-assistant-plugin/public/mock';

import { UXAppRoot } from './ux_app';
import { RumHome } from '../components/app/rum_dashboard/rum_home';
import { coreMock } from '@kbn/core/public/mocks';
import { merge } from 'lodash';
import { UI_SETTINGS } from '@kbn/data-plugin/common';
import { embeddablePluginMock } from '@kbn/embeddable-plugin/public/mocks';
import { BehaviorSubject } from 'rxjs';
import { ChromeStyle } from '@kbn/core-chrome-browser';

jest.mock('../services/rest/data_view', () => ({
  createStaticDataView: () => Promise.resolve(undefined),
}));

jest.mock('../components/app/rum_dashboard/rum_home', () => ({
  RumHome: () => <p>Home Mock</p>,
}));

jest.mock('@kbn/kibana-react-plugin/public', () => {
  const actual = jest.requireActual('@kbn/kibana-react-plugin/public');
  return {
    ...actual,
    useUiSetting: () => ({
      from: new Date(),
      to: new Date(),
    }),
  };
});

const mockAIAssistantPlugin = observabilityAIAssistantPluginMock.createStartContract();

const mockPlugin = {
  data: {
    query: {
      timefilter: { timefilter: { setTime: () => {}, getTime: () => ({}) } },
    },
  },
  observability: {},
  observabilityAIAssistant: mockAIAssistantPlugin,
};

const mockCorePlugins = {
  embeddable: embeddablePluginMock.createStartContract(),
  inspector: {},
  maps: {},
  observabilityShared: {
    navigation: {
      registerSections: () => jest.fn(),
      PageTemplate: ({ children }: { children: React.ReactNode }) => (
        <div>hello worlds {children}</div>
      ),
    },
  },
  observabilityAIAssistant: mockAIAssistantPlugin,
  data: {
    query: {
      timefilter: {
        timefilter: {
          setTime: jest.fn(),
          getTime: jest.fn().mockReturnValue({}),
          getTimeDefaults: jest.fn().mockReturnValue({}),
          getRefreshIntervalDefaults: jest.fn().mockReturnValue({}),
          getRefreshInterval: jest.fn().mockReturnValue({}),
        },
      },
    },
  },
};
const coreStart = coreMock.createStart({ basePath: '/basepath' });

const mockCore = merge({}, coreStart, {
  application: {
    capabilities: {
      apm: {},
      ml: {},
    },
  },
  uiSettings: {
    get: (key: string) => {
      const uiSettings: Record<string, unknown> = {
        [UI_SETTINGS.TIMEPICKER_QUICK_RANGES]: [
          {
            from: 'now/d',
            to: 'now/d',
            display: 'Today',
          },
          {
            from: 'now/w',
            to: 'now/w',
            display: 'This week',
          },
        ],
        [UI_SETTINGS.TIMEPICKER_TIME_DEFAULTS]: {
          from: 'now-15m',
          to: 'now',
        },
        [UI_SETTINGS.TIMEPICKER_REFRESH_INTERVAL_DEFAULTS]: {
          pause: false,
          value: 100000,
        },
      };
      return uiSettings[key];
    },
  },
  chrome: {
    ...coreStart.chrome,
    getChromeStyle$: () => new BehaviorSubject<ChromeStyle>('classic').asObservable(),
  },
});

export const mockApmPluginContextValue = {
  appMountParameters: coreMock.createAppMountParameters('/basepath'),
  core: mockCore,
  plugins: mockPlugin,
  observabilityRuleTypeRegistry: createObservabilityRuleTypeRegistryMock(),
  observabilityAIAssistant: mockAIAssistantPlugin,
  corePlugins: mockCorePlugins,
  deps: {},
};

describe('renderUxApp', () => {
  it('has an error boundary for the UXAppRoot', async () => {
    const wrapper = mount(<UXAppRoot {...(mockApmPluginContextValue as any)} />);

    wrapper.find(RumHome).simulateError(new Error('Oh no, an unexpected error!'));

    expect(wrapper.find(RumHome)).toHaveLength(0);
    expect(wrapper.find(EuiErrorBoundary)).toHaveLength(1);
    expect(wrapper.find(EuiErrorBoundary).text()).toMatch(/Error: Oh no, an unexpected error!/);
  });
});

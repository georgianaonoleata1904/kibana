/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  PluginSetupContract as AlertingPluginPublicSetup,
  PluginStartContract as AlertingPluginPublicStart,
} from '@kbn/alerting-plugin/public';
import type { ChartsPluginStart } from '@kbn/charts-plugin/public';
import type {
  ApplicationStart,
  AppMountParameters,
  CoreSetup,
  CoreStart,
  NotificationsStart,
  Plugin,
  PluginInitializerContext,
  SecurityServiceStart,
} from '@kbn/core/public';
import { DEFAULT_APP_CATEGORIES } from '@kbn/core/public';
import type { DataPublicPluginSetup, DataPublicPluginStart } from '@kbn/data-plugin/public';
import type { DataViewsPublicPluginStart } from '@kbn/data-views-plugin/public';
import type { DiscoverSetup, DiscoverStart } from '@kbn/discover-plugin/public';
import type { EmbeddableSetup, EmbeddableStart } from '@kbn/embeddable-plugin/public';
import type { ExploratoryViewPublicSetup } from '@kbn/exploratory-view-plugin/public';
import type { FeaturesPluginSetup } from '@kbn/features-plugin/public';
import type { FieldFormatsStart } from '@kbn/field-formats-plugin/public';
import type { FleetStart } from '@kbn/fleet-plugin/public';
import type { HomePublicPluginSetup } from '@kbn/home-plugin/public';
import { i18n } from '@kbn/i18n';
import type { MetricsDataPluginStart } from '@kbn/metrics-data-access-plugin/public';
import type { Start as InspectorPluginStart } from '@kbn/inspector-plugin/public';
import type { IStorageWrapper } from '@kbn/kibana-utils-plugin/public';
import type { LensPublicStart } from '@kbn/lens-plugin/public';
import type { LicenseManagementUIPluginSetup } from '@kbn/license-management-plugin/public';
import type { LicensingPluginStart } from '@kbn/licensing-plugin/public';
import type { MapsStartApi } from '@kbn/maps-plugin/public';
import type { MlPluginSetup, MlPluginStart } from '@kbn/ml-plugin/public';
import type {
  ObservabilityAIAssistantPublicSetup,
  ObservabilityAIAssistantPublicStart,
} from '@kbn/observability-ai-assistant-plugin/public';
import type {
  FetchDataParams,
  ObservabilityPublicSetup,
  ObservabilityPublicStart,
} from '@kbn/observability-plugin/public';
import { ObservabilityTriggerId } from '@kbn/observability-shared-plugin/common';
import type {
  ObservabilitySharedPluginSetup,
  ObservabilitySharedPluginStart,
} from '@kbn/observability-shared-plugin/public';
import { METRIC_TYPE } from '@kbn/observability-shared-plugin/public';
import type { ProfilingPluginSetup, ProfilingPluginStart } from '@kbn/profiling-plugin/public';
import type { SecurityPluginStart } from '@kbn/security-plugin/public';
import type { SharePluginSetup } from '@kbn/share-plugin/public';
import type { SpacesPluginStart } from '@kbn/spaces-plugin/public';
import type {
  TriggersAndActionsUIPublicPluginSetup,
  TriggersAndActionsUIPublicPluginStart,
} from '@kbn/triggers-actions-ui-plugin/public';
import type { UiActionsSetup, UiActionsStart } from '@kbn/ui-actions-plugin/public';
import type { UnifiedSearchPublicPluginStart } from '@kbn/unified-search-plugin/public';
import type { UsageCollectionStart } from '@kbn/usage-collection-plugin/public';
import type { DashboardStart } from '@kbn/dashboard-plugin/public';
import type { IUiSettingsClient, SettingsStart } from '@kbn/core-ui-settings-browser';
import { from } from 'rxjs';
import { map } from 'rxjs';
import type { CloudSetup } from '@kbn/cloud-plugin/public';
import type { ServerlessPluginStart } from '@kbn/serverless/public';
import type { LogsSharedClientStartExports } from '@kbn/logs-shared-plugin/public';
import type { LogsDataAccessPluginStart } from '@kbn/logs-data-access-plugin/public';
import type { SavedSearchPublicPluginStart } from '@kbn/saved-search-plugin/public';
import type { FieldsMetadataPublicStart } from '@kbn/fields-metadata-plugin/public';
import type { SharePublicStart } from '@kbn/share-plugin/public/plugin';
import type { ApmSourceAccessPluginStart } from '@kbn/apm-sources-access-plugin/public';
import type { CasesPublicStart } from '@kbn/cases-plugin/public';
import type { ConfigSchema } from '.';
import { registerApmRuleTypes } from './components/alerting/rule_types/register_apm_rule_types';
import { registerEmbeddables } from './embeddable/register_embeddables';
import {
  getApmEnrollmentFlyoutData,
  LazyApmCustomAssetsExtension,
} from './components/fleet_integration';
import { getLazyApmAgentsTabExtension } from './components/fleet_integration/lazy_apm_agents_tab_extension';
import { getLazyAPMPolicyCreateExtension } from './components/fleet_integration/lazy_apm_policy_create_extension';
import { getLazyAPMPolicyEditExtension } from './components/fleet_integration/lazy_apm_policy_edit_extension';
import { featureCatalogueEntry } from './feature_catalogue_entry';
import { APMServiceDetailLocator } from './locator/service_detail_locator';
import type { ITelemetryClient } from './services/telemetry';
import { TelemetryService } from './services/telemetry';

export type ApmPluginSetup = ReturnType<ApmPlugin['setup']>;
export type ApmPluginStart = ReturnType<ApmPlugin['start']>;

export interface ApmPluginSetupDeps {
  alerting?: AlertingPluginPublicSetup;
  data: DataPublicPluginSetup;
  discover?: DiscoverSetup;
  embeddable: EmbeddableSetup;
  exploratoryView: ExploratoryViewPublicSetup;
  unifiedSearch: UnifiedSearchPublicPluginStart;
  features: FeaturesPluginSetup;
  home?: HomePublicPluginSetup;
  licenseManagement?: LicenseManagementUIPluginSetup;
  ml?: MlPluginSetup;
  observability: ObservabilityPublicSetup;
  observabilityShared: ObservabilitySharedPluginSetup;
  observabilityAIAssistant?: ObservabilityAIAssistantPublicSetup;
  triggersActionsUi: TriggersAndActionsUIPublicPluginSetup;
  share: SharePluginSetup;
  uiActions: UiActionsSetup;
  profiling?: ProfilingPluginSetup;
  cloud?: CloudSetup;
}

export interface ApmServices {
  securityService: SecurityServiceStart;
  telemetry: ITelemetryClient;
}

export interface ApmPluginStartDeps {
  alerting?: AlertingPluginPublicStart;
  application: ApplicationStart;
  cases?: CasesPublicStart;
  charts?: ChartsPluginStart;
  data: DataPublicPluginStart;
  discover?: DiscoverStart;
  embeddable: EmbeddableStart;
  home: void;
  inspector: InspectorPluginStart;
  licensing: LicensingPluginStart;
  maps?: MapsStartApi;
  ml?: MlPluginStart;
  triggersActionsUi: TriggersAndActionsUIPublicPluginStart;
  observability: ObservabilityPublicStart;
  observabilityShared: ObservabilitySharedPluginStart;
  observabilityAIAssistant?: ObservabilityAIAssistantPublicStart;
  fleet?: FleetStart;
  fieldFormats: FieldFormatsStart;
  security?: SecurityPluginStart;
  settings: SettingsStart;
  spaces?: SpacesPluginStart;
  serverless?: ServerlessPluginStart;
  dataViews: DataViewsPublicPluginStart;
  unifiedSearch: UnifiedSearchPublicPluginStart;
  storage: IStorageWrapper;
  lens: LensPublicStart;
  uiActions: UiActionsStart;
  profiling?: ProfilingPluginStart;
  dashboard: DashboardStart;
  metricsDataAccess: MetricsDataPluginStart;
  uiSettings: IUiSettingsClient;
  logsShared: LogsSharedClientStartExports;
  logsDataAccess: LogsDataAccessPluginStart;
  apmSourcesAccess: ApmSourceAccessPluginStart;
  savedSearch: SavedSearchPublicPluginStart;
  fieldsMetadata: FieldsMetadataPublicStart;
  share?: SharePublicStart;
  notifications: NotificationsStart;
}

const applicationsTitle = i18n.translate('xpack.apm.navigation.rootTitle', {
  defaultMessage: 'Applications',
});

const servicesTitle = i18n.translate('xpack.apm.navigation.servicesTitle', {
  defaultMessage: 'Service inventory',
});

const serviceGroupsTitle = i18n.translate('xpack.apm.navigation.serviceGroupsTitle', {
  defaultMessage: 'Service groups',
});

const tracesTitle = i18n.translate('xpack.apm.navigation.tracesTitle', {
  defaultMessage: 'Traces',
});
const serviceMapTitle = i18n.translate('xpack.apm.navigation.serviceMapTitle', {
  defaultMessage: 'Service map',
});

const dependenciesTitle = i18n.translate('xpack.apm.navigation.dependenciesTitle', {
  defaultMessage: 'Dependencies',
});

const apmSettingsTitle = i18n.translate('xpack.apm.navigation.apmSettingsTitle', {
  defaultMessage: 'Settings',
});

const apmStorageExplorerTitle = i18n.translate('xpack.apm.navigation.apmStorageExplorerTitle', {
  defaultMessage: 'Storage explorer',
});

const apmTutorialTitle = i18n.translate('xpack.apm.navigation.apmTutorialTitle', {
  defaultMessage: 'Tutorial',
});

export class ApmPlugin implements Plugin<ApmPluginSetup, ApmPluginStart> {
  private telemetry: TelemetryService;
  private kibanaVersion: string;
  private isServerlessEnv: boolean;
  constructor(private readonly initializerContext: PluginInitializerContext<ConfigSchema>) {
    this.initializerContext = initializerContext;
    this.telemetry = new TelemetryService();
    this.kibanaVersion = initializerContext.env.packageInfo.version;
    this.isServerlessEnv = initializerContext.env.packageInfo.buildFlavor === 'serverless';
  }

  public setup(core: CoreSetup, plugins: ApmPluginSetupDeps) {
    const config = this.initializerContext.config.get();
    const pluginSetupDeps = plugins;
    const { featureFlags } = config;

    if (pluginSetupDeps.home) {
      pluginSetupDeps.home.featureCatalogue.register(featureCatalogueEntry);
    }

    // register observability nav if user has access to plugin
    plugins.observabilityShared.navigation.registerSections(
      from(core.getStartServices()).pipe(
        map(([coreStart, pluginsStart]) => {
          if (coreStart.application.capabilities.apm.show) {
            return [
              // APM navigation
              {
                label: applicationsTitle,
                sortKey: 400,
                entries: [
                  {
                    label: servicesTitle,
                    app: 'apm',
                    path: '/services',
                    matchPath(currentPath: string) {
                      return [
                        '/service-groups',
                        '/mobile-services',
                        '/services',
                        '/service-map',
                      ].some((testPath) => currentPath.startsWith(testPath));
                    },
                  },
                  { label: tracesTitle, app: 'apm', path: '/traces' },
                  {
                    label: dependenciesTitle,
                    app: 'apm',
                    path: '/dependencies/inventory',
                    onClick: () => {
                      const { usageCollection } = pluginsStart as {
                        usageCollection?: UsageCollectionStart;
                      };

                      if (usageCollection) {
                        usageCollection.reportUiCounter(
                          'apm',
                          METRIC_TYPE.CLICK,
                          'side_nav_dependency'
                        );
                      }
                    },
                  },
                ],
              },
            ];
          }

          return [];
        })
      )
    );

    const getApmDataHelper = async () => {
      const { fetchObservabilityOverviewPageData, getHasData } = await import(
        './services/rest/apm_observability_overview_fetchers'
      );
      const { hasFleetApmIntegrations } = await import('./tutorial/tutorial_apm_fleet_check');

      const { createCallApmApi } = await import('./services/rest/create_call_apm_api');

      // have to do this here as well in case app isn't mounted yet
      createCallApmApi(core);

      return {
        fetchObservabilityOverviewPageData,
        getHasData,
        hasFleetApmIntegrations,
      };
    };

    this.telemetry.setup({ analytics: core.analytics });

    // Registers a status check callback for the tutorial to call and verify if the APM integration is installed on fleet.
    pluginSetupDeps.home?.tutorials.registerCustomStatusCheck(
      'apm_fleet_server_status_check',
      async () => {
        const { hasFleetApmIntegrations } = await getApmDataHelper();
        return hasFleetApmIntegrations();
      }
    );

    // Registers custom component that is going to be render on fleet section
    pluginSetupDeps.home?.tutorials.registerCustomComponent('TutorialFleetInstructions', () =>
      import('./tutorial/tutorial_fleet_instructions').then((mod) => mod.TutorialFleetInstructions)
    );

    pluginSetupDeps.home?.tutorials.registerCustomComponent('TutorialConfigAgent', () =>
      import('./tutorial/config_agent').then((mod) => mod.TutorialConfigAgent)
    );

    pluginSetupDeps.home?.tutorials.registerCustomComponent('TutorialConfigAgentRumScript', () =>
      import('./tutorial/config_agent/rum_script').then((mod) => mod.TutorialConfigAgentRumScript)
    );

    pluginSetupDeps.uiActions.registerTrigger({
      id: ObservabilityTriggerId.ApmTransactionContextMenu,
    });

    pluginSetupDeps.uiActions.registerTrigger({
      id: ObservabilityTriggerId.ApmErrorContextMenu,
    });

    plugins.observability.dashboard.register({
      appName: 'apm',
      hasData: async () => {
        const dataHelper = await getApmDataHelper();
        return await dataHelper.getHasData();
      },
      fetchData: async (params: FetchDataParams) => {
        const dataHelper = await getApmDataHelper();
        return await dataHelper.fetchObservabilityOverviewPageData(params);
      },
    });

    plugins.exploratoryView.register({
      appName: 'apm',
      hasData: async () => {
        const dataHelper = await getApmDataHelper();
        return await dataHelper.getHasData();
      },
      fetchData: async (params: FetchDataParams) => {
        const dataHelper = await getApmDataHelper();
        return await dataHelper.fetchObservabilityOverviewPageData(params);
      },
    });

    const { observabilityRuleTypeRegistry } = plugins.observability;

    // Register APM telemetry based events
    const telemetry = this.telemetry.start();

    const isCloudEnv = !!pluginSetupDeps.cloud?.isCloudEnabled;
    const isServerlessEnv = pluginSetupDeps.cloud?.isServerlessEnabled || this.isServerlessEnv;
    const kibanaEnvironment = {
      isCloudEnv,
      isServerlessEnv,
      kibanaVersion: this.kibanaVersion,
    };

    core.application.register({
      id: 'apm',
      title: 'Applications',
      order: 8300,
      euiIconType: 'logoObservability',
      appRoute: '/app/apm',
      icon: 'plugins/apm/public/icon.svg',
      category: DEFAULT_APP_CATEGORIES.observability,
      keywords: ['apm'],
      deepLinks: [
        {
          id: 'service-groups-list',
          title: serviceGroupsTitle,
          path: '/service-groups',
        },
        {
          id: 'services',
          title: servicesTitle,
          path: '/services',
        },
        {
          id: 'traces',
          title: tracesTitle,
          path: '/traces',
        },
        { id: 'service-map', title: serviceMapTitle, path: '/service-map' },
        {
          id: 'dependencies',
          title: dependenciesTitle,
          path: '/dependencies/inventory',
        },
        { id: 'settings', title: apmSettingsTitle, path: '/settings' },
        {
          id: 'storage-explorer',
          title: apmStorageExplorerTitle,
          path: '/storage-explorer',
          visibleIn: featureFlags.storageExplorerAvailable ? ['globalSearch'] : [],
        },
        { id: 'tutorial', title: apmTutorialTitle, path: '/tutorial' },
      ],

      mount: async (appMountParameters: AppMountParameters<unknown>) => {
        // Load application bundle and Get start services
        const [{ renderApp }, [coreStart, pluginsStart]] = await Promise.all([
          import('./application'),
          core.getStartServices(),
        ]);
        return renderApp({
          coreStart,
          pluginsSetup: pluginSetupDeps as ApmPluginSetupDeps,
          appMountParameters,
          config,
          kibanaEnvironment,
          pluginsStart: pluginsStart as ApmPluginStartDeps,
          observabilityRuleTypeRegistry,
          apmServices: {
            securityService: coreStart.security,
            telemetry,
          },
        });
      },
    });

    registerApmRuleTypes(observabilityRuleTypeRegistry);
    registerEmbeddables({
      coreSetup: core,
      pluginsSetup: plugins,
      config,
      kibanaEnvironment,
      observabilityRuleTypeRegistry,
    });

    const locator = plugins.share.url.locators.create(new APMServiceDetailLocator(core.uiSettings));

    return {
      locator,
    };
  }

  public start(core: CoreStart, plugins: ApmPluginStartDeps) {
    const { fleet } = plugins;

    plugins.observabilityAIAssistant?.service.register(async ({ registerRenderFunction }) => {
      const mod = await import('./assistant_functions');

      mod.registerAssistantFunctions({
        registerRenderFunction,
      });
    });

    if (fleet) {
      const agentEnrollmentExtensionData = getApmEnrollmentFlyoutData();

      fleet.registerExtension({
        package: 'apm',
        view: 'agent-enrollment-flyout',
        title: agentEnrollmentExtensionData.title,
        Component: agentEnrollmentExtensionData.Component,
      });

      fleet.registerExtension({
        package: 'apm',
        view: 'package-detail-assets',
        Component: LazyApmCustomAssetsExtension,
      });

      fleet.registerExtension({
        package: 'apm',
        view: 'package-policy-create',
        Component: getLazyAPMPolicyCreateExtension(),
      });

      fleet.registerExtension({
        package: 'apm',
        view: 'package-policy-edit',
        useLatestPackageVersion: true,
        Component: getLazyAPMPolicyEditExtension(),
      });

      fleet.registerExtension({
        package: 'apm',
        view: 'package-policy-edit-tabs',
        tabs: [{ title: 'APM Agents', Component: getLazyApmAgentsTabExtension() }],
      });
    }
  }
}

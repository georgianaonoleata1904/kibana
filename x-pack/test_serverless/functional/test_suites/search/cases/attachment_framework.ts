/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../../ftr_provider_context';

export default ({ getPageObject, getService }: FtrProviderContext) => {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const dashboard = getPageObject('dashboard');
  const lens = getPageObject('lens');
  const svlSearchNavigation = getService('svlSearchNavigation');
  const svlCommonNavigation = getPageObject('svlCommonNavigation');
  const svlCommonPage = getPageObject('svlCommonPage');
  const settings = getPageObject('settings');
  const dashboardPanelActions = getService('dashboardPanelActions');

  describe('persistable attachment', () => {
    before(async () => {
      await svlCommonPage.loginWithPrivilegedRole();
    });

    describe('lens visualization', () => {
      before(async () => {
        await esArchiver.loadIfNeeded(
          'x-pack/platform/test/fixtures/es_archives/logstash_functional'
        );
        await kibanaServer.importExport.load(
          'x-pack/test/functional/fixtures/kbn_archiver/lens/lens_basic.json'
        );

        await settings.refreshDataViewFieldList('default:all-data', { ignoreMissing: true });

        await svlSearchNavigation.navigateToLandingPage();

        await svlCommonNavigation.sidenav.clickLink({ deepLinkId: 'dashboards' });

        await dashboard.clickNewDashboard();

        await lens.createAndAddLensFromDashboard({ ignoreTimeFilter: true });
      });

      after(async () => {
        await esArchiver.unload('x-pack/platform/test/fixtures/es_archives/logstash_functional');
        await kibanaServer.importExport.unload(
          'x-pack/test/functional/fixtures/kbn_archiver/lens/lens_basic.json'
        );
      });

      it('does not show actions to add lens visualization to case', async () => {
        await dashboardPanelActions.expectMissingPanelAction(
          'embeddablePanelAction-embeddable_addToExistingCase'
        );
      });
    });
  });
};

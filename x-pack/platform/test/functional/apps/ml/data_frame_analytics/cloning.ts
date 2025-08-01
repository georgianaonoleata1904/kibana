/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { DeepPartial } from '@kbn/ml-plugin/common/types/common';
import type { DataFrameAnalyticsConfig } from '@kbn/ml-data-frame-analytics-utils';

import { FtrProviderContext } from '../../../ftr_provider_context';

export default function ({ getService }: FtrProviderContext) {
  const esArchiver = getService('esArchiver');
  const ml = getService('ml');

  describe('jobs cloning supported by UI form', function () {
    const testDataList: Array<{
      suiteTitle: string;
      archive: string;
      dataView: { name: string; timeField: string };
      job: DeepPartial<DataFrameAnalyticsConfig>;
    }> = (() => {
      const timestamp = Date.now();

      return [
        {
          suiteTitle: 'classification job supported by the form',
          archive: 'x-pack/platform/test/fixtures/es_archives/ml/bm_classification',
          dataView: { name: 'ft_bank_marketing', timeField: '@timestamp' },
          job: {
            id: `bm_1_${timestamp}`,
            description:
              "Classification job based on 'ft_bank_marketing' dataset with dependentVariable 'y' and trainingPercent '20'",
            source: {
              index: ['ft_bank_marketing'],
              query: {
                match_all: {},
              },
            },
            dest: {
              get index(): string {
                return `user-bm_1_${timestamp}`;
              },
              results_field: 'ml',
            },
            analysis: {
              classification: {
                prediction_field_name: 'test',
                dependent_variable: 'y',
                training_percent: 20,
              },
            },
            analyzed_fields: {
              includes: [],
              excludes: [],
            },
            model_memory_limit: '60mb',
            allow_lazy_start: false,
          },
        },
        {
          suiteTitle: 'outlier detection job supported by the form',
          archive: 'x-pack/platform/test/fixtures/es_archives/ml/ihp_outlier',
          dataView: { name: 'ft_ihp_outlier', timeField: '@timestamp' },
          job: {
            id: `ihp_1_${timestamp}`,
            description: 'This is the job description',
            source: {
              index: ['ft_ihp_outlier'],
              query: {
                match_all: {},
              },
            },
            dest: {
              get index(): string {
                return `user-ihp_1_${timestamp}`;
              },
              results_field: 'ml',
            },
            analysis: {
              outlier_detection: {},
            },
            analyzed_fields: {
              includes: [],
              excludes: [],
            },
            model_memory_limit: '5mb',
          },
        },
        {
          suiteTitle: 'regression job supported by the form',
          archive: 'x-pack/platform/test/fixtures/es_archives/ml/egs_regression',
          dataView: { name: 'ft_egs_regression', timeField: '@timestamp' },
          job: {
            id: `egs_1_${timestamp}`,
            description: 'This is the job description',
            source: {
              index: ['ft_egs_regression'],
              query: {
                match_all: {},
              },
            },
            dest: {
              get index(): string {
                return `user-egs_1_${timestamp}`;
              },
              results_field: 'ml',
            },
            analysis: {
              regression: {
                prediction_field_name: 'test',
                dependent_variable: 'stab',
                training_percent: 20,
              },
            },
            analyzed_fields: {
              includes: [],
              excludes: [],
            },
            model_memory_limit: '20mb',
          },
        },
      ];
    })();

    before(async () => {
      await ml.testResources.setKibanaTimeZoneToUTC();
      await ml.securityUI.loginAsMlPowerUser();
    });

    after(async () => {
      await ml.api.cleanMlIndices();
    });

    for (const testData of testDataList) {
      describe(`${testData.suiteTitle}`, function () {
        const cloneJobId = `${testData.job.id}_clone`;
        const cloneDestIndex = `${testData.job!.dest!.index}_clone`;

        before(async () => {
          await esArchiver.loadIfNeeded(testData.archive);
          await ml.testResources.createDataViewIfNeeded(
            testData.dataView.name,
            testData.dataView.timeField
          );
          await ml.api.createDataFrameAnalyticsJob(testData.job as DataFrameAnalyticsConfig);

          await ml.navigation.navigateToStackManagementMlSection('analytics', 'mlAnalyticsJobList');
          await ml.dataFrameAnalyticsTable.waitForAnalyticsToLoad();
          await ml.dataFrameAnalyticsTable.filterWithSearchString(testData.job.id as string, 1);
          await ml.dataFrameAnalyticsTable.cloneJob(testData.job.id as string);
        });

        after(async () => {
          await ml.api.deleteIndices(cloneDestIndex);
          await ml.api.deleteIndices(testData.job.dest!.index as string);
          await ml.testResources.deleteDataViewByTitle(testData.job.dest!.index as string);
          await ml.testResources.deleteDataViewByTitle(cloneDestIndex);
          await ml.testResources.deleteDataViewByTitle(testData.dataView.name);
        });

        it('opens the existing job in the data frame analytics job wizard', async () => {
          await ml.testExecution.logTestStep('should open the wizard with a proper header');
          const headerText = await ml.dataFrameAnalyticsCreation.getHeaderText();
          expect(headerText).to.match(/Clone job/);
          await ml.dataFrameAnalyticsCreation.assertConfigurationStepActive();
        });

        it('navigates through the wizard, checks and sets all needed fields', async () => {
          await ml.testExecution.logTestStep(
            'should have correct init form values for config step'
          );
          await ml.dataFrameAnalyticsCreation.assertInitialCloneJobConfigStep(
            testData.job as DataFrameAnalyticsConfig
          );

          await ml.testExecution.logTestStep('should continue to the additional options step');
          await ml.dataFrameAnalyticsCreation.continueToAdditionalOptionsStep();

          await ml.testExecution.logTestStep(
            'should have correct init form values for additional options step'
          );
          await ml.dataFrameAnalyticsCreation.assertInitialCloneJobAdditionalOptionsStep(
            testData.job.analysis as DataFrameAnalyticsConfig['analysis']
          );

          await ml.testExecution.logTestStep('should continue to the details step');
          await ml.dataFrameAnalyticsCreation.continueToDetailsStep();

          await ml.testExecution.logTestStep(
            'should have correct init form values for details step'
          );
          await ml.dataFrameAnalyticsCreation.assertInitialCloneJobDetailsStep(
            testData.job as DataFrameAnalyticsConfig
          );
          await ml.dataFrameAnalyticsCreation.setJobId(cloneJobId);
          // open the dest index input
          await ml.dataFrameAnalyticsCreation.assertDestIndexSameAsIdSwitchExists();
          await ml.dataFrameAnalyticsCreation.setDestIndexSameAsIdCheckState(false);
          await ml.dataFrameAnalyticsCreation.setDestIndex(cloneDestIndex);

          await ml.testExecution.logTestStep('should continue to the validation step');
          await ml.dataFrameAnalyticsCreation.continueToValidationStep();

          await ml.testExecution.logTestStep('Should have validation callouts');
          await ml.dataFrameAnalyticsCreation.assertValidationCalloutsExists();

          if (testData?.job?.analysis?.outlier_detection !== undefined) {
            await ml.dataFrameAnalyticsCreation.assertAllValidationCalloutsPresent(1);
          } else {
            await ml.dataFrameAnalyticsCreation.assertAllValidationCalloutsPresent(
              testData?.job?.analysis?.regression !== undefined ? 3 : 4
            );
          }

          await ml.testExecution.logTestStep('should continue to the create step');
          await ml.dataFrameAnalyticsCreation.continueToCreateStep();
        });

        it('runs the clone analytics job and displays it correctly in the job list', async () => {
          await ml.testExecution.logTestStep(
            'should have enabled Create button on a valid form input'
          );
          expect(await ml.dataFrameAnalyticsCreation.isCreateButtonDisabled()).to.be(false);

          await ml.testExecution.logTestStep('should create a clone job');
          await ml.dataFrameAnalyticsCreation.createAnalyticsJob(cloneJobId);

          await ml.testExecution.logTestStep('should finish analytics processing');
          await ml.dataFrameAnalytics.waitForAnalyticsCompletion(cloneJobId);

          await ml.testExecution.logTestStep(
            'should display the created job in the analytics table'
          );
          await ml.navigation.navigateToStackManagementMlSection('analytics', 'mlAnalyticsJobList');
          await ml.dataFrameAnalyticsTable.refreshAnalyticsTable();
          await ml.dataFrameAnalyticsTable.filterWithSearchString(cloneJobId, 1);
        });
      });
    }
  });
}

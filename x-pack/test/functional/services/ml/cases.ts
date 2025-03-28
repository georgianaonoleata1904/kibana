/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SwimlaneType } from '@kbn/ml-plugin/public/application/explorer/explorer_constants';
import type { AnomalySwimLaneEmbeddableState } from '@kbn/ml-plugin/public';
import type { FtrProviderContext } from '../../ftr_provider_context';
import type { MlAnomalySwimLane } from './swim_lane';
import type { MlAnomalyCharts } from './anomaly_charts';

export interface CaseParams {
  title: string;
  description: string;
  reporter: string;
  tag: string;
}

export interface Attachment {
  swimLaneType: SwimlaneType;
}

export function MachineLearningCasesProvider(
  { getPageObject, getService }: FtrProviderContext,
  mlAnomalySwimLane: MlAnomalySwimLane,
  mlAnomalyCharts: MlAnomalyCharts
) {
  const testSubjects = getService('testSubjects');
  const cases = getService('cases');
  const elasticChart = getService('elasticChart');

  return {
    async openCaseInCasesApp(tag: string) {
      await cases.navigation.navigateToApp('cases', 'cases-app');
      await cases.casesTable.waitForTableToFinishLoading();
      await cases.casesTable.filterByTag(tag);
      await cases.casesTable.waitForTableToFinishLoading();
      await cases.casesTable.goToFirstListedCase();
    },

    async assertBasicCaseProps(params: CaseParams) {
      await this.openCaseInCasesApp(params.tag);
      await elasticChart.setNewChartUiDebugFlag(true);

      // Assert case details
      await cases.singleCase.assertCaseTitle(params.title);
      await cases.singleCase.assertCaseDescription(params.description);
    },

    async assertCaseWithAnomalySwimLaneAttachment(
      params: CaseParams,
      attachment: AnomalySwimLaneEmbeddableState,
      expectedSwimLaneState: {
        yAxisLabelCount: number;
      }
    ) {
      await this.assertBasicCaseProps(params);

      await testSubjects.existOrFail('comment-persistableState-ml_anomaly_swimlane');

      await mlAnomalySwimLane.waitForSwimLanesToLoad();
      await mlAnomalySwimLane.assertAxisLabelCount(
        `mlSwimLaneEmbeddable_${attachment.id}`,
        'y',
        expectedSwimLaneState.yAxisLabelCount
      );
    },

    async assertCaseWithAnomalyChartsAttachment(
      params: CaseParams,
      attachment: { id?: string; jobIds: string[]; maxSeriesToPlot: number },
      expectedChartsCount: number
    ) {
      await this.assertBasicCaseProps(params);
      await testSubjects.existOrFail('comment-persistableState-ml_anomaly_charts');

      await mlAnomalyCharts.assertAnomalyExplorerChartsCount(
        attachment.id !== undefined ? `mlExplorerEmbeddable_${attachment.id}` : undefined,
        expectedChartsCount
      );
    },

    async assertCaseWithLogPatternAnalysisAttachment(params: CaseParams) {
      await this.assertBasicCaseProps(params);
      await testSubjects.existOrFail('comment-persistableState-aiopsPatternAnalysisEmbeddable');
      await testSubjects.existOrFail('aiopsEmbeddablePatternAnalysis');
      await testSubjects.existOrFail('aiopsLogPatternsTable');
    },

    async assertCaseWithChangePointDetectionChartsAttachment(params: CaseParams) {
      await this.assertBasicCaseProps(params);
      await testSubjects.existOrFail('comment-persistableState-aiopsChangePointChart');
      await testSubjects.existOrFail('aiopsEmbeddableChangePointChart');
    },

    async assertCaseWithLogRateAnalysisAttachment(params: CaseParams) {
      await this.assertBasicCaseProps(params);
      await testSubjects.existOrFail('comment-persistableState-aiopsLogRateAnalysisEmbeddable');
      await testSubjects.existOrFail('aiopsEmbeddableLogRateAnalysis');
      await testSubjects.existOrFail('aiopsDocumentCountChart');
      await testSubjects.existOrFail('aiopsLogRateAnalysisResults');
    },
  };
}

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  EuiCode,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiLink,
  EuiSpacer,
  EuiIcon,
  EuiText,
  EuiHorizontalRule,
  EuiPanel,
} from '@elastic/eui';
import { css } from '@emotion/css';
import { useKibana } from '../hooks/use_kibana';
import type { UseKnowledgeBaseResult } from '../hooks/use_knowledge_base';

const panelContainerClassName = css`
  width: 330px;
`;

export function WelcomeMessageKnowledgeBaseSetupErrorPanel({
  knowledgeBase,
  onRetryInstall,
}: {
  knowledgeBase: UseKnowledgeBaseResult;
  onRetryInstall: (inferenceId: string) => void;
}) {
  const { http } = useKibana().services;

  const modelId = knowledgeBase.status.value?.endpoint?.service_settings?.model_id;
  const deploymentState = knowledgeBase.status.value?.modelStats?.deployment_stats?.state;
  const deploymentReason = knowledgeBase.status.value?.modelStats?.deployment_stats?.reason;
  const allocationState =
    knowledgeBase.status.value?.modelStats?.deployment_stats?.allocation_status?.state;
  const inferenceId = knowledgeBase.status.value?.modelStats?.deployment_stats?.deployment_id;

  return (
    <div
      className={panelContainerClassName}
      data-test-subj="observabilityAiAssistantWelcomeMessageKnowledgeBaseSetupErrorPanel"
    >
      <EuiPanel hasBorder={false} hasShadow={false} paddingSize="m">
        <EuiDescriptionList>
          <EuiDescriptionListTitle>
            {i18n.translate('xpack.aiAssistant.welcomeMessage.issuesDescriptionListTitleLabel', {
              defaultMessage: 'Issues',
            })}
          </EuiDescriptionListTitle>

          <EuiSpacer size="s" />

          <EuiDescriptionListDescription>
            <ul>
              {deploymentState ? (
                <>
                  <li>
                    <EuiIcon type="alert" color="subdued" />{' '}
                    <FormattedMessage
                      id="xpack.aiAssistant.welcomeMessage.modelIsNotDeployedLabel"
                      defaultMessage="Model {modelId} is not deployed"
                      values={{
                        modelId: <EuiCode>{modelId}</EuiCode>,
                      }}
                    />
                  </li>
                  <li>
                    <EuiIcon type="alert" color="subdued" />{' '}
                    <FormattedMessage
                      id="xpack.aiAssistant.welcomeMessage.modelIsNotStartedLabel"
                      defaultMessage="Deployment state of {modelId} is {deploymentState}"
                      values={{
                        modelId: <EuiCode>{modelId}</EuiCode>,
                        deploymentState: <EuiCode>{deploymentState}</EuiCode>,
                      }}
                    />
                  </li>
                </>
              ) : null}

              {deploymentReason ? (
                <li>
                  <EuiIcon type="alert" color="subdued" />{' '}
                  <FormattedMessage
                    id="xpack.aiAssistant.welcomeMessage.modelIsNotStartedLabelReason"
                    defaultMessage="reason: {reason}"
                    values={{
                      reason: <EuiCode>{deploymentReason}</EuiCode>,
                    }}
                  />
                </li>
              ) : null}

              {allocationState ? (
                <li>
                  <EuiIcon type="alert" color="subdued" />{' '}
                  <FormattedMessage
                    id="xpack.aiAssistant.welcomeMessage.modelIsNotFullyAllocatedLabel"
                    defaultMessage="Allocation state of {modelId} is {allocationState}"
                    values={{
                      modelId: <EuiCode>{modelId}</EuiCode>,
                      allocationState: <EuiCode>{allocationState}</EuiCode>,
                    }}
                  />
                </li>
              ) : null}
            </ul>
          </EuiDescriptionListDescription>
        </EuiDescriptionList>
      </EuiPanel>

      <EuiHorizontalRule margin="none" />

      <EuiPanel hasBorder={false} hasShadow={false} paddingSize="m">
        <EuiText color="subdued" size="xs">
          <FormattedMessage
            id="xpack.aiAssistant.welcomeMessage.div.checkTrainedModelsToLabel"
            defaultMessage="
                {retryInstallingLink} or check {trainedModelsLink} to ensure {modelId} is deployed and running."
            values={{
              modelId,
              retryInstallingLink: (
                <EuiLink
                  data-test-subj="observabilityAiAssistantWelcomeMessageKnowledgeBaseSetupErrorPanelRetryInstallingLink"
                  onClick={() => onRetryInstall(inferenceId!)} // TODO: check behaviour in error state
                >
                  {i18n.translate(
                    'xpack.aiAssistant.welcomeMessageKnowledgeBaseSetupErrorPanel.retryInstallingLinkLabel',
                    { defaultMessage: 'Retry install' }
                  )}
                </EuiLink>
              ),
              trainedModelsLink: (
                <EuiLink
                  data-test-subj="observabilityAiAssistantWelcomeMessageTrainedModelsLink"
                  external
                  href={http?.basePath.prepend('/app/management/ml/trained_models')}
                  target="_blank"
                >
                  {i18n.translate('xpack.aiAssistant.welcomeMessage.trainedModelsLinkLabel', {
                    defaultMessage: 'Trained Models',
                  })}
                </EuiLink>
              ),
            }}
          />
        </EuiText>
      </EuiPanel>
    </div>
  );
}

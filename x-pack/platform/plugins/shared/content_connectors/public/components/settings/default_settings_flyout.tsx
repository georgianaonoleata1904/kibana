/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useRef } from 'react';

import { useValues, useActions } from 'kea';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { useKibana } from '@kbn/kibana-react-plugin/public';
import { SettingsLogic } from './settings_logic';
import { SettingsPanel } from './settings_panel';

export interface DefaultSettingsFlyoutProps {
  closeFlyout: () => void;
}

const Callout = (
  <EuiCallOut
    title={i18n.translate('xpack.contentConnectors.defaultSettingsFlyout.callout.title', {
      defaultMessage: 'Individual settings management',
    })}
  >
    {i18n.translate('xpack.contentConnectors.defaultSettingsFlyout.callout.body', {
      defaultMessage:
        'You can also enable or disable this feature for a specific index on the index’s configuration page.',
    })}
  </EuiCallOut>
);
export const DefaultSettingsFlyout: React.FC<DefaultSettingsFlyoutProps> = ({ closeFlyout }) => {
  const modalTitleId = useGeneratedHtmlId();

  const {
    services: { http, docLinks },
  } = useKibana();
  const { makeRequest, setPipeline } = useActions(SettingsLogic({ http }));
  const { defaultPipeline, hasNoChanges, isLoading, pipelineState } = useValues(
    SettingsLogic({ http })
  );
  const {
    extract_binary_content: extractBinaryContent,
    reduce_whitespace: reduceWhitespace,
    run_ml_inference: runMLInference,
  } = pipelineState;
  // Reference the first focusable element in the flyout for accessibility on click or Enter key action either Reset or Save button
  const firstFocusInFlyoutRef = useRef<HTMLAnchorElement>(null);
  return (
    <EuiFlyout onClose={closeFlyout} size="s" paddingSize="l" aria-labelledby={modalTitleId}>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h4 id={modalTitleId}>
            {i18n.translate(
              'xpack.contentConnectors.defaultSettingsFlyout.h2.defaultSettingsLabel',
              {
                defaultMessage: 'Default Settings',
              }
            )}
          </h4>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody banner={Callout}>
        <EuiText>
          <p>
            <FormattedMessage
              id="xpack.contentConnectors..defaultSettingsFlyout.body.description.label"
              defaultMessage="These settings apply to all new Elasticsearch indices created by Search ingestion mechanisms. For API ingest-based indices, remember to include the pipeline when you ingest documents. These features are powered by {link}"
              values={{
                link: (
                  <EuiLink
                    data-test-subj="entSearchContent-defaultSettingsFlyout-ingestPipelinesLink"
                    data-telemetry-id="entSearchContent-defaultSettingsFlyout-ingestPipelinesLink"
                    href={docLinks?.links.ingest.pipelines}
                    target="_blank"
                    ref={firstFocusInFlyoutRef}
                  >
                    {i18n.translate(
                      'xpack.contentConnectors.defaultSettingsFlyout.body.description.ingestPipelinesLink.link',
                      {
                        defaultMessage: 'ingest pipelines',
                      }
                    )}
                  </EuiLink>
                ),
              }}
            />
          </p>
        </EuiText>
        <EuiSpacer />
        <SettingsPanel
          description={i18n.translate(
            'xpack.contentConnectors.content.settings.contentExtraction.description',
            {
              defaultMessage:
                'Extract searchable content from binary files, like PDFs and Word documents.',
            }
          )}
          label={i18n.translate(
            'xpack.contentConnectors.content.settings.contactExtraction.label',
            {
              defaultMessage: 'Content extraction',
            }
          )}
          onChange={() =>
            setPipeline({
              ...pipelineState,
              extract_binary_content: !pipelineState.extract_binary_content,
            })
          }
          title={i18n.translate(
            'xpack.contentConnectors.content.settings.contentExtraction.title',
            {
              defaultMessage: 'Deployment wide content extraction',
            }
          )}
          value={extractBinaryContent}
        />
        <EuiSpacer size="s" />
        <SettingsPanel
          description={i18n.translate(
            'xpack.contentConnectors.content.settings.whiteSpaceReduction.description',
            {
              defaultMessage:
                'Whitespace reduction will strip your full-text content of whitespace by default.',
            }
          )}
          label={i18n.translate(
            'xpack.contentConnectors.content.settings.whitespaceReduction.label',
            {
              defaultMessage: 'Whitespace reduction',
            }
          )}
          onChange={() =>
            setPipeline({
              ...pipelineState,
              reduce_whitespace: !pipelineState.reduce_whitespace,
            })
          }
          title={i18n.translate(
            'xpack.contentConnectors.content.settings.whitespaceReduction.deploymentHeaderTitle',
            {
              defaultMessage: 'Deployment wide whitespace reduction',
            }
          )}
          value={reduceWhitespace}
        />
        <EuiSpacer size="s" />
        <SettingsPanel
          description={i18n.translate(
            'xpack.contentConnectors.content.settings.mlInference.description',
            {
              defaultMessage:
                'ML Inference Pipelines will run as part of your pipelines. You will have to configure processors for each index individually on its pipelines page.',
            }
          )}
          label={i18n.translate('xpack.contentConnectors.content.settings.mlInference.label', {
            defaultMessage: 'ML Inference',
          })}
          link={
            <EuiLink
              data-test-subj="entSearchContent-defaultSettingsFlyout-mlInferenceLink"
              data-telemetry-id="entSearchContent-defaultSettingsFlyout-mlInferenceLink"
              href={docLinks?.links.enterpriseSearch.mlDocumentEnrichment}
              target="_blank"
            >
              {i18n.translate('xpack.contentConnectors.content.settings.mlInference.link', {
                defaultMessage: 'Learn more about document enrichment with ML',
              })}
            </EuiLink>
          }
          onChange={() =>
            setPipeline({
              ...pipelineState,
              run_ml_inference: !pipelineState.run_ml_inference,
            })
          }
          title={i18n.translate(
            'xpack.contentConnectors.content.settings.mlInference.deploymentHeaderTitle',
            {
              defaultMessage: 'Deployment wide ML Inference Pipelines extraction',
            }
          )}
          value={runMLInference}
        />
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              onClick={() => closeFlyout()}
              data-test-subj={'entSearchContentSettingsCancelButtonButton'}
            >
              {i18n.translate('xpack.contentConnectors.content.settings.cancelButtonLabel', {
                defaultMessage: 'Cancel',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="primary"
                  disabled={hasNoChanges}
                  isLoading={isLoading}
                  onClick={() => {
                    setPipeline(defaultPipeline);
                    firstFocusInFlyoutRef.current?.focus();
                  }}
                  data-test-subj={'entSearchContentSettingsResetButton'}
                >
                  {i18n.translate('xpack.contentConnectors.content.settings.resetButtonLabel', {
                    defaultMessage: 'Reset',
                  })}
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  color="primary"
                  fill
                  disabled={hasNoChanges}
                  isLoading={isLoading}
                  onClick={() => {
                    makeRequest({ ...pipelineState, http });
                    firstFocusInFlyoutRef.current?.focus();
                  }}
                  data-test-subj={'entSearchContentSettingsSaveButton'}
                >
                  {i18n.translate('xpack.contentConnectors.content.settings.saveButtonLabel', {
                    defaultMessage: 'Save',
                  })}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};

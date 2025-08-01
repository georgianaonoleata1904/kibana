/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * React component for rendering a modal to confirm deletion of a rule.
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { i18n } from '@kbn/i18n';

import { EuiConfirmModal, EuiLink, EUI_MODAL_CONFIRM_BUTTON, htmlIdGenerator } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';

export class DeleteRuleModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isModalVisible: false,
    };
  }

  deleteRule = () => {
    const { ruleIndex, deleteRuleAtIndex } = this.props;
    deleteRuleAtIndex(ruleIndex);
    this.closeModal();
  };

  closeModal = () => {
    this.setState({ isModalVisible: false });
  };

  showModal = () => {
    this.setState({ isModalVisible: true });
  };

  render() {
    const confirmModalTitleId = htmlIdGenerator()('confirmModalTitle');

    let modal;

    if (this.state.isModalVisible) {
      modal = (
        <EuiConfirmModal
          aria-labelledby={confirmModalTitleId}
          title={i18n.translate('xpack.ml.ruleEditor.deleteRuleModal.deleteRuleTitle', {
            defaultMessage: 'Delete rule?',
          })}
          titleProps={{ id: confirmModalTitleId }}
          onCancel={this.closeModal}
          onConfirm={this.deleteRule}
          buttonColor="danger"
          cancelButtonText={i18n.translate(
            'xpack.ml.ruleEditor.deleteRuleModal.cancelButtonLabel',
            { defaultMessage: 'Cancel' }
          )}
          confirmButtonText={i18n.translate(
            'xpack.ml.ruleEditor.deleteRuleModal.deleteButtonLabel',
            { defaultMessage: 'Delete' }
          )}
          defaultFocusedButton={EUI_MODAL_CONFIRM_BUTTON}
        />
      );
    }

    return (
      <React.Fragment>
        <EuiLink
          color="danger"
          onClick={() => this.showModal()}
          data-test-subj="deleteRuleModalLink"
        >
          <FormattedMessage
            id="xpack.ml.ruleEditor.deleteRuleModal.deleteRuleLinkText"
            defaultMessage="Delete rule"
          />
        </EuiLink>
        {modal}
      </React.Fragment>
    );
  }
}
DeleteRuleModal.propTypes = {
  ruleIndex: PropTypes.number.isRequired,
  deleteRuleAtIndex: PropTypes.func.isRequired,
};

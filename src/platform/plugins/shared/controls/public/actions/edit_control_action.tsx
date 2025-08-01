/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';

import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import {
  apiHasType,
  apiHasUniqueId,
  hasEditCapabilities,
  type EmbeddableApiContext,
  type HasUniqueId,
  apiHasParentApi,
  apiCanAccessViewMode,
  apiIsOfType,
  getInheritedViewMode,
} from '@kbn/presentation-publishing';
import { IncompatibleActionError, type Action } from '@kbn/ui-actions-plugin/public';

import { apiIsPresentationContainer } from '@kbn/presentation-containers';
import { CONTROLS_GROUP_TYPE } from '@kbn/controls-constants';
import { ACTION_EDIT_CONTROL } from './constants';
import { DataControlApi } from '../controls/data_controls/types';

const compatibilityCheck = (api: unknown): api is DataControlApi => {
  return Boolean(
    apiHasType(api) &&
      apiHasUniqueId(api) &&
      hasEditCapabilities(api) &&
      apiHasParentApi(api) &&
      apiCanAccessViewMode(api.parentApi) &&
      apiIsOfType(api.parentApi, CONTROLS_GROUP_TYPE) &&
      apiIsPresentationContainer(api.parentApi)
  );
};

export class EditControlAction implements Action<EmbeddableApiContext> {
  public readonly type = ACTION_EDIT_CONTROL;
  public readonly id = ACTION_EDIT_CONTROL;
  public order = 2;

  constructor() {}

  public readonly MenuItem = ({ context }: { context: EmbeddableApiContext }) => {
    return (
      <EuiToolTip content={this.getDisplayName(context)} disableScreenReaderOutput>
        <EuiButtonIcon
          data-test-subj={`control-action-${(context.embeddable as HasUniqueId).uuid}-edit`}
          aria-label={this.getDisplayName(context)}
          iconType={this.getIconType(context)}
          onClick={() => this.execute(context)}
          color="text"
        />
      </EuiToolTip>
    );
  };

  public getDisplayName({ embeddable }: EmbeddableApiContext) {
    return i18n.translate('controls.controlGroup.floatingActions.editTitle', {
      defaultMessage: 'Edit',
    });
  }

  public getIconType({ embeddable }: EmbeddableApiContext) {
    return 'pencil';
  }

  public async isCompatible({ embeddable }: EmbeddableApiContext) {
    return (
      compatibilityCheck(embeddable) &&
      getInheritedViewMode(embeddable.parentApi) === 'edit' &&
      embeddable.isEditingEnabled()
    );
  }

  public async execute({ embeddable }: EmbeddableApiContext) {
    if (!compatibilityCheck(embeddable)) throw new IncompatibleActionError();
    await embeddable.onEdit();
  }
}

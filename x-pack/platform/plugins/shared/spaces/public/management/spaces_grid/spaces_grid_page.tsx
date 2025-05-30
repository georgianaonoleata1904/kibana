/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiBadge,
  type EuiBasicTableColumn,
  EuiButton,
  EuiCallOut,
  EuiFlexGrid,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiLink,
  EuiLoadingSpinner,
  EuiPageHeader,
  EuiPageSection,
  type EuiSearchBarOnChangeArgs,
  EuiSpacer,
} from '@elastic/eui';
import { debounce } from 'lodash';
import React, { Component, lazy, Suspense } from 'react';

import type {
  ApplicationStart,
  Capabilities,
  NotificationsStart,
  ScopedHistory,
} from '@kbn/core/public';
import type { FeaturesPluginStart, KibanaFeature } from '@kbn/features-plugin/public';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { reactRouterNavigate } from '@kbn/kibana-react-plugin/public';

import { addSpaceIdToPath, type Space } from '../../../common';
import { isReservedSpace } from '../../../common';
import { ENTER_SPACE_PATH } from '../../../common/constants';
import { getSpacesFeatureDescription } from '../../constants';
import { getSpaceAvatarComponent } from '../../space_avatar';
import { SpaceSolutionBadge } from '../../space_solution_badge';
import type { SpacesManager } from '../../spaces_manager';
import { ConfirmDeleteModal, UnauthorizedPrompt } from '../components';

// No need to wrap LazySpaceAvatar in an error boundary, because it is one of the first chunks loaded when opening Kibana.
const LazySpaceAvatar = lazy(() =>
  getSpaceAvatarComponent().then((component) => ({ default: component }))
);

interface Props {
  spacesManager: SpacesManager;
  notifications: NotificationsStart;
  serverBasePath: string;
  getFeatures: FeaturesPluginStart['getFeatures'];
  capabilities: Capabilities;
  history: ScopedHistory;
  getUrlForApp: ApplicationStart['getUrlForApp'];
  maxSpaces: number;
  allowSolutionVisibility: boolean;
  isServerless: boolean;
}

interface State {
  spaces: Space[];
  spacesFiltered: Space[];
  activeSpace: Space | null;
  features: KibanaFeature[];
  loading: boolean;
  showConfirmDeleteModal: boolean;
  selectedSpace: Space | null;
}

export class SpacesGridPage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      spaces: [],
      spacesFiltered: [],
      activeSpace: null,
      features: [],
      loading: true,
      showConfirmDeleteModal: false,
      selectedSpace: null,
    };
  }

  public componentDidMount() {
    if (this.props.capabilities.spaces.manage) {
      this.loadGrid();
    }

    this.debouncedOnQueryChange?.cancel();
  }

  public render() {
    return (
      <div className="spcGridPage" data-test-subj="spaces-grid-page">
        <EuiPageHeader
          bottomBorder
          pageTitle={
            <FormattedMessage
              id="xpack.spaces.management.spacesGridPage.spacesTitle"
              defaultMessage="Spaces"
            />
          }
          description={getSpacesFeatureDescription()}
          rightSideItems={
            !this.state.loading && this.canCreateSpaces()
              ? [this.getPrimaryActionButton()]
              : undefined
          }
        />
        <EuiSpacer size="l" />
        {this.getPageContent()}
        {this.getConfirmDeleteModal()}
      </div>
    );
  }

  public onQueryChange = ({ query }: EuiSearchBarOnChangeArgs) => {
    const text = query?.text?.toLowerCase() || '';

    this.setState({ loading: true });

    const spacesFiltered = this.state.spaces.filter(
      (space) =>
        space.name.toLowerCase().includes(text) || space.description?.toLowerCase().includes(text)
    );

    this.setState({
      spacesFiltered,
      loading: false,
    });
  };

  public debouncedOnQueryChange = debounce(this.onQueryChange, 200);

  public getPageContent() {
    if (!this.props.capabilities.spaces.manage) {
      return (
        <EuiPageSection alignment="center" color="danger">
          <UnauthorizedPrompt />
        </EuiPageSection>
      );
    }

    return (
      <>
        {!this.state.loading && !this.canCreateSpaces() ? (
          <>
            <EuiCallOut title="You have reached the maximum number of allowed spaces." />
            <EuiSpacer />
          </>
        ) : undefined}
        <EuiInMemoryTable
          itemId={'id'}
          data-test-subj="spacesListTable"
          items={this.state.spacesFiltered}
          tableCaption={i18n.translate('xpack.spaces.management.spacesGridPage.tableCaption', {
            defaultMessage: 'Kibana spaces',
          })}
          rowHeader="name"
          rowProps={(item) => ({
            'data-test-subj': `spacesListTableRow-${item.id}`,
          })}
          columns={this.getColumnConfig()}
          pagination={true}
          sorting={true}
          search={{
            onChange: this.debouncedOnQueryChange,
            box: {
              incremental: true,
              placeholder: i18n.translate(
                'xpack.spaces.management.spacesGridPage.searchPlaceholder',
                { defaultMessage: 'Search' }
              ),
              'data-test-subj': 'spacesListTableSearchBox',
            },
          }}
          loading={this.state.loading}
          message={
            this.state.loading ? (
              <FormattedMessage
                id="xpack.spaces.management.spacesGridPage.loadingTitle"
                defaultMessage="loading…"
              />
            ) : undefined
          }
        />
      </>
    );
  }

  private canCreateSpaces() {
    return this.props.maxSpaces > this.state.spaces.length;
  }

  public getPrimaryActionButton() {
    return (
      <EuiButton
        fill
        iconType="plusInCircleFilled"
        {...reactRouterNavigate(this.props.history, '/create')}
        data-test-subj="createSpace"
      >
        <FormattedMessage
          id="xpack.spaces.management.spacesGridPage.createSpaceButtonLabel"
          defaultMessage="Create space"
        />
      </EuiButton>
    );
  }

  public getConfirmDeleteModal = () => {
    if (!this.state.showConfirmDeleteModal || !this.state.selectedSpace) {
      return null;
    }

    const { spacesManager } = this.props;

    return (
      <ConfirmDeleteModal
        space={this.state.selectedSpace}
        spacesManager={spacesManager}
        onCancel={() => {
          this.setState({
            showConfirmDeleteModal: false,
          });
        }}
        onSuccess={() => {
          this.setState({
            showConfirmDeleteModal: false,
          });
          this.loadGrid();
        }}
      />
    );
  };

  public loadGrid = async () => {
    const { spacesManager, getFeatures, notifications } = this.props;

    this.setState({
      loading: true,
      spaces: [],
      spacesFiltered: [],
      features: [],
    });

    const getSpaces = spacesManager.getSpaces();
    const getActiveSpace = spacesManager.getActiveSpace();

    try {
      const [spaces, activeSpace, features] = await Promise.all([
        getSpaces,
        getActiveSpace,
        getFeatures(),
      ]);
      this.setState({
        loading: false,
        spaces,
        spacesFiltered: spaces,
        activeSpace,
        features,
      });
    } catch (error) {
      this.setState({
        loading: false,
      });
      notifications.toasts.addError(error, {
        title: i18n.translate('xpack.spaces.management.spacesGridPage.errorTitle', {
          defaultMessage: 'Error loading spaces',
        }),
      });
    }
  };

  public getColumnConfig() {
    const { activeSpace } = this.state;

    const config: Array<EuiBasicTableColumn<Space>> = [
      {
        field: 'initials',
        name: '',
        width: '50px',
        render: (_value: string, rowRecord) => {
          return (
            <Suspense fallback={<EuiLoadingSpinner />}>
              <EuiLink
                {...reactRouterNavigate(this.props.history, this.getEditSpacePath(rowRecord))}
              >
                <LazySpaceAvatar space={rowRecord} size="s" />
              </EuiLink>
            </Suspense>
          );
        },
      },
      {
        field: 'name',
        name: i18n.translate('xpack.spaces.management.spacesGridPage.spaceColumnName', {
          defaultMessage: 'Space',
        }),
        sortable: true,
        render: (value: string, rowRecord: Space) => {
          const SpaceName = () => {
            const isCurrent = this.state.activeSpace?.id === rowRecord.id;
            return (
              <EuiFlexGrid responsive={false} columns={2} alignItems="center" gutterSize="s">
                <EuiFlexItem>
                  <EuiLink
                    {...reactRouterNavigate(this.props.history, this.getEditSpacePath(rowRecord))}
                    data-test-subj={`${rowRecord.id}-hyperlink`}
                  >
                    {value}
                  </EuiLink>
                </EuiFlexItem>
                <EuiFlexItem>
                  {isCurrent && (
                    <span>
                      <EuiBadge
                        color="primary"
                        data-test-subj={`spacesListCurrentBadge-${rowRecord.id}`}
                      >
                        {i18n.translate(
                          'xpack.spaces.management.spacesGridPage.currentSpaceMarkerText',
                          { defaultMessage: 'current' }
                        )}
                      </EuiBadge>
                    </span>
                  )}
                </EuiFlexItem>
              </EuiFlexGrid>
            );
          };

          return <SpaceName />;
        },
        'data-test-subj': 'spacesListTableRowNameCell',
        width: '20%',
      },
      {
        field: 'description',
        name: i18n.translate('xpack.spaces.management.spacesGridPage.descriptionColumnName', {
          defaultMessage: 'Description',
        }),
        sortable: true,
        truncateText: true,
      },
    ];

    if (this.props.allowSolutionVisibility) {
      config.push({
        field: 'solution',
        name: i18n.translate('xpack.spaces.management.spacesGridPage.solutionColumnName', {
          defaultMessage: 'Solution view',
        }),
        sortable: true,
        render: (solution: Space['solution'], record: Space) => (
          <SpaceSolutionBadge solution={solution} data-test-subj={`${record.id}-solution`} />
        ),
        width: '18%',
      });
    }

    config.push({
      name: i18n.translate('xpack.spaces.management.spacesGridPage.actionsColumnName', {
        defaultMessage: 'Actions',
      }),
      actions: [
        {
          isPrimary: true,
          name: i18n.translate('xpack.spaces.management.spacesGridPage.editSpaceActionName', {
            defaultMessage: `Edit`,
          }),
          description: (rowRecord) =>
            i18n.translate('xpack.spaces.management.spacesGridPage.editSpaceActionDescription', {
              defaultMessage: `Edit {spaceName}.`,
              values: { spaceName: rowRecord.name },
            }),
          type: 'icon',
          icon: 'pencil',
          color: 'primary',
          href: (rowRecord) =>
            reactRouterNavigate(this.props.history, this.getEditSpacePath(rowRecord)).href,
          onClick: (rowRecord) =>
            reactRouterNavigate(this.props.history, this.getEditSpacePath(rowRecord)).onClick,
          'data-test-subj': (rowRecord) => `${rowRecord.id}-editSpace`,
        },
        {
          isPrimary: true,
          name: i18n.translate('xpack.spaces.management.spacesGridPage.switchSpaceActionName', {
            defaultMessage: 'Switch',
          }),
          description: (rowRecord) =>
            activeSpace?.id !== rowRecord.id
              ? i18n.translate(
                  'xpack.spaces.management.spacesGridPage.switchSpaceActionDescription',
                  {
                    defaultMessage: 'Switch to {spaceName}',
                    values: { spaceName: rowRecord.name },
                  }
                )
              : i18n.translate(
                  'xpack.spaces.management.spacesGridPage.switchSpaceActionDisabledDescription',
                  {
                    defaultMessage: '{spaceName} is the current space',
                    values: { spaceName: rowRecord.name },
                  }
                ),
          type: 'icon',
          icon: 'merge',
          color: 'primary',
          href: (rowRecord: Space) =>
            addSpaceIdToPath(
              this.props.serverBasePath,
              rowRecord.id,
              `${ENTER_SPACE_PATH}?next=/app/management/kibana/spaces/`
            ),
          enabled: (rowRecord) => activeSpace?.id !== rowRecord.id,
          'data-test-subj': (rowRecord) => `${rowRecord.id}-switchSpace`,
        },
        {
          name: i18n.translate('xpack.spaces.management.spacesGridPage.deleteActionName', {
            defaultMessage: `Delete`,
          }),
          description: (rowRecord) =>
            isReservedSpace(rowRecord)
              ? i18n.translate(
                  'xpack.spaces.management.spacesGridPage.deleteActionDisabledDescription',
                  {
                    defaultMessage: `You can't delete the {spaceName} space`,
                    values: { spaceName: rowRecord.name },
                  }
                )
              : i18n.translate('xpack.spaces.management.spacesGridPage.deleteActionDescription', {
                  defaultMessage: `Delete {spaceName}`,
                  values: { spaceName: rowRecord.name },
                }),
          type: 'icon',
          icon: 'trash',
          color: 'danger',
          onClick: (rowRecord: Space) => this.onDeleteSpaceClick(rowRecord),
          enabled: (rowRecord: Space) => !isReservedSpace(rowRecord),
          'data-test-subj': (rowRecord) => `${rowRecord.id}-deleteSpace`,
        },
      ],
      width: '18%',
    });

    return config;
  }

  private getEditSpacePath = (space: Space) => `edit/${encodeURIComponent(space.id)}`;

  private onDeleteSpaceClick = (space: Space) => {
    this.setState({
      selectedSpace: space,
      showConfirmDeleteModal: true,
    });
  };
}

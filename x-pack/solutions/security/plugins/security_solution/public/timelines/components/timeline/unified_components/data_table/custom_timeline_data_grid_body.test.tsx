/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
// Necessary until components being tested are migrated of styled-components https://github.com/elastic/kibana/issues/219037
import 'jest-styled-components';
import { render } from '@testing-library/react';
import type { CustomTimelineDataGridBodyProps } from './custom_timeline_data_grid_body';
import { CustomTimelineDataGridBody } from './custom_timeline_data_grid_body';
import { mockTimelineData, TestProviders } from '../../../../../common/mock';
import type { TimelineItem } from '@kbn/timelines-plugin/common';
import type { DataTableRecord } from '@kbn/discover-utils/types';
import { defaultUdtHeaders } from '../../body/column_headers/default_headers';
import type { EuiDataGridColumn } from '@elastic/eui';
import { useStatefulRowRenderer } from '../../body/events/stateful_row_renderer/use_stateful_row_renderer';
import { TIMELINE_EVENT_DETAIL_ROW_ID } from '../../body/constants';

jest.mock('../../../../../common/hooks/use_selector');

const testDataRows = structuredClone(mockTimelineData);

jest.mock('../../body/events/stateful_row_renderer/use_stateful_row_renderer');

const MockCellComponent = ({
  colIndex,
  visibleRowIndex,
}: {
  colIndex: number;
  visibleRowIndex: number;
}) => <div>{`Cell-${visibleRowIndex}-${colIndex}`}</div>;

const additionalTrailingColumn = {
  id: TIMELINE_EVENT_DETAIL_ROW_ID,
};

const mockVisibleColumns = ['@timestamp', 'message', 'user.name']
  .map((id) => defaultUdtHeaders.find((h) => h.id === id) as EuiDataGridColumn)
  .concat(additionalTrailingColumn);

const defaultProps: CustomTimelineDataGridBodyProps = {
  Cell: MockCellComponent,
  visibleRowData: { startRow: 0, endRow: 2, visibleRowCount: 2 },
  rows: testDataRows as Array<DataTableRecord & TimelineItem>,
  enabledRowRenderers: [],
  setCustomGridBodyProps: jest.fn(),
  visibleColumns: mockVisibleColumns,
  headerRow: <></>,
  footerRow: null,
  gridWidth: 1000,
};

const renderTestComponents = (props?: Partial<CustomTimelineDataGridBodyProps>) => {
  const finalProps = props ? { ...defaultProps, ...props } : defaultProps;

  return render(
    <TestProviders>
      <CustomTimelineDataGridBody {...finalProps} />
    </TestProviders>
  );
};

describe('CustomTimelineDataGridBody', () => {
  beforeEach(() => {
    (useStatefulRowRenderer as jest.Mock).mockReturnValue({
      canShowRowRenderer: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render exactly as snapshots', () => {
    // mainly to make sure that if styling is changed the test fails and the developer is
    // aware of the change that affected this component
    const { container } = renderTestComponents();
    expect(container).toMatchSnapshot();
  });

  it('should render the additional Row when row Renderer is available', () => {
    // No additional row for first result
    (useStatefulRowRenderer as jest.Mock).mockReturnValueOnce({
      canShowRowRenderer: false,
    });
    // Additional row for second result
    (useStatefulRowRenderer as jest.Mock).mockReturnValueOnce({
      canShowRowRenderer: true,
    });
    const { getByTestId, getByText, queryByText } = renderTestComponents();

    expect(getByTestId('customGridRowsContainer')).toBeVisible();
    expect(queryByText('Cell-0-3')).toBeFalsy();
    expect(getByText('Cell-1-3')).toBeInTheDocument();
  });

  it('should not render grid if gridWidth is 0', () => {
    const { queryByTestId } = renderTestComponents({ gridWidth: 0 });
    expect(queryByTestId('customGridRowsContainer')).not.toBeInTheDocument();
  });
});

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { Filter } from '@kbn/es-query';
import type { DataView } from '@kbn/data-views-plugin/public';
import type { DataPublicPluginStart, ISearchSource } from '@kbn/data-plugin/public';
import type { DataTableRecord } from '@kbn/discover-utils/types';
import type { SearchResponseWarning } from '@kbn/search-response-warnings';
import { getEsQuerySort } from '@kbn/discover-utils';
import type { SortDirection } from '../utils/sorting';
import { reverseSortDir } from '../utils/sorting';
import { convertIsoToMillis, extractNanos } from '../utils/date_conversion';
import { fetchHitsInInterval } from '../utils/fetch_hits_in_interval';
import { generateIntervals } from '../utils/generate_intervals';
import { getEsQuerySearchAfter } from '../utils/get_es_query_search_after';
import type { DiscoverServices } from '../../../build_services';
import type { ScopedProfilesManager } from '../../../context_awareness';

export enum SurrDocType {
  SUCCESSORS = 'successors',
  PREDECESSORS = 'predecessors',
}

const DAY_MILLIS = 24 * 60 * 60 * 1000;

// look from 1 day up to 10000 days into the past and future
const LOOKUP_OFFSETS = [0, 1, 7, 30, 365, 10000].map((days) => days * DAY_MILLIS);

/**
 * Fetch successor or predecessor documents of a given anchor document
 *
 * @param {SurrDocType} type - `successors` or `predecessors`
 * @param {DataView} dataView
 * @param {DataTableRecord} anchor - anchor record
 * @param {string} tieBreakerField - name of the tie breaker, the 2nd sort field
 * @param {SortDirection} sortDir - direction of sorting
 * @param {number} size - number of records to retrieve
 * @param {Filter[]} filters - to apply in the elastic query
 * @param {DataPublicPluginStart} data
 * @param {DiscoverServices} services
 * @returns {Promise<object[]>}
 */
export async function fetchSurroundingDocs(
  type: SurrDocType,
  dataView: DataView,
  anchor: DataTableRecord,
  tieBreakerField: string,
  sortDir: SortDirection,
  size: number,
  filters: Filter[],
  data: DataPublicPluginStart,
  services: DiscoverServices,
  scopedProfilesManager: ScopedProfilesManager
): Promise<{
  rows: DataTableRecord[];
  interceptedWarnings: SearchResponseWarning[] | undefined;
}> {
  if (typeof anchor !== 'object' || anchor === null || !anchor.raw._id || !size) {
    return {
      rows: [],
      interceptedWarnings: undefined,
    };
  }
  const timeField = dataView.timeFieldName!;
  const searchSource = data.search.searchSource.createEmpty();
  updateSearchSource(searchSource, dataView, filters);
  const sortDirToApply = type === SurrDocType.SUCCESSORS ? sortDir : reverseSortDir(sortDir);
  const anchorRaw = anchor.raw!;

  const nanos = dataView.isTimeNanosBased() ? extractNanos(anchorRaw.fields?.[timeField][0]) : '';
  const timeValueMillis = convertIsoToMillis(
    nanos !== '' ? anchorRaw.fields?.[timeField][0] : anchorRaw.sort?.[0]
  );

  const intervals = generateIntervals(LOOKUP_OFFSETS, timeValueMillis, type, sortDir);
  let rows: DataTableRecord[] = [];
  let interceptedWarnings: SearchResponseWarning[] = [];

  for (const interval of intervals) {
    const remainingSize = size - rows.length;

    if (remainingSize <= 0) {
      break;
    }

    const searchAfter = getEsQuerySearchAfter(type, rows, anchor);

    const sort = getEsQuerySort({
      timeFieldName: timeField,
      tieBreakerFieldName: tieBreakerField,
      sortDir: sortDirToApply,
      isTimeNanosBased: dataView.isTimeNanosBased(),
    });

    const result = await fetchHitsInInterval(
      searchSource,
      timeField,
      sort,
      sortDirToApply,
      interval,
      searchAfter,
      remainingSize,
      nanos,
      anchor.raw._id,
      type,
      services,
      scopedProfilesManager
    );

    rows =
      type === SurrDocType.SUCCESSORS
        ? [...rows, ...result.rows]
        : [...result.rows.slice().reverse(), ...rows];

    if (result.interceptedWarnings) {
      interceptedWarnings =
        type === SurrDocType.SUCCESSORS
          ? [...interceptedWarnings, ...result.interceptedWarnings]
          : [...result.interceptedWarnings.slice().reverse(), ...interceptedWarnings];
    }
  }

  return {
    rows,
    interceptedWarnings,
  };
}

export function updateSearchSource(
  searchSource: ISearchSource,
  dataView: DataView,
  filters: Filter[]
) {
  searchSource.removeField('fieldsFromSource');
  searchSource.setField('fields', [{ field: '*', include_unmapped: true }]);

  return searchSource
    .setParent(undefined)
    .setField('index', dataView)
    .setField('filter', filters)
    .setField('trackTotalHits', false);
}

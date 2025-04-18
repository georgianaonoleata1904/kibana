/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import moment from 'moment';
import { keys } from 'lodash';
import type { RangeFilter } from '../build_filters';
import type { TimeRange } from './types';

const isRelativeTime = (value: string | number | undefined): boolean => {
  return typeof value === 'string' && !moment(value).isValid();
};

export function convertRangeFilterToTimeRange(filter: RangeFilter) {
  const key = keys(filter.query.range)[0];
  const values = filter.query.range[key];

  const from = values.gt || values.gte;
  const to = values.lt || values.lte;
  return {
    from: from && isRelativeTime(from) ? String(from) : moment(from),
    to: to && isRelativeTime(to) ? String(to) : moment(to),
  };
}

export function convertRangeFilterToTimeRangeString(filter: RangeFilter): TimeRange {
  const { from, to } = convertRangeFilterToTimeRange(filter);
  return {
    from: moment.isMoment(from) ? from?.toISOString() : from,
    to: moment.isMoment(to) ? to?.toISOString() : to,
  };
}

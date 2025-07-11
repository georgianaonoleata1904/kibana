/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { Moment } from 'moment';
import moment from 'moment';

export const getWeekdayInfo = (date: Moment, dayOfWeekFmt = 'dddd') => {
  const dayOfWeek = date.format(dayOfWeekFmt);
  const nthWeekdayOfMonth = Math.ceil(date.date() / 7);
  const isLastOfMonth = nthWeekdayOfMonth > 4 || !date.isSame(moment(date).add(7, 'd'), 'month');
  return { dayOfWeek, nthWeekdayOfMonth, isLastOfMonth };
};

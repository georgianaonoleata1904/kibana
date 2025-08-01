/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as rt from 'io-ts';
import { InventoryTsvbTypeKeysRT, ItemTypeRT } from '@kbn/metrics-data-access-plugin/common';
import { InfraTimerangeInputRT } from './snapshot_api';

const NodeDetailsDataPointRT = rt.intersection([
  rt.type({
    timestamp: rt.number,
  }),
  rt.partial({
    value: rt.union([rt.number, rt.null]),
  }),
]);

const NodeDetailsDataSeriesRT = rt.type({
  id: rt.string,
  label: rt.string,
  data: rt.array(NodeDetailsDataPointRT),
});

export type NodeDetailsDataSeries = rt.TypeOf<typeof NodeDetailsDataSeriesRT>;

export const NodeDetailsMetricDataRT = rt.intersection([
  rt.partial({
    id: rt.union([InventoryTsvbTypeKeysRT, rt.null]),
  }),
  rt.type({
    series: rt.array(NodeDetailsDataSeriesRT),
  }),
]);

export const NodeDetailsMetricDataResponseRT = rt.type({
  metrics: rt.array(NodeDetailsMetricDataRT),
});

export const NodeDetailsRequestRT = rt.intersection([
  rt.type({
    nodeType: ItemTypeRT,
    nodeId: rt.string,
    metrics: rt.array(InventoryTsvbTypeKeysRT),
    timerange: InfraTimerangeInputRT,
    sourceId: rt.string,
  }),
  rt.partial({
    cloudId: rt.union([rt.string, rt.null]),
  }),
]);

// export type NodeDetailsRequest = InfraWrappableRequest<NodesArgs & SourceArgs>;
export type NodeDetailsMetricData = rt.TypeOf<typeof NodeDetailsMetricDataRT>;
export type NodeDetailsRequest = rt.TypeOf<typeof NodeDetailsRequestRT>;
export type NodeDetailsMetricDataResponse = rt.TypeOf<typeof NodeDetailsMetricDataResponseRT>;

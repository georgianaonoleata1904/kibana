/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { get, last, first, isArray } from 'lodash';
import {
  type MetricsAPIRow,
  type MetricsAPISeries,
  findInventoryFields,
} from '@kbn/metrics-data-access-plugin/common';
import type { SnapshotRequest, SnapshotNodePath, SnapshotNode } from '../../../../common/http_api';
import { META_KEY } from './constants';

export const isIPv4 = (subject: string) => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(subject);

type RowWithMetadata = MetricsAPIRow & {
  [META_KEY]: Array<Record<string, string | number | string[]>>;
};

export const applyMetadataToLastPath = (
  series: MetricsAPISeries,
  node: SnapshotNode,
  snapshotRequest: SnapshotRequest
): SnapshotNodePath[] => {
  // First we need to find a row with metadata
  const rowWithMeta = series.rows.find(
    (row) => (row[META_KEY] && isArray(row[META_KEY]) && (row[META_KEY] as object[]).length) || 0
  ) as RowWithMetadata | undefined;

  if (rowWithMeta) {
    // We need just the first doc, there should only be one
    const firstMetaDoc = first(rowWithMeta[META_KEY]);
    // We also need the last path to add the metadata to
    const lastPath = last(node.path);
    if (firstMetaDoc && lastPath) {
      // We will need the inventory fields so we can use the field paths to get
      // the values from the metadata document
      const inventoryFields = findInventoryFields(snapshotRequest.nodeType);
      // Set the label as the name and fallback to the id OR path.value
      lastPath.label = (firstMetaDoc[inventoryFields.name] ?? lastPath.value) as string;
      // If the inventory fields contain an ip address, we need to try and set that
      // on the path object. IP addresses are typically stored as multiple fields. We will
      // use the first IPV4 address we find.
      if (inventoryFields.ip) {
        const ipAddresses = get(firstMetaDoc, inventoryFields.ip) as string[];
        if (Array.isArray(ipAddresses)) {
          lastPath.ip = ipAddresses.find(isIPv4) || null;
        } else if (typeof ipAddresses === 'string') {
          lastPath.ip = ipAddresses;
        }
      }
      if (inventoryFields.os) {
        lastPath.os = get(firstMetaDoc, inventoryFields.os) as string;
      }
      if (inventoryFields.cloudProvider) {
        lastPath.cloudProvider = get(firstMetaDoc, inventoryFields.cloudProvider) as string;
      }
      return [...node.path.slice(0, node.path.length - 1), lastPath];
    }
  }
  return node.path;
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type {
  PropertyName as EsPropertyName,
  MappingProperty as EsMappingProperty,
  MappingPropertyBase as EsMappingPropertyBase,
} from '@elastic/elasticsearch/lib/api/types';

/**
 * Describe a saved object type mapping.
 *
 * @example
 * ```ts
 * const typeDefinition: SavedObjectsTypeMappingDefinition = {
 *   properties: {
 *     enabled: {
 *       type: "boolean"
 *     },
 *     sendUsageFrom: {
 *       ignore_above: 256,
 *       type: "keyword"
 *     },
 *     lastReported: {
 *       type: "date"
 *     },
 *     lastVersionChecked: {
 *       ignore_above: 256,
 *       type: "keyword"
 *     },
 *   }
 * }
 * ```
 *
 * @public
 */
export interface SavedObjectsTypeMappingDefinition {
  /** The dynamic property of the mapping, either `false` or `'strict'`. If
   * unspecified `dynamic: 'strict'` will be inherited from the top-level
   * index mappings. */
  dynamic?: false | 'false' | 'strict';
  /** The underlying properties of the type mapping */
  properties: SavedObjectsMappingProperties;
}

/** @private */
export interface SavedObjectsTypeMappingDefinitionSafe extends SavedObjectsTypeMappingDefinition {
  dynamic: 'false' | 'strict';
}

/**
 * Describe the fields of a {@link SavedObjectsTypeMappingDefinition | saved object type}.
 *
 * @public
 */
export interface SavedObjectsMappingProperties {
  [field: string]: SavedObjectsFieldMapping;
}

export interface SavedObjectsMappingPropertiesSafe extends SavedObjectsMappingProperties {
  [field: string]: SavedObjectsFieldMappingSafe;
}

/**
 * Describe a {@link SavedObjectsTypeMappingDefinition | saved object type mapping} field.
 *
 * Please refer to {@link https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html | elasticsearch documentation}
 * For the mapping documentation
 *
 * @public
 */
export type SavedObjectsFieldMapping = EsMappingProperty &
  EsMappingPropertyBase & {
    /**
     * The dynamic property of the mapping, either `false` or `'strict'`. If
     * unspecified `dynamic: 'strict'` will be inherited from the top-level
     * index mappings.
     *
     * Note: To limit the number of mapping fields Saved Object types should
     * *never* use `dynamic: true`.
     */
    dynamic?: false | 'false' | 'strict';
    /**
     * Some mapping types do not accept the `properties` attributes. Explicitly adding it as optional to our type
     * to avoid type failures on all code using accessing them via `SavedObjectsFieldMapping.properties`.
     */
    properties?: Record<EsPropertyName, EsMappingProperty>;
  };

export type SavedObjectsFieldMappingSafe = SavedObjectsFieldMapping & {
  dynamic?: 'false' | 'strict';
};

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { PluginInitializerContext } from '@kbn/core-plugins-server';

export type { DiscoverSessionTab } from './saved_objects/schema';
export { getSavedSearch } from './services/saved_searches';

export const plugin = async (initContext: PluginInitializerContext) => {
  const { SavedSearchServerPlugin } = await import('./plugin');
  return new SavedSearchServerPlugin(initContext);
};

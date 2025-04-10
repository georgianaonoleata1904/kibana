/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { AggregateRulesResponseBody } from '@kbn/alerting-plugin/common/routes/rule/apis/aggregate';
import { INTERNAL_BASE_ALERTING_API_PATH } from '../../constants';
import type { AggregateRulesResponse, LoadRuleAggregationsProps } from './aggregate_helpers';
import { rewriteBodyRes } from './aggregate_helpers';
import { mapFiltersToKueryNode } from './map_filters_to_kuery_node';

export async function loadRuleAggregationsWithKueryFilter({
  http,
  searchText,
  actionTypesFilter,
  ruleExecutionStatusesFilter,
  ruleStatusesFilter,
  tagsFilter,
  ruleTypeIds,
  consumers,
}: LoadRuleAggregationsProps): Promise<AggregateRulesResponse> {
  const filtersKueryNode = mapFiltersToKueryNode({
    actionTypesFilter,
    tagsFilter,
    ruleExecutionStatusesFilter,
    ruleStatusesFilter,
    searchText,
  });

  const res = await http.post<AggregateRulesResponseBody>(
    `${INTERNAL_BASE_ALERTING_API_PATH}/rules/_aggregate`,
    {
      body: JSON.stringify({
        ...(filtersKueryNode ? { filter: JSON.stringify(filtersKueryNode) } : {}),
        rule_type_ids: ruleTypeIds,
        default_search_operator: 'AND',
        consumers,
      }),
    }
  );

  return rewriteBodyRes(res);
}

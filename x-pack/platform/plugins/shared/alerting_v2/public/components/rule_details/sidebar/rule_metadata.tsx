/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiDescriptionList, EuiSpacer, EuiTitle } from '@elastic/eui';
import { CoreStart, useService } from '@kbn/core-di-browser';
import type { UserProfileService } from '@kbn/core-user-profile-browser';
import { i18n } from '@kbn/i18n';
import { useQuery } from '@kbn/react-query';
import moment from 'moment';
import React, { useMemo } from 'react';
import { useRule } from '../rule_context';
import { EMPTY_VALUE } from '../utils';

export const RuleMetadata: React.FunctionComponent = () => {
  const rule = useRule();
  const uiSettings = useService(CoreStart('uiSettings'));
  const userProfile = useService(CoreStart('userProfile')) as UserProfileService;
  const dateFormat = uiSettings.get('dateFormat');
  const formatDate = (value: string) => moment(value).format(dateFormat);

  const metadataUids = useMemo(() => {
    const uids = new Set<string>();
    if (rule.createdBy) uids.add(rule.createdBy);
    if (rule.updatedBy) uids.add(rule.updatedBy);
    return uids;
  }, [rule.createdBy, rule.updatedBy]);

  const metadataUidsKey = useMemo(() => Array.from(metadataUids).sort(), [metadataUids]);

  const { data: metadataProfiles } = useQuery({
    queryKey: ['alertingV2RuleMetadataProfiles', metadataUidsKey],
    queryFn: () => userProfile.bulkGet({ uids: metadataUids }),
    enabled: metadataUids.size > 0,
    staleTime: 60_000,
    retry: 1,
  });

  const metadataProfileByUid = useMemo(() => {
    const map = new Map<string, { full_name?: string; username: string }>();
    for (const profile of metadataProfiles ?? []) {
      map.set(profile.uid, profile.user);
    }
    return map;
  }, [metadataProfiles]);

  const resolveDisplayName = (uid: string | null | undefined) => {
    if (!uid) return EMPTY_VALUE;
    const user = metadataProfileByUid.get(uid);
    return user?.full_name ?? user?.username ?? uid;
  };

  const metadataItems = [
    {
      title: i18n.translate('xpack.alertingV2.ruleDetails.createdBy', {
        defaultMessage: 'Created by',
      }),
      description: resolveDisplayName(rule.createdBy),
    },
    {
      title: i18n.translate('xpack.alertingV2.ruleDetails.createdDate', {
        defaultMessage: 'Created date',
      }),
      description: formatDate(rule.createdAt),
    },
    {
      title: i18n.translate('xpack.alertingV2.ruleDetails.lastUpdate', {
        defaultMessage: 'Last update',
      }),
      description: formatDate(rule.updatedAt),
    },
    {
      title: i18n.translate('xpack.alertingV2.ruleDetails.updatedBy', {
        defaultMessage: 'Updated by',
      }),
      description: resolveDisplayName(rule.updatedBy),
    },
  ];

  return (
    <>
      <EuiTitle size="s">
        <h2>
          {i18n.translate('xpack.alertingV2.ruleDetails.metadata', {
            defaultMessage: 'Metadata',
          })}
        </h2>
      </EuiTitle>
      <EuiSpacer size="m" />

      <EuiDescriptionList
        compressed
        type="column"
        listItems={metadataItems}
        css={{ maxWidth: 600 }}
      />
    </>
  );
};

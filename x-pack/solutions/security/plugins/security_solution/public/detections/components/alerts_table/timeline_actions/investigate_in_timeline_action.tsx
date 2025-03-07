/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EcsSecurityExtension as Ecs } from '@kbn/securitysolution-ecs';
import { ActionIconItem } from '../../../../common/components/header_actions/action_icon_item';
import { useUserPrivileges } from '../../../../common/components/user_privileges';

import {
  ACTION_INVESTIGATE_IN_TIMELINE,
  ACTION_INVESTIGATE_IN_TIMELINE_ARIA_LABEL,
} from '../translations';
import { useInvestigateInTimeline } from './use_investigate_in_timeline';

interface InvestigateInTimelineActionProps {
  ecsRowData?: Ecs | null;
  ariaLabel?: string;
  buttonType?: 'text' | 'icon' | 'emptyButton';
  onInvestigateInTimelineAlertClick?: () => void;
}

const InvestigateInTimelineActionComponent: React.FC<InvestigateInTimelineActionProps> = ({
  ariaLabel = ACTION_INVESTIGATE_IN_TIMELINE_ARIA_LABEL,
  ecsRowData,
  buttonType,
  onInvestigateInTimelineAlertClick,
}) => {
  const { investigateInTimelineAlertClick } = useInvestigateInTimeline({
    ecsRowData,
    onInvestigateInTimelineAlertClick,
  });
  const {
    timelinePrivileges: { read },
  } = useUserPrivileges();
  const cannotReadTimeline = !read;

  return (
    <ActionIconItem
      ariaLabel={ariaLabel}
      content={ACTION_INVESTIGATE_IN_TIMELINE}
      dataTestSubj="send-alert-to-timeline"
      iconType="timeline"
      onClick={investigateInTimelineAlertClick}
      isDisabled={cannotReadTimeline}
      buttonType={buttonType}
    />
  );
};

export const InvestigateInTimelineAction = React.memo(InvestigateInTimelineActionComponent);

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { mountWithIntl } from '@kbn/test-jest-helpers';
import { EventActionOptions, SeverityActionOptions } from '../types';
import PagerDutyParamsFields from './pagerduty_params';

describe('PagerDutyParamsFields renders', () => {
  test('all params fields are rendered', () => {
    const actionParams = {
      eventAction: EventActionOptions.TRIGGER,
      dedupKey: 'test',
      summary: '2323',
      source: 'source',
      severity: SeverityActionOptions.CRITICAL,
      timestamp: new Date().toISOString(),
      component: 'test',
      group: 'group',
      class: 'test class',
      customDetails: '{"foo":"bar"}',
      links: [
        { href: 'foo', text: 'bar' },
        { href: 'foo', text: 'bar' },
      ],
    };

    const wrapper = mountWithIntl(
      <PagerDutyParamsFields
        actionParams={actionParams}
        errors={{ summary: [], timestamp: [], dedupKey: [] }}
        editAction={() => {}}
        index={0}
        messageVariables={[
          {
            name: 'myVar',
            description: 'My variable description',
            useWithTripleBracesInTemplates: true,
          },
        ]}
      />
    );
    expect(wrapper.find('[data-test-subj="severitySelect"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="severitySelect"]').first().prop('value')).toStrictEqual(
      'critical'
    );
    expect(wrapper.find('[data-test-subj="dedupKeyInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="dedupKeyInput"]').first().prop('value')).toStrictEqual(
      'test'
    );
    expect(wrapper.find('[data-test-subj="eventActionSelect"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="dedupKeyInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="timestampInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="componentInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="groupInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="sourceInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="summaryInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="dedupKeyAddVariableButton"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="customDetailsJsonEditor"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="linksList"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="pagerDutyAddLinkButton"]').length > 0).toBeTruthy();
  });

  test('params select fields do not auto set values eventActionSelect', () => {
    const actionParams = {};

    const wrapper = mountWithIntl(
      <PagerDutyParamsFields
        actionParams={actionParams}
        errors={{ summary: [], timestamp: [], dedupKey: [] }}
        editAction={() => {}}
        index={0}
      />
    );
    expect(wrapper.find('[data-test-subj="eventActionSelect"]').length > 0).toBeTruthy();
    expect(
      wrapper.find('[data-test-subj="eventActionSelect"]').first().prop('value')
    ).toStrictEqual(undefined);
  });

  test('params select fields do not auto set values severitySelect', () => {
    const actionParams = {
      eventAction: EventActionOptions.TRIGGER,
      dedupKey: 'test',
    };

    const wrapper = mountWithIntl(
      <PagerDutyParamsFields
        actionParams={actionParams}
        errors={{ summary: [], timestamp: [], dedupKey: [] }}
        editAction={() => {}}
        index={0}
      />
    );
    expect(wrapper.find('[data-test-subj="severitySelect"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="severitySelect"]').first().prop('value')).toStrictEqual(
      undefined
    );
  });

  test('only eventActionSelect is available as a payload params for PagerDuty Resolve event', () => {
    const actionParams = {
      eventAction: EventActionOptions.RESOLVE,
      dedupKey: 'test',
    };

    const wrapper = mountWithIntl(
      <PagerDutyParamsFields
        actionParams={actionParams}
        errors={{ summary: [], timestamp: [], dedupKey: [] }}
        editAction={() => {}}
        index={0}
      />
    );
    expect(wrapper.find('[data-test-subj="dedupKeyInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="dedupKeyInput"]').first().prop('value')).toStrictEqual(
      'test'
    );
    expect(wrapper.find('[data-test-subj="eventActionSelect"]').length > 0).toBeTruthy();
    expect(
      wrapper.find('[data-test-subj="eventActionSelect"]').first().prop('value')
    ).toStrictEqual('resolve');
    expect(wrapper.find('[data-test-subj="dedupKeyInput"]').length > 0).toBeTruthy();
    expect(wrapper.find('[data-test-subj="timestampInput"]').length > 0).toBeFalsy();
    expect(wrapper.find('[data-test-subj="componentInput"]').length > 0).toBeFalsy();
    expect(wrapper.find('[data-test-subj="groupInput"]').length > 0).toBeFalsy();
    expect(wrapper.find('[data-test-subj="sourceInput"]').length > 0).toBeFalsy();
    expect(wrapper.find('[data-test-subj="summaryInput"]').length > 0).toBeFalsy();
  });

  describe('selected action group "recovered"', () => {
    test('event action dropdown is disabled and only shows Resolve', () => {
      const actionParams = {
        eventAction: EventActionOptions.RESOLVE,
        dedupKey: 'test-dedup',
      };

      const wrapper = mountWithIntl(
        <PagerDutyParamsFields
          actionParams={actionParams}
          errors={{ summary: [], timestamp: [], dedupKey: [] }}
          editAction={() => {}}
          index={0}
          selectedActionGroupId="recovered"
        />
      );

      const select = wrapper.find('[data-test-subj="eventActionSelect"]').first();
      expect(select.prop('value')).toStrictEqual('resolve');
      expect(select.prop('disabled')).toBe(true);
      expect(select.prop('options')).toEqual([expect.objectContaining({ value: 'resolve' })]);
    });

    test('dedupKey field is still rendered', () => {
      const actionParams = {
        eventAction: EventActionOptions.RESOLVE,
        dedupKey: 'test-dedup',
      };

      const wrapper = mountWithIntl(
        <PagerDutyParamsFields
          actionParams={actionParams}
          errors={{ summary: [], timestamp: [], dedupKey: [] }}
          editAction={() => {}}
          index={0}
          selectedActionGroupId="recovered"
        />
      );

      expect(wrapper.find('[data-test-subj="dedupKeyInput"]').length > 0).toBeTruthy();
      expect(wrapper.find('[data-test-subj="dedupKeyInput"]').first().prop('value')).toStrictEqual(
        'test-dedup'
      );
    });

    test('trigger-only fields are not rendered', () => {
      const actionParams = {
        eventAction: EventActionOptions.RESOLVE,
        dedupKey: 'test-dedup',
      };

      const wrapper = mountWithIntl(
        <PagerDutyParamsFields
          actionParams={actionParams}
          errors={{ summary: [], timestamp: [], dedupKey: [] }}
          editAction={() => {}}
          index={0}
          selectedActionGroupId="recovered"
        />
      );

      expect(wrapper.find('[data-test-subj="summaryInput"]').length).toBe(0);
      expect(wrapper.find('[data-test-subj="severitySelect"]').length).toBe(0);
      expect(wrapper.find('[data-test-subj="timestampInput"]').length).toBe(0);
      expect(wrapper.find('[data-test-subj="componentInput"]').length).toBe(0);
      expect(wrapper.find('[data-test-subj="groupInput"]').length).toBe(0);
      expect(wrapper.find('[data-test-subj="sourceInput"]').length).toBe(0);
      expect(wrapper.find('[data-test-subj="customDetailsJsonEditor"]').length).toBe(0);
      expect(wrapper.find('[data-test-subj="linksList"]').length).toBe(0);
    });
  });

  test('event action dropdown shows all options when selectedActionGroupId is not "recovered"', () => {
    const actionParams = {
      eventAction: EventActionOptions.TRIGGER,
      dedupKey: 'test',
    };

    const wrapper = mountWithIntl(
      <PagerDutyParamsFields
        actionParams={actionParams}
        errors={{ summary: [], timestamp: [], dedupKey: [] }}
        editAction={() => {}}
        index={0}
        selectedActionGroupId="default"
      />
    );

    const select = wrapper.find('[data-test-subj="eventActionSelect"]').first();
    expect(select.prop('disabled')).toBeFalsy();
    expect(select.prop('options')).toEqual([
      expect.objectContaining({ value: 'trigger' }),
      expect.objectContaining({ value: 'resolve' }),
      expect.objectContaining({ value: 'acknowledge' }),
    ]);
  });
});

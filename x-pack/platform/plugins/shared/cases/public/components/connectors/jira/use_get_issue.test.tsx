/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { waitFor, renderHook } from '@testing-library/react';

import { useKibana, useToasts } from '../../../common/lib/kibana';
import { connector as actionConnector } from '../mock';
import { useGetIssue } from './use_get_issue';
import * as api from './api';
import { TestProviders } from '../../../common/mock';

jest.mock('../../../common/lib/kibana');
jest.mock('./api');

const useKibanaMock = useKibana as jest.Mocked<typeof useKibana>;

describe('useGetIssue', () => {
  const { http } = useKibanaMock().services;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the api when invoked with the correct parameters', async () => {
    const spy = jest.spyOn(api, 'getIssue');
    const { result } = renderHook(
      () =>
        useGetIssue({
          http,
          actionConnector,
          id: 'RJ-107',
        }),
      { wrapper: TestProviders }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(spy).toHaveBeenCalledWith({
      http,
      signal: expect.anything(),
      connectorId: actionConnector.id,
      id: 'RJ-107',
    });
  });

  it('does not call the api when the connector is missing', async () => {
    const spy = jest.spyOn(api, 'getIssue');
    renderHook(
      () =>
        useGetIssue({
          http,
          id: 'RJ-107',
        }),
      { wrapper: TestProviders }
    );

    expect(spy).not.toHaveBeenCalledWith();
  });

  it('does not call the api when the id is missing', async () => {
    const spy = jest.spyOn(api, 'getIssue');
    renderHook(
      () =>
        useGetIssue({
          http,
          actionConnector,
          id: '',
        }),
      { wrapper: TestProviders }
    );

    expect(spy).not.toHaveBeenCalledWith();
  });

  it('calls addError when the getIssue api throws an error', async () => {
    const spyOnGetCases = jest.spyOn(api, 'getIssue');
    spyOnGetCases.mockImplementation(() => {
      throw new Error('Something went wrong');
    });

    const addError = jest.fn();
    (useToasts as jest.Mock).mockReturnValue({ addSuccess: jest.fn(), addError });

    const { result } = renderHook(
      () =>
        useGetIssue({
          http,
          actionConnector,
          id: 'RJ-107',
        }),
      { wrapper: TestProviders }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(addError).toHaveBeenCalled();
  });

  it('calls addError when the getIssue api returns successfully but contains an error', async () => {
    const spyOnGetCases = jest.spyOn(api, 'getIssue');
    spyOnGetCases.mockResolvedValue({
      status: 'error',
      message: 'Error message',
      actionId: 'test',
    });

    const addError = jest.fn();
    (useToasts as jest.Mock).mockReturnValue({ addSuccess: jest.fn(), addError });

    const { result } = renderHook(
      () =>
        useGetIssue({
          http,
          actionConnector,
          id: 'RJ-107',
        }),
      { wrapper: TestProviders }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(addError).toHaveBeenCalled();
  });
});

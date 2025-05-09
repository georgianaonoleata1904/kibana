/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { AIConnector } from '../connectorland/connector_selector';
import { FetchConnectorExecuteResponse } from './api';
import type { ClientMessage } from '../assistant_context/types';

export const getMessageFromRawResponse = (
  rawResponse: FetchConnectorExecuteResponse
): ClientMessage => {
  const { response, isStream, isError } = rawResponse;
  const dateTimeString = new Date().toISOString(); // TODO: Pull from response
  if (rawResponse) {
    return {
      role: 'assistant',
      ...(isStream
        ? { reader: response as ReadableStreamDefaultReader<Uint8Array> }
        : { content: response as string }),
      timestamp: dateTimeString,
      isError,
      traceData: rawResponse.traceData,
      metadata: rawResponse.metadata,
    };
  } else {
    return {
      role: 'assistant',
      content: 'Error: Response from LLM API is empty or undefined.',
      timestamp: dateTimeString,
      isError: true,
    };
  }
};

/**
 * Returns a default connector if there is only one connector
 * @param connectors
 */
export const getDefaultConnector = (
  connectors: AIConnector[] | undefined
): AIConnector | undefined => {
  const validConnectors = connectors?.filter((connector) => !connector.isMissingSecrets);
  if (validConnectors?.length) {
    return validConnectors[0];
  }

  return undefined;
};

interface OptionalRequestParams {
  alertsIndexPattern?: string;
  size?: number;
}

export const getOptionalRequestParams = ({
  alertsIndexPattern,
  size,
}: {
  alertsIndexPattern?: string;
  size?: number;
}): OptionalRequestParams => {
  const optionalAlertsIndexPattern = alertsIndexPattern ? { alertsIndexPattern } : undefined;
  const optionalSize = size ? { size } : undefined;

  return {
    ...optionalAlertsIndexPattern,
    ...optionalSize,
  };
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { validateConnectorId } from './validate_connector_id';
import { CONNECTOR_ID_MAX_LENGTH } from '.';

describe('validateConnectorId', () => {
  it('throws when value is empty', () => {
    expect(() => validateConnectorId('')).toThrow('Connector ID is required.');
  });

  it('throws when value exceeds max length', () => {
    const tooLong = 'a'.repeat(CONNECTOR_ID_MAX_LENGTH + 1);
    expect(() => validateConnectorId(tooLong)).toThrow(
      `Connector ID must be ${CONNECTOR_ID_MAX_LENGTH} characters or less.`
    );
  });

  it('throws when value contains uppercase letters', () => {
    expect(() => validateConnectorId('My-Connector')).toThrow(
      'Connector ID must contain only lowercase letters, numbers, underscores, and hyphens.'
    );
  });

  it('throws when value contains spaces', () => {
    expect(() => validateConnectorId('my connector')).toThrow(
      'Connector ID must contain only lowercase letters, numbers, underscores, and hyphens.'
    );
  });

  it('throws when value contains special characters', () => {
    expect(() => validateConnectorId('my@connector!')).toThrow(
      'Connector ID must contain only lowercase letters, numbers, underscores, and hyphens.'
    );
  });

  it('does not throw for a valid lowercase slug', () => {
    expect(() => validateConnectorId('my-connector')).not.toThrow();
  });

  it('does not throw for a value with numbers', () => {
    expect(() => validateConnectorId('connector-123')).not.toThrow();
  });

  it('does not throw for a value with underscores', () => {
    expect(() => validateConnectorId('my_connector')).not.toThrow();
  });

  it('does not throw for a value at exactly max length', () => {
    const maxLength = 'a'.repeat(CONNECTOR_ID_MAX_LENGTH);
    expect(() => validateConnectorId(maxLength)).not.toThrow();
  });
});

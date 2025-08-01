/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ELASTIC_HTTP_VERSION_HEADER } from '@kbn/core-http-common';
import { INITIAL_REST_VERSION_INTERNAL } from '@kbn/data-views-plugin/server/constants';
import { FIELDS_FOR_WILDCARD_PATH } from '@kbn/data-views-plugin/common/constants';
import expect from '@kbn/expect';
import { sortBy } from 'lodash';
import { InternalRequestHeader, RoleCredentials } from '../../../../shared/services';
import type { FtrProviderContext } from '../../../ftr_provider_context';

export default function ({ getService }: FtrProviderContext) {
  const esArchiver = getService('esArchiver');
  const svlCommonApi = getService('svlCommonApi');
  const svlUserManager = getService('svlUserManager');
  const supertestWithoutAuth = getService('supertestWithoutAuth');
  let roleAuthc: RoleCredentials;
  let internalReqHeader: InternalRequestHeader;

  const ensureFieldsAreSorted = (resp: { body: { fields: { name: string } } }) => {
    expect(resp.body.fields).to.eql(sortBy(resp.body.fields, 'name'));
  };

  const testFields = [
    {
      type: 'boolean',
      esTypes: ['boolean'],
      searchable: true,
      aggregatable: true,
      name: 'bar',
      readFromDocValues: true,
      metadata_field: false,
    },
    {
      type: 'string',
      esTypes: ['text'],
      searchable: true,
      aggregatable: false,
      name: 'baz',
      readFromDocValues: false,
      metadata_field: false,
    },
    {
      type: 'string',
      esTypes: ['keyword'],
      searchable: true,
      aggregatable: true,
      name: 'baz.keyword',
      readFromDocValues: true,
      subType: { multi: { parent: 'baz' } },
      metadata_field: false,
    },
    {
      type: 'number',
      esTypes: ['long'],
      searchable: true,
      aggregatable: true,
      name: 'foo',
      readFromDocValues: true,
      metadata_field: false,
    },
    {
      aggregatable: true,
      esTypes: ['keyword'],
      name: 'nestedField.child',
      readFromDocValues: true,
      searchable: true,
      subType: {
        nested: {
          path: 'nestedField',
        },
      },
      type: 'string',
      metadata_field: false,
    },
  ];

  describe('fields_for_wildcard_route response', () => {
    before(async () => {
      roleAuthc = await svlUserManager.createM2mApiKeyWithRoleScope('admin');
      internalReqHeader = svlCommonApi.getInternalRequestHeader();
      await esArchiver.load(
        'src/platform/test/api_integration/fixtures/es_archiver/index_patterns/basic_index'
      );
    });
    after(async () => {
      await esArchiver.unload(
        'src/platform/test/api_integration/fixtures/es_archiver/index_patterns/basic_index'
      );
      await svlUserManager.invalidateM2mApiKeyWithRoleScope(roleAuthc);
    });

    it('returns a flattened version of the fields in es', async () => {
      await supertestWithoutAuth
        .get(FIELDS_FOR_WILDCARD_PATH)
        .set(ELASTIC_HTTP_VERSION_HEADER, INITIAL_REST_VERSION_INTERNAL)
        .set(internalReqHeader)
        .set(roleAuthc.apiKeyHeader)
        .query({ pattern: 'basic_index' })
        .expect(200, {
          fields: testFields,
          indices: ['basic_index'],
        })
        .then(ensureFieldsAreSorted);
    });

    it('returns a single field as requested', async () => {
      await supertestWithoutAuth
        .get(FIELDS_FOR_WILDCARD_PATH)
        .set(ELASTIC_HTTP_VERSION_HEADER, INITIAL_REST_VERSION_INTERNAL)
        .set(internalReqHeader)
        .set(roleAuthc.apiKeyHeader)
        .query({ pattern: 'basic_index', fields: JSON.stringify(['bar']) })
        .expect(200, {
          fields: [testFields[0]],
          indices: ['basic_index'],
        });
    });

    it('always returns a field for all passed meta fields', async () => {
      await supertestWithoutAuth
        .get(FIELDS_FOR_WILDCARD_PATH)
        .set(ELASTIC_HTTP_VERSION_HEADER, INITIAL_REST_VERSION_INTERNAL)
        .set(internalReqHeader)
        .set(roleAuthc.apiKeyHeader)
        .query({
          pattern: 'basic_index',
          meta_fields: JSON.stringify(['_id', '_source', 'crazy_meta_field']),
        })
        .expect(200, {
          fields: [
            {
              aggregatable: false,
              name: '_id',
              esTypes: ['_id'],
              readFromDocValues: false,
              searchable: true,
              type: 'string',
              metadata_field: true,
            },
            {
              aggregatable: false,
              name: '_source',
              esTypes: ['_source'],
              readFromDocValues: false,
              searchable: false,
              type: '_source',
              metadata_field: true,
            },
            {
              type: 'boolean',
              esTypes: ['boolean'],
              searchable: true,
              aggregatable: true,
              name: 'bar',
              readFromDocValues: true,
              metadata_field: false,
            },
            {
              aggregatable: false,
              name: 'baz',
              esTypes: ['text'],
              readFromDocValues: false,
              searchable: true,
              type: 'string',
              metadata_field: false,
            },
            {
              type: 'string',
              esTypes: ['keyword'],
              searchable: true,
              aggregatable: true,
              name: 'baz.keyword',
              readFromDocValues: true,
              subType: { multi: { parent: 'baz' } },
              metadata_field: false,
            },
            {
              aggregatable: false,
              name: 'crazy_meta_field',
              readFromDocValues: false,
              searchable: false,
              type: 'string',
              metadata_field: true,
            },
            {
              type: 'number',
              esTypes: ['long'],
              searchable: true,
              aggregatable: true,
              name: 'foo',
              readFromDocValues: true,
              metadata_field: false,
            },
            {
              aggregatable: true,
              esTypes: ['keyword'],
              name: 'nestedField.child',
              readFromDocValues: true,
              searchable: true,
              subType: {
                nested: {
                  path: 'nestedField',
                },
              },
              type: 'string',
              metadata_field: false,
            },
          ],
          indices: ['basic_index'],
        })
        .then(ensureFieldsAreSorted);
    });

    it('returns fields when one pattern exists and the other does not', async () => {
      await supertestWithoutAuth
        .get(FIELDS_FOR_WILDCARD_PATH)
        .set(ELASTIC_HTTP_VERSION_HEADER, INITIAL_REST_VERSION_INTERNAL)
        .set(internalReqHeader)
        .set(roleAuthc.apiKeyHeader)
        .query({ pattern: 'bad_index,basic_index' })
        .expect(200, {
          fields: testFields,
          indices: ['basic_index'],
        });
    });

    it('returns 404 when neither exists', async () => {
      await supertestWithoutAuth
        .get(FIELDS_FOR_WILDCARD_PATH)
        .set(ELASTIC_HTTP_VERSION_HEADER, INITIAL_REST_VERSION_INTERNAL)
        .set(internalReqHeader)
        .set(roleAuthc.apiKeyHeader)
        .query({ pattern: 'bad_index,bad_index_2' })
        .expect(404);
    });

    it('returns 404 when no patterns exist', async () => {
      await supertestWithoutAuth
        .get(FIELDS_FOR_WILDCARD_PATH)
        .set(ELASTIC_HTTP_VERSION_HEADER, INITIAL_REST_VERSION_INTERNAL)
        .set(internalReqHeader)
        .set(roleAuthc.apiKeyHeader)
        .query({
          pattern: 'bad_index',
        })
        .expect(404);
    });
  });
}

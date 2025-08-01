/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { commonFunctionalServices } from '@kbn/ftr-common-functional-services';
import { SvlCommonApiServiceProvider } from '@kbn/test-suites-serverless/shared/services/svl_common_api';
import { IngestManagerProvider } from '@kbn/test-suites-xpack-platform/api_integration/services/ingest_manager';
import { services as xPackFunctionalServices } from '../../functional/services';
import { EndpointTelemetryTestResourcesProvider } from './endpoint_telemetry';
import { EndpointTestResources } from './endpoint';
import { TimelineTestService } from '../../security_solution_ftr/services/timeline';
import { DetectionsTestService } from '../../security_solution_ftr/services/detections';
import { EndpointPolicyTestResourcesProvider } from './endpoint_policy';
import { EndpointArtifactsTestResources } from './endpoint_artifacts';
import {
  KibanaSupertestWithCertProvider,
  KibanaSupertestWithCertWithoutAuthProvider,
} from './supertest_with_cert';
import { SecuritySolutionEndpointDataStreamHelpers } from '../../common/services/security_solution/endpoint_data_stream_helpers';
import { SecuritySolutionEndpointRegistryHelpers } from '../../common/services/security_solution/endpoint_registry_helpers';

export const services = {
  ...xPackFunctionalServices,

  endpointTestResources: EndpointTestResources,
  telemetryTestResources: EndpointTelemetryTestResourcesProvider,
  ingestManager: IngestManagerProvider,
  timeline: TimelineTestService,
  detections: DetectionsTestService,
  endpointArtifactTestResources: EndpointArtifactsTestResources,
  policyTestResources: EndpointPolicyTestResourcesProvider,
  endpointDataStreamHelpers: SecuritySolutionEndpointDataStreamHelpers,
  endpointRegistryHelpers: SecuritySolutionEndpointRegistryHelpers,
};

export const svlServices = {
  ...services,

  supertest: KibanaSupertestWithCertProvider,
  supertestWithoutAuth: KibanaSupertestWithCertWithoutAuthProvider,

  svlCommonApi: SvlCommonApiServiceProvider,
  svlUserManager: commonFunctionalServices.samlAuth,
};

export type Services = typeof services | typeof svlServices;

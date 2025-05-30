/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import useObservable from 'react-use/lib/useObservable';
import { map } from 'rxjs';
import { applicationLinksUpdater } from '../../app/links/application_links_updater';
import type { SecurityPageName } from '../../app/types';
import type { AppLinkItems, NavigationLink } from './types';

/**
 * @deprecated use `applicationLinks` instead
 * This is going to be cleaned when the classic navigation is removed
 */
export const formatNavigationLinks = (appLinks: AppLinkItems): NavigationLink[] =>
  appLinks
    .filter(({ unauthorized }) => !unauthorized)
    .map<NavigationLink>((link) => ({
      id: link.id,
      title: link.title,
      ...(link.categories != null && { categories: link.categories }),
      ...(link.description != null && { description: link.description }),
      ...(link.sideNavDisabled === true && { disabled: true }),
      ...(link.landingIcon != null && { landingIcon: link.landingIcon }),
      ...(link.landingImage != null && { landingImage: link.landingImage }),
      ...(link.sideNavIcon != null && { sideNavIcon: link.sideNavIcon }),
      ...(link.sideNavFooter != null && { isFooterLink: link.sideNavFooter }),
      ...(link.skipUrlState != null && { skipUrlState: link.skipUrlState }),
      ...(link.isBeta != null && { isBeta: link.isBeta }),
      ...(link.betaOptions != null && { betaOptions: link.betaOptions }),
      ...(link.links?.length && {
        links: formatNavigationLinks(link.links),
      }),
    }));

const navLinks$ = applicationLinksUpdater.links$.pipe(map(formatNavigationLinks));

/**
 * @deprecated use `applicationLinks` instead
 * This is going to be cleaned when the classic navigation is removed
 */
export const useNavLinks = (): NavigationLink[] => {
  return useObservable(navLinks$, []); // use default value from updater subject to prevent re-renderings
};

/**
 * @deprecated use `applicationLinks` instead
 * This is going to be cleaned when the classic navigation is removed
 */
export const useRootNavLink = (linkId: SecurityPageName): NavigationLink | undefined => {
  return useNavLinks().find(({ id }) => id === linkId);
};

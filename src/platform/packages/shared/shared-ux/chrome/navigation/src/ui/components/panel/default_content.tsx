/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { EuiFlexGroup, EuiFlexItem, EuiTitle } from '@elastic/eui';
import type { ChromeProjectNavigationNode, PanelSelectedNode } from '@kbn/core-chrome-browser';
import React, { Fragment, type FC } from 'react';

import { PanelGroup } from './panel_group';
import { PanelNavItem } from './panel_nav_item';

function isItemNode({ children }: Pick<ChromeProjectNavigationNode, 'children'>) {
  return children === undefined;
}

/**
 * All the children of a panel must be wrapped into groups. This is because a group in DOM is represented by <ul> tags
 * inside the <EuiListGroup/> which then renders the items in <li> insid the <EuiListGroupItem /> component.
 * Having <li> without <ul> is okayish but semantically it is not correct.
 * This function checks if we only have items and automatically wraps them into a group. If there is a mix
 * of items and groups it throws an error.
 *
 * @param node The current active node
 * @returns The children serialized
 */
function serializeChildren(node: PanelSelectedNode): ChromeProjectNavigationNode[] | undefined {
  if (!node.children) return undefined;

  const someChildrenAreItems = node.children.some((_node) => {
    if (isItemNode(_node)) return true;
    return _node.renderAs === 'item';
  });

  if (someChildrenAreItems) {
    // Automatically wrap all the children into top level "root" group.
    return [
      {
        id: 'root',
        path: `${node.path}.root`,
        children: [...node.children],
      },
    ];
  }

  return node.children;
}

interface Props {
  /** The selected node is the node in the main panel that opens the Panel */
  selectedNode: PanelSelectedNode;
}

export const DefaultContent: FC<Props> = ({ selectedNode }) => {
  const filteredChildren = selectedNode.children?.filter(
    (child) => child.sideNavStatus !== 'hidden'
  );
  const serializedChildren = serializeChildren({ ...selectedNode, children: filteredChildren });

  return (
    <EuiFlexGroup direction="column" gutterSize="m" alignItems="flexStart">
      {/* Panel title */}
      <EuiFlexItem>
        {typeof selectedNode.title === 'string' ? (
          <EuiTitle size="xxs">
            <h2>{selectedNode.title}</h2>
          </EuiTitle>
        ) : (
          selectedNode.title
        )}
      </EuiFlexItem>

      {/* Panel navigation */}
      <EuiFlexItem css={{ width: '100%' }}>
        {serializedChildren?.map((child, i) => {
          const hasHorizontalRuleBefore =
            i === 0 ? false : !!serializedChildren?.[i - 1]?.appendHorizontalRule;
          const isGroup = !!child.children;
          return isGroup ? (
            <Fragment key={child.id}>
              <PanelGroup
                navNode={child}
                isFirstInList={i === 0}
                hasHorizontalRuleBefore={hasHorizontalRuleBefore}
              />
            </Fragment>
          ) : (
            <PanelNavItem key={child.id} item={child} />
          );
        }) ?? null}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

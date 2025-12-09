import React, { useEffect, useMemo } from 'react';
import type { ISessionHistory, ISessionHistoryGroup } from './SessionHistory.interface';
import styles from './SessionHistory.css?inline';
import { useRaoContext } from '../../hooks';
import { Icon } from '../Icon';

const SAMPLE_HISTORY: ISessionHistoryGroup[] = [
  {
    label: 'Recents',
    items: [
      {
        id: 'recent-1',
        title: 'Sed ut perspiciatis unde omnis iste natus',
        description: 'Oct 12 · 2 responses',
        meta: 'more-horizontal',
      },
      {
        id: 'recent-2',
        title: 'Exceptuer sint occaecat proident',
        description: 'Oct 09 · 1 response',
        meta: 'more-horizontal',
      },
    ],
  },
  {
    label: 'September',
    items: [
      {
        id: 'sep-1',
        title: 'Nemo enim ipsam voluptatem',
        description: 'Sep 28',
      },
      {
        id: 'sep-2',
        title: 'Ut enim ad minim veniam, quis nostrud',
        description: 'Sep 21',
      },
      {
        id: 'sep-3',
        title: 'Lorem ipsum dolor sit amet',
        description: 'Sep 14',
      },
    ],
  },
  {
    label: 'August',
    items: [
      {
        id: 'aug-1',
        title: 'Sed ut perspiciatis unde',
        description: 'Aug 31',
      },
      {
        id: 'aug-2',
        title: 'Exceptuer sint occaecat cupidatat non',
        description: 'Aug 18',
      },
      {
        id: 'aug-3',
        title: 'Nemo enim ipsam voluptatem quia',
        description: 'Aug 09',
      },
      {
        id: 'aug-4',
        title: 'Nemo enim ipsam voluptatem quia',
        description: 'Aug 09',
      },
      {
        id: 'aug-5',
        title: 'Nemo enim ipsam voluptatem quia',
        description: 'Aug 09',
      },
    ],
  },
];

export const SessionHistory: React.FC<ISessionHistory> = () => {
  const context = useRaoContext();

  const contextHistory = (context as { history?: ISessionHistoryGroup[] } | undefined)?.history;

  const historyGroups = useMemo<ISessionHistoryGroup[]>(() => {
    if (contextHistory && contextHistory.length > 0) {
      return contextHistory;
    }
    return SAMPLE_HISTORY;
  }, [contextHistory]);

  useEffect(() => {
    context.getSessionsAPI('history');
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div
        className="rao-react__history"
        role="list">
        {historyGroups.map((group) => (
          <section
            key={group.label}
            className="rao-react__history-section">
            <h3 className="rao-react__history-section-title">{group.label}</h3>
            <ul className="rao-react__history-list">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="rao-react__history-item">
                    <div className="rao-react__history-item-text">
                      <span className="rao-react__history-item-title">{item.title}</span>
                      {item.description ? (
                        <span className="rao-react__history-item-description">{item.description}</span>
                      ) : null}
                    </div>
                    {item.meta ? (
                      <Icon
                        icon={item.meta}
                        size="sm"
                      />
                    ) : (
                      <Icon
                        icon="more-horizontal"
                        size="sm"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
};

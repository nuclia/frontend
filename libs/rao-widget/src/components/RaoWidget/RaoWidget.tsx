import { useRaoContext } from '../../hooks';
import { IRaoWidget } from './RaoWidget.interface';
import { Floating } from './viewTypes/Floating/Floating';
import { Standard } from './viewTypes/Standard/Standard';
import { type FC } from 'react';

export const RaoWidget: FC<IRaoWidget> = (props) => {
  const { visibleViewType } = useRaoContext();

  if (visibleViewType === 'floating') {
    return <Floating {...props} />;
  }

  return <Standard {...props} />;
};

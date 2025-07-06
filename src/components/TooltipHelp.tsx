import React from 'react';
import { TooltipHost, IconButton } from '@fluentui/react';

const TooltipHelp: React.FC = () => (
  <TooltipHost
    content={
      <div>
        Try asking: <b>Show total cost by carrier for last quarter.</b><br />
        Excel example: <b>Insert results in Sheet2, A1</b>
      </div>
    }
  >
    <IconButton iconProps={{ iconName: 'Info' }} ariaLabel="Help" />
  </TooltipHost>
);

export default TooltipHelp; 
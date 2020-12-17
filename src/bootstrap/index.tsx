import './index.less';

import React from 'react';
import { render } from 'react-dom';
import { Shim } from './shim';

console.log('hello from react');

render(<Shim />, document.getElementById('app-root'));

// Hot Module Replacement API
if (module['hot']) {
  module['hot'].accept();
}

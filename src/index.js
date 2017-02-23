import injectTapEventPlugin from 'react-tap-event-plugin';

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, hashHistory } from 'react-router';
import './index.css';
import routes from './routes.js';

// Needed for onTouchTap (Material-UI)
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();


ReactDOM.render(
  <Router history={hashHistory} routes={routes} />,
  document.getElementById('root')
);

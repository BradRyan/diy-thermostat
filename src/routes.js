import App from './App.jsx';
// import Status from './pages/status.jsx';
import SelectDevice from './pages/selectDevice.jsx';
import DevicePage from './pages/device.jsx';

const routes = {
  path: '/',
  component: App,
  indexRoute: { component: SelectDevice },
  childRoutes: [
    { path: 'devices', component: SelectDevice },
    { path: 'device/:deviceId', component: DevicePage },
    // {
    //   path: 'inbox',
    //   component: Inbox,
    //   childRoutes: [{
    //     path: 'messages/:id',
    //     onEnter: ({ params }, replace) => replace(`/messages/${params.id}`)
    //   }]
    // },
    // {
    //   component: Inbox,
    //   childRoutes: [{
    //     path: 'messages/:id', component: Message
    //   }]
    // }
  ]
};

export default routes;

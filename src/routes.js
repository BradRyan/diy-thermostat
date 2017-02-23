import App from './App.jsx';
// import Status from './pages/status.jsx';
import SelectDevice from './pages/selectDevice.jsx';
// TODO - render heater vs other device page in another component
import DevicePage from './pages/heater.jsx';
import HeaterSchedule from './pages/schedule.jsx';

const routes = {
  path: '/',
  component: App,
  indexRoute: { component: SelectDevice },
  childRoutes: [
    { path: 'devices', component: SelectDevice },
    { path: 'device/:deviceId', component: DevicePage },
    { path: 'device/:deviceId/schedule', component: HeaterSchedule },
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

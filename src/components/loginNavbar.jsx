import React from 'react';
import { IconMenu, IconButton, MenuItem, Divider, Toggle } from 'material-ui';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';

export class Login extends React.Component {
  static muiName = 'FlatButton';

  render() {
    return null;
  }
}

export const Logged = props => (
  <IconMenu
    iconStyle={props.iconStyle}
    iconButtonElement={
      <IconButton><MoreVertIcon /></IconButton>
    }
    targetOrigin={{ horizontal: 'right', vertical: 'top' }}
    anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
  >
    <MenuItem disabled primaryText={props.user} />
    <Divider />
    <Toggle
      label="Night Mode"
      labelPosition="right"
      onToggle={props.toggleNightMode}
      toggled={props.nightMode}
      style={{ paddingLeft: '14px' }}
    />
    <MenuItem primaryText="Sign out" onTouchTap={props.logoutUser} />
  </IconMenu>
);
Logged.muiName = 'IconMenu';

Logged.propTypes = {
  iconStyle: React.PropTypes.object,
  logoutUser: React.PropTypes.func,
  user: React.PropTypes.string,
  toggleNightMode: React.PropTypes.func,
  nightMode: React.PropTypes.bool
};

export default { Logged, Login };

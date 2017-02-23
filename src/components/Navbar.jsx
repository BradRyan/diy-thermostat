import React from 'react';
import { Link } from 'react-router';
import Dropdown, { DropdownTrigger, DropdownContent } from 'react-simple-dropdown';
import logo from './logo.svg';

const NAVIGATION = [
  {
    title: 'Schedule',
    deviceType: 'heater',
    icon: 'fa fa-calendar',
    path(deviceId) {
      return `/device/${deviceId}/schedule`;
    }
  },
];

const Navbar = (props) => {
  const user = props.user;
  const deviceId = props.params.deviceId;

  function logoutUser() {
    props.logoutUser();
  }

  return (
    <div>
      <div className="logo">
        <Link to="/">
          <img src={logo} alt="logo" className="App-logo" />
          <div className="app-logo-text">Home App</div>
        </Link>
      </div>
      <div className="navbar-buttons">
        {NAVIGATION.map((nav, i) => {
          if (props.deviceType !== nav.device) return null;
          return (
            <Link key={i} to={nav.path(deviceId)}>
              <div title={nav.title} className="nav-btn">
                <i className={nav.icon} />
                <div>{nav.title}</div>
              </div>
            </Link>
          );
        })}
        {user ?
          <Dropdown>
            <DropdownTrigger>
              <div className="nav-btn">
                <i className="fa fa-grav" />
                <div>Profile</div>
              </div>
            </DropdownTrigger>
            <DropdownContent>
              <div className="navbar-dropdown">
                <ul>
                  <li>{user || null}</li>
                  <li onClick={logoutUser}>Log Out</li>
                </ul>
              </div>
            </DropdownContent>
          </Dropdown>
          : null
        }
      </div>
    </div>
  );
};

Navbar.propTypes = {
  deviceType: React.PropTypes.string,
  logoutUser: React.PropTypes.func,
  user: React.PropTypes.string,
  params: React.PropTypes.object
};


export default Navbar;

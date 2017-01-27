import React, { Component, PropTypes } from 'react';
import Particle from 'particle-api-js';
import { Link } from 'react-router';
import NotificationSystem from 'react-notification-system';
import _ from 'lodash';
import logo from './logo.svg';
import './App.css';

const particle = new Particle();
const TOKEN_NAME = 'HEATER_AUTH_TOKEN';

const ELIOT = {
  username: 'eliot@landrum.cx',
  password: 'RsiT2E/Qob'
};
// const BRAD = {
//   username: 'bradryan7@gmail.com',
//   password: 'xLmmy7Vw3a9AKynViydk'
// };
// const DEVICE_ID = '1b003e000f51353338363333';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: null,
      loggingIn: false,
      loggedIn: false
    };

    this.token = null;
    this.devices = [];
    this.user = ELIOT;
    this.renderChildren = this.renderChildren.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  getChildContext() {
    return {
      addNotification: this.addNotification.bind(this),
      displayError: this.displayError.bind(this),
      displaySuccess: this.displaySuccess.bind(this),
    };
  }

  componentWillMount() {
    this.setState({ loggingIn: true });
    const self = this;

    // look for stored login token
    try {
      this.token = localStorage.getItem(TOKEN_NAME) || null;
    } catch (e) {
      console.log(e);
    }

    if (!this.token) {
      console.log('No token found, prompt login');
      particle
        .login({ username: this.user.username, password: this.user.password })
        .then((data) => {
          const token = data.body.access_token;
          console.log('API call completed on promise resolve: ', token);

          self.setState({ loggedIn: true, loggingIn: false });
          localStorage.setItem(TOKEN_NAME, token);
          this.token = token;
        }, (err) => {
          console.log('API call completed on promise fail: ', err);
          self.setState({ loggedIn: false, loggingIn: false });
        });
    } else {
      // validate token;
      self.setState({ loggedIn: true, loggingIn: false });
    }
  }

  addNotification(notification) {
    this.notifications.addNotification(notification);
  }

  displayError(err) {
    console.dir(err);
    const errorMessage = _.get(err, 'body.error') || err.message;
    this.notifications.addNotification({
      title: 'Whoops!',
      message: errorMessage,
      level: 'warning',
      dismissable: true
    });
  }

  displaySuccess(msg) {
    this.notifications.addNotification({
      title: 'Nice!',
      message: msg,
      level: 'success',
      dismissable: true
    });
  }

  handleLogout(statusCode) {
    if (statusCode === 401) {
      // "The access token was not found"
      console.log('Access token not found, clearing localStorage');
      localStorage.removeItem(TOKEN_NAME);
      this.setState({ loggedIn: false, loggingIn: false });
    }
  }

  renderChildren() {
    if (this.state.loggingIn) {
      return (<span>Loading...</span>);
    }

    if (this.state.loggedIn) {
      const childrenWithProps = React.Children.map(this.props.children,
        child => React.cloneElement(child, {
          handleLogout: this.handleLogout,
          token: this.token
        })
      );
      return childrenWithProps;
    }
    return <span>Log in error!</span>;
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2><Link to="/">Thermostat App</Link></h2>
          {this.state.loggedIn ? <span>Logged In</span> : <span>Logged Out</span>}
          <NotificationSystem ref={n => this.notifications = n} />
        </div>
        <div>
          {this.renderChildren()}
        </div>
      </div>
    );
  }
}

App.propTypes = {
  children: React.PropTypes.element,
};

App.childContextTypes = {
  addNotification: PropTypes.func,
  displayError: PropTypes.func,
  displaySuccess: PropTypes.func
};

export default App;

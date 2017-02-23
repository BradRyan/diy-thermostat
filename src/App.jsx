import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';
import { MuiThemeProvider, AppBar } from 'material-ui';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import Particle from 'particle-api-js';
import NotificationSystem from 'react-notification-system';
import './App.css';
import { Logged, Login } from './components/loginNavbar.jsx';
import LoginForm from './components/loginForm.jsx';
import { humanReadableError } from './components/DataLoader.js';

const particle = new Particle();
const TOKEN_NAME = 'HEATER_AUTH_TOKEN';
// storing username since I can't find a way to recover from token
const TOKEN_USERNAME = 'HEATER_AUTH_USERNAME';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggingIn: false,
      loggedIn: false,
      user: null,
      nightMode: false,
      appTitle: null
    };

    this.token = null;
    this.devices = [];
    this.renderChildren = this.renderChildren.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.logoutUser = this.logoutUser.bind(this);
    this.loginUser = this.loginUser.bind(this);
    this.toggleNightMode = this.toggleNightMode.bind(this);
    this.goHome = this.goHome.bind(this);
  }

  getChildContext() {
    return {
      addNotification: this.addNotification.bind(this),
      displayError: this.displayError.bind(this),
      displaySuccess: this.displaySuccess.bind(this),
    };
  }

  componentWillMount() {
    const self = this;

    // look for stored login token
    try {
      this.token = localStorage.getItem(TOKEN_NAME) || null;
      this.user = localStorage.getItem(TOKEN_USERNAME) || null;
    } catch (e) {
      console.log(e);
    }

    if (this.user) this.setState({ user: this.user });

    if (!this.token) {
      console.log('No token found, prompt login');
      this.setState({ loggingIn: false });
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
    const errorMessage = humanReadableError(err);
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
      localStorage.removeItem(TOKEN_USERNAME);
      this.setState({ loggedIn: false, loggingIn: false, user: null });
    }
  }

  logoutUser() {
    console.log('logging out');
    const self = this;
    // Since particle sdk requires user/pass again, we will just forget the login token instead...
    localStorage.removeItem(TOKEN_NAME);
    this.token = null;
    self.setState({ loggedIn: false, loggingIn: false });
  }

  loginUser(username, password) {
    this.setState({ loggingIn: true });
    const self = this;

    particle
      .login({ username, password })
      .then((data) => {
        console.log('login data', data);
        const token = data.body.access_token;
        localStorage.setItem(TOKEN_NAME, token);
        localStorage.setItem(TOKEN_USERNAME, username);
        this.token = token;
        self.setState({ loggedIn: true, loggingIn: false, user: username });
      }, (err) => {
        this.displayError(err);
        self.setState({ loggedIn: false, loggingIn: false });
      });
  }

  // setAppBarTitle(title) {
  //   this.setState({ appTitle: title });
  // }

  goHome() {
    this.props.router.push('/');
  }

  toggleNightMode() {
    this.setState({ nightMode: !this.state.nightMode });
  }

  fetchTheme() {
    if (this.state.nightMode) {
      console.log('dark side');
      return getMuiTheme(darkBaseTheme);
    }
    console.log('light side');
    return getMuiTheme();
  }

  renderChildren(theme) {
    if (this.state.loggingIn) {
      return (<span>Loading...</span>);
    }

    if (this.state.loggedIn) {
      const childrenWithProps = React.Children.map(this.props.children,
        child => React.cloneElement(child, {
          handleLogout: this.handleLogout,
          // setAppBarTitle: this.setAppBarTitle,
          token: this.token,
          muiTheme: theme  // Not sure why, but this wasnt always getting assigned
        })
      );
      return childrenWithProps;
    }

    if (!this.state.loggedIn) {
      return (
        <div>
          <LoginForm loginUser={this.loginUser} />
        </div>
      );
    }
    return <span>Log in error!</span>;
  }

  render() {
    const theme = this.fetchTheme();
    return (
      // <MuiThemeProvider>
      <MuiThemeProvider muiTheme={theme}>
        <div className="App" style={{ background: theme.palette.canvasColor }}>
          <div className="App-header">
            <AppBar
              title={<Link to="/" className="no-style-link">Das House</Link>}
              titleStyle={{ textAlign: 'left' }}
              // onTitleTouchTap={this.goHome}
              // iconElementLeft={<IconButton><NavigationClose /></IconButton>}
              iconElementRight={this.state.user ?
                <Logged
                  user={this.state.user}
                  logoutUser={this.logoutUser}
                  nightMode={this.state.nightMode}
                  toggleNightMode={this.toggleNightMode}
                /> : <Login />}
            />
            <NotificationSystem ref={n => this.notifications = n} />
          </div>
          <div>
            {this.renderChildren(theme)}
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

App.propTypes = {
  children: React.PropTypes.element,
  router: React.PropTypes.shape({
    push: React.PropTypes.func,
  }),
};

App.childContextTypes = {
  addNotification: PropTypes.func,
  displayError: PropTypes.func,
  displaySuccess: PropTypes.func
};

export default App;

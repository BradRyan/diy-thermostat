import React from 'react';
import { TextField, RaisedButton } from 'material-ui';

const LoginForm = (props) => {
  function login(e) {
    e.preventDefault();
    const form = e.target;
    const username = form[0].value;
    const password = form[1].value;
    props.loginUser(username, password);
  }

  return (
    <div className="login-form-container">
      <form onSubmit={login}>
        <TextField
          floatingLabelText="Username"
        /><br />
        <TextField
          floatingLabelText="Password"
          type="password"
        /><br />
        <RaisedButton type="submit" label="Login" primary />
      </form>
    </div>
  );
};

LoginForm.propTypes = {
  loginUser: React.PropTypes.func
};


export default LoginForm;

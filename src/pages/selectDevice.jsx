import React from 'react';
import Particle from 'particle-api-js';
import { Link } from 'react-router';

const particle = new Particle();

class SelectDevice extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      devices: []
    };
  }

  componentWillMount() {
    this.getDevices(this.props.token);
  }

  getDevices(token) {
    const self = this;
    const devicesPr = particle.listDevices({ auth: token });

    devicesPr.then(
      (devices) => {
        console.log('Devices: ', devices);
        self.setState({ devices: devices.body });
      },
      (err) => {
        console.log('List devices call failed: ', err);
        this.props.handleLogout(err.statusCode);
      }
    );
  }

  render() {
    return (
      <div>
        <h1>Select Device</h1>
        {this.state.devices.map((device, i) => {
          console.log(device);
          return (
            <Link key={i} to={`/device/${device.id}`}>
              <div className="device-select">{device.name}</div>
            </Link>
          );
        })}
      </div>
    );
  }
}

SelectDevice.propTypes = {
  token: React.PropTypes.string,
  handleLogout: React.PropTypes.func
};

export default SelectDevice;

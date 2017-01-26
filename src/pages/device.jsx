import React from 'react';
import Particle from 'particle-api-js';
import Thermostat from '../components/thermostat.jsx';

const particle = new Particle();

class DevicePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      device: null,
      ambient: null,
      heater: false,
      setTemp: null
    };

    this.deviceId = null;
    this.token = null;

    this.subscribeToDevice = this.subscribeToDevice.bind(this);
    this.changeTemp = this.changeTemp.bind(this);
  }

  componentWillMount() {
    // get device id from param, look up using token prop
    this.deviceId = this.props.params.deviceId;
    this.token = this.props.token;
    this.subscribeToDevice(this.deviceId, this.token);
  }

  subscribeToDevice(deviceId, token) {
    const self = this;

    // *** GET DEVICE DETAILS ***
    particle.getDevice({ deviceId, auth: token }).then(
      (data) => {
        console.log('Device attrs retrieved successfully:', data);
        self.setState({ device: data.body });
      },
      (err) => {
        console.log('API call failed: ', err);
        self.props.handleLogout(err.statusCode);
      }
    );

    // *** AMBIENT TEMPERATURE ***
    particle.getEventStream({ deviceId, name: 'temperature', auth: token }).then((stream) => {
      stream.on('event', (result) => {
        const ambient = Number(Number(result.data).toFixed(1));
        self.setState({ ambient });
      });

      stream.on('error', (err) => {
        console.log('error fetching ambient temperature stream', err);
        self.props.handleLogout(err.statusCode);
      });
    });

    // *** SET TEMP ***
    particle.getEventStream({ deviceId, name: 'setpoint', auth: token }).then((stream) => {
      stream.on('event', (result) => {
        const setTemp = Number(Number(result.data).toFixed(1));
        self.setState({ setTemp });
      });

      stream.on('error', (err) => {
        console.log('error fetching set temperature stream', err);
        self.props.handleLogout(err.statusCode);
      });
    });

    // *** HEATER ***
    particle.getEventStream({ deviceId, name: 'heater', auth: token }).then((stream) => {
      stream.on('event', (result) => {
        const heater = result.data === 'on';
        self.setState({ heater });
      });

      stream.on('error', (err) => {
        console.log('error fetching heater stream', err);
        self.props.handleLogout(err.statusCode);
      });
    });
  }

  changeTemp() {
    const temp = '75';
    const fnPr = particle.callFunction(
      { deviceId: this.deviceId, name: 'setTemp', argument: temp, auth: this.token }
    );

    fnPr.then(
      (data) => {
        console.log('Function called succesfully:', data);
      },
      (err) => {
        console.log('An error occurred:', err);
      }
    );
  }

  renderDeviceStatus() {
    const device = this.state.device;
    const ambient = this.state.ambient;
    const setTemp = this.state.setTemp;
    const heating = this.state.heater ? 'heating' : 'off';

    return (
      <div>
        <h1>{device.name}</h1>
        <div className="temp-dial">
          <Thermostat
            away={false}
            leaf={false}
            ambientTemperature={ambient}
            targetTemperature={setTemp}
            hvacMode={heating}
          />
        </div>
        <h4>Ambient Temperature: {ambient ? `${ambient} °F` : <span>Loading...</span>}</h4>
        <h4>Set Temperature: {setTemp !== null ? `${setTemp} °F` : <span>Loading...</span>}</h4>
        <h4>Heating: {this.state.heater !== null ? heating : <span>Loading...</span>}</h4>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.state.device ? this.renderDeviceStatus() : <div>Loading device data...</div>}
        <button onClick={this.changeTemp}>Change Temp</button>
      </div>
    );
  }
}

DevicePage.propTypes = {
  token: React.PropTypes.string,
  handleLogout: React.PropTypes.func,
  params: React.PropTypes.object
};

export default DevicePage;

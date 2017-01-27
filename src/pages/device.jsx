import React from 'react';
import Particle from 'particle-api-js';
import Thermostat from '../components/thermostat.jsx';

const particle = new Particle();
const MIN_TEMP = '50';
const MAX_TEMP = '90';

class DevicePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      device: null,
      ambient: null,
      heater: false,
      setTemp: null,
      selecting: false,
      setTempChanged: null
    };

    this.deviceId = this.props.params.deviceId;
    this.token = this.props.token;

    this.subscribeToDevice = this.subscribeToDevice.bind(this);
    this.changeTemp = this.changeTemp.bind(this);
    this.renderTempSelect = this.renderTempSelect.bind(this);
  }

  componentWillMount() {
    // get device id from param, look up using token prop
    this.subscribeToDevice(this.deviceId, this.token);
  }

  initializeVariables() {
    console.log('emit events plz');
    particle
      .callFunction({ deviceId: this.deviceId, name: 'emitEvents', argument: '', auth: this.token })
      .then((data) => {
        console.log('Function [toggleEvents] called succesfully:', data);
      }, (err) => {
        console.log('An error occurred:', err);
        this.displayError(err);
      });
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
        console.log('amb temperature stream: ', result.data);
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
        console.log('set temp stream: ', result.data);
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
        console.log('heater stream: ', result.data);
        const heater = result.data === 'on';
        self.setState({ heater });
      });

      stream.on('error', (err) => {
        console.log('error fetching heater stream', err);
        self.props.handleLogout(err.statusCode);
      });
    });

    this.initializeVariables();
  }

  changeTemp(e) {
    const temp = e.target.value;
    const self = this;
    this.setState({ setTempChanged: temp });

    if (!this.selecting) {
      // user has stopped moving slider and setTemp should be saved
      console.log('saving selected temperature');
      const fnPr = particle.callFunction(
        { deviceId: this.deviceId, name: 'setTemp', argument: temp, auth: this.token }
      );

      fnPr.then(
        (data) => {
          self.context.displaySuccess(`Setpoint changed to ${temp}°F`);
        },
        (err) => {
          self.context.displayError(err);
        }
      );
    }
  }

  renderTempSelect() {
    const setTemp = this.state.setTempChanged || this.state.setTemp;

    return (
      <div>
        <span>{`${MIN_TEMP} °F`}</span>
        <input
          type="range"
          id="set-temp"
          min={MIN_TEMP}
          max={MAX_TEMP}
          value={setTemp}
          step="1"
          onChange={this.changeTemp}
          onMouseDown={() => {
            this.setState({ selecting: true });
            this.selecting = true;
          }}
          onMouseUp={(e) => {
            const self = this;
            this.selecting = false;
            self.changeTemp(e);
            this.setState({ selecting: false });
          }}
        />
        <span>{`${MAX_TEMP} °F`}</span>
      </div>
    );
  }

  renderThermostatMessage(ready) {
    if (!ready) return 'Loading';
    if (this.state.selecting) return 'SET HEAT TO';
    if (this.state.heater) return 'HEATING';

    return 'HEAT SET TO';
  }

  renderDeviceStatus() {
    const device = this.state.device;
    const ambient = this.state.ambient;
    const setTemp = this.state.setTempChanged || this.state.setTemp;
    const heating = this.state.heater ? 'heating' : 'off';
    const ready = setTemp !== null;

    return (
      <div>
        <h1>{device.name}</h1>
        <div className="temp-dial">
          <Thermostat
            message={this.renderThermostatMessage(ready)}
            away={false}
            leaf={false}
            ambientTemperature={ambient}
            targetTemperature={setTemp}
            hvacMode={heating}
            minValue={Number(MIN_TEMP)}
            maxValue={Number(MAX_TEMP)}
          />
        </div>
        {/* DEBUG
        <h4>Ambient Temperature: {ambient ? `${ambient} °F` : <span>Loading...</span>}</h4>
        <h4>Set Temperature: {setTemp !== null ? `${setTemp} °F` : <span>Loading...</span>}</h4>
        <h4>Heating: {this.state.heater !== null ? heating : <span>Loading...</span>}</h4> */}

        {setTemp !== null && this.renderTempSelect()}
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.state.device ? this.renderDeviceStatus() : <div>Loading device data...</div>}
      </div>
    );
  }
}

DevicePage.propTypes = {
  token: React.PropTypes.string,
  handleLogout: React.PropTypes.func,
  params: React.PropTypes.object
};

DevicePage.contextTypes = {
  addNotification: React.PropTypes.func.isRequired,
  displayError: React.PropTypes.func.isRequired,
  displaySuccess: React.PropTypes.func.isRequired,
};

export default DevicePage;

import React from 'react';
import Particle from 'particle-api-js';
import { compose } from 'react-komposer';
import { Slider, SelectField, MenuItem, RaisedButton } from 'material-ui';
import muiThemeable from 'material-ui/styles/muiThemeable';
// import ScheduleIcon from 'material-ui/svg-icons/action/today';
import Thermostat from '../components/thermostat.jsx';
import DataLoader, { handleLoading } from '../components/DataLoader.js';

const particle = new Particle();
const MIN_TEMP = '50';
const MAX_TEMP = '90';
const MODE_OPTIONS = ['manual', 'schedule', 'off'];

class DevicePageInner extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      device: null,
      ambient: null,
      setTemp: null,
      selecting: false,
      setTempChanged: null,
      disableSlider: false
    };

    this.deviceId = this.props.params.deviceId;
    this.token = this.props.token;

    this.subscribeToDevice = this.subscribeToDevice.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.renderTempSelect = this.renderTempSelect.bind(this);
    this.saveNewSetTemp = this.saveNewSetTemp.bind(this);
  }

  componentDidMount() {
    // get device id from param, look up using token prop
    this.subscribeToDevice(this.deviceId, this.token);
  }

  initializeVariables() {
    const self = this;
    console.log('emit events plz');
    particle
      .callFunction({ deviceId: this.deviceId, name: 'emitEvents', argument: '', auth: this.token })
      .then((data) => {
        console.log('Function [emitEvents] called succesfully:', data);
      }, (err) => {
        self.context.displayError(err);
      });
  }

  subscribeToDevice(deviceId, token) {
    const self = this;

    // *** GET DEVICE DETAILS ***
    //  TODO - how to move to komposer?
    particle.getDevice({ deviceId, auth: token }).then(
      (data) => {
        console.log('Device attrs retrieved successfully:', data);
        self.setState({ device: data.body });
      },
      (err) => {
        self.props.handleLogout(err.statusCode);
      }
    );
  }

  saveNewSetTemp(temp) {
    const self = this;
    console.log('saving selected temperature ', temp);
    const fnPr = particle.callFunction(
      { deviceId: this.deviceId, name: 'setTemp', argument: String(temp) , auth: this.token }
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

  handleModeChange(mode) {
    const self = this;
    const fnPr = particle.callFunction(
      { deviceId: this.deviceId, name: 'setMode', argument: mode, auth: this.token }
    );

    fnPr.then(
      (data) => {
        self.context.displaySuccess(`Mode changed to ${mode}`);
      },
      (err) => {
        self.context.displayError(err);
      }
    );
  }

  renderTempSelect() {
    const self = this;
    const setTemp = this.state.setTempChanged || this.props.data.temperature;
    if (!setTemp) return null;

    return (
      <div>
        <div className="heater-slider">
          <Slider
            id="set-temp"
            min={Number(MIN_TEMP)}
            max={Number(MAX_TEMP)}
            required
            value={setTemp}
            step={1}
            onChange={(e, temp) => {
              self.setTemp = temp;
              self.setState({ setTempChanged: temp });
            }}
            onDragStart={(e) => {
              self.setState({ selecting: true });
            }}
            onDragStop={(e) => {
              console.log('drag stop: ', self.setTemp);
              // If user was dragging the slider, then only save when released
              self.selecting = false;
              self.saveNewSetTemp(self.setTemp);
              self.setState({ selecting: false });
            }}
          />
        </div>
      </div>
    );
  }

  renderThermostatMessage(ready) {
    if (!ready) return 'Loading';
    if (this.state.selecting) return 'SET HEAT TO';
    if (this.props.data.heater === '1') return 'HEATING';

    return 'HEAT SET TO';
  }

  renderModeSelect() {
    const deviceId = this.props.params.deviceId;
    return (
      <div className="mode-select">
        {this.props.data.mode ?
          <div>
            <div className="mode-dropdown">
              <SelectField
                value={this.props.data.mode}
                floatingLabelText="Mode"
                onChange={this.handleModeChange}
                style={{ width: '150px' }}
              >
                {MODE_OPTIONS.map((mode, i) => (
                  <MenuItem key={i} value={mode} primaryText={mode.toUpperCase()} />
                ))}
              </SelectField>
            </div>
            <RaisedButton
              className="edit-schedule"
              href={`/device/${deviceId}/schedule`}
              // icon={<FontIcon className="material-icons">today</FontIcon>}
              label="Edit Schedule"
              secondary
            />
          </div>
          :
          <span>Fetching Mode...</span>
        }
      </div>
    );
  }

  renderThermostat() {
    const data = this.props.data;
    const palette = this.props.muiTheme.palette;
    const device = this.state.device; // TODO - how to subscribe to device with komposer?

    const ready = data.ready !== null;
    console.log('data', data);

    return (
      <div>
        <h1 style={{ color: palette.textColor }}>{device.name}</h1>

        <div className="temp-dial">
          <Thermostat
            message={this.renderThermostatMessage(ready)}
            away={false}
            leaf={false}
            ambientTemperature={data.temperature}
            targetTemperature={this.state.setTempChanged || data.setPoint}
            hvacMode={data.heater === '1' ? 'heating' : 'off'}
            minValue={Number(MIN_TEMP)}
            maxValue={Number(MAX_TEMP)}
          />
        </div>
        <div className="therm-controls">
          {this.renderTempSelect()}
          {this.renderModeSelect()}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        {handleLoading(this.props.data) || this.renderThermostat()}
      </div>
    );
  }
}

DevicePageInner.propTypes = {
  token: React.PropTypes.string,
  handleLogout: React.PropTypes.func,
  params: React.PropTypes.object,
  data: React.PropTypes.shape({
    temperature: React.PropTypes.number,
    setpoint: React.PropTypes.number,
    heater: React.PropTypes.string, // EX: '1'
    mode: React.PropTypes.string,
  }),
  // muiTheme
};

DevicePageInner.contextTypes = {
  addNotification: React.PropTypes.func.isRequired,
  displayError: React.PropTypes.func.isRequired,
  displaySuccess: React.PropTypes.func.isRequired,
};

const DevicePage = compose(DataLoader)(DevicePageInner);
DevicePage.defaultProps = {
  dataRequest: {
    stream: ['temperature', 'setpoint', 'heater', 'mode'],
    get: ['maximumTemp', 'minimumTemp']
  }
};


export default muiThemeable()(DevicePage);

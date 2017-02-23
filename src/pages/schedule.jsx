import React from 'react';
import { Link } from 'react-router';
import Particle from 'particle-api-js';
import { RaisedButton, TimePicker, Slider } from 'material-ui';
import { compose } from 'react-komposer';
import moment from 'moment';
import DataLoader, { handleLoading } from '../components/DataLoader.js';

const particle = new Particle();

function timeToMinutesAfterMidnight(time) {
  const dayStartObj = moment(time, 'h:mm a').toObject(); // EX: '4:33 pm'
  return (dayStartObj.hours * 60) + dayStartObj.minutes;
}

function minutesAfterMidnightToTime(minutes) {
  if (!minutes) return null;
  const hr = Math.floor(minutes / 60);
  const min = minutes % 60;
  return moment(`${hr}:${min}`, 'H:mm').toDate();
}

class HeaterScheduleInner extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      changed: false,
      // Temperory state management until new data props returned
      dayTemp: null,
      nightTemp: null,
      dayTime: null,
      nightTime: null,
    };

    this.token = props.token;
    this.deviceId = props.params.deviceId;

    this.handleFormChange = this.handleFormChange.bind(this);
    this.submitFormChanges = this.submitFormChanges.bind(this);
    this.renderScheduleForm = this.renderScheduleForm.bind(this);
  }

  componentDidMount() {
    // get device id from param, look up using token prop
    const devicesPr = particle.getDevice({ deviceId: this.deviceId, auth: this.token });

    devicesPr.then(
      (data) => {
        console.log('Device attrs retrieved successfully:', data);
      },
      (err) => {
        console.log('API call failed: ', err);
      }
    );

    console.log('data: ', this.props.data);
  }

  componentWillReceiveProps(nextProps) {
    console.log('data: ', nextProps.data);
  }

  handleFormChange(e) {

    // look at form values, verify values have changed
    this.setState({ changed: true });
  }

  submitFormChanges(e) {
    e.preventDefault();
    const self = this;

    const dayStart = timeToMinutesAfterMidnight(this.form[0].value);
    const dayTemp = this.form[1].value;
    const nightStart = timeToMinutesAfterMidnight(this.form[2].value);
    const nightTemp = this.form[3].value;

    const scheduleArgument = `${dayStart},${dayTemp},${nightStart},${nightTemp}`;
    console.log('set schedule: ', scheduleArgument);
    const fnPr = particle.callFunction(
      { deviceId: this.deviceId, name: 'setSchedule', argument: scheduleArgument, auth: this.token }
    );
    fnPr.then(
      (data) => {
        console.log(data);
        self.context.displaySuccess('Schedule updated');
      },
      (err) => {
        console.log(err);
        self.context.displayError(err);
      }
    );
  }

  renderScheduleForm() {
    const self = this;
    const data = this.props.data;
    const startTime = minutesAfterMidnightToTime(data.dayStart);
    const endTime = minutesAfterMidnightToTime(data.nightStart);
    const palette = this.props.muiTheme.palette;
    const deviceId = this.props.params.deviceId;

    return (
      <div>
        <Link to={`/device/${deviceId}`} className="no-style-link">
          <h1 style={{ color: palette.textColor }}>Device Name</h1>
        </Link>
        <form onSubmit={this.submitFormChanges} ref={n => this.form = n}>
          <div>
            <TimePicker value={startTime} floatingLabelText="Day Start Time" />
            <div className="temp-select">
              <div className="slider-label" style={{ color: palette.primary3Color }}>Day Temp</div>
              <div className="schedule-temp-slider">
                <Slider
                  min={50}
                  max={90}
                  value={this.state.dayTemp || data.dayTemp}
                  step={1}
                  onChange={(e, temp) => {
                    self.setTemp = temp;
                    self.setState({ dayTemp: temp });
                  }}
                />
                <div className="temp-display" style={{ color: palette.textColor }}>
                  {`${this.state.dayTemp || data.dayTemp}°F`}
                </div>
              </div>
            </div>
          </div>

          <div>
            <TimePicker value={endTime} floatingLabelText="Night Start Time" />
            <div className="temp-select">
              <div className="slider-label" style={{ color: palette.primary3Color }}>Night Temp</div>
              <div className="schedule-temp-slider">
                <Slider
                  min={50}
                  max={90}
                  value={this.state.nightTemp || data.nightTemp}
                  step={1}
                  onChange={(e, temp) => {
                    self.setState({ nightTemp: temp });
                  }}
                />
                <div className="temp-display" style={{ color: palette.textColor }}>
                  {`${this.state.nightTemp || data.nightTemp}°F`}
                </div>
              </div>
            </div>
          </div>
          <RaisedButton label="Submit" type="submit" primary />
        </form>
      </div>
    );
  }

  render() {
    const data = this.props.data;

    return (
      <div>
        {handleLoading(data) || this.renderScheduleForm()}
      </div>
    );
  }
}

HeaterScheduleInner.propTypes = {
  token: React.PropTypes.string,
  handleLogout: React.PropTypes.func,
  params: React.PropTypes.object,
  data: React.PropTypes.shape({
    nightTemp: React.PropTypes.number, // decimal deg F
    nightTime: React.PropTypes.number, // integer minutes after midnight
    dayTime: React.PropTypes.number,
    dayTemp: React.PropTypes.number,
    maximumTemp: React.PropTypes.number,
    minimumTemp: React.PropTypes.number
  }),
  muiTheme: React.PropTypes.shape({
    palette: React.PropTypes.object
  })
};

HeaterScheduleInner.contextTypes = {
  addNotification: React.PropTypes.func.isRequired,
  displayError: React.PropTypes.func.isRequired,
  displaySuccess: React.PropTypes.func.isRequired,
};

const HeaterSchedule = compose(DataLoader)(HeaterScheduleInner);
HeaterSchedule.defaultProps = {
  dataRequest: {
    stream: ['nightTemp', 'nightStart', 'dayTemp', 'dayStart'],
    get: ['maximumTemp', 'minimumTemp']
  }
};

export default HeaterSchedule;

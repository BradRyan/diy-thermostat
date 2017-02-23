import React from 'react';
import Particle from 'particle-api-js';
import _ from 'lodash';
import { CircularProgress } from 'material-ui';

const particle = new Particle();

// determine if all requested fields have returned.  Currently mutates the provided data object
function isDataReady(dataRequest, data) {
  data.ready = true; // initialize as true

  dataRequest.stream.forEach((variable) => {
    if (_.isNil(data[variable])) {
      data.ready = false;
    }
  });

  dataRequest.get.forEach((variable) => {
    if (_.isNil(data[variable])) {
      data.ready = false;
    }
  });
}

export function humanReadableError(err) {
  return _.get(err, 'body.error_description') || _.get(err, 'body.error')
         || _.get(err, 'error.message') || err.message;
}

// Component that can be used to determine whether to render loading, loading error, or page
export function handleLoading(data) {
  console.log('[handleLoading]: ', data);
  if (!data.ready && !data.error) {
    return <CircularProgress size={80} thickness={5} style={{ paddingTop: '20px' }} />;
  }

  if (!data.ready && data.error) {
    return (
      <div style={{ marginTop: '20px' }}>
        There was and error loading the page.<br />
        <strong>Error: </strong><span style={{ color: 'red' }}>{data.error}</span>
      </div>
    );
  }
}

function DataLoader(props, onData) {
  const data = { ready: false };
  const dataRequest = props.dataRequest;
  const deviceId = props.params.deviceId;
  const token = props.token;

  if (dataRequest && deviceId && token) {
    // get: fetch variables but don't stream them
    if (dataRequest.get) {
      dataRequest.get.forEach((variable) => {
        // TODO - Rewrite into one shared function (used in stream)
        particle.getVariable({ deviceId, name: variable, auth: token }).then((response) => {
          console.log(`Device variable (${variable}) retrieved successfully:`, response.body);
          data[variable] = response.body.result;
          isDataReady(dataRequest, data);
          onData(null, { data });
        }, (err) => {
          console.log('An error occurred while getting attrs:', err);
          data[variable] = null;
          data.error = humanReadableError(err);
          isDataReady(dataRequest, data);
          onData(null, { data });
        });
      });
    }

    // stream: fetch initial variable and then open a stream
    if (dataRequest.stream) {
      dataRequest.stream.forEach((variable) => {
        // Get initial variable value
        particle.getVariable({ deviceId, name: variable, auth: token }).then((response) => {
          console.log(`Device variable (${variable}) retrieved successfully:`, response.body);
          data[variable] = response.body.result;
          isDataReady(dataRequest, data);
          onData(null, { data });
        }, (err) => {
          console.log('An error occurred while getting attrs:', err);
          data[variable] = null;
          data.error = humanReadableError(err);
          isDataReady(dataRequest, data);
          onData(null, { data });
        });

        // open stream so changes are detected
        particle.getEventStream({ deviceId, name: variable, auth: token }).then((stream) => {
          stream.on('event', (result) => {
            console.log(`Device stream (${variable}) retrieved successfully:`, result);
            data[variable] = result.data;
            isDataReady(dataRequest, data);
            onData(null, { data });
          });

          stream.on('error', (err) => {
            console.log('error fetching ambient temperature stream', err);
            data[variable] = null;
            data.error = humanReadableError(err);
            isDataReady(dataRequest, data);
            onData(null, { data });
          });
        });
      });
    }
  }
  onData(null, { data });
}

export default DataLoader;

// Fridge/Freezer Alarm Plugin
// Copyright (c) James Pearce, 2020
// Last updated June 2020
//
// Version 1:
// - Monitoring of the appliance temperature via a ContactSensor with embedded Temperature Sensor.
//   This enables alerts to be generated if the temperature rises above a configured threshold, by reporting the
//   Contact Sensor as status open. This allows for alerts to generated on the Home on iPhone or watch.
// - Requires an Sonoff TH10 based temperature sensor with Dallas DS18B20 temeperature sensor installed within the appliance
//   running Tasmota firmware (see https://tasmota.github.io/docs/)
// - Note: Supports a single attached DS18B20 sesnor currently. These devices follow a one-wire protocol so it may
//   be possible to connect two sensors, e.g. in a Fridge Freezer type appliance, to monitor both cavities in future.
//
// globals and imports
var request = require('request');

// HomeKit API registration
module.exports = (api) => {
  api.registerAccessory('TH10FridgeFreezerAlarm', TH10FridgeFreezerAlarm);
}


class TH10FridgeFreezerAlarm {

  constructor(log, config, api) {
      this.log = log;
      this.config = config;
      this.api = api;

      this.Service = this.api.hap.Service;
      this.Characteristic = this.api.hap.Characteristic;

      this.name = config.name || 'My Appliance';
      this.th10IpAddress = config.th10IpAddress;
      this.th10StatusLocation = config.th10StatusLocation || '/cm?cmnd=status%208';
      this.pollTimer = config.pollTimer || 60; //default poll interval = 60 seconds
      this.alertCount = config.alertCount || 0; // number of consecutive alerts recorded before raising HomeKit alert status
      this.alertTemperature = config.alertTemperature || -10; // -10 is default for a freezer, use 10 for a fridge
      this.hysteresis = config.hysteresis || 3;

      this.state = {
        contactSensorState: 0,
        temperature: 0,
        alerts: 0,
      };

      // Create the services
      this.contactSensor = new this.Service.ContactSensor(this.name); // reports open/close according to registered alert state
      this.temperatureService = new this.Service.TemperatureSensor(); // reports the measured temperature within the appliance

      // create an information service...
      this.informationService = new this.Service.AccessoryInformation()
        .setCharacteristic(this.Characteristic.Manufacturer, "James Pearce")
        .setCharacteristic(this.Characteristic.Model, "Sonoff TH10 Fridge/Freezer Alarm")
        .setCharacteristic(this.Characteristic.SerialNumber, "N/App");

      this.contactSensor
        .setCharacteristic(this.Characteristic.Name, "My Appliance")
        .getCharacteristic(this.Characteristic.ContactSensorState)
        .on('get', this.getContactState.bind(this));

      this.temperatureService
        .setCharacteristic(this.Characteristic.Name, "Current Temperature")
        .getCharacteristic(this.Characteristic.CurrentTemperature)
        .on('get', this.getTemperature.bind(this));

  } // constructor

  // mandatory getServices function tells HomeBridge how to use this object
  getServices() {
    var accessory = this;
    var Characteristic = this.Characteristic;
    var command;
    accessory.log.debug(accessory.name + ': Invoked getServices');

    // Initialise the plugin ahead of any function call with static configured IP address
    // we need to update HomeKit that this device can report temperatures below zero degrees:
    this.temperatureService.getCharacteristic(Characteristic.CurrentTemperature).props.minValue = -50;
    // ... and collect the data from the device...
    accessory.pollTH10State();

    // and retrun the services to HomeBridge
    return [
      accessory.informationService,
      accessory.contactSensor,
      accessory.temperatureService,
    ];
  } // getServices()/

  getTemperature(callback) {
    var accessory = this;
    accessory.log.debug('Current freezer temperature: ', accessory.state.temperature);
    callback(null, (accessory.state.temperature));
  }

  getContactState(callback) {
    var accessory = this;
    accessory.log.debug('Contact State (=Freezer Alert flag): ', accessory.state.contactSensorState);
    callback(null, accessory.state.contactSensorState);
  }

  pollTH10State(callback) {
    // Background status polling function.
    var accessory = this;
    var Characteristic = this.Characteristic;

    var URI = "http://" + accessory.th10IpAddress + accessory.th10StatusLocation;
    accessory.log.debug("pollState: Retrieving current device state from " + URI);

    try {
      request(URI, function(error, response, body) {
        accessory.log.debug(body);
        if (!error) {
          try {
            var sonoff_reply = JSON.parse(body);
            try {
              accessory.log.debug(sonoff_reply);
              var temperature = parseFloat(sonoff_reply.StatusSNS.DS18B20.Temperature);
              accessory.state.temperature = temperature;
              if ((accessory.state.contactSensorState == 0) & (temperature >= accessory.alertTemperature)) {
                accessory.log("WARNING: Alert threshold " + accessory.alertTemperature + "*C exceeded.");
                accessory.state.alerts += 1;
                if (accessory.state.alerts == accessory.alertCount) {
                  // consecutive alert count reached: raise alarm in HomeKit
                  accessory.log("WARNING: Alert count exceeded; raising alarm in HomeKit");
                  accessory.state.contactSensorState = 1;
                }
              } else if ((accessory.state.contactSensorState == 1) & (temperature <= (accessory.alertTemperature - accessory.hysteresis))) {
                accessory.log("INFORMATION: Previous alert condition cleared, reported temperature is " + accessory.alertTemperature + "*C.");
                accessory.state.contactSensorState = 0;
                accessory.state.alerts = 0;
              } else if (accessory.state.alerts > 0) {
                // something else happened by we didn't log an alert state so clear the counter
                accessory.log.debug("INFORMATION: Temperature reported withn normal range, clearning alert count");
                accessory.state.alerts = 0;
              }
              accessory.log.debug("pollTH10State: Updating accessory state...");
              accessory.contactSensor.updateCharacteristic(Characteristic.ContactSensorState, accessory.state.contactSensorState);
              accessory.temperatureService.updateCharacteristic(Characteristic.CurrentTemperature, accessory.state.temperature);
            } catch(err) {
              accessory.log('Could not convert data to number (' + sonoff_reply.StatusSNS.DS18B20.Temperature + ')');
              accessory.log(err);
            }
          } catch(err) {
            accessory.log('Invalid json received from device:' + body);
            accessory.log(err);
          }
        }
      });
    } catch (err) {
      accessory.log(accessory.name+": Did not receive a valid response from device: " + err.message);
      accessory.log(err);
    }
    accessory.pollState(); // (re)start polling timer
  } // pollTH10State

  /**
    * Polling function
  */
  pollState = function() {
    var accessory = this;
    var Characteristic = this.Characteristic;

    // Clear any existing timer
    if (accessory.stateTimer) {
      clearTimeout(accessory.stateTimer);
      accessory.stateTimer = null;
    }

    // define the new poll function
    accessory.stateTimer = setTimeout(
      function() {
        accessory.pollTH10State(function(err, CurrentDeviceState) {
          if (err) {
            accessory.log(err);
            return;
          }
        })
      }, accessory.pollTimer * 1000
    );
  } // pollState

} // class FreezerAlarm

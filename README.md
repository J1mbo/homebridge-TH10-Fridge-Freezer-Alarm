# Fridge or Freezer Alarm Plugin using Sonoff TH10 Smart WiFi Switch

This HomeBridge plugin provides a simple, low-cost way to receive alerts on your iPhone or Apple Watch if a fridge or freezer door has been left open. It adds a ContactSensor with embedded Temperature Sensor to HomeKit, and the ContactSensor state will raise alerts within HomeKit:

<img src="https://user-images.githubusercontent.com/784541/85220405-131e1080-b3a3-11ea-89ac-d47f6af3c71d.png" width="250"/>

To use this plugin, you will need a £10 Sonoff TH10 Smart WiFi Switch running Tasmota firmware ('sensors' build) with an attached DS18B20 temperature sensor, and the sensor physically installed within the appliance somewhere.

# Preparing the TH10

Flashing the Tasmota firmware on the device is straight-forward - you will need to download Tasmotizer for Windows and get a £5 serial programmer with wires such as WINGONEER CP2104 serial converter. The Sonoff must be opened (the case lid just pulls apart once the terminal cover screw has been removed) - ** IMPORTANT ** note that there are exposed components carrying mains electricity when the cover is removed - and solder on a 4-pin header. Connect up the serial interface (RX to TX and TX to RX), and press-and-hold the TH10 button whilst providing 3V3 power and keep holding for 10 seconds. Next load of Tasmotizer, select the 'sensors' release and hit program.

Once Tasmota has been installed, it must be configured to attach to your WiFi and so it knows it is running on a TH10 and has a DS18B20 sensor attached. This is done by through a browser and using a profile - see the Tasmotizer docs. It can take a couple of gos for these settings to 'stick' for some reason. Once working, the device will be reporting the sensor temperature in it's WebUI:

<img src="https://user-images.githubusercontent.com/784541/85220319-7491af80-b3a2-11ea-8451-29ac635e4380.png" width="250"/>
<img src="https://user-images.githubusercontent.com/784541/85220371-d2be9280-b3a2-11ea-80c8-4fc081d63154.png" width="250"/>

Note: Supports a single attached DS18B20 sesnor currently. These devices follow a one-wire protocol so it may be possible to connect two sensors, e.g. in a Fridge Freezer type appliance, to monitor both cavities in future.

# Mounting the Sensor

Mounting the sensor in the appliance will depend on the appliance design and how permanent you want the sensor to be. This might be as simple as passing the sensor into the appliance on the door hinge side, and taping it in against the side, or you might decide to go further and drill a hole to enable permanent mounting.

In the particular freezer this was developed for, there is a temperature control knob inside that is little more than a vaiable resistor. The cavity this mounts in made an ideal installation point, with a single hole drilled through the back of the cavity through the side of the freezer, the wire passed in and the outside bunged up with a 20mm rubber gromit.

These pictures show the sensor within the appliance, and the wire tacked along the outside of the appliance (which in this case, is against a wall anyway) and finally the TH10 itself simply stuck to the back with double-sided foam sticky pads.

<img src="https://user-images.githubusercontent.com/784541/85618397-a92e9100-b658-11ea-968d-fe2ab54d1da7.jpg" width="250"/>
<img src="https://user-images.githubusercontent.com/784541/85618585-e1ce6a80-b658-11ea-84ed-6f8937e0b671.jpg" width="250"/>
<img src="https://user-images.githubusercontent.com/784541/85618618-eeeb5980-b658-11ea-984a-2ec244ffcf7e.jpg" width="250"/>

However the sensor is mounted, it must be within the thermal envolope within the freezer and have some air flow across it. Mounted behind the control knob as described, it is also necessary to drill some ventilation holes to ensure the interior temperature can be accurately metered through that case:

<img src="https://user-images.githubusercontent.com/784541/85618842-4ab5e280-b659-11ea-850a-63e2b40b9893.jpg" width="250"/>

# Contact and support

If find a problem or have any suggestions, please create an issue on the GitHub project page at: https://github.com/J1mbo/homebridge-TH10-Fridge-Freezer-Alarm/issues


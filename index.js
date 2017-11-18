const ruuvi = require('node-ruuvitag');
const mqtt = require('mqtt');

const REPORT_AIR_INTERVAL_MILLISECONDS = 1000 * 10;
const REPORT_BATTERY_INTERVAL_MILLISECONDS = 1000 * 60;

const ADAFRUIT_IO_USERNAME = 'username';
const ADAFRUIT_IO_KEY = 'key';

let lastAirPublish = 0;
let lastBatteryPublish = 0;

let client = mqtt.connect('mqtts://io.adafruit.com',{
  port: 8883,
  username: ADAFRUIT_IO_USERNAME,
  password: ADAFRUIT_IO_KEY
});

client.on('connect', () => {
  console.log('connected!');
});

client.on('error', (error) => {
  console.log('MQTT Client Errored');
  console.log(error);
});

ruuvi.on('found', tag => {
  console.log('Found RuuviTag, id: ' + tag.id);

  tag.on('updated', data => {
    let temp = data.temperature;
    let humidity = data.humidity;
    let pressure = data.pressure / 100;
    let battery = data.battery / 1000;

    if (client.connected && shouldPublishAir()) {
      client.publish(ADAFRUIT_IO_USERNAME + '/f/TempC', temp.toString());
      client.publish(ADAFRUIT_IO_USERNAME + '/f/Humidity', humidity.toString());
      client.publish(ADAFRUIT_IO_USERNAME + '/f/PressurehPa', pressure.toString());

      lastAirPublish = (new Date()).getTime();
    }

    if (client.connected && shouldPublishBattery()) {
      client.publish(ADAFRUIT_IO_USERNAME + '/f/BatteryV', battery.toString());

      lastBatteryPublish = (new Date()).getTime();
    }
  });
});

function shouldPublishAir () {
  let now = (new Date()).getTime();
  let diffMillis = now - lastAirPublish;

  return diffMillis >= REPORT_AIR_INTERVAL_MILLISECONDS;
}

function shouldPublishBattery () {
  let now = (new Date()).getTime();
  let diffMillis = now - lastBatteryPublish;

  return diffMillis >= REPORT_BATTERY_INTERVAL_MILLISECONDS;
}

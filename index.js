const ruuvi = require('node-ruuvitag');
const mqtt = require('mqtt');

const REPORT_AIR_INTERVAL_MILLISECONDS = 1000 * 10;
const REPORT_BATTERY_INTERVAL_MILLISECONDS = 1000 * 30;

const ADAFRUIT_IO_USERNAME = 'username';
const ADAFRUIT_IO_KEY = 'key';

let lastAirPublish = 0;
let lastBatteryPublish = 0;

let localMqtt = mqtt.connect('mqtt://localhost');

let adaMqtt = mqtt.connect('mqtts://io.adafruit.com',{
  port: 8883,
  username: ADAFRUIT_IO_USERNAME,
  password: ADAFRUIT_IO_KEY
});

adaMqtt.on('connect', () => {
  console.log('adaMqtt connected!');
});

adaMqtt.on('error', (error) => {
  console.log('adaMqtt error:');
  console.log(error);
});

localMqtt.on('connect', () => {
  console.log('localMqtt connected!');
});

localMqtt.on('error', (error) => {
  console.log('localMqtt error:');
  console.log(error);
});

ruuvi.on('found', tag => {
  console.log('Found RuuviTag, id: ' + tag.id);

  tag.on('updated', data => {
    let temp = data.temperature;
    let humidity = data.humidity;
    let pressure = data.pressure / 100;
    let battery = data.battery / 1000;

    if (shouldPublishAir()) {
      publishAir(temp, humidity, pressure);
    }

    if (shouldPublishBattery()) {
      publishBattery(battery);
    }
  });
});

function publishAir (temp, humidity, pressure) {
  if (localMqtt.connected) {
    localMqtt.publish(ADAFRUIT_IO_USERNAME + '/f/TempC', temp.toString());
    localMqtt.publish(ADAFRUIT_IO_USERNAME + '/f/Humidity', humidity.toString());
    localMqtt.publish(ADAFRUIT_IO_USERNAME + '/f/PressurehPa', pressure.toString());
  }

  if (adaMqtt.connected) {
    adaMqtt.publish(ADAFRUIT_IO_USERNAME + '/f/TempC', temp.toString());
    adaMqtt.publish(ADAFRUIT_IO_USERNAME + '/f/Humidity', humidity.toString());
    adaMqtt.publish(ADAFRUIT_IO_USERNAME + '/f/PressurehPa', pressure.toString());
  }

  lastAirPublish = (new Date()).getTime();
}

function publishBattery (battery) {
  if (localMqtt.connected) {
    localMqtt.publish(ADAFRUIT_IO_USERNAME + '/f/BatteryV', battery.toString());
  }

  if (adaMqtt.connected) {
    adaMqtt.publish(ADAFRUIT_IO_USERNAME + '/f/BatteryV', battery.toString());
  }

  lastBatteryPublish = (new Date()).getTime();
}

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

load('api_timer.js');
load('api_arduino_bme280.js');
load('api_http.js');
load('api_config.js');
load('api_math.js');
load('api_blynk.js');
load('api_sys.js');

let sens_addr = Cfg.get('i2c.address');
let bme = Adafruit_BME280.create();
if (bme.begin(sens_addr) === 0) {
  print('Cant find a sensor');
} else {
	print('BME280 sensor found!');
	print('Initializing elastic-search data store..');
	let url = Cfg.get('elastic.baseUrl');
	if (url === '') {
		print('Initialization failed because elastic.url is empty, please configure it!');
	} else {
		let url = Cfg.get('elastic.url');
		let repeatTime = Cfg.get('elastic.repeatTime') || 30000;
		print('Started repeating timer at ', Math.round(repeatTime / 1000), 'seconds');
		print('Notifying to ', url);
		Timer.set(repeatTime, true, function() {
			let url = Cfg.get('elastic.url');
			let authorization = Cfg.get('elastic.headers.authorization');
			HTTP.query({
				url: url,
				headers: { 
					'Authorization': authorization,
					'User-Agent': 'elasticsearch-bme280-js (esp8266)'
				},
				data: {
					updated: Math.round(Timer.now() * 1000),
					type: 'bme280',
					sensorData: {
						temperature: bme.readTemperature(), 
						humidity: bme.readHumidity(), 
						pressure: bme.readPressure()
					}
				},
				success: function(body, full_http_msg) {
					let logOnSuccess = Cfg.get('elastic.logOnSuccess');
					if (logOnSuccess) {
						print(body);
					}
				},
				error: function(err) {
					print(err);
				},
			});
		}, null);
	}
	print('Initialization completed');
}

Blynk.setHandler(function(conn, cmd, pin, val, id) {
  let ram = Sys.free_ram() / 1024;
  let temperature = bme.readTemperature();
  let humidity = bme.readHumidity();
  let pressure = bme.readPressure();
  if (cmd === 'vr') {
  	// When reading any virtual pin, report free RAM in KB
  	if (pin === 1) {
  	 Blynk.virtualWrite(conn, pin, ram, id);
  	}
  	else if (pin === 3) {
  	  Blynk.virtualWrite(conn, pin, temperature, id);
  	}
  	else if (pin === 4) {
  	  Blynk.virtualWrite(conn, pin, humidity, id);
  	}
  	else if (pin === 5) {
  	  Blynk.virtualWrite(conn, pin, pressure, id);
  	}
  	else {
  	  print('BLYNK JS handler, unknown', ram, cmd, id, pin, val);
  	}
  } else if (cmd === 'vw') {
  	// Writing to virtual pin translate to writing to physical pin
    GPIO.set_mode(pin, GPIO.MODE_OUTPUT);
    GPIO.write(pin, val);
  } else {
	  print('Unknown command', cmd, id, pin, val);
  }
}, null);

# Using BME280 sensor and Elastic Search and Blynk as data store.

## Overview

This example shows how to use MongooseOS with bme280 and Elastic Search and Blynk.
Go to device configuration and specify elastic.url and elastic.headers.Authorization
`blynk.auth` setting to your Blynk access token. Or, alternatively,
run the following console command (from the terminal or "Terminal" tab in Web UI):

# BME280 sensor i2c address
```bash
# In case its on 0x76 use this
mos config-set i2c.address=0x76
# Otherwise if its on 0x77 use this
mos config-set i2c.address=0x77
```

# Elastic config
```bash
mos config-set elastic.url=<YOUR_ELASTIC_URL>/<INDEX>/<TYPE> elastic.headers.Authorization="some hash/token here"
# Example
mos config-set elastic.url=http://elastic-search.local/sensors/bme280 elastic.headers.Authorization="asdf9asdf890asdfksadf89879789asdf"
```

# Blynk config
```bash
mos config-set blynk.auth=YOUR_TOKEN blynk.server="blynk-cloud.com:8442"
```

## Nginx configuration
- Using nginx as reverse proxy for elastic-search to limit the exposure
```
map $http_Authorization $is_ok {
    default false;
    "some hash/token here" true;
    "asdf9asdf890asdfksadf89879789asdf" true;
}

server {
    listen            80;
    server_name       elastic-search.local;
    access_log        /var/log/nginx/$server_name-access.log;
    error_log         /var/log/nginx/elastic-search.local-error.log

    location / {
        if ($is_ok = false) {
            return 401;
        }

        proxy_pass    http://localhost:9200;
    }
}
```

## Elastic configuration
- Install Elastic Search
- Install Kibana
- Install X-Pack for Elastic Search (`/usr/share/elasticsearch/bin/elasticsearch-plugin install x-pack`)
- Install X-Pack for Kibana (`/usr/share/kibana/bin/kibana-plugin install x-pack`)
- Register your own license (https://register.elastic.co/)
- Install your own license (`curl -XPUT -u admin 'http://<host>:<port>/_license?acknowledge=true' -d @license.json`)
- Create index for data
- Create bme280 mapping (Go to kibana -> Dev Tools and paste this)
```
PUT /data/_mapping/bme280?update_all_types=true
{
  "properties": {
    "sensorData": {
      "properties": {
        "humidity": {
          "type": "float"
        },
        "pressure": {
          "type": "float"
        },
        "temperature": {
          "type": "float"
        }
      }
    },
    "updated": {
      "type": "date",
          "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
    }
  }
}
```

## Blynk configuration
- Create a graph with virtual pin 1 (Graph of memory usage) limits min 0 - 50
- Create a button with virtual pin 2 (Toggles led on/off)
- Create a graph with virtual pin 3 (Graph of temperature) limits min -30 - 60
- Create a graph with virtual pin 4 (Graph of humidity) limits min 0 - 100
- Create a graph with virtual pin 5 (Graph of pressure) limits min 500 - 3000

## Then you can start creating your own graphs that looks like this:
# Kibana
![Kibana](http://i.imgur.com/bJWlvtn.png)
# Blynk
![Blynk](http://i.imgur.com/QRlFGjR.png)

## How to install this app

- Install and start [mos tool](https://mongoose-os.com/software.html)
- Switch to the Project page, find and import this app, build and flash it:

<p align="center">
  <img src="https://mongoose-os.com/images/app1.gif" width="75%">
</p>

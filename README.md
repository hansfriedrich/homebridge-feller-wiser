
# Homebridge Feller Wiser plugin

This is a homebridge plugin for the [Wiser-by-Feller](https://wiser.feller.ch/) system based on the provided [api](https://github.com/Feller-AG/wiser-tutorial). 
When activated it communicates with the wifi-device of the wiser-system to get a list of available loads and provides them as an accessoire in the homebridge system.

## Configuration

    "platforms": [
        [...]
        {
            "ip": [THE IP-ADDRESS OF THE WISER-WIFI-DEVICE]
            "username": [THE USERNAME]
            "password": [THE PASSWORD]
            "platform": "feller-wiser"
        }
    ]

## known issues and limitations

* there is no ui implemented (see the config above)
* currently there are only the switches and dimmer implemented (no motors)
* there is no support for rooms (adapt them in the homekit app)
* loads get their name from the devices name provided by the api (adapt them in the homekit app)
* the handler is slow on requesting all loads, since every loads does a request to the wifi-device on its own
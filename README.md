
# Homebridge Feller Wiser plugin

This is a homebridge plugin for the [Wiser-by-Feller](https://wiser.feller.ch/) system based on the provided [api](https://github.com/Feller-AG/wiser-tutorial). 
When activated it communicates with the wifi-device of the wiser-system to get a list of available loads and provides them as an accessoire in the homebridge system.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/hansfr)

## Configuration

To get an authkey follow the instructins on the [api documentation](https://github.com/Feller-AG/wiser-tutorial/blob/main/doc/authentication.md#get-the-authentication-code).

    "platforms": [
        [...]
        {
            "ip": [THE IP-ADDRESS OF THE WISER-WIFI-DEVICE]
            "authkey" : [YOUR_AUTH_KEY]
            "platform": "feller-wiser"
        }
    ]

## known issues and limitations

* there is no ui implemented (see the config above)
* there is no support for rooms (adapt them in the homekit app)
* loads get their name from the devices name provided by the api (adapt them in the homekit app)

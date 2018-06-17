# Beaver's Nanny

A web application that acts as a digital nanny for monitoring children. It is intended to be embedded in standalone linux-based computers like Raspberry Pi equipped with camera and a microphone.

The application acts as a web server which uses WebSockets to transfer data and audio. The audio is subsequently played using Audio API in the browser. The video is transferred separately (and optionally) using (MJPEG streamer)[https://github.com/jacksonliam/mjpg-streamer].

Please note that this is just a prototype and I do not have time to extend this project beyond my actual needs. However, pull requests are welcome.



## Setting up on Raspberry Pi

The following text describes, how to set up this application quickly on Raspberry Pi running Raspbian. It was tested on Raspberry Pi B and Rasbperry Pi 3. Raspberry was selected as common easy-to-get PC with sufficiently low consumption and performance. The RPi can be easily equipped with USB web cam (preferably with microphone) and can be powered from a power bank. Along with WiFi module, it can be truly portable (at least within the reach of your WiFi AP).

First of all I recommend to remove or disable everything unnecessary on the RPi. Especially older versions of 


### Prerequisities

`apt-get install nodejs` is not a good idea. It installs an old version of node.js and the name clashes as there is a completely different package called `node`.

Check your ARM version `uname -v` and get appropriate tarball from https://nodejs.org/. In my case, it was https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-armv7l.tar.xz

You might need `wget` to fetch it and `xz-utils` to unpack it.

```
$ tar -xf ./node-v8.11.3-linux-armv7l.tar.xz
```

Enter the unpacked directory (`node-<version>` and copy all dirs inside (`bin`, `include`, `lib`, and `share`) to `/usr/local` (as root). Then check that everything is working:

```
node -v
npm -v
```

Install `forever` manager using npm globally:

```
$ sudo npm install forever -g
```


Then you need to fetch and build the MJPG streamer. See the readme of the project (https://github.com/jacksonliam/mjpg-streamer).


### Installation

cd ./src

npm install websocket

all as root: 
copy beavers-nanny to /usr/share
chown -R root:root /usr/share/beavers-nanny

copy ./etc/init.d/beavers-nanny to /etc/init.d (set exec flag and chown to root)
chown root:root /etc/init.d/beavers-nanny
chmod a+x /etc/init.d/beavers-nanny
place relative symlinks to /etc/rc.2 and /etc/rc.6


### Set up local web server

```
$ sudo apt-get install lighttpd
```

Make the `/usr/share/beavers-nanny` directory available over http(s).



### IP Address Dilema

TODO

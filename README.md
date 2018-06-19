# Beaver's Nanny

A web application that acts as a digital nanny for monitoring children. It is intended to be embedded in standalone linux-based computers like Raspberry Pi equipped with a camera and a microphone.

The application acts as a web server which uses WebSockets to transfer data and audio. The audio is subsequently played using Audio API in the browser. The video is transferred separately (and optionally) using (MJPEG streamer)[https://github.com/jacksonliam/mjpg-streamer].

Please note that this is just a prototype and I do not have time to extend this project beyond my actual needs. However, pull requests are welcome.



## Setting up on Raspberry Pi

The following text describes, how to set up this application quickly on Raspberry Pi running Raspbian. It was tested on Raspberry Pi B and Raspberry Pi 3. Raspberry was selected as common easy-to-get PC with acceptable compromise between consumption and performance. The RPi can be easily equipped with USB web cam (preferably with microphone) and can be powered from a power bank. Along with WiFi module, it can be truly portable (at least within the reach of your WiFi AP).

First of all, I recommend to remove or disable everything unnecessary on the RPi. Especially older versions (like RPi B) have barely enough performance to encode the video and handle the network load.


### Prerequisites

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

```
$ cd ./src
$ npm install websocket
```

Copy it to final location (as root):

``` 
# copy beavers-nanny to /usr/share
# chown -R root:root /usr/share/beavers-nanny
```

Make sure the nanny is started by forever as service. Copy `./etc/init.d/beavers-nanny` to `/etc/init.d` (set exec flag and chown to root):

```
chown root:root /etc/init.d/beavers-nanny
chmod a+x /etc/init.d/beavers-nanny
```

Finally, place relative symlinks to `/etc/rc.2` and `/etc/rc.6` to make sure it starts/ends automatically.


### Set up local web server

```
$ sudo apt-get install lighttpd
```

Make the `/usr/share/beavers-nanny/public` directory available over http(s) as
a root web page (or at your preferred URL).



### IP Address Dilemma

The nanny is intended to be used in local network only. Of course, you can set up a VLAN and access it from anywhere, just be aware that the generated traffic is not small since the audio is transferred uncompressed and the video is not small either. In any case, make sure your transfers are reasonably safe (i.e., it is not a good idea run your nanny over unsecured wifi without additional security measures).

Perhaps the greatest issue (except for security) is locating your nanny in your local network. The easiest way is to configure your DHCP server to reserve a specific IP for your nanny. Another option is to smuggle out local IP assigned to the nanny to your public server. The IP(s) can be easily fetched as:

```
/sbin/ifconfig | /bin/grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | /bin/grep -Eo '([0-9]*\.){3}[0-9]*' | /bin/grep -v '127.0.0.1'
```

And subsequently, they can be sent over to a public server if the nanny (i.e., the local network) has access to Internet.

In my case, I send the addresses to my server every 2 minutes (`cron`) using simple `cat` executed through `ssh` (with authenticated key). My public server expose the local address on a web page in a form of a link (so it is only one-click delay to get to the nanny viewscreen in my browser).


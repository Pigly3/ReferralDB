# ReferralDB
ReferralDB is a database server for game save storage. It was originally made for Referral Clicker, 

## Notice
ReferralDB should only be used with an intermediary server, as it is designed to only be accessed by trusted servers and not clients.

## Quick Start
This project does not need to be built, but requires [Bun](https://github.com/oven-sh/bun). RSA keys for the client and server can be generated using node-rsa.
In .env, DB_PRIVATE and GAME_SERVER_PUBLIC will need to be set.
You must also install the projects node_modules.

## Use
The code includes builtin references to files for, logs, suspected cheaters, saves, and logins. In order to use this code to the most benefit, you should customize the references to fit your project. This intends to serve as an encrypted base, where you only have to handle handling the operations specified by requests.

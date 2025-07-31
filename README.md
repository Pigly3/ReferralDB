# ReferralDB
ReferralDB is a database server for game save storage. 

## Notice
ReferralDB should only be used with an intermediary server, as it is designed to only be accessed by trusted servers and not clients.

## Quick Start
This project does not need to be built, but requires [Bun](https://github.com/oven-sh/bun). RSA keys for the client and server can be generated using node-rsa.
In .env, DB_PRIVATE and GAME_SERVER_PUBLIC will need to be set.
You must also install the projects node_modules.